const express = require('express');
const cors = require('cors');
const path = require('path');

// Rutas existentes
// Importación de rutas
const productosRoutes = require('./routes/productos.routes');
const movimientosRoutes = require('./routes/movimientos.routes');
const loginRoutes = require('./routes/login.routes');
const estadisticasRoutes = require('./routes/estadisticas.routes');
const categoriesRoutes = require('./routes/categorias.routes');
const ordenarRoutes = require('./routes/ordenar.routes'); 
const heladosRoutes = require('./routes/helados.routes'); 
const staffRoutes = require('./routes/staff.routes'); 
const salesRoutes = require('./routes/sales.routes');
const cajaRoutes = require('./routes/caja.routes');
const mesasRoutes = require('./routes/mesas.routes');
const app = express();

// === CONFIGURACIÓN DE MIDDLEWARES ===

// CORS
app.use(cors());

// Parsing de JSON
app.use(express.json());

// Parsing de URL-encoded data (para formularios)
app.use(express.urlencoded({ extended: true }));


// Middleware de logging básico
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - ${req.ip}`);
  next();
});

// === RUTAS DE LA APLICACIÓN ===

// Endpoints existentes
app.use('/api/productos', productosRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/estadisticas', estadisticasRoutes);
app.use('/api/categorias', categoriesRoutes);
app.use('/api/helados', heladosRoutes);
app.use('/api/ordenar', ordenarRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/ventas', salesRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/mesas', mesasRoutes);
// Ruta de login (debe ir después de las rutas de API)
app.use('/', loginRoutes);


// === CONFIGURACIÓN DE CIERRE ELEGANTE ===


// Ruta de prueba
app.get('/ping', (req, res) => {
  res.json({ success: true, message: 'Servidor activo' });
});

module.exports = app;