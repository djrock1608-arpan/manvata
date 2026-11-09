const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All entry routes require admin authentication
router.use(authenticate, requireAdmin);

// 1. Dashboard statistics
router.get('/dashboard-stats', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Today's total sales (UDHAR)
    const salesRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM entries 
      WHERE type = 'UDHAR' AND date = ?
    `).get(today);

    // Today's total collected (JAMA)
    const jamaRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM entries 
      WHERE type = 'JAMA' AND date = ?
    `).get(today);

    // Total outstanding balance across all customers (net market balance)
    const pendingRow = db.prepare(`
      SELECT COALESCE(SUM(CASE WHEN type = 'UDHAR' THEN amount ELSE -amount END), 0) as total 
      FROM entries
    `).get();

    // Counts
    const custCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
    const itemCount = db.prepare('SELECT COUNT(*) as count FROM items').get().count;

    // Recent 10 entries
    const recentEntries = db.prepare(`
      SELECT 
        e.*,
        c.name as customer_name,
        c.phone as customer_phone
      FROM entries e
      JOIN customers c ON e.customer_id = c.id
      ORDER BY e.date DESC, e.id DESC
      LIMIT 10
    `).all();

    res.json({
      todayDate: today,
      todaySales: salesRow ? salesRow.total : 0,
      todayJama: jamaRow ? jamaRow.total : 0,
      totalPending: pendingRow ? pendingRow.total : 0,
      totalCustomers: custCount,
      totalItems: itemCount,
      recentEntries
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'ડેશબોર્ડ માહિતી મેળવવામાં ક્ષતિ થઈ.' });
  }
});

// 2. Add New Entry (UDHAR / જમા / અથવા મલ્ટીપલ આઇટમ બિલ)
router.post('/', (req, res) => {
  try {
    const {
      customer_id,
      type, // 'UDHAR' or 'JAMA'
      item_id,
      item_name,
      quantity,
      unit_price,
      amount,
      payment_mode,
      notes,
      date,
      items // optional array for batch/multi-item bill
    } = req.body;

    if (!customer_id) {
      return res.status(400).json({ error: 'ગ્રાહક પસંદ કરવો જરૂરી છે.' });
    }

    const customer = db.prepare('SELECT id, name FROM customers WHERE id = ?').get(customer_id);
    if (!customer) {
      return res.status(404).json({ error: 'પસંદ કરેલ ગ્રાહક મળ્યો નથી.' });
    }

    const entryDate = date && date.trim() !== '' ? date.trim() : new Date().toISOString().split('T')[0];

    // Case A: Multiple items in a single bill (UDHAR)
    if (Array.isArray(items) && items.length > 0) {
      const insertStmt = db.prepare(`
        INSERT INTO entries (customer_id, item_id, item_name, quantity, unit_price, amount, type, notes, date)
        VALUES (?, ?, ?, ?, ?, ?, 'UDHAR', ?, ?)
      `);

      let totalBill = 0;
      for (const item of items) {
        const qty = parseFloat(item.quantity) || 1;
        const price = parseFloat(item.unit_price) || 0;
        const itemAmount = parseFloat(item.amount) || (qty * price);
        totalBill += itemAmount;

        insertStmt.run(
          customer_id,
          item.item_id || null,
          item.item_name || 'સામાન',
          qty,
          price,
          itemAmount,
          item.notes || notes || '',
          entryDate
        );
      }

      return res.status(201).json({
        message: `${items.length} વસ્તુઓ સફળતાપૂર્વક ઉધાર નોંધાઈ ગઈ. કુલ ₹${totalBill}`,
        totalAmount: totalBill
      });
    }

    // Case B: JAMA (પૈસા જમા)
    if (type === 'JAMA') {
      const jamaAmount = parseFloat(amount);
      if (isNaN(jamaAmount) || jamaAmount <= 0) {
        return res.status(400).json({ error: 'માન્ય જમા રકમ દાખલ કરો.' });
      }

      const result = db.prepare(`
        INSERT INTO entries (customer_id, item_name, quantity, unit_price, amount, type, payment_mode, notes, date)
        VALUES (?, ?, 1, ?, ?, 'JAMA', ?, ?, ?)
      `).run(
        customer_id,
        'પૈસા જમા કર્યા',
        jamaAmount,
        jamaAmount,
        payment_mode || 'CASH',
        notes || '',
        entryDate
      );

      const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(result.lastInsertRowid);
      return res.status(201).json({
        message: `₹${jamaAmount} સફળતાપૂર્વક જમા થયા.`,
        entry
      });
    }

    // Case C: Single UDHAR entry
    const numQty = parseFloat(quantity) || 1;
    const numPrice = parseFloat(unit_price) || 0;
    const totalAmount = amount !== undefined ? parseFloat(amount) : (numQty * numPrice);

    if (isNaN(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ error: 'માન્ય રકમ દાખલ કરો.' });
    }

    const finalItemName = item_name && item_name.trim() !== '' ? item_name.trim() : 'સામાન';

    const result = db.prepare(`
      INSERT INTO entries (customer_id, item_id, item_name, quantity, unit_price, amount, type, payment_mode, notes, date)
      VALUES (?, ?, ?, ?, ?, ?, 'UDHAR', ?, ?, ?)
    `).run(
      customer_id,
      item_id || null,
      finalItemName,
      numQty,
      numPrice,
      totalAmount,
      payment_mode || 'CASH',
      notes || '',
      entryDate
    );

    const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({
      message: 'ઉધાર નોંધ સફળતાપૂર્વક સાચવાઈ ગઈ.',
      entry
    });

  } catch (error) {
    console.error('Entry creation error:', error);
    res.status(500).json({ error: 'નોંધ કરવામાં ક્ષતિ થઈ.' });
  }
});

// 3. Edit entry (સુધારો)
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, quantity, unit_price, amount, payment_mode, notes, date } = req.body;

    const existing = db.prepare('SELECT * FROM entries WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'આ નોંધ મળી નથી.' });
    }

    const numQty = quantity !== undefined ? parseFloat(quantity) : existing.quantity;
    const numPrice = unit_price !== undefined ? parseFloat(unit_price) : existing.unit_price;
    const numAmount = amount !== undefined ? parseFloat(amount) : existing.amount;

    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'માન્ય રકમ દાખલ કરો.' });
    }

    db.prepare(`
      UPDATE entries 
      SET item_name = ?, quantity = ?, unit_price = ?, amount = ?, payment_mode = ?, notes = ?, date = ?
      WHERE id = ?
    `).run(
      item_name ? item_name.trim() : existing.item_name,
      numQty,
      numPrice,
      numAmount,
      payment_mode || existing.payment_mode,
      notes !== undefined ? notes : existing.notes,
      date || existing.date,
      id
    );

    const updated = db.prepare('SELECT * FROM entries WHERE id = ?').get(id);
    res.json({
      message: 'નોંધ સફળતાપૂર્વક સુધારાઈ ગઈ.',
      entry: updated
    });
  } catch (error) {
    console.error('Entry update error:', error);
    res.status(500).json({ error: 'નોંધ સુધારવામાં ક્ષતિ થઈ.' });
  }
});

// 4. Delete entry (કાઢી નાખો)
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id, customer_id, amount, type FROM entries WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'આ નોંધ મળી નથી.' });
    }

    db.prepare('DELETE FROM entries WHERE id = ?').run(id);
    res.json({ message: 'નોંધ સફળતાપૂર્વક કાઢી નાખવામાં આવી.' });
  } catch (error) {
    console.error('Entry delete error:', error);
    res.status(500).json({ error: 'નોંધ કાઢવામાં ક્ષતિ થઈ.' });
  }
});

module.exports = router;
