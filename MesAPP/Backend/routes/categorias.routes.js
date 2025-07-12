const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const categoryManager = require('../services/categoryManager'); // Solo para rutas que no modificamos

// === RUTAS PARA CATEGORÍAS ===

// Obtener todas las categorías
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM categories ORDER BY categoria ASC'
    );
    
    res.json({
      success: true,
      data: rows,
      total: rows.length,
      message: `${rows.length} categorías encontradas`
    });
  } catch (error) {
    console.error('❌ CategoriesRoute: Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al obtener categorías'
    });
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
        error: 'El nombre de la categoría es obligatorio',
        message: 'El nombre de la categoría es obligatorio'
      });
    }
    
    // Validar low_stock antes de parseInt
    if (low_stock === '' || low_stock === null || low_stock === undefined) {
      return res.status(400).json({
        success: false,
        error: 'El valor de stock bajo es obligatorio',
        message: 'El valor de stock bajo es obligatorio'
      });
    }
    
    const lowStockValue = parseInt(low_stock, 10);
    
    if (isNaN(lowStockValue)) {
      return res.status(400).json({
        success: false,
        error: 'El valor de stock bajo debe ser un número válido',
        message: 'El valor de stock bajo debe ser un número válido'
      });
    }
    
    const trimmedCategoria = categoria.trim();
    
    console.log('📋 CategoriesRoute: Datos procesados:', {
      categoria: trimmedCategoria,
      activo: true,
      low_stock: lowStockValue
    });
    
    // Verificar si ya existe
    const [existing] = await pool.execute(
      'SELECT * FROM categories WHERE categoria = ?',
      [trimmedCategoria]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una categoría con ese nombre',
        message: 'Ya existe una categoría con ese nombre'
      });
    }

    // Crear en base de datos con SQL directo
    const [result] = await pool.execute(
      'INSERT INTO categories (categoria, activo, low_stock) VALUES (?, ?, ?)',
      [trimmedCategoria, true, lowStockValue]
    );

    // Obtener categoría creada
    const [newCategory] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [result.insertId]
    );

    console.log('✅ CategoriesRoute: Categoría creada exitosamente');
    res.status(201).json({
      success: true,
      data: newCategory[0],
      message: `Categoría "${trimmedCategoria}" creada exitosamente`
    });
    
  } catch (error) {
    console.error('❌ CategoriesRoute: Error creando categoría:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una categoría con ese nombre',
        message: 'Ya existe una categoría con ese nombre'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al crear categoría'
    });
  }
});

// Actualizar categoría
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { categoria, activo, low_stock } = req.body;
    
    // Validación simple
    if (!categoria || categoria.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'El nombre de la categoría es obligatorio',
        message: 'El nombre de la categoría es obligatorio'
      });
    }
    
    // Validar low_stock antes de parseInt
    if (low_stock === '' || low_stock === null || low_stock === undefined) {
      return res.status(400).json({
        success: false,
        error: 'El valor de stock bajo es obligatorio',
        message: 'El valor de stock bajo es obligatorio'
      });
    }
    
    const lowStockValue = parseInt(low_stock, 10);
    
    if (isNaN(lowStockValue)) {
      return res.status(400).json({
        success: false,
        error: 'El valor de stock bajo debe ser un número válido',
        message: 'El valor de stock bajo debe ser un número válido'
      });
    }
    
    // Manejo correcto del valor booleano activo
    const activoValue = activo === true || activo === 'true' || activo === 1;
    const trimmedCategoria = categoria.trim();
    
    console.log('📋 CategoriesRoute: Datos procesados:', {
      id,
      categoria: trimmedCategoria,
      activo: activoValue,
      low_stock: lowStockValue
    });
    
    // Verificar si la categoría existe
    const [existing] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada',
        message: 'Categoría no encontrada'
      });
    }

    await pool.execute(
      'UPDATE categories SET categoria = ?, activo = ?, low_stock = ? WHERE id = ?',
      [trimmedCategoria, activoValue, lowStockValue, id]
    );

    // Obtener categoría actualizada
    const [updated] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    console.log('✅ CategoriesRoute: Categoría actualizada exitosamente');
    res.json({
      success: true,
      data: updated[0],
      message: 'Categoría actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ CategoriesRoute: Error actualizando categoría:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una categoría con ese nombre',
        message: 'Ya existe una categoría con ese nombre'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al actualizar categoría'
    });
  }
});

// === RUTAS EXISTENTES SIN CAMBIOS (mantienen categoryManager) ===

// Obtener solo categorías activas
router.get('/active', async (req, res) => {
  try {
    console.log('📋 CategoriesRoute: Obteniendo categorías activas...');
    
    const result = await categoryManager.getActiveCategories();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        total: result.total,
        message: `${result.total} categorías activas encontradas`
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: 'Error al obtener categorías activas'
      });
    }
  } catch (error) {
    console.error('❌ CategoriesRoute: Error obteniendo categorías activas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al obtener categorías activas'
    });
  }
});

// Obtener nombres de categorías activas (para validación)
router.get('/names', async (req, res) => {
  try {
    console.log('📋 CategoriesRoute: Obteniendo nombres de categorías...');
    
    const result = await categoryManager.getActiveCategoryNames();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        total: result.total,
        message: `${result.total} nombres de categorías obtenidos`
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: 'Error al obtener nombres de categorías'
      });
    }
  } catch (error) {
    console.error('❌ CategoriesRoute: Error obteniendo nombres:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al obtener nombres de categorías'
    });
  }
});

// Validar una categoría específica
router.get('/validate/:name', async (req, res) => {
  try {
    console.log(`🔍 CategoriesRoute: Validando categoría "${req.params.name}"`);
    
    const categoryName = decodeURIComponent(req.params.name);
    const result = await categoryManager.validateCategory(categoryName);
    
    if (result.success) {
      res.json({
        success: true,
        valid: result.valid,
        exists: result.exists,
        category: categoryName,
        data: result.category,
        message: result.valid ? 'Categoría válida' : 'Categoría no válida o inactiva'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        valid: false,
        category: categoryName,
        message: 'Error al validar categoría'
      });
    }
  } catch (error) {
    console.error('❌ CategoriesRoute: Error validando categoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      valid: false,
      message: 'Error al validar categoría'
    });
  }
});

// Desactivar categoría (soft delete)
router.patch('/:id/deactivate', async (req, res) => {
  try {
    console.log(`🔒 CategoriesRoute: Desactivando categoría ID: ${req.params.id}`);
    
    const { id } = req.params;
    
    const result = await categoryManager.deactivateCategory(id);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: result.message
      });
    } else {
      const statusCode = result.error === 'Categoría no encontrada' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        message: result.error
      });
    }
  } catch (error) {
    console.error('❌ CategoriesRoute: Error desactivando categoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al desactivar categoría'
    });
  }
});

// Activar categoría
router.patch('/:id/activate', async (req, res) => {
  try {
    console.log(`🔓 CategoriesRoute: Activando categoría ID: ${req.params.id}`);
    
    const { id } = req.params;
    
    const result = await categoryManager.activateCategory(id);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: result.message
      });
    } else {
      const statusCode = result.error === 'Categoría no encontrada' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error,
        message: result.error
      });
    }
  } catch (error) {
    console.error('❌ CategoriesRoute: Error activando categoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al activar categoría'
    });
  }
});

// Eliminar categoría permanentemente (MODIFICADO - SQL directo)
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️ CategoriesRoute: Eliminando categoría ID: ${req.params.id}`);
    
    const { id } = req.params;
    
    // Verificar si la categoría existe antes de eliminar
    const [existing] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada',
        message: 'La categoría especificada no existe'
      });
    }

    const categoryName = existing[0].categoria;

    // Eliminar categoría con SQL directo
    const [result] = await pool.execute(
      'DELETE FROM categories WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada',
        message: 'No se pudo eliminar la categoría'
      });
    }

    console.log('✅ CategoriesRoute: Categoría eliminada exitosamente');
    res.json({
      success: true,
      message: `Categoría "${categoryName}" eliminada permanentemente`
    });
    
  } catch (error) {
    console.error('❌ CategoriesRoute: Error eliminando categoría:', error);
    
    // Manejar errores de integridad referencial si hay productos asociados
    if (error.code === 'ER_ROW_IS_REFERENCED' || error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar la categoría porque tiene productos asociados',
        message: 'Elimina primero todos los productos de esta categoría'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al eliminar categoría'
    });
  }
});

// Obtener detalles de una categoría específica (MODIFICADO - SQL directo)
router.get('/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Categoría no encontrada',
        message: 'La categoría especificada no existe'
      });
    }
    
    res.json({
      success: true,
      data: {
        category: rows[0]
      },
      message: 'Detalles de categoría obtenidos exitosamente'
    });
    
  } catch (error) {
    console.error('❌ CategoriesRoute: Error obteniendo detalles:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al obtener detalles de categoría'
    });
  }
});

module.exports = router;