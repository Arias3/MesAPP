const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET: cantidad de mesas (cuenta las tablas mesa1, mesa2, ...)
router.get('/count', async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name LIKE 'mesa%'"
        );
        res.json({ count: rows.length });
    } catch (err) {
        console.error('Error al contar las mesas:', err); // <-- Agrega este log para ver el error en consola
        res.status(500).json({ error: 'Error al contar las mesas' });
    }
});

// POST: agregar mesas (crea nuevas tablas mesaN)
router.post('/', async (req, res) => {
    const { cantidad } = req.body;
    if (!cantidad || cantidad < 1) return res.status(400).json({ error: 'Cantidad inválida' });

    try {
        const [rows] = await pool.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name LIKE 'mesa%'"
        );
        const existentes = rows.length;
        let creadas = 0;
        for (let i = existentes + 1; i <= existentes + cantidad; i++) {
            await pool.query(
                `CREATE TABLE IF NOT EXISTS mesa${i} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      codigoProd VARCHAR(50),
      nombre VARCHAR(100),
      precio DECIMAL(10,2),
      para_llevar BOOLEAN DEFAULT FALSE
        )`
            );
            creadas++;
        }
        res.json({ message: `Se crearon ${creadas} mesas nuevas.` });
    } catch (err) {
        res.status(500).json({ error: 'Error al crear mesas' });
    }
});

// DELETE: eliminar mesas (elimina las últimas N tablas mesaN)
router.delete('/', async (req, res) => {
    const { cantidad } = req.body;
    if (!cantidad || cantidad < 1) return res.status(400).json({ error: 'Cantidad inválida' });

    try {
        const [rows] = await pool.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name LIKE 'mesa%' ORDER BY LENGTH(table_name), table_name"
        );
        const existentes = rows.length;
        if (cantidad > existentes) return res.status(400).json({ error: 'No hay tantas mesas para eliminar' });

        let eliminadas = 0;
        for (let i = existentes; i > existentes - cantidad; i--) {
            await pool.query(`DROP TABLE IF EXISTS mesa${i}`);
            eliminadas++;
        }
        res.json({ message: `Se eliminaron ${eliminadas} mesas.` });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar mesas' });
    }
});

router.get('/productos/:mesa', async (req, res) => {
  const mesa = req.params.mesa;
  try {
    const [rows] = await pool.query(`SELECT * FROM mesa${mesa}`);
    res.json({ productos: rows });
  } catch (err) {
    res.status(500).json({ productos: [] });
  }
});

module.exports = router;