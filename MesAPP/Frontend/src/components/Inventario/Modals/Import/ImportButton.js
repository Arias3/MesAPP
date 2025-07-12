import * as XLSX from 'xlsx';
import { FieldNormalizer } from './../../Helpers/FormatAppliers/FieldNormalizer.js';
import { GeneralValidator } from './../../Helpers/Validators/Generals/GeneralValidator.js';
import { UpsertProcessor } from './../../../../services/Products/Update.js';
import { productAPI, APIFactory } from './../../../../services/Products/ProductsSearch.js';

export class ImportButtonLogic {
  constructor(apiConfig = {}) {
    // Configurar GeneralValidator con la misma configuración
    this.generalValidator = new GeneralValidator(apiConfig);
    
    // Agregar UpsertProcessor
    this.upsertProcessor = new UpsertProcessor(apiConfig);
    
    // Si se pasa configuración específica, crear instancia personalizada
    if (Object.keys(apiConfig).length > 0) {
      this.productAPI = APIFactory.createProductAPI(apiConfig);
    } else {
      // Usar instancia global
      this.productAPI = productAPI;
    }
    
    // ✅ NUEVO: Estado intezrno para rastrear el modo de importación
    this.importMode = 'replace'; // Por defecto: replace
    
    // Columnas mínimas requeridas
    this.requiredColumns = [
      'Code', 'Category', 'Name', 'Cost', 'Price', 'Stock',
      'Barcode', 'Unit', 'Flavor_Count', 'Description'
    ];
  }

  // ✅ NUEVO: Método para establecer el modo de importación
  setImportMode(mode) {
    if (mode === 'replace' || mode === 'upsert') {
      console.log(`🔧 ImportButtonLogic: Cambiando modo de ${this.importMode} a ${mode}`);
      this.importMode = mode;
      return true;
    } else {
      console.error('❌ ImportButtonLogic: Modo inválido:', mode);
      return false;
    }
  }

  // ✅ NUEVO: Método para obtener el modo actual
  getImportMode() {
    return this.importMode;
  }

  // Leer archivo Excel
  readExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          console.log('📁 ImportButtonLogic: Archivo Excel leído correctamente');
          console.log('   - Filas encontradas:', jsonData.length);
          console.log('   - Primera fila:', jsonData[0]);

          resolve(jsonData);
        } catch (error) {
          console.error('❌ ImportButtonLogic: Error al leer Excel:', error);
          reject(new Error('No se preocupe, solo hubo un pequeño problema al abrir su archivo. Por favor revise que sea un archivo de Excel y no esté dañado.'));
        }
      };

      reader.onerror = () => {
        console.error('❌ ImportButtonLogic: Error en FileReader');
        reject(new Error('Tranquilo, vamos a intentarlo de nuevo. Por favor seleccione el archivo otra vez.'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  // Validar que sea Excel y tenga columnas mínimas
  validateExcelStructure(data) {
    console.log('🔍 ImportButtonLogic: Validando estructura del Excel...');
    
    if (!data || data.length === 0) {
      console.log('❌ ImportButtonLogic: Archivo vacío');
      return {
        valid: false,
        error: 'Su archivo parece estar vacío. No se preocupe, esto pasa a veces. Por favor asegúrese de que tenga información de productos.'
      };
    }

    const firstRow = data[0];
    const fileColumns = Object.keys(firstRow);
    const missingColumns = this.requiredColumns.filter(col => !fileColumns.includes(col));

    console.log('📋 ImportButtonLogic: Columnas encontradas:', fileColumns);
    console.log('📋 ImportButtonLogic: Columnas requeridas:', this.requiredColumns);
    console.log('❌ ImportButtonLogic: Columnas faltantes:', missingColumns);

    if (missingColumns.length > 0) {
      console.log('❌ ImportButtonLogic: Estructura inválida - faltan columnas');
      return {
        valid: false,
        error: 'Todo está bien, solo necesitamos usar el formato correcto. Por favor descargue la plantilla desde "Exportar" y copie su información ahí. Es muy fácil, no se preocupe.'
      };
    }

    console.log('✅ ImportButtonLogic: Estructura válida');
    return {
      valid: true,
      message: '¡Excelente! Su archivo está perfecto y listo para usar.'
    };
  }

  // Convertir filas a productos normalizados
  convertRowsToProducts(rows) {
    console.log('🔄 ImportButtonLogic: Convirtiendo filas a productos normalizados...');
    console.log('   - Filas a convertir:', rows.length);
    
    const products = rows.map(rowData => {
      return FieldNormalizer.normalizeFromExcelRow(rowData.originalRow, rowData.rowNumber);
    });
    
    console.log('✅ ImportButtonLogic: Productos normalizados:', products.length);
    console.log('   - Primer producto normalizado:', products[0]);
    
    return products;
  }

  // Enviar datos al servidor - MÉTODO ORIGINAL
  async importToDatabase(products) {
    try {
      console.log('📡 ImportButtonLogic: Enviando productos a la base de datos...');
      console.log('   - Total productos a enviar:', products.length);
      
      // USAR ProductAPI en lugar de fetch manual
      const result = await this.productAPI.importProducts(products, { replaceAll: true });
      
      console.log('📡 ImportButtonLogic: Respuesta de ProductAPI:', result);

      if (!result.success) {
        throw new Error(result.error || 'No se preocupe, solo necesitamos intentar guardar nuevamente. Todo está bien.');
      }

      console.log('✅ ImportButtonLogic: Productos guardados exitosamente');
      return result;
      
    } catch (error) {
      console.error('❌ ImportButtonLogic: Error al enviar a BD:', error);
      
      // Mantener mensajes amigables para el usuario
      const friendlyMessage = error.message.includes('fetch') || error.message.includes('network')
        ? 'Parece que no hay conexión a internet en este momento. Por favor revise su conexión y lo intentamos de nuevo. No se preocupe, es normal que esto pase.'
        : error.message;
        
      throw new Error(friendlyMessage);
    }
  }

  // ✅ ACTUALIZADO: PROCESO PRINCIPAL que usa el modo interno
  async processImport(file, onProgress) {
    try {
      console.log('🚀 ImportButtonLogic: INICIANDO PROCESO DE IMPORTACIÓN');
      console.log('📁 ImportButtonLogic: Archivo recibido:', file.name, '(' + file.size + ' bytes)');
      console.log('🎯 ImportButtonLogic: Modo de importación actual:', this.importMode);

      // ✅ DECISIÓN: Usar el método apropiado según el modo interno
      if (this.importMode === 'upsert') {
        console.log('🔄 ImportButtonLogic: Delegando a processImportWithUpsert...');
        return await this.processImportWithUpsert(file, onProgress);
      } else {
        console.log('🔄 ImportButtonLogic: Ejecutando proceso de reemplazo...');
        return await this.processImportReplace(file, onProgress);
      }

    } catch (error) {
      console.error('💥 ImportButtonLogic: ERROR EN EL PROCESO PRINCIPAL:', error);
      
      const errorResult = {
        success: false,
        message: error.message,
        importMode: this.importMode // ✅ INCLUIR MODO EN ERROR
      };
      
      console.log('❌ ImportButtonLogic: RETORNANDO RESULTADO DE ERROR:', errorResult);
      return errorResult;
    }
  }

  // ✅ NUEVO: Proceso específico para modo REPLACE (lógica original)
  async processImportReplace(file, onProgress) {
    try {
      console.log('🚀 ImportButtonLogic: INICIANDO PROCESO DE REEMPLAZO');

      // Paso 1: Leer archivo Excel
      console.log('\n📖 ImportButtonLogic: PASO 1 - Leyendo archivo Excel...');
      onProgress?.('Abriendo su archivo ...');
      const rawData = await this.readExcelFile(file);

      // Paso 2: Validar estructura básica
      console.log('\n🔍 ImportButtonLogic: PASO 2 - Validando estructura...');
      onProgress?.('Revisando que todo esté en orden...');
      const structureValidation = this.validateExcelStructure(rawData);
      if (!structureValidation.valid) {
        console.log('❌ ImportButtonLogic: Estructura inválida, terminando proceso');
        throw new Error(structureValidation.error);
      }

      // Paso 3: GeneralValidator
      console.log('\n🏷️ ImportButtonLogic: PASO 3 - Ejecutando GeneralValidator...');
      onProgress?.('Verificando la información de sus productos...');
      const categoryValidation = await this.generalValidator.validateExcelData(rawData);
      
      console.log('📊 ImportButtonLogic: Resultado de GeneralValidator:');
      console.log('   - success:', categoryValidation.success);
      console.log('   - error:', categoryValidation.error);
      console.log('   - data keys:', categoryValidation.data ? Object.keys(categoryValidation.data) : 'NO DATA');
      
      if (!categoryValidation.success) {
        console.log('❌ ImportButtonLogic: GeneralValidator falló, terminando proceso');
        throw new Error(categoryValidation.error);
      }

      // DEBUG CRÍTICO - EXTRACCIÓN DE DATOS
      console.log('\n🎯 ImportButtonLogic: PASO 4 - Evaluando resultados de GeneralValidator:');
      const { completeRows, incompleteRows } = categoryValidation.data;
      
      console.log('🔍 ImportButtonLogic: DATOS EXTRAÍDOS:');
      console.log('   - completeRows.length:', completeRows ? completeRows.length : 'UNDEFINED');
      console.log('   - incompleteRows.length:', incompleteRows ? incompleteRows.length : 'UNDEFINED');
      
      // Paso 4: Decisión simple con logs detallados
      console.log('\n⚖️ ImportButtonLogic: TOMANDO DECISIÓN...');
      
      if (incompleteRows.length === 0) {
        console.log('🎯 ImportButtonLogic: DECISIÓN -> TODOS PERFECTOS (modo REPLACE)');
        
        // TODO PERFECTO: procesar con FieldNormalizer
        onProgress?.('¡Maravilloso! Todos sus productos están perfectos. Guardando con cuidado...');
        const normalizedProducts = this.convertRowsToProducts(completeRows);

        // Enviar al servidor usando ProductAPI (MÉTODO ORIGINAL)
        onProgress?.(`Guardando sus ${normalizedProducts.length} productos en el sistema...`);
        const result = await this.importToDatabase(normalizedProducts);

        const successResult = {
          success: true,
          message: result.message || '¡Felicidades! Todos sus productos se han guardado correctamente. Ya puede verlos en su inventario.',
          imported: result.imported || 0,
          importMode: this.importMode // ✅ INCLUIR MODO
        };
        
        console.log('✅ ImportButtonLogic: RETORNANDO RESULTADO DE ÉXITO:', successResult);
        return successResult;

      } else {
        console.log('🚨 ImportButtonLogic: DECISIÓN -> HAY ERRORES (modo REPLACE)');
        console.log('🔧 ImportButtonLogic: Preparando datos para ManualEditInterface...');
        
        // HAY ERRORES: devolver para edición manual
        onProgress?.('Preparando ayuda para mejorar algunos productos...');
        
        const manualEditResult = {
          success: false,
          needsManualEdit: true,
          message: '¡Perfecto! Vamos a mejorar juntos algunos productos. En un momento se abrirá una ventana para ayudarle paso a paso. No se preocupe, es muy sencillo.',
          data: categoryValidation.data,
          importMode: this.importMode // ✅ INCLUIR MODO
        };
        
        console.log('🚨 ImportButtonLogic: RETORNANDO RESULTADO DE EDICIÓN MANUAL:', manualEditResult);
        return manualEditResult;
      }

    } catch (error) {
      console.error('💥 ImportButtonLogic: ERROR EN REPLACE:', error);
      return {
        success: false,
        message: error.message,
        importMode: this.importMode // ✅ INCLUIR MODO EN ERROR
      };
    }
  }

  // ✅ ACTUALIZADO: PROCESO CON UPSERT (incluye modo en resultados)
  async processImportWithUpsert(file, onProgress) {
    try {
      console.log('🚀 ImportButtonLogic: INICIANDO PROCESO CON UPSERT');
      console.log('📁 ImportButtonLogic: Archivo recibido:', file.name, '(' + file.size + ' bytes)');

      // Pasos 1-3: Igual que processImportReplace
      onProgress?.('Abriendo su archivo...');
      const rawData = await this.readExcelFile(file);

      onProgress?.('Revisando que todo esté en orden...');
      const structureValidation = this.validateExcelStructure(rawData);
      if (!structureValidation.valid) {
        throw new Error(structureValidation.error);
      }

      onProgress?.('Verificando la información de sus productos...');
      const categoryValidation = await this.generalValidator.validateExcelData(rawData);
      if (!categoryValidation.success) {
        throw new Error(categoryValidation.error);
      }

      const { completeRows, incompleteRows } = categoryValidation.data;

      if (incompleteRows.length > 0) {
        // Hay errores → devolver para edición manual
        return {
          success: false,
          needsManualEdit: true,
          message: 'Necesitamos mejorar algunos productos antes de continuar...',
          data: categoryValidation.data,
          importMode: this.importMode // ✅ INCLUIR MODO
        };
      }

      // TODO PERFECTO → Usar UpsertProcessor
      onProgress?.('Normalizando productos...');
      const normalizedProducts = this.convertRowsToProducts(completeRows);

      onProgress?.('Verificando qué productos actualizar y cuáles crear...');
      const upsertResult = await this.upsertProcessor.processProducts(
        normalizedProducts,
        onProgress
      );

      return {
        success: true,
        message: `¡Proceso completado! Se crearon ${upsertResult.created} productos nuevos y se actualizaron ${upsertResult.updated} existentes.`,
        created: upsertResult.created,
        updated: upsertResult.updated,
        errors: upsertResult.errors,
        details: upsertResult.details,
        importMode: this.importMode // ✅ INCLUIR MODO
      };

    } catch (error) {
      console.error('💥 ImportButtonLogic: ERROR EN UPSERT:', error);
      return {
        success: false,
        message: error.message,
        importMode: this.importMode // ✅ INCLUIR MODO EN ERROR
      };
    }
  }

  // ✅ NUEVO: Método de conveniencia para procesar con modo específico
  async processImportWithMode(file, onProgress, mode = null) {
    // Si se especifica un modo, usarlo temporalmente
    const originalMode = this.importMode;
    
    if (mode && (mode === 'replace' || mode === 'upsert')) {
      console.log(`🔧 ImportButtonLogic: Usando modo temporal: ${mode}`);
      this.setImportMode(mode);
    }
    
    try {
      const result = await this.processImport(file, onProgress);
      return result;
    } finally {
      // Restaurar el modo original si se cambió temporalmente
      if (mode) {
        this.setImportMode(originalMode);
      }
    }
  }
}