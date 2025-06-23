require('dotenv').config(); // Asegúrate de cargar variables de entorno

const app = require('./app'); // Tu archivo donde defines app = express()
const { initializeDatabase } = require('./db/init'); // Función para crear tablas y base de datos

const port = process.env.PORT || 5000;

// Inicializar base de datos si aplica
initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${port}`);
  });
}).catch((err) => {
  console.error('❌ Error al inicializar la base de datos:', err);
});
