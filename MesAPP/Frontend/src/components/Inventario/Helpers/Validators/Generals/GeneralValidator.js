import { CategoryValidator } from './../Category/CategoryValidator.js';

export class GeneralValidator {
  constructor(apiConfig = {}) {
    // Usar CategoryValidator para obtener las categorías
    this.categoryValidator = new CategoryValidator(apiConfig);
    
    // Cache local de categorías (obtenidas desde CategoryValidator)
    this.validCategories = [];
    
    // Campos obligatorios para validar completitud
    this.requiredFields = [
      'Code', 'Category', 'Name', 'Cost', 'Price', 'Stock',
      'Barcode', 'Unit', 'Flavor_Count', 'Description'
    ];
  }

  // ✅ FUNCIÓN AUXILIAR: Verificar si un valor está vacío de forma robusta
  isValueEmpty(value) {
    // Casos vacíos: null, undefined, string vacío, solo espacios
    if (value === null || value === undefined) {
      return true;
    }
    
    // Si es string, verificar si está vacío o solo tiene espacios
    if (typeof value === 'string') {
      return value.trim() === '';
    }
    
    // Si es número 0, NO está vacío (es un valor válido)
    if (typeof value === 'number') {
      return false;
    }
    
    // Para otros tipos, convertir a string y verificar
    return String(value).trim() === '';
  }

  // ✅ FUNCIÓN AUXILIAR: Normalizar string de forma robusta
  normalizeString(str) {
    if (this.isValueEmpty(str)) {
      return '';
    }
    return String(str).toLowerCase().trim();
  }

  // ✅ MODIFICADO: Obtener categorías válidas usando CategoryValidator
  async fetchValidCategories() {
    // Si ya las tenemos, no volver a buscarlas
    if (this.validCategories.length > 0) {
      console.log('✅ GeneralValidator: Usando categorías en caché:', this.validCategories.length);
      return {
        success: true,
        categories: this.validCategories
      };
    }

    try {
      console.log('🔍 GeneralValidator: Obteniendo categorías con CategoryValidator...');
      
      // ✅ USAR CategoryValidator en lugar de ProductAPI directamente
      const result = await this.categoryValidator.fetchValidCategories();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al obtener categorías');
      }
      
      // Obtener las categorías del CategoryValidator
      this.validCategories = this.categoryValidator.getValidCategories();
      
      console.log('📦 GeneralValidator: Categorías obtenidas desde CategoryValidator:', this.validCategories.length);
      
      // Si no hay categorías, es un error
      if (this.validCategories.length === 0) {
        throw new Error('No hay categorías válidas disponibles');
      }
      
      console.log('✅ GeneralValidator: Categorías válidas cargadas:', this.validCategories);
      
      return {
        success: true,
        categories: this.validCategories
      };
    } catch (error) {
      console.error('❌ GeneralValidator: Error al obtener categorías:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validar una categoría individual
  validateSingleCategory(categoryName) {
    console.log('🔍 GeneralValidator: Validando categoría:', JSON.stringify(categoryName));
    
    // Categoría vacía
    if (this.isValueEmpty(categoryName)) {
      console.log('   ❌ Categoría vacía');
      return {
        valid: false,
        reason: 'EMPTY',
        originalValue: categoryName
      };
    }

    // Normalizar para comparar
    const normalizedInput = this.normalizeString(categoryName);
    console.log('   🔄 Categoría normalizada:', JSON.stringify(normalizedInput));
    
    // Buscar coincidencia
    const matchedCategory = this.validCategories.find(
      cat => this.normalizeString(cat) === normalizedInput
    );

    if (matchedCategory) {
      console.log('   ✅ Categoría válida, nombre correcto:', matchedCategory);
      return {
        valid: true,
        correctName: matchedCategory,
        originalValue: categoryName
      };
    }

    console.log('   ❌ Categoría no encontrada en BD');
    console.log('   📋 Categorías disponibles:', this.validCategories);
    
    return {
      valid: false,
      reason: 'NOT_FOUND',
      originalValue: categoryName,
      availableCategories: this.validCategories
    };
  }

  // Validar completitud de campos de una fila
  validateRowCompleteness(row) {
    console.log('🔍 GeneralValidator: Validando completitud de fila:', Object.keys(row));
    
    const emptyFields = [];
    const fieldDetails = {};

    this.requiredFields.forEach(field => {
      const value = row[field];
      const isEmpty = this.isValueEmpty(value);
      
      fieldDetails[field] = {
        value: value,
        isEmpty: isEmpty,
        type: typeof value
      };
      
      if (isEmpty) {
        emptyFields.push(field);
      }
    });

    console.log('   📊 Detalles de campos:', fieldDetails);
    console.log('   ❌ Campos vacíos:', emptyFields);

    return {
      isComplete: emptyFields.length === 0,
      emptyFields: emptyFields,
      fieldDetails: fieldDetails
    };
  }

  // ✅ FUNCIÓN PRINCIPAL: Separar productos completos de incompletos
  async validateExcelData(rawData) {
    try {
      console.log('🚀 GeneralValidator: Iniciando validación de datos Excel');
      console.log('📊 GeneralValidator: Total filas a procesar:', rawData.length);
      
      // ✅ VALIDAR ESTRUCTURA DE DATOS DE ENTRADA
      if (!Array.isArray(rawData)) {
        throw new Error('Los datos de entrada no son un array válido');
      }
      
      if (rawData.length === 0) {
        throw new Error('No hay datos para procesar');
      }
      
      // Verificar que la primera fila tenga los campos requeridos
      const firstRow = rawData[0];
      const availableFields = Object.keys(firstRow);
      const missingFields = this.requiredFields.filter(field => !availableFields.includes(field));
      
      if (missingFields.length > 0) {
        throw new Error(`Faltan campos requeridos en el Excel: ${missingFields.join(', ')}`);
      }
      
      console.log('✅ GeneralValidator: Estructura de datos válida');
      console.log('📋 GeneralValidator: Campos disponibles:', availableFields);

      // 1. Obtener categorías usando CategoryValidator
      console.log('🔍 GeneralValidator: Obteniendo categorías válidas...');
      const categoryResult = await this.fetchValidCategories();
      if (!categoryResult.success) {
        throw new Error(categoryResult.error);
      }

      const completeRows = [];    // Productos perfectos
      const incompleteRows = [];  // Productos con problemas

      // 2. Procesar cada fila con logs detallados
      console.log('🔄 GeneralValidator: Procesando filas...');
      
      rawData.forEach((row, index) => {
        const rowNumber = index + 2; // Número de fila en Excel
        console.log(`\n📋 GeneralValidator: Procesando fila ${rowNumber}:`, row);
        
        // Validar categoría
        const categoryValidation = this.validateSingleCategory(row['Category']);
        console.log(`   🏷️ Validación de categoría:`, categoryValidation);
        
        // Preparar fila procesada
        let processedRow = { ...row };
        
        // Si categoría es inválida, limpiarla
        if (!categoryValidation.valid) {
          console.log(`   🔄 Limpiando categoría inválida`);
          processedRow['Category'] = '';
        } else {
          // Si categoría es válida, usar el nombre correcto de la BD
          console.log(`   ✅ Usando nombre correcto de categoría: ${categoryValidation.correctName}`);
          processedRow['Category'] = categoryValidation.correctName;
        }
        
        // Validar completitud de campos
        const completenessValidation = this.validateRowCompleteness(processedRow);
        console.log(`   📊 Validación de completitud:`, completenessValidation);
        
        // Clasificar fila
        if (categoryValidation.valid && completenessValidation.isComplete) {
          // PRODUCTO PERFECTO: categoría válida + todos los campos llenos
          console.log(`   ✅ Fila ${rowNumber}: PRODUCTO PERFECTO`);
          const completeRow = {
            rowNumber: rowNumber,
            originalRow: processedRow
          };
          completeRows.push(completeRow);
          
        } else {
          // PRODUCTO CON PROBLEMAS: categoría inválida ó campos vacíos
          console.log(`   ❌ Fila ${rowNumber}: PRODUCTO CON PROBLEMAS`);
          const incompleteRow = {
            rowNumber: rowNumber,
            originalRow: processedRow,
            issues: {
              categoryIssue: !categoryValidation.valid ? categoryValidation : null,
              emptyFields: completenessValidation.emptyFields,
              fieldDetails: completenessValidation.fieldDetails
            }
          };
          incompleteRows.push(incompleteRow);
        }
      });

      // 3. Resumen final con logs
      console.log('\n🎯 GeneralValidator: RESUMEN FINAL:');
      console.log(`   📊 Total filas procesadas: ${rawData.length}`);
      console.log(`   ✅ Productos perfectos: ${completeRows.length}`);
      console.log(`   ❌ Productos con problemas: ${incompleteRows.length}`);
      console.log(`   📋 Categorías válidas disponibles: ${this.validCategories.length}`);
      
      if (incompleteRows.length > 0) {
        console.log('\n🔍 GeneralValidator: DETALLES DE PRODUCTOS CON PROBLEMAS:');
        incompleteRows.forEach(row => {
          console.log(`   Fila ${row.rowNumber}:`, row.issues);
        });
      }

      // 4. Retornar resultados separados
      const result = {
        success: true,
        data: {
          completeRows: completeRows,        // Productos perfectos
          incompleteRows: incompleteRows,    // Productos con problemas + campos vacíos
          availableCategories: this.validCategories, // Lista de categorías válidas
          summary: {
            total: rawData.length,
            complete: completeRows.length,
            incomplete: incompleteRows.length
          }
        }
      };
      
      console.log('✅ GeneralValidator: Validación completada exitosamente');
      return result;

    } catch (error) {
      console.error('💥 GeneralValidator: Error durante la validación:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}