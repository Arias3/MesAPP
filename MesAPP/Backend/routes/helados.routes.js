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

// Eliminar un sabor
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

// Editar (actualizar nombre) de un sabor
router.put('/sabores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Nombre requerido' });
    await pool.execute('UPDATE flavors SET name = ? WHERE id = ?', [name, id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al editar sabor:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

module.exports = router;