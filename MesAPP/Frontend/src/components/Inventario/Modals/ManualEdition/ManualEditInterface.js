import { FieldNormalizer } from './../../Helpers/FormatAppliers/FieldNormalizer.js';
import { UpsertProcessor } from './../../../../services/Products/Update.js';
import { productAPI, APIFactory } from './../../../../services/Products/ProductsSearch.js';

/**
 * ManualEditInterfaceLogic - Lógica de negocio para el procesamiento de productos
 * después de la corrección manual en la interfaz
 * 
 * Responsabilidades:
 * - Combinar completeRows + correctedRows
 * - Normalizar productos con FieldNormalizer
 * - Decidir método de procesamiento según importMode
 * - Manejar eventos de éxito/error para FullInventory
 */
export class ManualEditInterfaceLogic {
  constructor(apiConfig = {}, importMode = 'replace') {
    // Modo de importación: 'replace' o 'upsert'
    this.importMode = importMode;
    
    // Configurar componentes necesarios
    this.upsertProcessor = new UpsertProcessor(apiConfig);
    
    // Configurar ProductAPI
    if (Object.keys(apiConfig).length > 0) {
      this.productAPI = APIFactory.createProductAPI(apiConfig);
    } else {
      this.productAPI = productAPI;
    }
    
    console.log(`🔧 ManualEditInterfaceLogic: Inicializado con modo "${importMode}"`);
  }

  /**
   * ✅ MÉTODO PRINCIPAL: Procesar todos los productos según el modo
   * @param {Array} completeRows - Productos que ya estaban perfectos
   * @param {Array} correctedRows - Productos corregidos manualmente
   * @param {Function} onProgress - Callback para actualizar progreso en UI
   * @returns {Object} Resultado del procesamiento
   */
  async processAllProducts(completeRows, correctedRows, onProgress = null) {
    try {
      console.log('🚀 ManualEditInterfaceLogic: INICIANDO PROCESAMIENTO');
      console.log(`🎯 Modo: ${this.importMode}`);
      console.log(`📊 Productos completos: ${completeRows.length}`);
      console.log(`📊 Productos corregidos: ${correctedRows.length}`);
      
      // 1. Combinar todos los productos
      onProgress?.('Preparando productos para procesamiento...');
      const allProducts = this.combineProducts(completeRows, correctedRows);
      
      // 2. Normalizar productos
      onProgress?.('Normalizando datos de productos...');
      const normalizedProducts = this.normalizeProducts(allProducts);
      
      // 3. Validar que tengamos productos para procesar
      if (normalizedProducts.length === 0) {
        throw new Error('No hay productos válidos para procesar');
      }
      
      console.log(`📋 Total productos a procesar: ${normalizedProducts.length}`);
      console.log(`🔍 Primer producto normalizado:`, normalizedProducts[0]);
      
      // 4. Procesar según el modo
      let result;
      if (this.importMode === 'upsert') {
        result = await this.processWithUpsert(normalizedProducts, onProgress);
      } else {
        result = await this.processWithReplace(normalizedProducts, onProgress);
      }
      
      // 5. Emitir evento de éxito
      this.emitSuccessEvent(result);
      
      console.log('✅ ManualEditInterfaceLogic: PROCESAMIENTO COMPLETADO');
      return result;
      
    } catch (error) {
      console.error('💥 ManualEditInterfaceLogic: ERROR EN PROCESAMIENTO:', error);
      
      // Emitir evento de error
      this.emitErrorEvent(error);
      
      return {
        success: false,
        message: error.message,
        importMode: this.importMode,
        error: error
      };
    }
  }

  /**
   * ✅ COMBINAR productos completos + corregidos
   * @param {Array} completeRows - Productos perfectos originales
   * @param {Array} correctedRows - Productos corregidos manualmente 
   * @returns {Array} Array combinado de productos
   */
  combineProducts(completeRows, correctedRows) {
    console.log('🔄 ManualEditInterfaceLogic: Combinando productos...');
    
    // Combinar ambos arrays
    const allProducts = [
      ...completeRows,
      ...correctedRows
    ];
    
    console.log(`📋 Productos combinados: ${allProducts.length} total`);
    console.log(`   - Completos originales: ${completeRows.length}`);
    console.log(`   - Corregidos manualmente: ${correctedRows.length}`);
    
    return allProducts;
  }

  /**
   * ✅ NORMALIZAR productos usando FieldNormalizer
   * @param {Array} allProducts - Productos combinados
   * @returns {Array} Productos normalizados
   */
  normalizeProducts(allProducts) {
    console.log('🔄 ManualEditInterfaceLogic: Normalizando productos...');
    
    try {
      const normalizedProducts = allProducts.map((rowData, index) => {
        try {
          // Usar FieldNormalizer para normalizar cada producto
          return FieldNormalizer.normalizeFromExcelRow(
            rowData.originalRow, 
            rowData.rowNumber || index + 1
          );
        } catch (error) {
          console.error(`❌ Error normalizando producto ${index + 1}:`, error);
          throw new Error(`Error normalizando producto en fila ${rowData.rowNumber || index + 1}: ${error.message}`);
        }
      });
      
      console.log(`✅ Productos normalizados exitosamente: ${normalizedProducts.length}`);
      return normalizedProducts;
      
    } catch (error) {
      console.error('❌ Error en normalización de productos:', error);
      throw error;
    }
  }

  /**
   * ✅ PROCESAR con modo REPLACE - Reemplaza todo el inventario
   * @param {Array} normalizedProducts - Productos normalizados
   * @param {Function} onProgress - Callback para progreso
   * @returns {Object} Resultado del procesamiento
   */
  async processWithReplace(normalizedProducts, onProgress = null) {
    try {
      console.log('🔄 ManualEditInterfaceLogic: PROCESANDO CON MODO REPLACE');
      
      onProgress?.(`Guardando ${normalizedProducts.length} productos (reemplazando inventario completo)...`);
      
      // Usar ProductAPI para importar con reemplazo total
      const result = await this.productAPI.importProducts(normalizedProducts, { 
        replaceAll: true 
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Error al procesar productos con modo replace');
      }
      
      console.log('✅ REPLACE completado exitosamente:', result);
      
      return {
        success: true,
        importMode: 'replace',
        method: 'REPLACE',
        totalProcessed: normalizedProducts.length,
        imported: result.imported || normalizedProducts.length,
        message: result.message || `¡Inventario actualizado! ${normalizedProducts.length} productos procesados (inventario reemplazado completamente)`,
        details: {
          operation: 'replace_all',
          productsProcessed: normalizedProducts.length,
          backendResponse: result
        }
      };
      
    } catch (error) {
      console.error('❌ Error en modo REPLACE:', error);
      throw new Error(`Error en modo REPLACE: ${error.message}`);
    }
  }

  /**
   * ✅ PROCESAR con modo UPSERT - Actualiza existentes + crea nuevos
   * @param {Array} normalizedProducts - Productos normalizados
   * @param {Function} onProgress - Callback para progreso
   * @returns {Object} Resultado del procesamiento
   */
  async processWithUpsert(normalizedProducts, onProgress = null) {
    try {
      console.log('🔄 ManualEditInterfaceLogic: PROCESANDO CON MODO UPSERT');
      
      onProgress?.(`Verificando ${normalizedProducts.length} productos (actualizar existentes + crear nuevos)...`);
      
      // Usar UpsertProcessor para procesar con lógica CREATE/UPDATE
      const result = await this.upsertProcessor.processProducts(
        normalizedProducts, 
        onProgress
      );
      
      console.log('✅ UPSERT completado exitosamente:', result);
      
      // Verificar si hubo errores
      if (result.errors > 0) {
        console.warn(`⚠️ UPSERT completado con ${result.errors} errores`);
      }
      
      return {
        success: true,
        importMode: 'upsert',
        method: 'UPSERT',
        totalProcessed: result.total,
        created: result.created,
        updated: result.updated,
        errors: result.errors,
        message: `¡Procesamiento completado! ${result.created} productos creados, ${result.updated} productos actualizados${result.errors > 0 ? `, ${result.errors} errores` : ''}`,
        details: {
          operation: 'upsert',
          summary: result.summary,
          processingDetails: result.details
        }
      };
      
    } catch (error) {
      console.error('❌ Error en modo UPSERT:', error);
      throw new Error(`Error en modo UPSERT: ${error.message}`);
    }
  }

  /**
   * ✅ EMITIR evento de éxito para que FullInventory actualice
   * @param {Object} result - Resultado del procesamiento
   */
  emitSuccessEvent(result) {
    console.log('📡 ManualEditInterfaceLogic: Emitiendo evento de éxito...');
    
    const eventData = {
      success: true,
      processedCount: result.totalProcessed || result.created + result.updated || 0,
      message: result.message,
      source: 'manualEditInterface',
      importMode: result.importMode,
      method: result.method,
      details: result.details
    };
    
    // Si es UPSERT, incluir detalles específicos
    if (result.importMode === 'upsert') {
      eventData.created = result.created;
      eventData.updated = result.updated;
      eventData.errors = result.errors;
    }
    
    console.log('📋 Datos del evento:', eventData);
    
    window.dispatchEvent(new CustomEvent('databaseUpdated', {
      detail: eventData
    }));
    
    console.log('✅ Evento databaseUpdated emitido correctamente');
  }

  /**
   * ✅ EMITIR evento de error para manejo en FullInventory
   * @param {Error} error - Error ocurrido
   */
  emitErrorEvent(error) {
    console.log('📡 ManualEditInterfaceLogic: Emitiendo evento de error...');
    
    const eventData = {
      success: false,
      error: error.message,
      source: 'manualEditInterface',
      importMode: this.importMode,
      originalError: error
    };
    
    console.log('📋 Datos del evento de error:', eventData);
    
    window.dispatchEvent(new CustomEvent('databaseUpdateError', {
      detail: eventData
    }));
    
    console.log('✅ Evento databaseUpdateError emitido correctamente');
  }

  /**
   * ✅ CAMBIAR modo de importación dinámicamente
   * @param {string} newMode - Nuevo modo ('replace' | 'upsert')
   */
  setImportMode(newMode) {
    if (newMode === 'replace' || newMode === 'upsert') {
      console.log(`🔧 ManualEditInterfaceLogic: Cambiando modo de ${this.importMode} a ${newMode}`);
      this.importMode = newMode;
      return true;
    } else {
      console.error('❌ ManualEditInterfaceLogic: Modo inválido:', newMode);
      return false;
    }
  }

  /**
   * ✅ OBTENER modo actual
   * @returns {string} Modo actual
   */
  getImportMode() {
    return this.importMode;
  }

  /**
   * ✅ VALIDAR datos antes del procesamiento
   * @param {Array} completeRows - Productos completos
   * @param {Array} correctedRows - Productos corregidos
   * @returns {Object} Resultado de validación
   */
  validateInputData(completeRows, correctedRows) {
    console.log('🔍 ManualEditInterfaceLogic: Validando datos de entrada...');
    
    const errors = [];
    
    // Validar que sean arrays
    if (!Array.isArray(completeRows)) {
      errors.push('completeRows debe ser un array');
    }
    
    if (!Array.isArray(correctedRows)) {
      errors.push('correctedRows debe ser un array');
    }
    
    // Validar que haya al menos un producto
    const totalProducts = (completeRows?.length || 0) + (correctedRows?.length || 0);
    if (totalProducts === 0) {
      errors.push('No hay productos para procesar');
    }
    
    // Validar estructura de productos
    const allProducts = [...(completeRows || []), ...(correctedRows || [])];
    allProducts.forEach((product, index) => {
      if (!product.originalRow) {
        errors.push(`Producto ${index + 1}: falta originalRow`);
      }
    });
    
    const isValid = errors.length === 0;
    
    console.log(`${isValid ? '✅' : '❌'} Validación ${isValid ? 'exitosa' : 'falló'}:`, { 
      totalProducts, 
      errors 
    });
    
    return {
      valid: isValid,
      errors: errors,
      totalProducts: totalProducts
    };
  }
}