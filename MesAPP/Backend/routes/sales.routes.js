const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const { date } = req.query;

    let query = 'SELECT id, table_number, date, time, description, total, type, seller, NumOrden FROM sales';
    let params = [];

    if (date) {
      query += ' WHERE date = ?';
      params.push(date);
    }

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ success: false, message: 'Error interno al obtener ventas' });
  }
});

router.delete('/:numero/borrar', async (req, res) => {
  try {
    const { numero } = req.params;

    // Construir nombre de la tabla dinámicamente
    const tableName = `mesa${numero}`;

    // Ejecutar query para borrar contenido
    await pool.execute(`DELETE FROM \`${tableName}\``);

    res.json({ success: true, message: `Contenido de la tabla ${tableName} eliminado correctamente.` });
  } catch (error) {
    console.error('Error al borrar contenido de la mesa:', error);
    res.status(500).json({ success: false, message: 'Error interno al borrar contenido de la mesa.' });
  }
});

router.put('/:numero/disponible', async (req, res) => {
  try {
    const { numero } = req.params;
    await pool.execute('UPDATE mesas SET disponible = 1 WHERE numero = ?', [numero]);
    res.json({ success: true, message: `Mesa ${numero} marcada como disponible.` });
  } catch (error) {
    console.error('Error al actualizar mesa:', error);
    res.status(500).json({ success: false, message: 'Error interno al actualizar mesa.' });
  }
});

router.post('/sales', async (req, res) => {
  try {
    const { table_number, date, time, description, total, type, seller, status, NumOrden } = req.body;
    await pool.execute(
      'INSERT INTO sales (table_number, date, time, description, total, type, seller, NumOrden) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [table_number, date, time, description, total, type, seller, NumOrden]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error al agregar orden:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

module.exports = router;