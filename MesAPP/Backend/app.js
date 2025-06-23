const express = require('express');
const cors = require('cors');

// Rutas
const productosRoutes = require('./routes/productos.routes');
const movimientosRoutes = require('./routes/movimientos.routes');
const loginRoutes = require('./routes/login.routes');
const estadisticasRoutes = require('./routes/estadisticas.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/productos', productosRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/estadisticas', estadisticasRoutes);

// ⚠️ Asegúrate que tu frontend esté enviando POST a /login (no /api/login)
app.use('/', loginRoutes); // Esto permite que /login funcione directamente

// Ruta opcional para probar si el servidor responde
app.get('/ping', (req, res) => {
  res.json({ success: true, message: 'Servidor activo' });
});

module.exports = app;
