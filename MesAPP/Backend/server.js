require('dotenv').config();

const app = require('./app');
const { initializeDatabase } = require('./db/init');

const ipLocalhost = process.env.IP_LOCALHOST;
const port = process.env.PORT || 5000;

let server;

// Inicializar base de datos si aplica
initializeDatabase().then(() => {
  server = app.listen(port, ipLocalhost, () => {
    console.log(`✅ Servidor corriendo en http://${ipLocalhost}:${port}`);
  });
  
  // Timeout para peticiones colgadas
  server.timeout = 30000;
  
  // Cierre elegante con Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    server.close(() => {
      console.log('👋 Servidor cerrado correctamente');
      process.exit(0);
    });
  });
  
}).catch((err) => {
  console.error('❌ Error al inicializar:', err);
  process.exit(1);
});