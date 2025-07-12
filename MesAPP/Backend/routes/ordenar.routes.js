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

// GET: Obtener un nuevo número de orden único para la jornada actual
router.get('/lastId', async (req, res) => {
  try {
    const hoy = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

    // Verifica si ya existe un registro para hoy
    const [rows] = await pool.query(
      'SELECT ultimo_numero FROM control WHERE fecha = ?',
      [hoy]
    );

    let nuevoNumero;

    if (rows.length > 0) {
      nuevoNumero = rows[0].ultimo_numero + 1;
      await pool.query(
        'UPDATE control SET ultimo_numero = ? WHERE fecha = ?',
        [nuevoNumero, hoy]
      );
    } else {
      nuevoNumero = 1;
      await pool.query(
        'INSERT INTO control (fecha, ultimo_numero) VALUES (?, ?)',
        [hoy, nuevoNumero]
      );
    }

    res.json({ numero: nuevoNumero });
  } catch (error) {
    console.error('Error al generar número de orden:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});


router.post('/mesa/:mesa', async (req, res) => {
  const mesa = parseInt(req.params.mesa, 10);
  const { productos, ordenNum } = req.body;

  if (!Number.isInteger(mesa) || mesa < 1) {
    return res.status(400).json({ error: 'Número de mesa inválido' });
  }

  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ error: 'No hay productos para agregar' });
  }

  try {
    // 1. Vaciar mesa existente
    await pool.query(`DELETE FROM mesa${mesa}`);

    let subtotal = 0;

    // 2. Insertar nuevos productos en la mesa
    for (const prod of productos) {
      const [rows] = await pool.query(
        `SELECT code, price FROM products WHERE name = ? LIMIT 1`,
        [prod.name]
      );
      if (rows.length === 0) continue;

      const precio = Number(rows[0].price) || 0;
      const llevar = prod.llevar === 1 ? 1000 : 0;

      subtotal += precio + llevar;

      const saboresStr = Array.isArray(prod.sabores)
        ? prod.sabores.join(',')
        : (typeof prod.sabores === 'string' ? prod.sabores : '');

      await pool.query(
        `INSERT INTO mesa${mesa} (codigoProd, nombre, precio, sabores, para_llevar)
         VALUES (?, ?, ?, ?, ?)`,
        [rows[0].code, prod.name, precio, saboresStr, prod.llevar || 0]
      );
    }

    // 3. Actualizar el estado de la mesa
    await pool.query(
      `UPDATE mesas SET disponible = 0, ordenNum = ?, subtotal = ? WHERE numero = ?`,
      [ordenNum, subtotal, mesa]
    );

    res.json({
      message: 'Productos agregados y número de orden registrado correctamente',
      subtotal
    });

  } catch (err) {
    console.error('Error al agregar productos a la mesa:', err);
    res.status(500).json({ error: 'Error al agregar productos a la mesa' });
  }
});

module.exports = router;