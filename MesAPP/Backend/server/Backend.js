require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de la base de datos local
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

const pool = mysql.createPool(dbConfig);

// Función para crear la base de datos y tablas
async function initializeDatabase() {
  try {
    // Crear conexión sin especificar base de datos para crearla
    const tempConfig = { ...dbConfig };
    delete tempConfig.database;
    const tempPool = mysql.createPool(tempConfig);
    
    const connection = await tempPool.getConnection();
    
    // Crear base de datos si no existe
    await connection.execute('CREATE DATABASE IF NOT EXISTS heladeria');
    await connection.execute('USE heladeria');
    
    // Crear tabla productos
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS productos (
        codigo INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        costo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        rentabilidad DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        stock INT NOT NULL DEFAULT 0,
        barcode VARCHAR(100) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Crear tabla para otras funcionalidades futuras (ejemplo: categorías)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Crear tabla para historial de movimientos de inventario
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS movimientos_inventario (
        id INT AUTO_INCREMENT PRIMARY KEY,
        producto_codigo INT,
        tipo_movimiento ENUM('entrada', 'salida', 'ajuste') NOT NULL,
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(10,2),
        motivo VARCHAR(255),
        usuario VARCHAR(50),
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (producto_codigo) REFERENCES productos(codigo) ON DELETE CASCADE
      )
    `);
    
    connection.release();
    await tempPool.end();
    
    console.log('Base de datos y tablas inicializadas correctamente');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  }
}

// Función para calcular rentabilidad automáticamente
function calcularRentabilidad(costo, precio) {
  if (costo === 0) return 0;
  return ((precio - costo) / costo) * 100;
}

// === RUTAS PARA PRODUCTOS ===

// Obtener todos los productos con búsqueda opcional
app.get('/api/productos', async (req, res) => {
  try {
    const { search = '', limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM productos';
    let params = [];
    
    if (search) {
      query += ' WHERE nombre LIKE ? OR barcode LIKE ?';
      const searchParam = `%${search}%`;
      params = [searchParam, searchParam];
    }
    
    query += ' ORDER BY nombre ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [rows] = await pool.execute(query, params);
    
    // Formatear rentabilidad con símbolo de porcentaje
    const formattedRows = rows.map(row => ({
      ...row,
      rentabilidad: `${row.rentabilidad.toFixed(2)}%`
    }));
    
    res.json({ success: true, data: formattedRows });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener productos' });
  }
});

// Obtener un producto específico por código
app.get('/api/productos/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const [rows] = await pool.execute('SELECT * FROM productos WHERE codigo = ?', [codigo]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    
    const producto = rows[0];
    producto.rentabilidad = `${producto.rentabilidad.toFixed(2)}%`;
    
    res.json({ success: true, data: producto });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ success: false, message: 'Error al obtener producto' });
  }
});

// Crear nuevo producto
app.post('/api/productos', async (req, res) => {
  try {
    const { nombre, costo, precio, stock, barcode } = req.body;
    
    // Validaciones básicas
    if (!nombre || costo < 0 || precio < 0 || stock < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos inválidos. Verifique nombre, costo, precio y stock.' 
      });
    }
    
    // Calcular rentabilidad
    const rentabilidad = calcularRentabilidad(costo, precio);
    
    const [result] = await pool.execute(
      'INSERT INTO productos (nombre, costo, precio, rentabilidad, stock, barcode) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, costo, precio, rentabilidad, stock, barcode || null]
    );
    
    // Obtener el producto recién creado
    const [newProduct] = await pool.execute('SELECT * FROM productos WHERE codigo = ?', [result.insertId]);
    const producto = newProduct[0];
    producto.rentabilidad = `${producto.rentabilidad.toFixed(2)}%`;
    
    res.status(201).json({ success: true, data: producto });
  } catch (error) {
    console.error('Error al crear producto:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ success: false, message: 'El código de barras ya existe' });
    } else {
      res.status(500).json({ success: false, message: 'Error al crear producto' });
    }
  }
});

// Actualizar producto
app.put('/api/productos/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const { nombre, costo, precio, stock, barcode } = req.body;
    
    // Verificar que el producto existe
    const [existing] = await pool.execute('SELECT * FROM productos WHERE codigo = ?', [codigo]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    
    // Calcular nueva rentabilidad
    const rentabilidad = calcularRentabilidad(costo, precio);
    
    await pool.execute(
      'UPDATE productos SET nombre = ?, costo = ?, precio = ?, rentabilidad = ?, stock = ?, barcode = ? WHERE codigo = ?',
      [nombre, costo, precio, rentabilidad, stock, barcode || null, codigo]
    );
    
    // Obtener el producto actualizado
    const [updated] = await pool.execute('SELECT * FROM productos WHERE codigo = ?', [codigo]);
    const producto = updated[0];
    producto.rentabilidad = `${producto.rentabilidad.toFixed(2)}%`;
    
    res.json({ success: true, data: producto });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ success: false, message: 'El código de barras ya existe' });
    } else {
      res.status(500).json({ success: false, message: 'Error al actualizar producto' });
    }
  }
});

// Eliminar producto
app.delete('/api/productos/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    
    const [result] = await pool.execute('DELETE FROM productos WHERE codigo = ?', [codigo]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    
    res.json({ success: true, message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar producto' });
  }
});

// === RUTAS PARA MOVIMIENTOS DE INVENTARIO ===

// Registrar movimiento de inventario
app.post('/api/movimientos', async (req, res) => {
  try {
    const { producto_codigo, tipo_movimiento, cantidad, precio_unitario, motivo, usuario } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el producto existe
      const [producto] = await connection.execute('SELECT * FROM productos WHERE codigo = ?', [producto_codigo]);
      if (producto.length === 0) {
        throw new Error('Producto no encontrado');
      }
      
      // Calcular nuevo stock
      let nuevoStock = producto[0].stock;
      if (tipo_movimiento === 'entrada') {
        nuevoStock += cantidad;
      } else if (tipo_movimiento === 'salida') {
        nuevoStock -= cantidad;
        if (nuevoStock < 0) {
          throw new Error('Stock insuficiente');
        }
      } else if (tipo_movimiento === 'ajuste') {
        nuevoStock = cantidad;
      }
      
      // Actualizar stock del producto
      await connection.execute('UPDATE productos SET stock = ? WHERE codigo = ?', [nuevoStock, producto_codigo]);
      
      // Registrar el movimiento
      await connection.execute(
        'INSERT INTO movimientos_inventario (producto_codigo, tipo_movimiento, cantidad, precio_unitario, motivo, usuario) VALUES (?, ?, ?, ?, ?, ?)',
        [producto_codigo, tipo_movimiento, cantidad, precio_unitario, motivo, usuario]
      );
      
      await connection.commit();
      
      res.json({ success: true, message: 'Movimiento registrado correctamente', nuevo_stock: nuevoStock });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error al registrar movimiento:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Obtener historial de movimientos
app.get('/api/movimientos', async (req, res) => {
  try {
    const { producto_codigo, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT m.*, p.nombre as producto_nombre 
      FROM movimientos_inventario m 
      JOIN productos p ON m.producto_codigo = p.codigo
    `;
    let params = [];
    
    if (producto_codigo) {
      query += ' WHERE m.producto_codigo = ?';
      params.push(producto_codigo);
    }
    
    query += ' ORDER BY m.fecha DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [rows] = await pool.execute(query, params);
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener movimientos' });
  }
});

// === RUTAS PARA ESTADÍSTICAS ===

// Obtener estadísticas generales
app.get('/api/estadisticas', async (req, res) => {
  try {
    const [totalProductos] = await pool.execute('SELECT COUNT(*) as total FROM productos');
    const [stockTotal] = await pool.execute('SELECT SUM(stock) as total FROM productos');
    const [valorInventario] = await pool.execute('SELECT SUM(precio * stock) as total FROM productos');
    const [productosAgotados] = await pool.execute('SELECT COUNT(*) as total FROM productos WHERE stock = 0');
    const [productosPocoStock] = await pool.execute('SELECT COUNT(*) as total FROM productos WHERE stock > 0 AND stock <= 10');
    
    res.json({
      success: true,
      data: {
        total_productos: totalProductos[0].total,
        stock_total: stockTotal[0].total || 0,
        valor_inventario: valorInventario[0].total || 0,
        productos_agotados: productosAgotados[0].total,
        productos_poco_stock: productosPocoStock[0].total
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
});

// Inicializar base de datos al iniciar la aplicación
initializeDatabase();

app.listen(port, () => {
  console.log(`Backend corriendo en http://localhost:${port}`);
  console.log('Endpoints disponibles:');
  console.log('- GET /api/productos - Obtener productos');
  console.log('- POST /api/productos - Crear producto');
  console.log('- PUT /api/productos/:codigo - Actualizar producto');
  console.log('- DELETE /api/productos/:codigo - Eliminar producto');
  console.log('- POST /api/movimientos - Registrar movimiento');
  console.log('- GET /api/movimientos - Obtener movimientos');
  console.log('- GET /api/estadisticas - Obtener estadísticas');
});


// === RUTAS PARA LOGIN  & REGISTER === //}

// Ruta POST para login
app.post('/login', (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username requerido' });
  }

  const query = 'SELECT role FROM usuarios WHERE username = ? LIMIT 1';

  db.query(query, [username], (err, results) => {
    if (err) {
      console.error('Error en consulta:', err);
      return res.status(500).json({ success: false, message: 'Error en el servidor' });
    }

    if (results.length > 0) {
      const role = results[0].role;
      return res.json({ success: true, role });
    } else {
      return res.json({ success: false });
    }
  });
});

