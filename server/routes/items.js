const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All item routes require admin authentication
router.use(authenticate, requireAdmin);

// 1. Get all items
router.get('/', (req, res) => {
  try {
    const search = req.query.search ? `%${req.query.search.trim()}%` : null;
    let items;
    if (search) {
      items = db.prepare('SELECT * FROM items WHERE name LIKE ? ORDER BY name ASC').all(search);
    } else {
      items = db.prepare('SELECT * FROM items ORDER BY name ASC').all();
    }
    res.json(items);
  } catch (error) {
    console.error('Items fetch error:', error);
    res.status(500).json({ error: 'વસ્તુઓની યાદી લાવવામાં ક્ષતિ થઈ.' });
  }
});

// 2. Add new item
router.post('/', (req, res) => {
  try {
    const { name, price, unit } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'વસ્તુનું નામ જરૂરી છે.' });
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'માન્ય ભાવ (કિંમત) દાખલ કરો.' });
    }

    const cleanUnit = unit && unit.trim() !== '' ? unit.trim() : 'નંગ';

    const result = db.prepare('INSERT INTO items (name, price, unit) VALUES (?, ?, ?)').run(
      name.trim(),
      numPrice,
      cleanUnit
    );

    const newItem = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({
      message: 'વસ્તુ સફળતાપૂર્વક ઉમેરાઈ ગઈ.',
      item: newItem
    });
  } catch (error) {
    console.error('Item add error:', error);
    res.status(500).json({ error: 'વસ્તુ ઉમેરવામાં ક્ષતિ થઈ.' });
  }
});

// 3. Update existing item
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, unit } = req.body;

    const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'આ વસ્તુ મળી નથી.' });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'વસ્તુનું નામ જરૂરી છે.' });
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'માન્ય ભાવ (કિંમત) દાખલ કરો.' });
    }

    const cleanUnit = unit && unit.trim() !== '' ? unit.trim() : existing.unit;

    db.prepare('UPDATE items SET name = ?, price = ?, unit = ? WHERE id = ?').run(
      name.trim(),
      numPrice,
      cleanUnit,
      id
    );

    const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    res.json({
      message: 'વસ્તુની વિગત સુધારાઈ ગઈ.',
      item: updated
    });
  } catch (error) {
    console.error('Item update error:', error);
    res.status(500).json({ error: 'વસ્તુ સુધારવામાં ક્ષતિ થઈ.' });
  }
});

// 4. Delete item
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'આ વસ્તુ મળી નથી.' });
    }

    db.prepare('DELETE FROM items WHERE id = ?').run(id);
    res.json({ message: 'વસ્તુ સફળતાપૂર્વક કાઢી નાખવામાં આવી.' });
  } catch (error) {
    console.error('Item delete error:', error);
    res.status(500).json({ error: 'વસ્તુ કાઢવામાં ક્ષતિ થઈ.' });
  }
});

module.exports = router;
