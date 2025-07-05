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

router.get('/sales/last-id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT MAX(id) as lastId FROM sales');
    res.json({ lastId: rows[0].lastId || 0 });
  } catch (error) {
    console.error('Error al obtener el último id:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

router.post('/mesa/:mesa', async (req, res) => {
  const mesa = parseInt(req.params.mesa, 10);
  const { productos } = req.body;

  if (!Number.isInteger(mesa) || mesa < 1) {
    return res.status(400).json({ error: 'Número de mesa inválido' });
  }
  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ error: 'No hay productos para agregar' });
  }

  try {
    await pool.query(`DELETE FROM mesa${mesa}`);
    for (const prod of productos) {
      // Buscar code y price en la tabla products
      const [rows] = await pool.query(
        "SELECT code, price FROM products WHERE name = ? LIMIT 1",
        [prod.name]
      );
      if (rows.length === 0) {
        console.warn(`Producto no encontrado: ${prod.name}`);
        continue;
      }

      // Preparar sabores como string separado por coma
      const saboresStr = Array.isArray(prod.sabores) ? prod.sabores.join(',') : '';

      // Insertar en la mesa
      await pool.query(
        `INSERT INTO mesa${mesa} (codigoProd, nombre, precio, sabores, para_llevar)
         VALUES (?, ?, ?, ?, ?)`,
        [rows[0].code, prod.name, rows[0].price, saboresStr, prod.llevar || 0]
      );
      console.log(`Producto agregado a mesa${mesa}:`, prod.name, 'Sabores:', saboresStr);
    }

    // Cambiar el estado de la mesa a ocupada (disponible = 0)
    await pool.query(
      "UPDATE mesas SET disponible = 0 WHERE numero = ?",
      [mesa]
    );

    res.json({ message: 'Productos agregados a la mesa y mesa marcada como ocupada' });
  } catch (err) {
    console.error('Error al agregar productos a la mesa:', err);
    res.status(500).json({ error: 'Error al agregar productos a la mesa' });
  }
});

module.exports = router;