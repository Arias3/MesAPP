const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  const { date } = req.query;
  const [rows] = await pool.execute(
    'SELECT id, time, description, total, type, seller, status FROM sales WHERE date = ? AND status = "PAGO" ORDER BY time DESC',
    [date]
  );
  res.json(rows);
});


router.post('/sales', async (req, res) => {
  try {
    const { table_number, date, time, description, total, type, seller, status, NumOrden } = req.body;
    await pool.execute(
      'INSERT INTO sales (table_number, date, time, description, total, type, seller, status, NumOrden) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [table_number, date, time, description, total, type, seller, status, NumOrden]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error al agregar orden:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

module.exports = router;