const express = require('express');
const router = express.Router();
const pool = require('../db/pool');


// Obtener estadísticas generales
router.get('/api/estadisticas', async (req, res) => {
  try {
    const [totalProductos] = await pool.execute('SELECT COUNT(*) as total FROM productos');
    const [stockTotal] = await pool.execute('SELECT SUM(stock) as total FROM productos');
    const [valorInventario] = await pool.execute('SELECT SUM(precio * stock) as total FROM productos');
    const [productosAgotados] = await pool.execute('SELECT COUNT(*) as total FROM productos WHERE stock = 0');
    const [productosPocoStock] = await pool.execute('SELECT COUNT(*) as total FROM productos WHERE stock > 0 AND stock <= 10');
    
    res.json({
      success: true,
      data: {
        total_productos: totalProductos[0].total,
        stock_total: stockTotal[0].total || 0,
        valor_inventario: valorInventario[0].total || 0,
        productos_agotados: productosAgotados[0].total,
        productos_poco_stock: productosPocoStock[0].total
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
});

module.exports = router;