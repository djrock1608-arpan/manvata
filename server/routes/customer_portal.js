const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireCustomer } = require('../middleware/auth');

// All routes require customer authentication
router.use(authenticate, requireCustomer);

// 1. Customer summary and metrics (Strictly isolated by req.user.customerId)
router.get('/summary', (req, res) => {
  try {
    const customerId = req.user.customerId;
    const today = new Date().toISOString().split('T')[0];

    const customer = db.prepare(`
      SELECT id, name, phone, address, created_at 
      FROM customers 
      WHERE id = ?
    `).get(customerId);

    if (!customer) {
      return res.status(404).json({ error: 'ગ્રાહક ખાતું મળ્યું નથી.' });
    }

    // Shop info
    const shop = db.prepare('SELECT shop_name, phone FROM admins LIMIT 1').get() || { shop_name: 'ખાતાવહી દુકાન', phone: '' };

    // Total Udhar
    const udharRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM entries 
      WHERE customer_id = ? AND type = 'UDHAR'
    `).get(customerId);

    // Total Jama
    const jamaRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM entries 
      WHERE customer_id = ? AND type = 'JAMA'
    `).get(customerId);

    // Today's purchases
    const todayUdharRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM entries 
      WHERE customer_id = ? AND type = 'UDHAR' AND date = ?
    `).get(customerId, today);

    // Today's items list
    const todayItems = db.prepare(`
      SELECT id, item_name, quantity, unit_price, amount, type, notes, date 
      FROM entries 
      WHERE customer_id = ? AND date = ?
      ORDER BY id DESC
    `).all(customerId, today);

    const totalUdhar = udharRow ? udharRow.total : 0;
    const totalJama = jamaRow ? jamaRow.total : 0;
    const netBalance = totalUdhar - totalJama; // > 0 means customer owes money

    res.json({
      customer,
      shop: {
        name: shop.shop_name,
        phone: shop.phone
      },
      stats: {
        totalUdhar,
        totalJama,
        netBalance,
        todayUdhar: todayUdharRow ? todayUdharRow.total : 0,
        todayItemsCount: todayItems.length
      },
      todayItems
    });
  } catch (error) {
    console.error('Customer summary error:', error);
    res.status(500).json({ error: 'ખાતાવહી હિસાબ મેળવવામાં ક્ષતિ થઈ.' });
  }
});

// 2. Full ledger entries for this customer (Strictly isolated by req.user.customerId)
router.get('/entries', (req, res) => {
  try {
    const customerId = req.user.customerId;
    const filter = req.query.filter; // 'today', 'month', 'all'
    const today = new Date().toISOString().split('T')[0];

    let query = `
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
    `;

    let params = [customerId];

    if (filter === 'today') {
      query += ` AND date = ?`;
      params.push(today);
    } else if (filter === 'month') {
      const currentMonth = today.slice(0, 7); // 'YYYY-MM'
      query += ` AND date LIKE ?`;
      params.push(`${currentMonth}%`);
    }

    query += ` ORDER BY date DESC, id DESC`;

    const entries = db.prepare(query).all(...params);

    res.json(entries);
  } catch (error) {
    console.error('Customer entries error:', error);
    res.status(500).json({ error: 'નોંધો લાવવામાં ક્ષતિ થઈ.' });
  }
});

module.exports = router;
