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

router.get('/sales/last-id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT MAX(id) as lastId FROM sales');
    res.json({ lastId: rows[0].lastId || 0 });
  } catch (error) {
    console.error('Error al obtener el último id:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

router.get('/sales/pending-tables', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT table_number FROM sales WHERE status = 'PENDIENTE'"
    );
    const mesasOcupadas = rows.map(r => r.table_number);
    res.json({ mesasOcupadas });
  } catch (error) {
    console.error('Error al obtener mesas ocupadas:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

router.post('/mesa/:mesa', async (req, res) => {
  const mesa = req.params.mesa;
  const { productos } = req.body;
  try {
    // Borra todos los productos actuales de la mesa SIEMPRE
    await pool.query(`DELETE FROM mesa${mesa}`);

    // Si hay productos, los insertamos
    if (Array.isArray(productos) && productos.length > 0) {
      for (const prod of productos) {
        await pool.query(
          `INSERT INTO mesa${mesa} (name, notas, sabores, llevar)
           VALUES (?, ?, ?, ?)`,
          [
            prod.name,
            prod.notas || "",
            prod.sabores || "",
            prod.llevar || 0
          ]
        );
      }
      return res.json({ message: 'Productos guardados en la mesa' });
    } else {
      // Si no hay productos, solo se borró la mesa
      return res.json({ message: 'Mesa vaciada correctamente' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar productos en la mesa' });
  }
});

module.exports = router;