const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Ruta POST para login
// Ejemplo en server.js o en un archivo routes/login.js
router.post('/login', async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Usuario requerido' });
  }

  try {
    const [rows] = await pool.execute('SELECT role FROM staff WHERE name = ?', [username]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const role = rows[0].role;
    return res.json({ success: true, token: 'falso-token', role }); // token falso de ejemplo
  } catch (error) {
    console.error('Error al buscar usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});


module.exports = router;