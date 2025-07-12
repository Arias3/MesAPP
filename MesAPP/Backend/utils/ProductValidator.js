const pool = require('../db/pool');

class ProductValidator {
  constructor() {
    // Solo validación técnica - se asume que los campos ya están completos
    // Las categorías se validan con CategoryValidator en el frontend
  }

  // Validar que una categoría existe en la BD (versión mejorada con normalización)
  async validateCategory(categoryName) {
    try {
      // Normalizar la búsqueda a minúsculas
      const [rows] = await pool.execute(
        'SELECT * FROM categories WHERE LOWER(categoria) = LOWER(?) AND activo = true',
        [categoryName.trim()]
      );
      return rows.length > 0;
    } catch (error) {
      console.error('Error al validar categoría:', error);
      return false;
    }
  }

  // Encontrar categoría correcta (normalizada)
  async findCorrectCategory(categoryName) {
    try {
      const [rows] = await pool.execute(
        'SELECT categoria FROM categories WHERE LOWER(categoria) = LOWER(?) AND activo = true',
        [categoryName.trim()]
      );
      
      if (rows.length > 0) {
        return {
          found: true,
          correct: rows[0].categoria, // Devolver la versión correcta de la BD
          normalized: categoryName.toLowerCase().trim() !== rows[0].categoria.toLowerCase()
        };
      }
      
      return { found: false, correct: null };
    } catch (error) {
      console.error('Error al buscar categoría:', error);
      return { found: false, correct: null };
    }
  }

  // Validación técnica simplificada (categorías ya validadas en frontend)
  async validateAndPrepare(products) {
    try {
      console.log(`📋 Validando ${products.length} productos técnicamente...`);

      const formattedProducts = [];
      const validationErrors = [];

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const rowNumber = product._excelRow || i + 1;

        try {
          // 1. Solo verificar que la categoría aún exista (por si acaso)
          const categoryResult = await this.findCorrectCategory(product.category);
          if (!categoryResult.found) {
            validationErrors.push({
              row: rowNumber,
              code: product.code,
              field: 'category',
              message: `La categoría '${product.category}' no existe en la base de datos`,
              type: 'INVALID_CATEGORY'
            });
            continue;
          }

          // 2. Validar y convertir tipos de datos
          const cost = parseFloat(product.cost);
          const price = parseFloat(product.price);
          const flavorCount = parseInt(product.flavor_count);

          if (isNaN(cost) || cost < 0) {
            validationErrors.push({
              row: rowNumber,
              code: product.code,
              field: 'cost',
              message: `El costo '${product.cost}' no es un número válido`,
              type: 'INVALID_NUMBER'
            });
            continue;
          }

          if (isNaN(price) || price < 0) {
            validationErrors.push({
              row: rowNumber,
              code: product.code,
              field: 'price',
              message: `El precio '${product.price}' no es un número válido`,
              type: 'INVALID_NUMBER'
            });
            continue;
          }

          if (isNaN(flavorCount) || flavorCount < 0) {
            validationErrors.push({
              row: rowNumber,
              code: product.code,
              field: 'flavor_count',
              message: `El conteo de sabores '${product.flavor_count}' no es un número válido`,
              type: 'INVALID_NUMBER'
            });
            continue;
          }

          // 3. Formatear producto para BD (usando categoría correcta de la BD)
          const formattedProduct = {
            category: categoryResult.correct, // Usar la versión correcta de la BD
            code: product.code.toString().trim(),
            name: product.name.toString().trim(),
            cost: cost,
            price: price,
            stock: product.stock.toString().trim(),
            barcode: product.barcode.toString().trim(),
            unit: product.unit.toString().trim(),
            flavor_count: flavorCount,
            description: product.description.toString().trim()
          };

          formattedProducts.push(formattedProduct);

        } catch (error) {
          validationErrors.push({
            row: rowNumber,
            code: product.code || 'Sin código',
            message: `Error técnico: ${error.message}`,
            type: 'PROCESSING_ERROR'
          });
        }
      }

      // Resultado de validación técnica
      if (validationErrors.length > 0) {
        console.log(`❌ Errores técnicos encontrados: ${validationErrors.length}`);
        
        return {
          success: false,
          message: `Se encontraron ${validationErrors.length} errores técnicos de validación`,
          errors: validationErrors,
          validProducts: formattedProducts,
          summary: {
            totalProcessed: products.length,
            successful: formattedProducts.length,
            failed: validationErrors.length
          }
        };
      }

      console.log(`✅ Validación técnica exitosa: ${formattedProducts.length} productos`);
      
      return {
        success: true,
        message: `${formattedProducts.length} productos validados técnicamente`,
        data: formattedProducts,
        summary: {
          totalProcessed: products.length,
          successful: formattedProducts.length,
          failed: 0
        }
      };

    } catch (error) {
      console.error('Error en validación técnica:', error);
      return {
        success: false,
        message: 'Error interno durante la validación técnica',
        error: error.message
      };
    }
  }

  // Obtener categorías válidas (para UI de frontend)
  async getValidCategories() {
    try {
      const [rows] = await pool.execute(
        'SELECT categoria FROM categories WHERE activo = true ORDER BY categoria ASC'
      );
      return {
        success: true,
        data: rows.map(row => row.categoria)
      };
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
}

module.exports = ProductValidator;