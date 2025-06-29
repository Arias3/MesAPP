const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, table_number, total, NumOrden FROM sales WHERE status = "PENDIENTE"'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener cuentas pendientes:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

router.get('/orden/:numOrden', async (req, res) => {
  const { numOrden } = req.params;
  const [ventas] = await pool.execute(
    'SELECT id, NumOrden, description, type, status FROM sales WHERE NumOrden = ? AND status = "PENDIENTE" LIMIT 1',
    [numOrden]
  );
  if (!ventas.length) return res.status(404).json({ message: "No encontrada" });

  // description es una cadena de nombres separados por coma
  const nombres = ventas[0].description.split(',').map(n => n.trim()).filter(Boolean);

  let productos = [];
  if (nombres.length) {
    const [rows] = await pool.query(
      `SELECT name, price FROM products WHERE name IN (${nombres.map(() => '?').join(',')})`,
      nombres
    );
    // Mantén el orden original de la descripción
    const map = {};
    rows.forEach(r => { map[r.name] = r; });
    productos = nombres.map(name => map[name] || { name, price: 0 });
  }

  res.json({
    ...ventas[0],
    productos
  });
});

router.put('/orden/:numOrden', async (req, res) => {
  const { numOrden } = req.params;
  const { type, descripcion, total, status } = req.body;

  await pool.execute(
    'UPDATE sales SET description = ?, total = ?, type = ?, status = ? WHERE NumOrden = ?',
    [descripcion, total, type, status, numOrden]
  );

  res.json({ success: true });
});

router.delete('/orden/:numOrden', async (req, res) => {
  const { numOrden } = req.params;
  await pool.execute('DELETE FROM sales WHERE NumOrden = ?', [numOrden]);
  res.json({ success: true });
});

module.exports = router;