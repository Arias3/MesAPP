const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, role FROM staff');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener staff:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

router.put('/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ success: false, message: 'Role requerido' });
    }
    await pool.execute('UPDATE staff SET role = ? WHERE id = ?', [role, id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar role:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

router.put('/:id/name', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Nombre requerido' });
    }
    await pool.execute('UPDATE staff SET name = ? WHERE id = ?', [name, id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar nombre:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, role } = req.body;
    if (!name || !role) {
      return res.status(400).json({ success: false, message: 'Nombre y rol requeridos' });
    }
    // Puedes usar AUTO_INCREMENT en la base de datos para el id
    await pool.execute('INSERT INTO staff (name, role) VALUES (?, ?)', [name, role]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error al agregar personal:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

module.exports = router;