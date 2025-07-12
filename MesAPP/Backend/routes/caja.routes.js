const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
         numero AS table_number,
         COALESCE(subtotal, 0) AS total,
         ordenNum AS NumOrden
       FROM mesas
       WHERE disponible = 0 AND ordenNum IS NOT NULL`
    );

    res.json(rows);
  } catch (error) {
    console.error('❌ Error al obtener cuentas pendientes:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

router.get('/mesa/:mesa', async (req, res) => {
  const mesa = parseInt(req.params.mesa, 10);

  if (!Number.isInteger(mesa) || mesa < 1) {
    return res.status(400).json({ error: "Número de mesa inválido" });
  }

  try {
    // 1. Traer productos de la mesa con para_llevar incluido
    const [productos] = await pool.query(
      `SELECT 
         nombre AS name, 
         precio AS price, 
         para_llevar 
       FROM mesa${mesa}`
    );

    // 2. Obtener información de orden y subtotal
    const [infoMesa] = await pool.query(
      `SELECT ordenNum, subtotal FROM mesas WHERE numero = ? LIMIT 1`,
      [mesa]
    );

    res.json({
      mesa,
      ordenNum: infoMesa[0]?.ordenNum || null,
      subtotal: infoMesa[0]?.subtotal || 0,
      productos
    });
  } catch (err) {
    console.error("❌ Error al obtener productos de mesa:", err);
    res.status(500).json({ error: "Error interno al obtener productos de la mesa" });
  }
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

router.delete('/mesa/:mesa', async (req, res) => {
  const { mesa } = req.params;

  try {
    const mesaNum = parseInt(mesa, 10);
    if (isNaN(mesaNum)) {
      return res.status(400).json({ success: false, message: 'Número de mesa inválido' });
    }

    const nombreTabla = `mesa${mesaNum}`;

    // 1. Limpiar la tabla mesaN (ej: mesa1, mesa2, ...)
    await pool.execute(`DELETE FROM \`${nombreTabla}\``);

    // 2. Cambiar el estado de la mesa a disponible en la tabla "mesas"
    await pool.execute('UPDATE mesas SET disponible = 1 WHERE id = ?', [mesaNum]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar orden:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});




module.exports = router;