const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All customer management routes require admin authentication
router.use(authenticate, requireAdmin);

// 1. Get all customers with balances and summary
router.get('/', (req, res) => {
  try {
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;
    let query = `
      SELECT 
        c.id,
        c.name,
        c.phone,
        c.address,
        c.created_at,
        COALESCE(SUM(CASE WHEN e.type = 'UDHAR' THEN e.amount ELSE 0 END), 0) AS total_udhar,
        COALESCE(SUM(CASE WHEN e.type = 'JAMA' THEN e.amount ELSE 0 END), 0) AS total_jama,
        COALESCE(SUM(CASE WHEN e.type = 'UDHAR' THEN e.amount ELSE -e.amount END), 0) AS balance,
        MAX(e.date) AS last_date,
        COUNT(e.id) AS total_entries
      FROM customers c
      LEFT JOIN entries e ON c.id = e.customer_id
    `;

    let customers;
    if (search) {
      query += ` WHERE c.name LIKE ? OR c.phone LIKE ? GROUP BY c.id ORDER BY balance DESC, c.name ASC`;
      customers = db.prepare(query).all(search, search);
    } else {
      query += ` GROUP BY c.id ORDER BY balance DESC, c.name ASC`;
      customers = db.prepare(query).all();
    }

    res.json(customers);
  } catch (error) {
    console.error('Customers fetch error:', error);
    res.status(500).json({ error: 'ગ્રાહકોની યાદી લાવવામાં ક્ષતિ થઈ.' });
  }
});

// 2. Add new customer
router.post('/', (req, res) => {
  try {
    const { name, phone, pin, address } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'ગ્રાહકનું નામ જરૂરી છે.' });
    }
    if (!phone || phone.trim() === '') {
      return res.status(400).json({ error: 'ગ્રાહકનો ફોન નંબર જરૂરી છે.' });
    }

    const cleanPhone = phone.trim().replace(/\D/g, ''); // digits only
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: 'માન્ય 10 અંકનો ફોન નંબર દાખલ કરો.' });
    }

    // Check if phone already registered
    const existing = db.prepare('SELECT id FROM customers WHERE phone = ?').get(cleanPhone);
    if (existing) {
      return res.status(400).json({ error: 'આ ફોન નંબર ધરાવતો ગ્રાહક પહેલેથી જ નોંધાયેલ છે.' });
    }

    // Default 4-digit PIN is 1234 if not specified
    const rawPin = pin && pin.trim().length === 4 ? pin.trim() : '1234';
    const pinHash = bcrypt.hashSync(rawPin, 10);

    const result = db.prepare(`
      INSERT INTO customers (name, phone, pin_hash, address)
      VALUES (?, ?, ?, ?)
    `).run(name.trim(), cleanPhone, pinHash, (address || '').trim());

    const newCustomer = db.prepare(`
      SELECT id, name, phone, address, created_at, 0 as balance, 0 as total_udhar, 0 as total_jama 
      FROM customers WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: 'નવો ગ્રાહક સફળતાપૂર્વક ઉમેરાઈ ગયો.',
      customer: newCustomer,
      defaultPin: rawPin
    });
  } catch (error) {
    console.error('Add customer error:', error);
    res.status(500).json({ error: 'ગ્રાહક ઉમેરવામાં ક્ષતિ થઈ.' });
  }
});

// 3. Get single customer details with ledger entries
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const customer = db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.phone,
        c.address,
        c.created_at,
        COALESCE(SUM(CASE WHEN e.type = 'UDHAR' THEN e.amount ELSE 0 END), 0) AS total_udhar,
        COALESCE(SUM(CASE WHEN e.type = 'JAMA' THEN e.amount ELSE 0 END), 0) AS total_jama,
        COALESCE(SUM(CASE WHEN e.type = 'UDHAR' THEN e.amount ELSE -e.amount END), 0) AS balance
      FROM customers c
      LEFT JOIN entries e ON c.id = e.customer_id
      WHERE c.id = ?
      GROUP BY c.id
    `).get(id);

    if (!customer) {
      return res.status(404).json({ error: 'ગ્રાહક મળ્યો નથી.' });
    }

    const entries = db.prepare(`
      SELECT 
        id,
        item_id,
        item_name,
        quantity,
        unit_price,
        amount,
        type,
        payment_mode,
        notes,
        date,
        created_at
      FROM entries
      WHERE customer_id = ?
      ORDER BY date DESC, id DESC
    `).all(id);

    res.json({
      customer,
      entries
    });
  } catch (error) {
    console.error('Customer details error:', error);
    res.status(500).json({ error: 'ગ્રાહકની ખાતાવહી લાવવામાં ક્ષતિ થઈ.' });
  }
});

// 4. Update customer
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, pin } = req.body;

    const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'ગ્રાહક મળ્યો નથી.' });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'ગ્રાહકનું નામ જરૂરી છે.' });
    }

    const cleanPhone = phone ? phone.trim().replace(/\D/g, '') : existing.phone;
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: 'માન્ય 10 અંકનો ફોન નંબર દાખલ કરો.' });
    }

    // Check if phone taken by other customer
    const phoneCheck = db.prepare('SELECT id FROM customers WHERE phone = ? AND id != ?').get(cleanPhone, id);
    if (phoneCheck) {
      return res.status(400).json({ error: 'આ ફોન નંબર બીજા ગ્રાહક સાથે નોંધાયેલ છે.' });
    }

    let pinHash = existing.pin_hash;
    if (pin && pin.trim().length === 4) {
      pinHash = bcrypt.hashSync(pin.trim(), 10);
    }

    db.prepare(`
      UPDATE customers 
      SET name = ?, phone = ?, address = ?, pin_hash = ?
      WHERE id = ?
    `).run(name.trim(), cleanPhone, (address || '').trim(), pinHash, id);

    res.json({ message: 'ગ્રાહકની વિગતો સફળતાપૂર્વક સુધારાઈ ગઈ.' });
  } catch (error) {
    console.error('Customer update error:', error);
    res.status(500).json({ error: 'ગ્રાહકની વિગતો સુધારવામાં ક્ષતિ થઈ.' });
  }
});

// 5. Delete customer (cascade delete all entries)
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id, name FROM customers WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'ગ્રાહક મળ્યો નથી.' });
    }

    db.prepare('DELETE FROM entries WHERE customer_id = ?').run(id);
    db.prepare('DELETE FROM customers WHERE id = ?').run(id);

    res.json({ message: `${existing.name} અને તેમનું ખાતું સફળતાપૂર્વક કાઢી નાખવામાં આવ્યું.` });
  } catch (error) {
    console.error('Customer delete error:', error);
    res.status(500).json({ error: 'ગ્રાહકનું ખાતું કાઢવામાં ક્ષતિ થઈ.' });
  }
});

module.exports = router;
