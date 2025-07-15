import { flavorCategoryService } from './../../../../../services/Flavors/FlavorCategoryService';
import { CategoryValidator } from './../Category/CategoryValidator.js';

export class FlavorValidator {
  constructor(apiConfig = {}) {
    // Usar el servicio de sabores y categorías que ya tienes implementado
    this.flavorCategoryService = flavorCategoryService;
    
    // Integrar CategoryValidator para validación de categorías
    this.categoryValidator = new CategoryValidator(apiConfig);
    
    // Cache de sabores por categoría para evitar consultas repetidas
    this.flavorsByCategory = new Map();
    
    // Cache de categorías válidas procesadas
    this.processedCategories = new Set();
    
    // Cache del resumen completo de sabores por categoría
    this.flavorsSummaryCache = null;
    
    console.log('🍦 FlavorValidator: Inicializado');
  }

  // ✅ FUNCIÓN AUXILIAR: Verificar si un valor está vacío de forma robusta
  isValueEmpty(value) {
    if (value === null || value === undefined) {
      return true;
    }
    
    if (typeof value === 'string') {
      return value.trim() === '';
    }
    
    // Para números, 0 es un valor válido
    if (typeof value === 'number') {
      return false;
    }
    
    return String(value).trim() === '';
  }

  // ✅ FUNCIÓN AUXILIAR: Normalizar string de forma robusta
  normalizeString(str) {
    if (this.isValueEmpty(str)) {
      return '';
    }
    return String(str).toLowerCase().trim();
  }

  // ✅ FUNCIÓN PRINCIPAL CORREGIDA: Obtener sabores activos para una categoría específica
  async fetchFlavorsForCategory(categoryName) {
    try {
      console.log('🔍 FlavorValidator: Obteniendo sabores para categoría:', categoryName);
      
      // ✅ NORMALIZAR el nombre de categoría para el cache
      const normalizedCategoryName = this.normalizeString(categoryName);
      
      // Verificar si ya tenemos los sabores en cache (usando nombre normalizado)
      if (this.flavorsByCategory.has(normalizedCategoryName)) {
        const cachedFlavors = this.flavorsByCategory.get(normalizedCategoryName);
        console.log('✅ FlavorValidator: Usando sabores en caché para', categoryName, ':', cachedFlavors.length);
        return {
          success: true,
          flavors: cachedFlavors,
          count: cachedFlavors.length
        };
      }

      // Obtener todas las categorías con sus sabores
      const categoriesResult = await this.flavorCategoryService.getCategoriesWithFlavors();
      
      if (!categoriesResult.success) {
        throw new Error(categoriesResult.error || 'Error al obtener categorías con sabores');
      }

      console.log('📦 FlavorValidator: Categorías con sabores obtenidas:', categoriesResult.data.length);

      // ✅ CORREGIDO: Buscar la categoría específica con normalización robusta
      const targetCategory = categoriesResult.data.find(category => 
        this.normalizeString(category.categoria) === normalizedCategoryName
      );

      if (!targetCategory) {
        console.warn('⚠️ FlavorValidator: Categoría no encontrada:', categoryName);
        console.warn('   📋 Categorías disponibles:', categoriesResult.data.map(c => c.categoria));
        return {
          success: false,
          error: `Categoría "${categoryName}" no encontrada en la base de datos de sabores`,
          flavors: [],
          count: 0,
          availableCategories: categoriesResult.data.map(c => c.categoria)
        };
      }

      console.log('✅ FlavorValidator: Categoría encontrada:', targetCategory.categoria);

      // ✅ CORREGIDO: Manejar el caso donde la categoría existe pero no tiene sabores asociados
      const allFlavors = targetCategory.flavors || []; // Asegurar que no sea undefined
      const activeFlavors = allFlavors.filter(flavor => flavor.status === 1);
      
      console.log('🍦 FlavorValidator: Sabores totales para', categoryName, ':', allFlavors.length);
      console.log('🍦 FlavorValidator: Sabores activos encontrados para', categoryName, ':', activeFlavors.length);
      
      if (activeFlavors.length > 0) {
        console.log('   - Sabores activos:', activeFlavors.map(f => f.name));
      } else {
        console.log('   - No hay sabores activos asociados a esta categoría');
      }

      // ✅ GUARDAR en cache usando nombre normalizado (incluso si es array vacío)
      this.flavorsByCategory.set(normalizedCategoryName, activeFlavors);
      this.processedCategories.add(normalizedCategoryName);

      return {
        success: true,
        flavors: activeFlavors,
        count: activeFlavors.length // Puede ser 0, que es válido
      };

    } catch (error) {
      console.error('❌ FlavorValidator: Error al obtener sabores para categoría:', error);
      return {
        success: false,
        error: error.message,
        flavors: [],
        count: 0
      };
    }
  }

  // ✅ FUNCIÓN PRINCIPAL: Validar el flavor_count para una categoría específica
  async validateFlavorCount(categoryName, flavorCountValue) {
    try {
      console.log('🔍 FlavorValidator: Validando flavor_count:', flavorCountValue, 'para categoría:', categoryName);
      
      // ✅ CORREGIDO: Validar parámetros de entrada - categoría vacía es ERROR
      if (this.isValueEmpty(categoryName)) {
        // ✅ Obtener lista de categorías con conteos para el error
        const summaryResult = await this.getFlavorsSummary();
        const categoriesWithFlavors = summaryResult.success ? summaryResult.data : [];
        
        return {
          valid: false,
          reason: 'EMPTY_CATEGORY',
          originalValue: flavorCountValue,
          correctedValue: null,
          maxAllowed: null,
          message: 'No se puede validar flavor_count: categoría vacía',
          categoriesWithFlavors: categoriesWithFlavors
        };
      }

      // ✅ CORREGIDO: Si flavor_count está vacío, ES ERROR (no auto-corregir)
      if (this.isValueEmpty(flavorCountValue)) {
        console.log('   ❌ Flavor_count vacío no permitido');
        
        // ✅ Obtener lista de categorías con conteos para el error
        const summaryResult = await this.getFlavorsSummary();
        const categoriesWithFlavors = summaryResult.success ? summaryResult.data : [];
        
        return {
          valid: false,
          reason: 'EMPTY_FLAVOR_COUNT',
          originalValue: flavorCountValue,
          correctedValue: null,
          maxAllowed: null,
          message: 'Flavor_count no puede estar vacío. Debe ser un número mayor o igual a 0.',
          categoriesWithFlavors: categoriesWithFlavors
        };
      }

      // Convertir a número
      const flavorCount = parseInt(flavorCountValue, 10);
      if (isNaN(flavorCount)) {
        console.log('   ❌ Flavor_count no es un número válido:', flavorCountValue);
        
        // ✅ Obtener lista de categorías con conteos para el error
        const summaryResult = await this.getFlavorsSummary();
        const categoriesWithFlavors = summaryResult.success ? summaryResult.data : [];
        
        return {
          valid: false,
          reason: 'INVALID_NUMBER',
          originalValue: flavorCountValue,
          correctedValue: null,
          maxAllowed: null,
          message: 'Flavor_count debe ser un número válido',
          categoriesWithFlavors: categoriesWithFlavors
        };
      }

      // Los números negativos se consideran error
      if (flavorCount < 0) {
        console.log('   ❌ Flavor_count negativo no permitido:', flavorCount);
        
        // ✅ Obtener lista de categorías con conteos para el error
        const summaryResult = await this.getFlavorsSummary();
        const categoriesWithFlavors = summaryResult.success ? summaryResult.data : [];
        
        return {
          valid: false,
          reason: 'NEGATIVE_NOT_ALLOWED',
          originalValue: flavorCountValue,
          correctedValue: null,
          maxAllowed: null,
          message: 'Flavor_count no puede ser negativo. Debe ser 0 o mayor.',
          categoriesWithFlavors: categoriesWithFlavors
        };
      }

      // ✅ OBTENER sabores disponibles para la categoría
      const flavorsResult = await this.fetchFlavorsForCategory(categoryName);
      
      // ✅ CAMBIO CRÍTICO: Si la categoría no existe en sabores, es ERROR
      if (!flavorsResult.success) {
        console.error('❌ FlavorValidator: Categoría no encontrada en base de datos de sabores:', categoryName);
        
        // ✅ Obtener lista de categorías con conteos para el error
        const summaryResult = await this.getFlavorsSummary();
        const categoriesWithFlavors = summaryResult.success ? summaryResult.data : [];
        
        return {
          valid: false,
          reason: 'CATEGORY_NOT_FOUND_IN_FLAVORS',
          originalValue: flavorCountValue,
          correctedValue: null,
          maxAllowed: null,
          message: `Categoría "${categoryName}" no encontrada en la base de datos de sabores. Verifique que la categoría sea válida.`,
          error: flavorsResult.error,
          availableCategories: flavorsResult.availableCategories || [],
          categoriesWithFlavors: categoriesWithFlavors
        };
      }

      const maxAllowedFlavors = flavorsResult.count;
      console.log('   📊 Sabores máximos permitidos para', categoryName, ':', maxAllowedFlavors);

      // ✅ VALIDAR que no exceda el máximo
      if (flavorCount > maxAllowedFlavors) {
        console.log('   ⚠️ Flavor_count excede el máximo:', flavorCount, '>', maxAllowedFlavors);
        
        // ✅ Obtener lista de categorías con conteos para el error
        const summaryResult = await this.getFlavorsSummary();
        const categoriesWithFlavors = summaryResult.success ? summaryResult.data : [];
        
        return {
          valid: false,
          reason: 'EXCEEDED_LIMIT',
          originalValue: flavorCountValue,
          correctedValue: null,
          maxAllowed: maxAllowedFlavors,
          message: `Flavor_count ${flavorCount} excede el máximo de ${maxAllowedFlavors} sabores disponibles para "${categoryName}". Debe corregirse manualmente.`,
          categoriesWithFlavors: categoriesWithFlavors
        };
      }

      // ✅ TODO está bien - devolver solo los datos necesarios (sin lista completa)
      console.log('   ✅ Flavor_count válido:', flavorCount, '<=', maxAllowedFlavors);
      return {
        valid: true,
        reason: 'VALID',
        originalValue: flavorCountValue,
        correctedValue: flavorCount,
        maxAllowed: maxAllowedFlavors,
        message: `Flavor_count ${flavorCount} es válido para "${categoryName}"`
        // ✅ NO incluir categoriesWithFlavors cuando es válido (optimización)
      };

    } catch (error) {
      console.error('❌ FlavorValidator: Error validando flavor_count:', error);
      
      // ✅ En caso de error técnico, también devolver lista de categorías
      const summaryResult = await this.getFlavorsSummary();
      const categoriesWithFlavors = summaryResult.success ? summaryResult.data : [];
      
      return {
        valid: false,
        reason: 'VALIDATION_ERROR',
        originalValue: flavorCountValue,
        correctedValue: null,
        maxAllowed: null,
        message: `Error validando flavor_count: ${error.message}`,
        categoriesWithFlavors: categoriesWithFlavors
      };
    }
  }

  // ✅ FUNCIÓN MEJORADA: Obtener resumen de sabores por categoría con cache
  async getFlavorsSummary() {
    try {
      // ✅ Usar cache si ya lo tenemos
      if (this.flavorsSummaryCache) {
        console.log('✅ FlavorValidator: Usando resumen en caché');
        return {
          success: true,
          data: this.flavorsSummaryCache,
          message: `Resumen desde caché con ${this.flavorsSummaryCache.length} categorías`
        };
      }
      
      console.log('📊 FlavorValidator: Generando resumen de sabores...');
      
      const categoriesResult = await this.flavorCategoryService.getCategoriesWithFlavors();
      
      if (!categoriesResult.success) {
        throw new Error(categoriesResult.error);
      }

      const summary = categoriesResult.data.map(category => ({
        categoryName: category.categoria,
        maxFlavors: (category.flavors || []).filter(f => f.status === 1).length, // ✅ Simplificado: solo el número máximo
        totalFlavors: (category.flavors || []).length,
        activeFlavors: (category.flavors || []).filter(f => f.status === 1).length,
        inactiveFlavors: (category.flavors || []).filter(f => f.status !== 1).length,
        flavorNames: (category.flavors || [])
          .filter(f => f.status === 1)
          .map(f => f.name)
      }));

      // ✅ Guardar en cache
      this.flavorsSummaryCache = summary;

      console.log('📋 FlavorValidator: Resumen generado:', summary);
      
      return {
        success: true,
        data: summary,
        message: `Resumen de ${summary.length} categorías generado`
      };

    } catch (error) {
      console.error('❌ FlavorValidator: Error generando resumen:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // ✅ NUEVO MÉTODO PRINCIPAL: Validar categoría Y sabores (método puente)
  async validateCategoryAndFlavors(categoryName, flavorCountValue) {
    try {
      console.log('🔗 FlavorValidator: Validando categoría y sabores:', { categoryName, flavorCountValue });
      
      // ✅ PASO 1: Asegurar que CategoryValidator tenga las categorías cargadas
      const categoryResult = await this.categoryValidator.fetchValidCategories();
      if (!categoryResult.success) {
        throw new Error(`Error obteniendo categorías: ${categoryResult.error}`);
      }
      
      // ✅ PASO 2: Validar la categoría usando CategoryValidator
      const categoryValidation = this.categoryValidator.validateSingleCategory(categoryName);
      console.log('   🏷️ Resultado CategoryValidator:', categoryValidation);
      
      // ✅ PASO 3: Si la categoría es inválida, devolver error con lista mejorada
      if (!categoryValidation.valid) {
        console.log('   ❌ Categoría inválida, obteniendo lista de categorías con conteos...');
        
        const summaryResult = await this.getFlavorsSummary();
        const categoriesWithFlavors = summaryResult.success ? summaryResult.data : [];
        
        return {
          valid: false,
          reason: 'INVALID_CATEGORY',
          categoryIssue: categoryValidation, // Información original de CategoryValidator
          originalValues: {
            categoryName: categoryName,
            flavorCount: flavorCountValue
          },
          message: `Categoría "${categoryName}" no es válida. ${categoryValidation.reason === 'EMPTY' ? 'Categoría vacía.' : 'Categoría no encontrada.'}`,
          categoriesWithFlavors: categoriesWithFlavors // ✅ Lista mejorada en lugar de lista simple
        };
      }
      
      // ✅ PASO 4: Si la categoría es válida, validar el flavor_count
      console.log('   ✅ Categoría válida, validando flavor_count...');
      const flavorValidation = await this.validateFlavorCount(categoryValidation.correctName, flavorCountValue);
      console.log('   🍦 Resultado FlavorValidator:', flavorValidation);
      
      // ✅ PASO 5: Si flavor_count es inválido, ya tiene la lista mejorada
      if (!flavorValidation.valid) {
        console.log('   ❌ Flavor_count inválido, devolviendo error con lista');
        return {
          valid: false,
          reason: 'INVALID_FLAVOR_COUNT',
          categoryName: categoryValidation.correctName, // Nombre correcto de la categoría
          flavorIssue: flavorValidation, // Información detallada del error de sabores
          originalValues: {
            categoryName: categoryName,
            flavorCount: flavorCountValue
          },
          message: flavorValidation.message,
          categoriesWithFlavors: flavorValidation.categoriesWithFlavors // Ya viene incluida
        };
      }
      
      // ✅ PASO 6: Todo está bien, devolver solo los datos necesarios
      console.log('   ✅ Categoría y flavor_count válidos');
      return {
        valid: true,
        reason: 'VALID',
        categoryName: categoryValidation.correctName, // Nombre correcto de la categoría
        flavorCount: flavorValidation.correctedValue, // Número validado
        maxAllowed: flavorValidation.maxAllowed,
        originalValues: {
          categoryName: categoryName,
          flavorCount: flavorCountValue
        },
        message: `Categoría "${categoryValidation.correctName}" y flavor_count ${flavorValidation.correctedValue} son válidos`
        // ✅ NO incluir categoriesWithFlavors cuando todo está bien
      };
      
    } catch (error) {
      console.error('❌ FlavorValidator: Error en validateCategoryAndFlavors:', error);
      
      // ✅ En caso de error técnico, devolver lista de categorías
      const summaryResult = await this.getFlavorsSummary();
      const categoriesWithFlavors = summaryResult.success ? summaryResult.data : [];
      
      return {
        valid: false,
        reason: 'TECHNICAL_ERROR',
        originalValues: {
          categoryName: categoryName,
          flavorCount: flavorCountValue
        },
        message: `Error técnico: ${error.message}`,
        error: error.message,
        categoriesWithFlavors: categoriesWithFlavors
      };
    }
  }

  // ✅ FUNCIÓN DE UTILIDAD MEJORADA: Limpiar cache
  clearCache() {
    this.flavorsByCategory.clear();
    this.processedCategories.clear();
    this.flavorsSummaryCache = null; // ✅ Limpiar también el cache del resumen
    this.categoryValidator.clearCache(); // ✅ Limpiar cache de CategoryValidator también
    console.log('🧹 FlavorValidator: Cache completo limpiado');
  }

  // ✅ FUNCIÓN DE UTILIDAD: Obtener sabores en cache para una categoría
  getCachedFlavors(categoryName) {
    const normalizedName = this.normalizeString(categoryName);
    return this.flavorsByCategory.get(normalizedName) || [];
  }

  // ✅ FUNCIÓN DE UTILIDAD: Verificar si una categoría ya fue procesada
  isCategoryProcessed(categoryName) {
    const normalizedName = this.normalizeString(categoryName);
    return this.processedCategories.has(normalizedName);
  }

  // ✅ FUNCIÓN ESTÁTICA: Crear desde configuración API (para compatibilidad)
  static async createFromAPI(apiConfig = {}) {
    console.log('🏭 FlavorValidator: Creando desde API...');
    
    const validator = new FlavorValidator(apiConfig);
    
    // ✅ Pre-cargar CategoryValidator
    await validator.categoryValidator.fetchValidCategories();
    
    return validator;
  }
}