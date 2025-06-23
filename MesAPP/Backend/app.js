const express = require('express');
const cors = require('cors');

const productosRoutes = require('./routes/productos.routes');
const movimientosRoutes = require('./routes/movimientos.routes');
const loginRoutes = require('./routes/login.routes');
const estadisticasRoutes = require('./routes/estadisticas.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/productos', productosRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/estadisticas', estadisticasRoutes);

module.exports = app;
