const express = require('express');
const cors = require('cors');

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

// Middlewares
app.use(cors());
app.use(express.json());

// Endpoints
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
app.use('/', loginRoutes);

// Ruta de prueba
app.get('/ping', (req, res) => {
  res.json({ success: true, message: 'Servidor activo' });
});

module.exports = app;
