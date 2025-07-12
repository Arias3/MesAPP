const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/sabores/all', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, status FROM flavors');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener sabores:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

router.post('/sabores', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Nombre requerido' });
    await pool.execute('INSERT INTO flavors (name, status) VALUES (?, 1)', [name]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al agregar sabor:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

router.put('/sabores/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body;
    status = Number(status);
    if (isNaN(status) || (status !== 0 && status !== 1)) {
      return res.status(400).json({ success: false, message: 'Status debe ser 0 o 1' });
    }
    await pool.execute('UPDATE flavors SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

// === NUEVAS RUTAS PARA COMPLETAR CRUD ===

// Actualizar nombre de sabor
router.put('/sabores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Nombre requerido' });
    }

    await pool.execute('UPDATE flavors SET name = ? WHERE id = ?', [name.trim(), id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar sabor:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

// Eliminar sabor
router.delete('/sabores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM flavors WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar sabor:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

// === RUTAS PARA GESTIÓN DE RELACIONES FLAVOR-CATEGORIES ===

// Asociar sabor con categorías
router.post('/sabores/:id/categorias', async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryIds } = req.body;

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Se requiere array de categoryIds' });
    }

    // Eliminar asociaciones existentes
    await pool.execute('DELETE FROM flavor_categories WHERE flavor_id = ?', [id]);

    // Insertar nuevas asociaciones
    for (const categoryId of categoryIds) {
      await pool.execute(
        'INSERT INTO flavor_categories (flavor_id, category_id) VALUES (?, ?)',
        [id, categoryId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error al asociar categorías:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

// Obtener categorías de un sabor
router.get('/sabores/:id/categorias', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.execute(`
      SELECT c.id, c.categoria, c.activo 
      FROM categories c
      INNER JOIN flavor_categories fc ON c.id = fc.category_id
      WHERE fc.flavor_id = ?
    `, [id]);

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener categorías del sabor:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

// Obtener sabores de una categoría
router.get('/categorias/:id/sabores', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.execute(`
      SELECT f.id, f.name, f.status
      FROM flavors f
      INNER JOIN flavor_categories fc ON f.id = fc.flavor_id
      WHERE fc.category_id = ?
    `, [id]);

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener sabores de la categoría:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

// Remover asociación específica
router.delete('/sabores/:flavorId/categorias/:categoryId', async (req, res) => {
  try {
    const { flavorId, categoryId } = req.params;
    
    await pool.execute(
      'DELETE FROM flavor_categories WHERE flavor_id = ? AND category_id = ?',
      [flavorId, categoryId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error al remover asociación:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

module.exports = router;