const express = require('express');
const router = express.Router();
const pool = require('../db/pool');


// Obtener estadísticas generales
router.get('/', async (req, res) => {
  try {
    console.log('📊 StatisticsRoute: Calculando estadísticas con low_stock por categoría...');
    
    // Total de productos
    const [totalProductos] = await pool.execute('SELECT COUNT(*) as total FROM productos');
    const [stockTotal] = await pool.execute('SELECT SUM(stock) as total FROM productos');
    const [valorInventario] = await pool.execute('SELECT SUM(precio * stock) as total FROM productos');
    const [productosAgotados] = await pool.execute('SELECT COUNT(*) as total FROM productos WHERE stock = 0');
    const [productosPocoStock] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM productos p 
      JOIN categories c ON p.category = c.categoria 
      WHERE p.stock > 0 AND p.stock <= c.low_stock AND c.activo = true
    `);
    
    console.log('✅ StatisticsRoute: Estadísticas calculadas exitosamente');
    console.log('📋 StatisticsRoute: Productos con poco stock (dinámico):', productosPocoStock[0].total);
    
    res.json({
      success: true,
      data: {
        total_productos: totalProductos[0].total,
        stock_total: stockTotal[0].total || 0,
        valor_inventario: valorInventario[0].total || 0,
        productos_agotados: productosAgotados[0].total,
        productos_poco_stock: productosPocoStock[0].total
      },
      message: 'Estadísticas obtenidas exitosamente'
    });
    
  } catch (error) {
    console.error('❌ StatisticsRoute: Error al obtener estadísticas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      message: 'Error al obtener estadísticas' 
    });
  }
});

// NUEVA RUTA: Obtener información de categorías con sus low_stock para el frontend
router.get('/categorias-config', async (req, res) => {
  try {
    console.log('📋 StatisticsRoute: Obteniendo configuración de categorías...');
    
    // Obtener todas las categorías activas con su configuración de low_stock
    const [categorias] = await pool.execute(`
      SELECT categoria, low_stock, activo 
      FROM categories 
      WHERE activo = true 
      ORDER BY categoria ASC
    `);
    
    // Convertir a objeto para fácil acceso desde el frontend
    const categoriasConfig = {};
    categorias.forEach(cat => {
      categoriasConfig[cat.categoria] = {
        low_stock: cat.low_stock,
        activo: cat.activo
      };
    });
    
    console.log('✅ StatisticsRoute: Configuración de categorías obtenida');
    console.log('📊 StatisticsRoute: Total categorías activas:', categorias.length);
    
    res.json({
      success: true,
      data: {
        categorias: categorias,
        config: categoriasConfig
      },
      total: categorias.length,
      message: `${categorias.length} configuraciones de categorías obtenidas`
    });
    
  } catch (error) {
    console.error('❌ StatisticsRoute: Error obteniendo configuración de categorías:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      message: 'Error al obtener configuración de categorías' 
    });
  }
});

// NUEVA RUTA: Estadísticas detalladas por categoría
router.get('/por-categoria', async (req, res) => {
  try {
    console.log('📊 StatisticsRoute: Calculando estadísticas detalladas por categoría...');
    
    const [estadisticasPorCategoria] = await pool.execute(`
      SELECT 
        c.categoria,
        c.low_stock as umbral_bajo_stock,
        COUNT(p.id) as total_productos,
        SUM(p.stock) as stock_total,
        SUM(p.precio * p.stock) as valor_total,
        SUM(CASE WHEN p.stock = 0 THEN 1 ELSE 0 END) as productos_agotados,
        SUM(CASE WHEN p.stock > 0 AND p.stock <= c.low_stock THEN 1 ELSE 0 END) as productos_poco_stock,
        SUM(CASE WHEN p.stock > c.low_stock THEN 1 ELSE 0 END) as productos_stock_normal
      FROM categories c
      LEFT JOIN productos p ON c.categoria = p.category
      WHERE c.activo = true
      GROUP BY c.id, c.categoria, c.low_stock
      ORDER BY c.categoria ASC
    `);
    
    console.log('✅ StatisticsRoute: Estadísticas por categoría calculadas');
    console.log('📋 StatisticsRoute: Categorías procesadas:', estadisticasPorCategoria.length);
    
    res.json({
      success: true,
      data: estadisticasPorCategoria.map(cat => ({
        categoria: cat.categoria,
        umbral_bajo_stock: cat.umbral_bajo_stock,
        total_productos: cat.total_productos || 0,
        stock_total: cat.stock_total || 0,
        valor_total: parseFloat(cat.valor_total) || 0,
        productos_agotados: cat.productos_agotados || 0,
        productos_poco_stock: cat.productos_poco_stock || 0,
        productos_stock_normal: cat.productos_stock_normal || 0
      })),
      total: estadisticasPorCategoria.length,
      message: `Estadísticas de ${estadisticasPorCategoria.length} categorías calculadas`
    });
    
  } catch (error) {
    console.error('❌ StatisticsRoute: Error calculando estadísticas por categoría:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      message: 'Error al calcular estadísticas por categoría' 
    });
  }
});

module.exports = router;