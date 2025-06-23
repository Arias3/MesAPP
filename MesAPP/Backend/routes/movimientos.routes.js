const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// === RUTAS PARA MOVIMIENTOS DE INVENTARIO ===

// Registrar movimiento de inventario
router.post('/api/movimientos', async (req, res) => {
  try {
    const { producto_codigo, tipo_movimiento, cantidad, precio_unitario, motivo, usuario } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el producto existe
      const [producto] = await connection.execute('SELECT * FROM productos WHERE codigo = ?', [producto_codigo]);
      if (producto.length === 0) {
        throw new Error('Producto no encontrado');
      }
      
      // Calcular nuevo stock
      let nuevoStock = producto[0].stock;
      if (tipo_movimiento === 'entrada') {
        nuevoStock += cantidad;
      } else if (tipo_movimiento === 'salida') {
        nuevoStock -= cantidad;
        if (nuevoStock < 0) {
          throw new Error('Stock insuficiente');
        }
      } else if (tipo_movimiento === 'ajuste') {
        nuevoStock = cantidad;
      }
      
      // Actualizar stock del producto
      await connection.execute('UPDATE productos SET stock = ? WHERE codigo = ?', [nuevoStock, producto_codigo]);
      
      // Registrar el movimiento
      await connection.execute(
        'INSERT INTO movimientos_inventario (producto_codigo, tipo_movimiento, cantidad, precio_unitario, motivo, usuario) VALUES (?, ?, ?, ?, ?, ?)',
        [producto_codigo, tipo_movimiento, cantidad, precio_unitario, motivo, usuario]
      );
      
      await connection.commit();
      
      res.json({ success: true, message: 'Movimiento registrado correctamente', nuevo_stock: nuevoStock });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error al registrar movimiento:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Obtener historial de movimientos
router.get('/api/movimientos', async (req, res) => {
  try {
    const { producto_codigo, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT m.*, p.nombre as producto_nombre 
      FROM movimientos_inventario m 
      JOIN productos p ON m.producto_codigo = p.codigo
    `;
    let params = [];
    
    if (producto_codigo) {
      query += ' WHERE m.producto_codigo = ?';
      params.push(producto_codigo);
    }
    
    query += ' ORDER BY m.fecha DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [rows] = await pool.execute(query, params);
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener movimientos' });
  }
});

module.exports = router;