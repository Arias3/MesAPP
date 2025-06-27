const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// === RUTAS PARA CATEGORÍAS ===

// Obtener todas las categorías
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM categories ORDER BY categoria ASC'
    );
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ success: false, message: 'Error al obtener categorías' });
  }
});

// Obtener solo categorías activas
router.get('/active', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM categories WHERE activo = true ORDER BY categoria ASC'
    );
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener categorías activas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener categorías activas' });
  }
});

// Obtener nombres de categorías activas (para validación)
router.get('/names', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT categoria FROM categories WHERE activo = true ORDER BY categoria ASC'
    );
    
    const names = rows.map(row => row.categoria);
    res.json({ success: true, data: names });
  } catch (error) {
    console.error('Error al obtener nombres de categorías:', error);
    res.status(500).json({ success: false, message: 'Error al obtener nombres de categorías' });
  }
});

// Validar una categoría específica
router.get('/validate/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM categories WHERE categoria = ? AND activo = true',
      [decodeURIComponent(name)]
    );
    
    res.json({
      success: true,
      valid: rows.length > 0,
      category: decodeURIComponent(name)
    });
  } catch (error) {
    console.error('Error al validar categoría:', error);
    res.status(500).json({ success: false, message: 'Error al validar categoría' });
  }
});

// Crear nueva categoría
router.post('/', async (req, res) => {
  try {
    const { categoria, activo = true } = req.body;
    
    // Validaciones básicas
    if (!categoria || categoria.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es obligatorio'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO categories (categoria, activo) VALUES (?, ?)',
      [categoria.trim(), activo]
    );
    
    // Obtener la categoría recién creada
    const [newCategory] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({ success: true, data: newCategory[0] });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ success: false, message: 'Ya existe una categoría con ese nombre' });
    } else {
      res.status(500).json({ success: false, message: 'Error al crear categoría' });
    }
  }
});

// Actualizar categoría
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { categoria, activo } = req.body;
    
    // Verificar que la categoría existe
    const [existing] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }

    await pool.execute(
      'UPDATE categories SET categoria = ?, activo = ? WHERE id = ?',
      [categoria, activo, id]
    );
    
    // Obtener la categoría actualizada
    const [updated] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
    
    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ success: false, message: 'Ya existe una categoría con ese nombre' });
    } else {
      res.status(500).json({ success: false, message: 'Error al actualizar categoría' });
    }
  }
});

// Desactivar categoría (soft delete)
router.patch('/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'UPDATE categories SET activo = false WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }
    
    // Obtener la categoría actualizada
    const [updated] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
    
    res.json({ success: true, data: updated[0], message: 'Categoría desactivada correctamente' });
  } catch (error) {
    console.error('Error al desactivar categoría:', error);
    res.status(500).json({ success: false, message: 'Error al desactivar categoría' });
  }
});

// Activar categoría
router.patch('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'UPDATE categories SET activo = true WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }
    
    // Obtener la categoría actualizada
    const [updated] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
    
    res.json({ success: true, data: updated[0], message: 'Categoría activada correctamente' });
  } catch (error) {
    console.error('Error al activar categoría:', error);
    res.status(500).json({ success: false, message: 'Error al activar categoría' });
  }
});

// Eliminar categoría permanentemente
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }
    
    res.json({ success: true, message: 'Categoría eliminada permanentemente' });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar categoría' });
  }
});

module.exports = router;