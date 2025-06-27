const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Obtener todos los sabores activos
router.get('/sabores', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, status FROM flavors WHERE status = 1');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener sabores:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

// Obtener todos los productos y su cantidad de sabores
router.get('/productos', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, flavor_count, price FROM products');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

module.exports = router;