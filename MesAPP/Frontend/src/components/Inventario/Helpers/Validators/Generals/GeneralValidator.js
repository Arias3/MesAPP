import { FlavorValidator } from './../Flavor/FlavorValidator.js';

export class GeneralValidator {
  constructor(apiConfig = {}) {
    // ✅ CAMBIO: Usar FlavorValidator como validador principal (incluye CategoryValidator)
    this.flavorValidator = new FlavorValidator(apiConfig);
    
    // Cache local de categorías con sabores (obtenidas desde FlavorValidator)
    this.categoriesWithFlavors = [];
    
    // Campos obligatorios para validar completitud
    this.requiredFields = [
      'Code', 'Category', 'Name', 'Cost', 'Price', 'Stock',
      'Barcode', 'Unit', 'Flavor_Count', 'Description'
    ];
    
    console.log('🔧 GeneralValidator: Inicializado con FlavorValidator');
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

  // ✅ NUEVO: Obtener categorías con sabores usando FlavorValidator
  async fetchCategoriesWithFlavors() {
    // Si ya las tenemos en cache, no volver a buscarlas
    if (this.categoriesWithFlavors.length > 0) {
      console.log('✅ GeneralValidator: Usando categorías con sabores en caché:', this.categoriesWithFlavors.length);
      return {
        success: true,
        categoriesWithFlavors: this.categoriesWithFlavors
      };
    }

    try {
      console.log('🔍 GeneralValidator: Obteniendo categorías con sabores desde FlavorValidator...');
      
      // ✅ USAR FlavorValidator para obtener resumen completo
      const summaryResult = await this.flavorValidator.getFlavorsSummary();
      
      if (!summaryResult.success) {
        throw new Error(summaryResult.error || 'Error al obtener categorías con sabores');
      }
      
      // Guardar en cache
      this.categoriesWithFlavors = summaryResult.data || [];
      
      console.log('📦 GeneralValidator: Categorías con sabores obtenidas:', this.categoriesWithFlavors.length);
      
      // Si no hay categorías, es un error
      if (this.categoriesWithFlavors.length === 0) {
        throw new Error('No hay categorías con información de sabores disponibles');
      }
      
      console.log('✅ GeneralValidator: Categorías con sabores cargadas:', this.categoriesWithFlavors.map(c => `${c.categoryName}: ${c.maxFlavors} sabores`));
      
      return {
        success: true,
        categoriesWithFlavors: this.categoriesWithFlavors
      };
    } catch (error) {
      console.error('❌ GeneralValidator: Error al obtener categorías con sabores:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ NUEVO: Validar categoría Y sabores usando FlavorValidator
  async validateCategoryAndFlavors(categoryName, flavorCount) {
    console.log('🔗 GeneralValidator: Validando categoría y sabores:', { categoryName, flavorCount });
    
    try {
      // ✅ USAR el método puente de FlavorValidator
      const validation = await this.flavorValidator.validateCategoryAndFlavors(categoryName, flavorCount);
      console.log('   🍦 Resultado FlavorValidator:', validation);
      
      return validation;
    } catch (error) {
      console.error('❌ GeneralValidator: Error validando categoría y sabores:', error);
      return {
        valid: false,
        reason: 'TECHNICAL_ERROR',
        originalValues: { categoryName, flavorCount },
        message: `Error técnico: ${error.message}`,
        error: error.message
      };
    }
  }

  // ✅ FUNCIÓN MEJORADA: Validar completitud de campos de una fila
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

      // ✅ 1. Obtener categorías con sabores usando FlavorValidator
      console.log('🔍 GeneralValidator: Obteniendo categorías con información de sabores...');
      const categoriesResult = await this.fetchCategoriesWithFlavors();
      if (!categoriesResult.success) {
        throw new Error(categoriesResult.error);
      }

      const completeRows = [];    // Productos perfectos
      const incompleteRows = [];  // Productos con problemas

      // 2. Procesar cada fila con logs detallados
      console.log('🔄 GeneralValidator: Procesando filas...');
      
      for (let index = 0; index < rawData.length; index++) {
        const row = rawData[index];
        const rowNumber = index + 2; // Número de fila en Excel
        console.log(`\n📋 GeneralValidator: Procesando fila ${rowNumber}:`, row);
        
        // ✅ CAMBIO PRINCIPAL: Validar categoría Y sabores juntos
        const categoryFlavorValidation = await this.validateCategoryAndFlavors(
          row['Category'], 
          row['Flavor_Count']
        );
        console.log(`   🔗 Validación categoría + sabores:`, categoryFlavorValidation);
        
        // Preparar fila procesada
        let processedRow = { ...row };
        
        // ✅ NUEVO: Manejar resultado de validación integrada
        if (!categoryFlavorValidation.valid) {
          console.log(`   ❌ Categoría o sabores inválidos, limpiando campos...`);
          // Limpiar campos problemáticos
          processedRow['Category'] = '';
          processedRow['Flavor_Count'] = '';
        } else {
          // ✅ Si todo está bien, usar valores corregidos
          console.log(`   ✅ Usando datos validados: ${categoryFlavorValidation.categoryName}, ${categoryFlavorValidation.flavorCount}`);
          processedRow['Category'] = categoryFlavorValidation.categoryName;
          processedRow['Flavor_Count'] = categoryFlavorValidation.flavorCount;
        }
        
        // Validar completitud de campos
        const completenessValidation = this.validateRowCompleteness(processedRow);
        console.log(`   📊 Validación de completitud:`, completenessValidation);
        
        // ✅ NUEVO: Clasificar fila con validación integrada
        if (categoryFlavorValidation.valid && completenessValidation.isComplete) {
          // PRODUCTO PERFECTO: categoría válida + sabores válidos + todos los campos llenos
          console.log(`   ✅ Fila ${rowNumber}: PRODUCTO PERFECTO`);
          const completeRow = {
            rowNumber: rowNumber,
            originalRow: processedRow,
            validationDetails: {
              categoryName: categoryFlavorValidation.categoryName,
              flavorCount: categoryFlavorValidation.flavorCount,
              maxAllowed: categoryFlavorValidation.maxAllowed
            }
          };
          completeRows.push(completeRow);
          
        } else {
          // PRODUCTO CON PROBLEMAS: categoría/sabores inválidos ó campos vacíos
          console.log(`   ❌ Fila ${rowNumber}: PRODUCTO CON PROBLEMAS`);
          const incompleteRow = {
            rowNumber: rowNumber,
            originalRow: processedRow,
            issues: {
              categoryFlavorIssue: !categoryFlavorValidation.valid ? categoryFlavorValidation : null,
              emptyFields: completenessValidation.emptyFields,
              fieldDetails: completenessValidation.fieldDetails
            }
          };
          incompleteRows.push(incompleteRow);
        }
      }

      // ✅ 3. Resumen final con información mejorada
      console.log('\n🎯 GeneralValidator: RESUMEN FINAL:');
      console.log(`   📊 Total filas procesadas: ${rawData.length}`);
      console.log(`   ✅ Productos perfectos: ${completeRows.length}`);
      console.log(`   ❌ Productos con problemas: ${incompleteRows.length}`);
      console.log(`   📋 Categorías con sabores disponibles: ${this.categoriesWithFlavors.length}`);
      
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
          completeRows: completeRows,        // Productos perfectos con validación completa
          incompleteRows: incompleteRows,    // Productos con problemas + detalles de errores
          categoriesWithFlavors: this.categoriesWithFlavors, // ✅ Lista mejorada con conteos de sabores
          summary: {
            total: rawData.length,
            complete: completeRows.length,
            incomplete: incompleteRows.length,
            categoriesAvailable: this.categoriesWithFlavors.length
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

  // ✅ NUEVO: Función de utilidad para limpiar cache
  clearCache() {
    this.categoriesWithFlavors = [];
    this.flavorValidator.clearCache();
    console.log('🧹 GeneralValidator: Cache completo limpiado');
  }

  // ✅ NUEVO: Función de utilidad para obtener categorías en cache
  getCategoriesWithFlavors() {
    return [...this.categoriesWithFlavors]; // Retornar copia para evitar mutaciones
  }

  // ✅ NUEVO: Verificar si tiene datos cargados
  hasDataLoaded() {
    return this.categoriesWithFlavors.length > 0;
  }

  // ✅ FUNCIÓN ESTÁTICA: Crear desde configuración API (para compatibilidad)
  static async createFromAPI(apiConfig = {}) {
    console.log('🏭 GeneralValidator: Creando desde API...');
    
    const validator = new GeneralValidator(apiConfig);
    
    // ✅ Pre-cargar datos de categorías con sabores
    await validator.fetchCategoriesWithFlavors();
    
    return validator;
  }
}