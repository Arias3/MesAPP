const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Función para calcular rentabilidad automáticamente
function calcularRentabilidad(costo, precio) {
  if (costo === 0) return 0;
  return ((precio - costo) / costo) * 100;
}


// === RUTAS PARA PRODUCTOS ===

// Obtener todos los productos con búsqueda opcional
router.get('/api/productos', async (req, res) => {
  try {
    const { search = '', limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM productos';
    let params = [];
    
    if (search) {
      query += ' WHERE nombre LIKE ? OR barcode LIKE ?';
      const searchParam = `%${search}%`;
      params = [searchParam, searchParam];
    }
    
    query += ' ORDER BY nombre ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [rows] = await pool.execute(query, params);
    
    // Formatear rentabilidad con símbolo de porcentaje
    const formattedRows = rows.map(row => ({
      ...row,
      rentabilidad: `${row.rentabilidad.toFixed(2)}%`
    }));
    
    res.json({ success: true, data: formattedRows });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener productos' });
  }
});

// Obtener un producto específico por código
router.get('/api/productos/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const [rows] = await pool.execute('SELECT * FROM productos WHERE codigo = ?', [codigo]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    
    const producto = rows[0];
    producto.rentabilidad = `${producto.rentabilidad.toFixed(2)}%`;
    
    res.json({ success: true, data: producto });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ success: false, message: 'Error al obtener producto' });
  }
});

// Crear nuevo producto
router.post('/api/productos', async (req, res) => {
  try {
    const { nombre, costo, precio, stock, barcode } = req.body;
    
    // Validaciones básicas
    if (!nombre || costo < 0 || precio < 0 || stock < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos inválidos. Verifique nombre, costo, precio y stock.' 
      });
    }
    
    // Calcular rentabilidad
    const rentabilidad = calcularRentabilidad(costo, precio);
    
    const [result] = await pool.execute(
      'INSERT INTO productos (nombre, costo, precio, rentabilidad, stock, barcode) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, costo, precio, rentabilidad, stock, barcode || null]
    );
    
    // Obtener el producto recién creado
    const [newProduct] = await pool.execute('SELECT * FROM productos WHERE codigo = ?', [result.insertId]);
    const producto = newProduct[0];
    producto.rentabilidad = `${producto.rentabilidad.toFixed(2)}%`;
    
    res.status(201).json({ success: true, data: producto });
  } catch (error) {
    console.error('Error al crear producto:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ success: false, message: 'El código de barras ya existe' });
    } else {
      res.status(500).json({ success: false, message: 'Error al crear producto' });
    }
  }
});

// Actualizar producto
router.put('/api/productos/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const { nombre, costo, precio, stock, barcode } = req.body;
    
    // Verificar que el producto existe
    const [existing] = await pool.execute('SELECT * FROM productos WHERE codigo = ?', [codigo]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    
    // Calcular nueva rentabilidad
    const rentabilidad = calcularRentabilidad(costo, precio);
    
    await pool.execute(
      'UPDATE productos SET nombre = ?, costo = ?, precio = ?, rentabilidad = ?, stock = ?, barcode = ? WHERE codigo = ?',
      [nombre, costo, precio, rentabilidad, stock, barcode || null, codigo]
    );
    
    // Obtener el producto actualizado
    const [updated] = await pool.execute('SELECT * FROM productos WHERE codigo = ?', [codigo]);
    const producto = updated[0];
    producto.rentabilidad = `${producto.rentabilidad.toFixed(2)}%`;
    
    res.json({ success: true, data: producto });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ success: false, message: 'El código de barras ya existe' });
    } else {
      res.status(500).json({ success: false, message: 'Error al actualizar producto' });
    }
  }
});

// Eliminar producto
router.delete('/api/productos/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    
    const [result] = await pool.execute('DELETE FROM productos WHERE codigo = ?', [codigo]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    
    res.json({ success: true, message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar producto' });
  }
});
module.exports = router;
