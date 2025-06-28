const express = require('express');
const cors = require('cors');

// Rutas
const productosRoutes = require('./routes/productos.routes');
const movimientosRoutes = require('./routes/movimientos.routes');
const loginRoutes = require('./routes/login.routes');
const estadisticasRoutes = require('./routes/estadisticas.routes');
const categoriesRoutes = require('./routes/categorias.routes');
const ordenarRoutes = require('./routes/ordenar.routes'); 
const heladosRoutes = require('./routes/helados.routes'); 
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/productos', productosRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/estadisticas', estadisticasRoutes);
app.use('/api/categorias', categoriesRoutes);
app.use('/api/helados', heladosRoutes);
app.use('/api/ordenar', ordenarRoutes);
app.use('/', loginRoutes);

// Ruta opcional para probar si el servidor responde
app.get('/ping', (req, res) => {
  res.json({ success: true, message: 'Servidor activo' });
});

module.exports = app;
