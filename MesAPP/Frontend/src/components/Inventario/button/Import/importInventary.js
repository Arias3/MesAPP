import * as XLSX from 'xlsx';
import { FieldNormalizer } from './FieldNormalizer.js';
import { CategoryValidator } from './CategoryValidator.js';

export class ImportButtonLogic {
  constructor(apiBaseUrl = 'http://localhost:5000/api') {
    this.apiBaseUrl = apiBaseUrl;
    this.categoryValidator = new CategoryValidator(apiBaseUrl);
    // Columnas obligatorias
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

          resolve(jsonData);
        } catch (error) {
          reject(new Error('Error al leer el archivo Excel: ' + error.message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  // Validar estructura básica del Excel
  validateExcelStructure(data) {
    if (!data || data.length === 0) {
      return {
        valid: false,
        error: 'El archivo está vacío o no contiene datos válidos'
      };
    }

    const firstRow = data[0];
    const fileColumns = Object.keys(firstRow);

    // Verificar que tenga las columnas básicas
    const missingColumns = this.requiredColumns.filter(col => !fileColumns.includes(col));

    if (missingColumns.length > 0) {
      return {
        valid: false,
        error: 'Por favor, enviar archivo Excel con formato adecuado, descargue modelo en Exportar'
      };
    }

    return {
      valid: true,
      message: 'Estructura del Excel válida'
    };
  }

  // Convertir filas a productos normalizados (formato para FieldNormalizer)
  convertRowsToProducts(rows) {
    return rows.map(rowData => {
      // TODOS los productos pasan por FieldNormalizer
      return FieldNormalizer.normalizeFromExcelRow(rowData.originalRow, rowData.rowNumber);
    });
  }

  // Enviar datos normalizados al servidor
  async importToDatabase(products) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/productos/import`, {
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

      if (!response.ok) {
        throw new Error(data.frontendMessage || data.message || 'Error al importar productos');
      }

      return data;
    } catch (error) {
      throw new Error('Error de conexión: ' + error.message);
    }
  }

  // PROCESO PRINCIPAL FINAL
  async processImport(file, onProgress, fixedTable = 0, correctedData = null, onImportOpen = null) {
    try {
      // LÓGICA CUANDO fixedTable = 1 (datos ya corregidos)
      if (fixedTable === 1 && correctedData) {
        onProgress?.('Procesando datos corregidos...');
        
        // Normalizar datos corregidos directamente
        const normalizedProducts = this.convertRowsToProducts(correctedData);
        
        // Enviar al servidor
        onProgress?.(`Enviando ${normalizedProducts.length} productos al servidor...`);
        const result = await this.importToDatabase(normalizedProducts);

        // Notificar que importOpen debe ser 0 (cerrar modal)
        onImportOpen?.(0);

        return {
          success: true,
          message: result.frontendMessage || result.message,
          data: result,
          summary: {
            total: correctedData.length,
            processed: normalizedProducts.length,
            imported: result.imported || 0
          }
        };
      }

      // LÓGICA CUANDO fixedTable = 0 (proceso inicial)
      
      // Paso 1: Leer archivo Excel
      onProgress?.('Leyendo archivo Excel...');
      const rawData = await this.readExcelFile(file);

      // Paso 2: Validar estructura básica
      onProgress?.('Validando estructura del archivo...');
      const structureValidation = this.validateExcelStructure(rawData);
      if (!structureValidation.valid) {
        throw new Error(structureValidation.error);
      }

      // Paso 3: CategoryValidator - separar completos de incompletos
      onProgress?.('Validando categorías y completitud de campos...');
      const categoryValidation = await this.categoryValidator.validateExcelData(rawData);
      
      if (!categoryValidation.success) {
        throw new Error(categoryValidation.error);
      }

      const { completeRows, incompleteRows, availableCategories } = categoryValidation.data;

      // Paso 4: Decisión de flujo
      if (incompleteRows.length === 0) {
        // TODO PERFECTO: enviar directamente a FieldNormalizer
        onProgress?.('Todos los productos están completos. Normalizando...');
        const normalizedProducts = this.convertRowsToProducts(completeRows);

        // Enviar al servidor
        onProgress?.(`Enviando ${normalizedProducts.length} productos al servidor...`);
        const result = await this.importToDatabase(normalizedProducts);

        // Notificar que importOpen debe ser 0 (cerrar modal)
        onImportOpen?.(0);

        return {
          success: true,
          message: result.frontendMessage || result.message,
          data: result,
          summary: {
            total: rawData.length,
            processed: normalizedProducts.length,
            imported: result.imported || 0,
            complete: completeRows.length,
            incomplete: 0
          }
        };

      } else {
        // HAY PROBLEMAS: retornar datos para ManualEditInterface
        onProgress?.(`Se encontraron ${incompleteRows.length} productos con problemas.`);
        
        return {
          success: false,
          needsManualEdit: true,
          data: {
            completeRows: completeRows,
            incompleteRows: incompleteRows,
            availableCategories: availableCategories,
            summary: {
              total: rawData.length,
              complete: completeRows.length,
              incomplete: incompleteRows.length
            }
          }
        };
      }

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}