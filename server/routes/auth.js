const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, authenticate, requireAdmin } = require('../middleware/auth');

// 1. Admin Login
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'યુઝરનેમ અને પાસવર્ડ બંને જરૂરી છે.' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username.trim());
  if (!admin) {
    return res.status(401).json({ error: 'ખોટો યુઝરનેમ અથવા પાસવર્ડ.' });
  }

  const match = bcrypt.compareSync(password, admin.password_hash);
  if (!match) {
    return res.status(401).json({ error: 'ખોટો યુઝરનેમ અથવા પાસવર્ડ.' });
  }

  const token = jwt.sign(
    { id: admin.id, username: admin.username, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    message: 'સફળતાપૂર્વક લૉગિન થયું.',
    token,
    user: {
      id: admin.id,
      username: admin.username,
      role: 'admin',
      shop_name: admin.shop_name,
      phone: admin.phone
    }
  });
});

// 2. Customer Login (Phone + 4 digit PIN)
router.post('/customer/login', (req, res) => {
  const { phone, pin } = req.body;
  if (!phone || !pin) {
    return res.status(400).json({ error: 'મોબાઈલ નંબર અને 4 અંકનો PIN બંને જરૂરી છે.' });
  }

  const cleanPhone = phone.toString().trim();
  const cleanPin = pin.toString().trim();

  const customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(cleanPhone);
  if (!customer) {
    return res.status(401).json({ error: 'આ મોબાઈલ નંબર ખાતાવહીમાં નોંધાયેલ નથી.' });
  }

  const match = bcrypt.compareSync(cleanPin, customer.pin_hash);
  if (!match) {
    return res.status(401).json({ error: 'ખોટો 4-અંકનો PIN.' });
  }

  // Fetch shop details for customer view
  const shop = db.prepare('SELECT shop_name, phone FROM admins LIMIT 1').get() || { shop_name: 'ખાતાવહી દુકાન', phone: '' };

  const token = jwt.sign(
    { customerId: customer.id, role: 'customer', phone: customer.phone },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    message: 'સફળતાપૂર્વક લૉગિન થયું.',
    token,
    user: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      role: 'customer',
      shopName: shop.shop_name,
      shopPhone: shop.phone
    }
  });
});

// 3. Get Current User info
router.get('/me', authenticate, (req, res) => {
  if (req.user.role === 'admin') {
    const admin = db.prepare('SELECT id, username, shop_name, phone FROM admins WHERE id = ?').get(req.user.id);
    if (!admin) return res.status(404).json({ error: 'એડમિન મળ્યો નથી.' });
    return res.json({ user: { ...admin, role: 'admin' } });
  } else if (req.user.role === 'customer') {
    const customer = db.prepare('SELECT id, name, phone, address FROM customers WHERE id = ?').get(req.user.customerId);
    if (!customer) return res.status(404).json({ error: 'ગ્રાહક મળ્યો નથી.' });
    const shop = db.prepare('SELECT shop_name, phone FROM admins LIMIT 1').get() || { shop_name: 'ખાતાવહી દુકાન', phone: '' };
    return res.json({ user: { ...customer, role: 'customer', shopName: shop.shop_name, shopPhone: shop.phone } });
  }
  res.status(400).json({ error: 'અમાન્ય રોલ' });
});

// 4. Change Admin Password
router.post('/admin/change-password', authenticate, requireAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'જૂનો પાસવર્ડ અને નવો પાસવર્ડ બંને જરૂરી છે.' });
  }

  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'નવો પાસવર્ડ ઓછામાં ઓછો 4 અક્ષરનો હોવો જોઈએ.' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.user.id);
  if (!admin) {
    return res.status(404).json({ error: 'એડમિન એકાઉન્ટ મળ્યું નથી.' });
  }

  const match = bcrypt.compareSync(currentPassword, admin.password_hash);
  if (!match) {
    return res.status(400).json({ error: 'હાલનો જૂનો પાસવર્ડ ખોટો છે.' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

  res.json({ message: 'પાસવર્ડ સફળતાપૂર્વક બદલાઈ ગયો છે!' });
});

// 5. Update Shop Info / Profile
router.put('/admin/profile', authenticate, requireAdmin, (req, res) => {
  const { shop_name, phone } = req.body;
  db.prepare('UPDATE admins SET shop_name = ?, phone = ? WHERE id = ?').run(
    shop_name || 'મારી દુકાન',
    phone || '',
    req.user.id
  );
  res.json({ message: 'દુકાનની વિગતો સફળતાપૂર્વક સાચવવામાં આવી.' });
});

module.exports = router;
