import * as XLSX from 'xlsx';
import { FieldNormalizer } from './Procesamiento/FieldNormalizer.js';
import { CategoryValidator } from './Procesamiento/CategoryValidator.js';

export class ImportButtonLogic {
  constructor(apiBaseUrl = `http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}`) {
    this.apiBaseUrl = apiBaseUrl;
    this.categoryValidator = new CategoryValidator(apiBaseUrl);
    // Columnas mínimas requeridas
    this.requiredColumns = [
      'Code', 'Category', 'Name', 'Cost', 'Price', 'Stock',
      'Barcode', 'Unit', 'Image_URL', 'Flavor_Count', 'Description'
    ];
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

  // Enviar datos al servidor
  async importToDatabase(products) {
    try {
      console.log('📡 ImportButtonLogic: Enviando productos a la base de datos...');
      console.log('   - Total productos a enviar:', products.length);
      console.log('   - URL de destino:', `${this.apiBaseUrl}/api/productos/import`);
      
      const response = await fetch(`${this.apiBaseUrl}/api/productos/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productos: products,
          replaceAll: true
        }),
      });

      const data = await response.json();
      
      console.log('📡 ImportButtonLogic: Respuesta del servidor:', response.status, response.statusText);
      console.log('📦 ImportButtonLogic: Datos de respuesta:', data);

      if (!response.ok) {
        throw new Error(data.frontendMessage || data.message || 'No se preocupe, solo necesitamos intentar guardar nuevamente. Todo está bien.');
      }

      console.log('✅ ImportButtonLogic: Productos guardados exitosamente');
      return data;
    } catch (error) {
      console.error('❌ ImportButtonLogic: Error al enviar a BD:', error);
      throw new Error('Parece que no hay conexión a internet en este momento. Por favor revise su conexión y lo intentamos de nuevo. No se preocupe, es normal que esto pase.');
    }
  }

  // ✅ PROCESO PRINCIPAL CON DEBUG COMPLETO
  async processImport(file, onProgress) {
    try {
      console.log('🚀 ImportButtonLogic: INICIANDO PROCESO DE IMPORTACIÓN');
      console.log('📁 ImportButtonLogic: Archivo recibido:', file.name, '(' + file.size + ' bytes)');

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

      // Paso 3: CategoryValidator
      console.log('\n🏷️ ImportButtonLogic: PASO 3 - Ejecutando CategoryValidator...');
      onProgress?.('Verificando la información de sus productos...');
      const categoryValidation = await this.categoryValidator.validateExcelData(rawData);
      
      console.log('📊 ImportButtonLogic: Resultado de CategoryValidator:');
      console.log('   - success:', categoryValidation.success);
      console.log('   - error:', categoryValidation.error);
      console.log('   - data keys:', categoryValidation.data ? Object.keys(categoryValidation.data) : 'NO DATA');
      
      if (!categoryValidation.success) {
        console.log('❌ ImportButtonLogic: CategoryValidator falló, terminando proceso');
        throw new Error(categoryValidation.error);
      }

      // ✅ DEBUG CRÍTICO - EXTRACCIÓN DE DATOS
      console.log('\n🎯 ImportButtonLogic: PASO 4 - Evaluando resultados de CategoryValidator:');
      const { completeRows, incompleteRows } = categoryValidation.data;
      
      console.log('🔍 ImportButtonLogic: DATOS EXTRAÍDOS:');
      console.log('   - categoryValidation.success:', categoryValidation.success);
      console.log('   - completeRows existe:', !!completeRows);
      console.log('   - completeRows.length:', completeRows ? completeRows.length : 'UNDEFINED');
      console.log('   - incompleteRows existe:', !!incompleteRows);
      console.log('   - incompleteRows.length:', incompleteRows ? incompleteRows.length : 'UNDEFINED');
      console.log('   - categoryValidation.data completo:', categoryValidation.data);
      
      if (completeRows) {
        console.log('   - Ejemplo completeRow:', completeRows[0]);
      }
      if (incompleteRows && incompleteRows.length > 0) {
        console.log('   - Ejemplo incompleteRow:', incompleteRows[0]);
      }

      // Paso 4: Decisión simple con logs detallados
      console.log('\n⚖️ ImportButtonLogic: TOMANDO DECISIÓN...');
      
      if (incompleteRows.length === 0) {
        console.log('🎯 ImportButtonLogic: DECISIÓN -> TODOS PERFECTOS (incompleteRows.length === 0)');
        console.log('✅ ImportButtonLogic: Procesando con FieldNormalizer y enviando a BD...');
        
        // TODO PERFECTO: procesar con FieldNormalizer
        onProgress?.('¡Maravilloso! Todos sus productos están perfectos. Guardando con cuidado...');
        const normalizedProducts = this.convertRowsToProducts(completeRows);

        // Enviar al servidor
        onProgress?.(`Guardando sus ${normalizedProducts.length} productos en el sistema...`);
        const result = await this.importToDatabase(normalizedProducts);

        const successResult = {
          success: true,
          message: result.frontendMessage || '¡Felicidades! Todos sus productos se han guardado correctamente. Ya puede verlos en su inventario.',
          imported: result.imported || 0
        };
        
        console.log('✅ ImportButtonLogic: RETORNANDO RESULTADO DE ÉXITO:', successResult);
        return successResult;

      } else {
        console.log('🚨 ImportButtonLogic: DECISIÓN -> HAY ERRORES (incompleteRows.length =', incompleteRows.length, ')');
        console.log('🔧 ImportButtonLogic: Preparando datos para ManualEditInterface...');
        
        // HAY ERRORES: devolver exactamente lo que devuelve CategoryValidator
        onProgress?.('Preparando ayuda para mejorar algunos productos...');
        
        const manualEditResult = {
          success: false,
          needsManualEdit: true,
          message: '¡Perfecto! Vamos a mejorar juntos algunos productos. En un momento se abrirá una ventana para ayudarle paso a paso. No se preocupe, es muy sencillo.',
          data: categoryValidation.data// ✅ Devolver tal cual CategoryValidator
        };
        
        console.log('🚨 ImportButtonLogic: RETORNANDO RESULTADO DE EDICIÓN MANUAL:');
        console.log('   - success:', manualEditResult.success);
        console.log('   - needsManualEdit:', manualEditResult.needsManualEdit);
        console.log('   - message:', manualEditResult.message);
        console.log('   - data existe:', !!manualEditResult.data);
        console.log('   - data.completeRows:', manualEditResult.data?.completeRows?.length);
        console.log('   - data.incompleteRows:', manualEditResult.data?.incompleteRows?.length);
        console.log('   - Resultado completo:', manualEditResult);
        
        return manualEditResult;
      }

    } catch (error) {
      console.error('💥 ImportButtonLogic: ERROR EN EL PROCESO:', error);
      
      const errorResult = {
        success: false,
        message: error.message
      };
      
      console.log('❌ ImportButtonLogic: RETORNANDO RESULTADO DE ERROR:', errorResult);
      return errorResult;
    }
  }
}