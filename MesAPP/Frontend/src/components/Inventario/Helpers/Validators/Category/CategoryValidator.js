import { productAPI, APIFactory } from './../../../../../services/Products/ProductsSearch.js';

export class CategoryValidator {
  constructor(apiConfig = {}) {
    // Si se pasa configuración específica, crear instancia personalizada
    if (Object.keys(apiConfig).length > 0) {
      this.productAPI = APIFactory.createProductAPI(apiConfig);
    } else {
      // Usar instancia global
      this.productAPI = productAPI;
    }
    
    // Cache de categorías
    this.validCategories = [];
    
    console.log('🏷️ CategoryValidator: Inicializado');
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

  // ✅ FUNCIÓN PRINCIPAL: Obtener categorías válidas de la base de datos
  async fetchValidCategories() {
    // Si ya las tenemos en cache, no volver a buscarlas
    if (this.validCategories.length > 0) {
      console.log('✅ CategoryValidator: Usando categorías en caché:', this.validCategories.length);
      return {
        success: true,
        categories: this.validCategories
      };
    }

    try {
      console.log('🔍 CategoryValidator: Obteniendo categorías con ProductAPI...');
      
      // USAR HTTPClient a través de ProductAPI
      const result = await this.productAPI.getValidCategories();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al obtener categorías');
      }
      
      this.validCategories = result.categories || [];
      
      console.log('📦 CategoryValidator: Respuesta de ProductAPI:', result);
      
      // ✅ VALIDAR QUE LAS CATEGORÍAS NO ESTÉN VACÍAS
      const filteredCategories = this.validCategories.filter(cat => !this.isValueEmpty(cat));
      
      if (filteredCategories.length !== this.validCategories.length) {
        console.warn('⚠️ CategoryValidator: Se encontraron categorías vacías en BD, filtrando...');
        this.validCategories = filteredCategories;
      }
      
      // Si la BD está vacía, es un error real
      if (this.validCategories.length === 0) {
        throw new Error('No hay categorías válidas disponibles en la base de datos');
      }
      
      console.log('✅ CategoryValidator: Categorías válidas cargadas:', this.validCategories);
      
      return {
        success: true,
        categories: this.validCategories
      };
    } catch (error) {
      console.error('❌ CategoryValidator: Error al obtener categorías:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ NUEVO: Obtener categorías válidas actuales (desde cache)
  getValidCategories() {
    return [...this.validCategories]; // Retornar copia para evitar mutaciones
  }

  // ✅ NUEVO: Verificar si tiene categorías válidas cargadas
  hasValidCategories() {
    return this.validCategories.length > 0;
  }

  // ✅ NUEVO: Limpiar cache de categorías
  clearCache() {
    this.validCategories = [];
    console.log('🧹 CategoryValidator: Cache de categorías limpiado');
  }

  // ✅ NUEVO: Método estático para crear desde diferentes fuentes (para compatibilidad)
  static async createFromAPI(apiConfig = {}) {
    console.log('🏭 CategoryValidator: Creando desde API...');
    
    const validator = new CategoryValidator(apiConfig);
    const result = await validator.fetchValidCategories();
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return validator;
  }

  static createFromArray(categories) {
    console.log('📋 CategoryValidator: Creando desde array...');
    const validator = new CategoryValidator();
    validator.validCategories = Array.isArray(categories) ? categories : [];
    return validator;
  }

  static createFromString(categoriesString, separator = ',') {
    console.log('📝 CategoryValidator: Creando desde string...');
    const categories = categoriesString
      .split(separator)
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0);
    
    return CategoryValidator.createFromArray(categories);
  }
}