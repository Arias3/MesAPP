const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Ruta POST para login
router.post('/login', (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username requerido' });
  }

  const query = 'SELECT role FROM usuarios WHERE username = ? LIMIT 1';

  db.query(query, [username], (err, results) => {
    if (err) {
      console.error('Error en consulta:', err);
      return res.status(500).json({ success: false, message: 'Error en el servidor' });
    }

    if (results.length > 0) {
      const role = results[0].role;
      return res.json({ success: true, role });
    } else {
      return res.json({ success: false });
    }
  });
});

module.exports = router;