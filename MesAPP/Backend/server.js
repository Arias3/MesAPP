const app = require('./app');
const { initializeDatabase } = require('./db/init'); // si tienes lógica de creación de tablas

const port = process.env.PORT || 5000;

initializeDatabase(); // si lo usas

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
