const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de conexión (si no la tienes ya en otro archivo)
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Diccionario de tablas y sus sentencias CREATE
const TABLES = {
  products: `
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category VARCHAR(40) NOT NULL,
      code VARCHAR(20) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      cost DECIMAL(10,2) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      profitability VARCHAR(10),
      stock VARCHAR(50),
      barcode VARCHAR(50),
      unit VARCHAR(20),
      image_url VARCHAR(255),
      flavor_count INT,
      description TEXT
    ) ENGINE=InnoDB
  `,
  flavors: `
    CREATE TABLE IF NOT EXISTS flavors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      status ENUM('Disponible', 'No Disponible') DEFAULT 'Disponible'
    ) ENGINE=InnoDB
  `,
  tables: `
    CREATE TABLE IF NOT EXISTS tables (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(20) NOT NULL,
      status ENUM('Disponible', 'Ocupada') DEFAULT 'Disponible'
    ) ENGINE=InnoDB
  `,
  staff: `
  CREATE TABLE IF NOT EXISTS staff (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL
  ) ENGINE=InnoDB
`,
  daily_closures: `
    CREATE TABLE IF NOT EXISTS daily_closures (
      id INT AUTO_INCREMENT PRIMARY KEY,
      date DATE NOT NULL,
      time TIME NOT NULL,
      cash DECIMAL(10,2) DEFAULT 0.00,
      electronic DECIMAL(10,2) DEFAULT 0.00,
      declared_total DECIMAL(10,2) DEFAULT 0.00,
      expenses DECIMAL(10,2) DEFAULT 0.00
    ) ENGINE=InnoDB
  `,
  sales: `
    CREATE TABLE IF NOT EXISTS sales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      table_number INT,
      date DATE NOT NULL,
      time TIME NOT NULL,
      description TEXT,
      total DECIMAL(10,2) NOT NULL,
      type ENUM('Efectivo', 'Transferencia', 'Tarjeta') NOT NULL,
      seller VARCHAR(100) NOT NULL,
      status ENUM('PAGO', 'PENDIENTE') DEFAULT 'PENDIENTE'
    ) ENGINE=InnoDB
  `,
  categories: `
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      categoria VARCHAR(50) NOT NULL UNIQUE,
      activo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
`
};

// Función que crea base de datos y tablas
async function initializeDatabase() {
  try {
    const tempConfig = { ...dbConfig };
    delete tempConfig.database;
    const tempPool = mysql.createPool(tempConfig);
    const connection = await tempPool.getConnection();

    // Crear base de datos si no existe
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await connection.query(`USE \`${dbConfig.database}\``);

    // Crear todas las tablas
    for (const [name, query] of Object.entries(TABLES)) {
      console.log(`Creando tabla '${name}'...`);
      await connection.execute(query);
    }

    connection.release();
    await tempPool.end();

    console.log('✅ Base de datos y tablas creadas correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
  }
}

module.exports = { initializeDatabase };
