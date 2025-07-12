import { flavorCategoryService } from './../../../../../services/Flavors/FlavorCategoryService';

export class FlavorValidator {
  constructor(apiConfig = {}) {
    // Usar el servicio de sabores y categorías que ya tienes implementado
    this.flavorCategoryService = flavorCategoryService;
    
    // Cache de sabores por categoría para evitar consultas repetidas
    this.flavorsByCategory = new Map();
    
    // Cache de categorías válidas procesadas
    this.processedCategories = new Set();
    
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

  // ✅ FUNCIÓN PRINCIPAL: Obtener sabores activos para una categoría específica
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

      // ✅ MEJORAR: Buscar la categoría específica con normalización robusta
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

      // Filtrar solo sabores activos
      const activeFlavors = targetCategory.flavors.filter(flavor => flavor.status === 1);
      
      console.log('🍦 FlavorValidator: Sabores activos encontrados para', categoryName, ':', activeFlavors.length);
      console.log('   - Sabores:', activeFlavors.map(f => f.name));

      // ✅ GUARDAR en cache usando nombre normalizado
      this.flavorsByCategory.set(normalizedCategoryName, activeFlavors);
      this.processedCategories.add(normalizedCategoryName);

      return {
        success: true,
        flavors: activeFlavors,
        count: activeFlavors.length
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
      
      // ✅ CAMBIO: Validar parámetros de entrada - categoría vacía es ERROR
      if (this.isValueEmpty(categoryName)) {
        return {
          valid: false,
          reason: 'EMPTY_CATEGORY',
          originalValue: flavorCountValue,
          correctedValue: null, // ✅ No corregir, es un error
          maxAllowed: null,
          message: 'No se puede validar flavor_count: categoría vacía'
        };
      }

      // Si flavor_count está vacío, asignar 0 por defecto
      if (this.isValueEmpty(flavorCountValue)) {
        console.log('   ℹ️ Flavor_count vacío, asignando 0');
        return {
          valid: true,
          reason: 'EMPTY_ASSIGNED_ZERO',
          originalValue: flavorCountValue,
          correctedValue: 0,
          maxAllowed: 0,
          message: 'Flavor_count vacío, asignado 0 por defecto'
        };
      }

      // Convertir a número
      const flavorCount = parseInt(flavorCountValue, 10);
      if (isNaN(flavorCount)) {
        console.log('   ❌ Flavor_count no es un número válido:', flavorCountValue);
        return {
          valid: false,
          reason: 'INVALID_NUMBER',
          originalValue: flavorCountValue,
          correctedValue: null, // ✅ No corregir automáticamente
          maxAllowed: null,
          message: 'Flavor_count debe ser un número válido'
        };
      }

      // Los números negativos se consideran error
      if (flavorCount < 0) {
        console.log('   ❌ Flavor_count negativo no permitido:', flavorCount);
        return {
          valid: false,
          reason: 'NEGATIVE_NOT_ALLOWED',
          originalValue: flavorCountValue,
          correctedValue: null, // ✅ No corregir automáticamente
          maxAllowed: null,
          message: 'Flavor_count no puede ser negativo'
        };
      }

      // ✅ OBTENER sabores disponibles para la categoría
      const flavorsResult = await this.fetchFlavorsForCategory(categoryName);
      
      // ✅ CAMBIO CRÍTICO: Si la categoría no existe en sabores, es ERROR
      if (!flavorsResult.success) {
        console.error('❌ FlavorValidator: Categoría no encontrada en base de datos de sabores:', categoryName);
        return {
          valid: false,
          reason: 'CATEGORY_NOT_FOUND_IN_FLAVORS',
          originalValue: flavorCountValue,
          correctedValue: null, // ✅ No corregir
          maxAllowed: null,
          message: `Categoría "${categoryName}" no encontrada en la base de datos de sabores. Verifique que la categoría sea válida.`,
          error: flavorsResult.error,
          availableCategories: flavorsResult.availableCategories || []
        };
      }

      const maxAllowedFlavors = flavorsResult.count;
      console.log('   📊 Sabores máximos permitidos para', categoryName, ':', maxAllowedFlavors);

      // ✅ VALIDAR que no exceda el máximo
      if (flavorCount > maxAllowedFlavors) {
        console.log('   ⚠️ Flavor_count excede el máximo:', flavorCount, '>', maxAllowedFlavors);
        return {
          valid: false, // ✅ CAMBIO: Marcarlo como inválido para que vaya a corrección manual
          reason: 'EXCEEDED_LIMIT',
          originalValue: flavorCountValue,
          correctedValue: null, // ✅ No corregir automáticamente
          maxAllowed: maxAllowedFlavors,
          message: `Flavor_count ${flavorCount} excede el máximo de ${maxAllowedFlavors} sabores disponibles para "${categoryName}". Debe corregirse manualmente.`
        };
      }

      // ✅ TODO está bien
      console.log('   ✅ Flavor_count válido:', flavorCount, '<=', maxAllowedFlavors);
      return {
        valid: true,
        reason: 'VALID',
        originalValue: flavorCountValue,
        correctedValue: flavorCount,
        maxAllowed: maxAllowedFlavors,
        message: `Flavor_count ${flavorCount} es válido para "${categoryName}"`
      };

    } catch (error) {
      console.error('❌ FlavorValidator: Error validando flavor_count:', error);
      return {
        valid: false,
        reason: 'VALIDATION_ERROR',
        originalValue: flavorCountValue,
        correctedValue: null, // ✅ No corregir en caso de error
        maxAllowed: null,
        message: `Error validando flavor_count: ${error.message}`
      };
    }
  }

  // ✅ FUNCIÓN DE CONVENIENCIA: Obtener resumen de sabores por categoría
  async getFlavorsSummary() {
    try {
      console.log('📊 FlavorValidator: Generando resumen de sabores...');
      
      const categoriesResult = await this.flavorCategoryService.getCategoriesWithFlavors();
      
      if (!categoriesResult.success) {
        throw new Error(categoriesResult.error);
      }

      const summary = categoriesResult.data.map(category => ({
        categoryName: category.categoria,
        totalFlavors: category.flavors.length,
        activeFlavors: category.flavors.filter(f => f.status === 1).length,
        inactiveFlavors: category.flavors.filter(f => f.status !== 1).length,
        flavorNames: category.flavors
          .filter(f => f.status === 1)
          .map(f => f.name)
      }));

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

  // ✅ FUNCIÓN DE UTILIDAD: Limpiar cache
  clearCache() {
    this.flavorsByCategory.clear();
    this.processedCategories.clear();
    console.log('🧹 FlavorValidator: Cache limpiado');
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
    
    // Pre-cargar datos si es necesario
    // const summary = await validator.getFlavorsSummary();
    
    return validator;
  }
}