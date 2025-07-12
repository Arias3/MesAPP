import { productAPI, APIFactory } from './ProductsSearch.js';

/**
 * UpsertProcessor - Componente modular para procesar productos con lógica UPSERT
 * Se integra después de CategoryValidator y FieldNormalizer
 * 
 * ✅ CORREGIDO: Usa la nueva ruta de búsqueda por código
 */
export class UpsertProcessor {
  constructor(apiConfig = {}) {
    // Usar la misma configuración que ImportButtonLogic
    if (Object.keys(apiConfig).length > 0) {
      this.productAPI = APIFactory.createProductAPI(apiConfig);
    } else {
      this.productAPI = productAPI;
    }
  }

  /**
   * ✅ CORREGIDO: Buscar producto por código usando la nueva ruta específica
   */
  async findProductByCode(code) {
    try {
      console.log(`🔍 UpsertProcessor: Buscando producto por código exacto: "${code}"`);
      
      // ✅ USAR LA NUEVA RUTA ESPECÍFICA PARA BÚSQUEDA POR CÓDIGO
      const result = await this.productAPI.findByCode(code);
      
      if (!result.success) {
        console.error(`❌ UpsertProcessor: Error técnico buscando código "${code}":`, result.error);
        return { 
          found: false, 
          product: null, 
          error: result.error 
        };
      }
      
      if (result.found) {
        console.log(`✅ UpsertProcessor: Producto encontrado con código "${code}":`, result.data.id);
        return {
          found: true,
          product: result.data
        };
      } else {
        console.log(`❌ UpsertProcessor: Producto con código "${code}" no existe en BD`);
        return {
          found: false,
          product: null
        };
      }
      
    } catch (error) {
      console.error(`❌ UpsertProcessor: Excepción buscando código "${code}":`, error);
      return { 
        found: false, 
        product: null, 
        error: error.message 
      };
    }
  }

  /**
   * ✅ CORREGIDO: Crear producto nuevo con mapping correcto de campos
   */
  async createProduct(normalizedProduct) {
    try {
      console.log(`➕ UpsertProcessor: Creando producto nuevo con código: "${normalizedProduct.code}"`);
      
      // ✅ MAPPING CORREGIDO: Usar los nombres de campo que espera el backend
      const productData = {
        codigo: normalizedProduct.code,      // ✅ Campo para el código
        nombre: normalizedProduct.name,      // ✅ Nombre
        costo: parseFloat(normalizedProduct.cost),
        precio: parseFloat(normalizedProduct.price),
        stock: normalizedProduct.stock.toString(),
        barcode: normalizedProduct.barcode,
        category: normalizedProduct.category,
        unit: normalizedProduct.unit,        // ✅ Verificado: es "unit" no "unity"
        image_url: normalizedProduct.image_url,
        flavor_count: parseInt(normalizedProduct.flavor_count),
        description: normalizedProduct.description
      };

      console.log(`📤 UpsertProcessor: Datos a crear:`, productData);

      const result = await this.productAPI.createProduct(productData);
      
      if (result.success) {
        console.log(`✅ UpsertProcessor: Producto creado exitosamente:`, result.data?.id);
        return {
          success: true,
          action: 'CREATE',
          code: normalizedProduct.code,
          productId: result.data?.id,
          message: `Producto "${normalizedProduct.code}" creado exitosamente`
        };
      } else {
        console.error(`❌ UpsertProcessor: Error creando producto "${normalizedProduct.code}":`, result.error);
        return {
          success: false,
          action: 'CREATE',
          code: normalizedProduct.code,
          message: `Error creando "${normalizedProduct.code}": ${result.error}`
        };
      }
      
    } catch (error) {
      console.error(`❌ UpsertProcessor: Excepción creando producto "${normalizedProduct.code}":`, error);
      return {
        success: false,
        action: 'CREATE',
        code: normalizedProduct.code,
        message: `Excepción creando "${normalizedProduct.code}": ${error.message}`
      };
    }
  }

  /**
   * ✅ MEJORADO: Actualizar producto existente
   */
  async updateProduct(existingProduct, normalizedProduct) {
    try {
      console.log(`✏️ UpsertProcessor: Actualizando producto existente ID ${existingProduct.id} con código: "${normalizedProduct.code}"`);
      
      // ✅ MAPPING CORRECTO: Para UPDATE no enviamos el código (es inmutable)
      const productData = {
        nombre: normalizedProduct.name,
        costo: parseFloat(normalizedProduct.cost),
        precio: parseFloat(normalizedProduct.price),
        stock: normalizedProduct.stock.toString(),
        barcode: normalizedProduct.barcode,
        category: normalizedProduct.category,
        unit: normalizedProduct.unit,
        image_url: normalizedProduct.image_url,
        flavor_count: parseInt(normalizedProduct.flavor_count),
        description: normalizedProduct.description
        // ✅ NOTA: No enviamos 'codigo' en UPDATE porque es la clave de búsqueda
      };

      console.log(`📤 UpsertProcessor: Datos a actualizar:`, productData);

      const result = await this.productAPI.updateProduct(existingProduct.id, productData);
      
      if (result.success) {
        console.log(`✅ UpsertProcessor: Producto actualizado exitosamente ID ${existingProduct.id}`);
        return {
          success: true,
          action: 'UPDATE',
          code: normalizedProduct.code,
          productId: existingProduct.id,
          message: `Producto "${normalizedProduct.code}" actualizado exitosamente`
        };
      } else {
        console.error(`❌ UpsertProcessor: Error actualizando producto "${normalizedProduct.code}":`, result.error);
        return {
          success: false,
          action: 'UPDATE',
          code: normalizedProduct.code,
          message: `Error actualizando "${normalizedProduct.code}": ${result.error}`
        };
      }
      
    } catch (error) {
      console.error(`❌ UpsertProcessor: Excepción actualizando producto "${normalizedProduct.code}":`, error);
      return {
        success: false,
        action: 'UPDATE',
        code: normalizedProduct.code,
        message: `Excepción actualizando "${normalizedProduct.code}": ${error.message}`
      };
    }
  }

  /**
   * ✅ LÓGICA PRINCIPAL: Procesar un producto individual con UPSERT
   * 
   * REGLA ÚNICA: Solo el código determina CREATE vs UPDATE
   * - Si código existe en BD → UPDATE (actualizar TODOS los campos)
   * - Si código NO existe en BD → CREATE
   */
  async processProduct(normalizedProduct) {
    try {
      const code = normalizedProduct.code;
      
      console.log(`\n🎯 UpsertProcessor: === PROCESANDO PRODUCTO "${code}" ===`);
      
      // ✅ PASO 1: Buscar por código exacto usando la nueva ruta
      console.log(`🔍 UpsertProcessor: Paso 1 - Buscando si código "${code}" existe...`);
      const searchResult = await this.findProductByCode(code);
      
      if (searchResult.error) {
        console.error(`❌ UpsertProcessor: Error técnico en búsqueda:`, searchResult.error);
        return {
          success: false,
          action: 'ERROR',
          code: code,
          message: `Error buscando código "${code}": ${searchResult.error}`
        };
      }
      
      // ✅ PASO 2: Decidir CREATE vs UPDATE basado SOLO en si el código existe
      let result;
      
      if (searchResult.found) {
        // ✅ CÓDIGO EXISTE → UPDATE (actualizar TODOS los campos)
        console.log(`🔄 UpsertProcessor: Paso 2 - Código "${code}" existe (ID: ${searchResult.product.id}), ACTUALIZANDO todos los campos...`);
        result = await this.updateProduct(searchResult.product, normalizedProduct);
        
      } else {
        // ✅ CÓDIGO NO EXISTE → CREATE
        console.log(`➕ UpsertProcessor: Paso 2 - Código "${code}" NO existe, CREANDO producto nuevo...`);
        result = await this.createProduct(normalizedProduct);
      }
      
      console.log(`🎯 UpsertProcessor: === RESULTADO PARA "${code}": ${result.action} - ${result.success ? 'ÉXITO' : 'FALLÓ'} ===\n`);
      
      return result;
      
    } catch (error) {
      console.error(`💥 UpsertProcessor: Excepción procesando producto "${normalizedProduct.code}":`, error);
      return {
        success: false,
        action: 'ERROR',
        code: normalizedProduct.code,
        message: `Excepción procesando "${normalizedProduct.code}": ${error.message}`
      };
    }
  }

  /**
   * ✅ MEJORADO: Procesar múltiples productos con UPSERT
   */
  async processProducts(normalizedProducts, onProgress = null) {
    console.log(`\n🚀 UpsertProcessor: === INICIANDO PROCESAMIENTO MASIVO ===`);
    console.log(`📊 UpsertProcessor: Total de productos a procesar: ${normalizedProducts.length}`);
    
    const results = {
      total: normalizedProducts.length,
      created: 0,
      updated: 0,
      errors: 0,
      details: [],
      summary: {
        processedCodes: [],
        errorCodes: [],
        createdCodes: [],
        updatedCodes: []
      }
    };

    for (let i = 0; i < normalizedProducts.length; i++) {
      const product = normalizedProducts[i];
      const progress = `${i + 1}/${normalizedProducts.length}`;
      
      console.log(`\n📋 UpsertProcessor: [${progress}] Procesando código: "${product.code}"`);
      onProgress?.(`[${progress}] Procesando: ${product.code}`);

      const result = await this.processProduct(product);
      
      // Registrar resultado detallado
      results.details.push({
        code: result.code,
        action: result.action,
        success: result.success,
        message: result.message,
        productId: result.productId
      });

      // Actualizar contadores
      results.summary.processedCodes.push(result.code);
      
      if (result.success) {
        if (result.action === 'CREATE') {
          results.created++;
          results.summary.createdCodes.push(result.code);
        } else if (result.action === 'UPDATE') {
          results.updated++;
          results.summary.updatedCodes.push(result.code);
        }
      } else {
        results.errors++;
        results.summary.errorCodes.push(result.code);
      }

      // Pausa pequeña para no saturar la BD
      if (i % 3 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`\n🎯 UpsertProcessor: === PROCESAMIENTO COMPLETADO ===`);
    console.log(`📊 Resumen final:`);
    console.log(`   ✅ Creados: ${results.created} productos`);
    console.log(`   🔄 Actualizados: ${results.updated} productos`);
    console.log(`   ❌ Errores: ${results.errors} productos`);
    console.log(`   📋 Total procesado: ${results.total} productos`);
    
    if (results.summary.createdCodes.length > 0) {
      console.log(`   ➕ Códigos creados:`, results.summary.createdCodes);
    }
    if (results.summary.updatedCodes.length > 0) {
      console.log(`   ✏️ Códigos actualizados:`, results.summary.updatedCodes);
    }
    if (results.summary.errorCodes.length > 0) {
      console.log(`   💥 Códigos con error:`, results.summary.errorCodes);
    }

    return results;
  }
}