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

module.exports = router;