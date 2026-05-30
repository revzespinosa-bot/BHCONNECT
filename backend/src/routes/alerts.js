const express = require('express');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { unread } = req.query;
    let sql = 'SELECT * FROM alerts';
    if (unread === 'true') sql += ' WHERE is_read = FALSE';
    sql += ' ORDER BY created_at DESC LIMIT 50';
    const [rows] = await pool.execute(sql);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    await pool.execute('UPDATE alerts SET is_read = TRUE WHERE is_read = FALSE');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    await pool.execute('UPDATE alerts SET is_read = TRUE WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
