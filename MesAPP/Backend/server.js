require('dotenv').config(); // Cargar variables de entorno

const app = require('./app'); // Express app
const { initializeDatabase } = require('./db/init'); // Inicializador de base de datos

const ipLocalhost = process.env.IP_LOCALHOST || 'localhost';
const port = process.env.PORT || 5000;

// Inicializar base de datos y levantar servidor
initializeDatabase()
  .then(() => {
    const server = app.listen(port, () => {
      console.log(`✅ Servidor corriendo en http://${ipLocalhost}:${port}`);
    });

    // Manejar error de puerto ocupado
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ El puerto ${port} ya está en uso. Cierra el proceso o cambia el puerto.`);
        process.exit(1);
      } else {
        throw err;
      }
    });
  })
  .catch((err) => {
    console.error('❌ Error al inicializar la base de datos:', err);
    process.exit(1);
  });
