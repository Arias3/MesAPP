const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const ProductValidator = require('../utils/ProductValidator');

// Función para calcular rentabilidad automáticamente
function calcularRentabilidad(costo, precio) {
  if (costo === 0) return 0;
  return ((precio - costo) / costo) * 100;
}


// === RUTAS PARA PRODUCTOS ===

// Obtener todos los productos con búsqueda opcional
router.get('/', async (req, res) => {
  try {
    const search = req.query.search || '';
    
    let query = 'SELECT * FROM products';
    let params = [];
    
    if (search.trim()) {
      query += ' WHERE name LIKE ? OR barcode LIKE ?';
      const searchParam = `%${search}%`;
      params = [searchParam, searchParam];
    }
    
    // SIN LIMIT NI OFFSET - esto elimina el problema completamente
    query += ' ORDER BY name ASC';
    
    console.log('🔍 Query sin LIMIT:', query);
    console.log('📝 Params:', params);
    
    const [rows] = await pool.execute(query, params);
    
    console.log('✅ Filas obtenidas:', rows.length);
    
    // Formatear datos para mantener compatibilidad con frontend
    const formattedRows = rows.map(row => ({
      id: row.id,
      codigo: row.code,
      category: row.category,
      nombre: row.name,
      costo: row.cost,
      precio: row.price,
      rentabilidad: `${parseFloat(row.profitability || 0).toFixed(2)}%`,
      stock: row.stock,
      barcode: row.barcode,
      unit: row.unit,
      image_url: row.image_url,
      flavor_count: row.flavor_count,
      description: row.description
    }));
    
    console.log('✅ Datos formateados:', formattedRows.length, 'productos');
    
    res.json({ success: true, data: formattedRows });
  } catch (error) {
    console.error('💥 Error al obtener productos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener productos' });
  }
});

// ✅ NUEVA RUTA: Búsqueda específica por código (para UpsertProcessor)
router.get('/search/by-code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    console.log(`🔍 Buscando producto por código exacto: "${code}"`);
    
    // Buscar por el campo 'code' exacto
    const [rows] = await pool.execute('SELECT * FROM products WHERE code = ?', [code]);
    
    if (rows.length === 0) {
      console.log(`❌ Producto con código "${code}" no encontrado`);
      return res.status(404).json({ 
        success: false, 
        message: 'Producto no encontrado',
        found: false,
        data: null
      });
    }
    
    const row = rows[0];
    const producto = {
      id: row.id,
      codigo: row.code,
      category: row.category,
      nombre: row.name,
      costo: row.cost,
      precio: row.price,
      rentabilidad: `${parseFloat(row.profitability || 0).toFixed(2)}%`,
      stock: row.stock,
      barcode: row.barcode,
      unit: row.unit,
      flavor_count: row.flavor_count,
      description: row.description
    };
    
    console.log(`✅ Producto encontrado por código "${code}":`, producto.id);
    
    res.json({ 
      success: true, 
      found: true,
      data: producto 
    });
    
  } catch (error) {
    console.error('❌ Error al buscar producto por código:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al buscar producto',
      found: false,
      data: null 
    });
  }
});

// Obtener un producto específico por ID (para operaciones CRUD desde FullInventory)
router.get('/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [codigo]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    
    const row = rows[0];
    const producto = {
      id: row.id,
      codigo: row.code,
      category: row.category,
      nombre: row.name,
      costo: row.cost,
      precio: row.price,
      rentabilidad: `${parseFloat(row.profitability || 0).toFixed(2)}%`,
      stock: row.stock,
      barcode: row.barcode,
      unit: row.unit,
      image_url: row.image_url,
      flavor_count: row.flavor_count,
      description: row.description
    };
    
    res.json({ success: true, data: producto });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ success: false, message: 'Error al obtener producto' });
  }
});

// Crear nuevo producto
router.post('/', async (req, res) => {
  try {
    const { nombre, costo, precio, stock, barcode, category, unit, flavor_count, description } = req.body;
    
    // ✅ IMPORTANTE: Aceptar tanto "codigo" como "code"
    const productCode = req.body.codigo || req.body.code;
    
    // Validaciones básicas
    if (!nombre || costo < 0 || precio < 0 || stock < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos inválidos. Verifique nombre, costo, precio y stock.' 
      });
    }
    
    // ✅ VALIDAR QUE SE PROPORCIONE EL CÓDIGO
    if (!productCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere proporcionar un código para el producto.' 
      });
    }
    
    // Calcular rentabilidad
    const rentabilidad = calcularRentabilidad(costo, precio);
    
    const [result] = await pool.execute(
      `INSERT INTO products 
       (category, code, name, cost, price, profitability, stock, barcode, unit, flavor_count, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category,
        productCode, // ✅ USAR EL CÓDIGO PROPORCIONADO
        nombre,
        costo,
        precio,
        `${rentabilidad.toFixed(2)}%`,
        stock || '0',
        barcode || null,
        unit || 'unidad',
        flavor_count || 0,
        description || null
      ]
    );
    
    // Obtener el producto recién creado
    const [newProduct] = await pool.execute('SELECT * FROM products WHERE id = ?', [result.insertId]);
    const row = newProduct[0];
    
    const producto = {
      id: row.id,
      codigo: row.code,
      category: row.category,
      nombre: row.name,
      costo: row.cost,
      precio: row.price,
      rentabilidad: `${parseFloat(row.profitability || 0).toFixed(2)}%`,
      stock: row.stock,
      barcode: row.barcode,
      unit: row.unit,
      flavor_count: row.flavor_count,
      description: row.description
    };
    
    res.status(201).json({ success: true, data: producto });
  } catch (error) {
    console.error('Error al crear producto:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ success: false, message: 'El código de producto ya existe' });
    } else {
      res.status(500).json({ success: false, message: 'Error al crear producto' });
    }
  }
});

// Actualizar producto por ID
router.put('/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const { nombre, costo, precio, stock, barcode, category, unit, flavor_count, description } = req.body;
    
    // Verificar que el producto existe
    const [existing] = await pool.execute('SELECT * FROM products WHERE id = ?', [codigo]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    
    // Calcular nueva rentabilidad
    const rentabilidad = calcularRentabilidad(costo, precio);
    
    await pool.execute(
      `UPDATE products SET 
       category = ?, name = ?, cost = ?, price = ?, profitability = ?, 
       stock = ?, barcode = ?, unit = ?, flavor_count = ?, description = ? 
       WHERE id = ?`,
      [
        category || existing[0].category,
        nombre,
        costo,
        precio,
        `${rentabilidad.toFixed(2)}%`,
        stock,
        barcode || null,
        unit || existing[0].unit,
        flavor_count || existing[0].flavor_count,
        description || existing[0].description,
        codigo
      ]
    );
    
    // Obtener el producto actualizado
    const [updated] = await pool.execute('SELECT * FROM products WHERE id = ?', [codigo]);
    const row = updated[0];
    
    const producto = {
      id: row.id,
      codigo: row.code,
      category: row.category,
      nombre: row.name,
      costo: row.cost,
      precio: row.price,
      rentabilidad: `${parseFloat(row.profitability || 0).toFixed(2)}%`,
      stock: row.stock,
      barcode: row.barcode,
      unit: row.unit,
      flavor_count: row.flavor_count,
      description: row.description
    };
    
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

// Eliminar producto por ID
router.delete('/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    
    const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [codigo]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    
    res.json({ success: true, message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar producto' });
  }
});

// ===== RUTA DE IMPORTACIÓN MASIVA CORREGIDA =====
router.post('/import', async (req, res) => {
  try {
    const { productos, replaceAll } = req.body;
    
    if (!productos || !Array.isArray(productos)) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de productos'
      });
    }

    console.log(`📦 Iniciando importación de ${productos.length} productos...`);

    // Paso 1: Validar con ProductValidator
    const validator = new ProductValidator();
    const validationResult = await validator.validateAndPrepare(productos);

    if (!validationResult.success) {
      console.log('❌ Validación fallida:', validationResult.message);
      
      // DEVOLVER ERRORES DETALLADOS DE PRODUCTVALIDATOR
      return res.status(400).json({
        success: false,
        message: validationResult.message, // Error principal
        errors: validationResult.errors || [], // Errores específicos por fila
        errorReport: validationResult.errorReport || {}, // Reporte detallado
        summary: validationResult.summary || {}, // Resumen de errores
        validProducts: validationResult.validProducts || [], // Productos que sí pasaron
        frontendMessage: 'Error de validación: Revise que todos los campos estén completos y las categorías sean válidas.'
      });
    }

    console.log(`✅ Validación exitosa: ${validationResult.data.length} productos válidos`);

    // Paso 2: Si replaceAll es true, eliminar todos los productos existentes
    if (replaceAll) {
      await pool.execute('DELETE FROM products');
      console.log('🗑️ Productos existentes eliminados');
    }

    // Paso 3: Insertar todos los productos validados
    let insertedCount = 0;
    const insertErrors = [];

    for (let i = 0; i < validationResult.data.length; i++) {
      const producto = validationResult.data[i];
      
      try {
        // Calcular rentabilidad automáticamente
        const rentabilidad = calcularRentabilidad(producto.cost, producto.price);
        
        await pool.execute(
          `INSERT INTO products 
           (category, code, name, cost, price, profitability, stock, barcode, unit, flavor_count, description) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            producto.category,
            producto.code,
            producto.name,
            producto.cost,
            producto.price,
            `${rentabilidad.toFixed(2)}%`,
            producto.stock,
            producto.barcode,
            producto.unit,
            producto.flavor_count,
            producto.description
          ]
        );
        insertedCount++;
      } catch (error) {
        console.error(`Error insertando producto ${producto.code}:`, error);
        insertErrors.push(`Producto ${producto.code}: ${error.message}`);
      }
    }

    // Paso 4: Respuesta final
    if (insertErrors.length > 0 && insertedCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo importar ningún producto a la base de datos',
        errors: insertErrors,
        frontendMessage: 'Error en base de datos: No se pudieron insertar los productos.'
      });
    }

    console.log(`✅ Importación completada: ${insertedCount}/${validationResult.data.length} productos`);

    // RESPUESTA DE ÉXITO DETALLADA
    res.json({
      success: true,
      message: `Se importaron ${insertedCount} productos exitosamente`,
      imported: insertedCount,
      total: productos.length,
      validated: validationResult.data.length,
      validationSummary: validationResult.summary,
      insertErrors: insertErrors.length > 0 ? insertErrors : null,
      frontendMessage: `¡Importación exitosa! ${insertedCount} productos agregados a la base de datos.`
    });

  } catch (error) {
    console.error('Error en importación masiva:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
      frontendMessage: 'Error del servidor: Intente nuevamente o contacte al administrador.'
    });
  }
});

module.exports = router;