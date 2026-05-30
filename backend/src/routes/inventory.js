const express = require('express');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { deductInventory, restockInventory } = require('../services/inventoryService');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, lowStock } = req.query;
    let sql = 'SELECT * FROM inventory_items WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (lowStock === 'true') {
      sql += ' AND quantity <= low_stock_threshold';
    }

    sql += ' ORDER BY item_name';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { itemName, category, unit, quantity, lowStockThreshold, expiryDate } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO inventory_items (item_name, category, unit, quantity, low_stock_threshold, expiry_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [itemName, category, unit || 'pcs', quantity || 0, lowStockThreshold || 50, expiryDate || null]
    );
    const [item] = await pool.execute('SELECT * FROM inventory_items WHERE id = ?', [result.insertId]);
    res.status(201).json(item[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT t.*, i.item_name, u.full_name AS performed_by_name
       FROM inventory_transactions t
       JOIN inventory_items i ON i.id = t.item_id
       LEFT JOIN users u ON u.id = t.performed_by
       ORDER BY t.created_at DESC LIMIT 50`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/deduct', authMiddleware, async (req, res) => {
  try {
    const { quantity, patientId, notes } = req.body;
    const result = await deductInventory(req.params.id, quantity || 1, patientId || null, req.user.id, notes);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/restock', authMiddleware, async (req, res) => {
  try {
    const { quantity, notes } = req.body;
    const result = await restockInventory(req.params.id, quantity, req.user.id, notes);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
