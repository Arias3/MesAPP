const express = require('express');
const router = express.Router();
const pool = require('../db/pool');


router.get('/cierres/ultimos', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT date, total 
       FROM daily_closures 
       ORDER BY date DESC 
       LIMIT 10`
    );
    // Opcional: invertir para que el array quede de más antiguo a más reciente
    res.json(rows.reverse());
  } catch (err) {
    console.error('Error al obtener cierres diarios:', err);
    res.status(500).json({ error: 'Error al obtener cierres diarios' });
  }
});

router.post('/cierres', async (req, res) => {
  const { date, time, efectivo, electronicos, expenses } = req.body;

  if (!date || !time) {
    return res.status(400).json({ error: 'Faltan campos requeridos: date o time' });
  }

  try {
    await pool.query(
      `INSERT INTO daily_closures (date, time, efectivo, electronicos, expenses)
       VALUES (?, ?, ?, ?, ?)`,
      [date, time, efectivo || 0, electronicos || 0, expenses || 0]
    );
    res.json({ success: true, message: 'Cierre diario guardado correctamente' });
  } catch (err) {
    console.error('Error al guardar cierre diario:', err);
    res.status(500).json({ error: 'Error al guardar cierre diario' });
  }
});




module.exports = router;