const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET: cantidad de mesas (cuenta solo mesa1, mesa2, ...; excluye mesa0 y 'mesas')
router.get('/count', async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name REGEXP '^mesa[1-9][0-9]*$'"
        );
        res.json({ count: rows.length });
    } catch (err) {
        console.error('Error al contar las mesas:', err);
        res.status(500).json({ error: 'Error al contar las mesas' });
    }
});

// POST: asegurar que existen mesa1 ... mesaN según cantidad
router.post('/', async (req, res) => {
    const { cantidad } = req.body;

    if (!Number.isInteger(cantidad) || cantidad < 1) {
        return res.status(400).json({ error: 'Cantidad inválida. Debe ser un número entero mayor que 0.' });
    }
    
    try {
        const mesasCreadas = [];

        for (let i = 1; i <= cantidad; i++) {
            
            await pool.query(`
                CREATE TABLE IF NOT EXISTS mesa${i} (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    codigoProd VARCHAR(50),
                    nombre VARCHAR(100),
                    precio DECIMAL(10,2),
                    sabores VARCHAR(100),
                    para_llevar BOOLEAN DEFAULT FALSE
                ) ENGINE=InnoDB
            `);
            console.log('Cantidad de mesas a asegurar:', cantidad);
            console.log('Creando (o asegurando) mesa', i);
            mesasCreadas.push(`mesa${i}`);
        }

        res.json({
            message: `Se aseguraron las mesas: ${mesasCreadas.join(', ')}`
        });
    } catch (err) {
        console.error('Error al crear mesas:', err.message);
        res.status(500).json({ error: 'Error al crear mesas', detalle: err.message });
    }
});


// DELETE: eliminar mesas (elimina las mesas sobrantes, de mayor número hacia cantidad+1)
router.delete('/', async (req, res) => {
    const { count, cantidad } = req.body;
    if (
        typeof count !== 'number' ||
        typeof cantidad !== 'number' ||
        cantidad < 0 ||
        count < 0 ||
        cantidad > count
    ) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }

    try {
        let mesasEliminadas = [];
        for (let i = cantidad + 1; i <= count; i++) {
            await pool.query(`DROP TABLE IF EXISTS mesa${i}`);
            mesasEliminadas.push(i);
        }
        res.json({ message: `Se eliminaron las mesas: ${mesasEliminadas.join(', ')}` });
    } catch (err) {
        console.error('Error al eliminar mesas:', err);
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