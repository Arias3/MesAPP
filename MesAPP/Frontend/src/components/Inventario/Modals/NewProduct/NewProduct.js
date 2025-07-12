import { FieldNormalizer } from './../../Helpers/FormatAppliers/FieldNormalizer.js';
import { UpsertProcessor } from './../../../../services/Products/Update.js';
import { CategoryValidator } from './../../Helpers/Validators/Category/CategoryValidator.js';

/**
 * NewProductLogic - Lógica de negocio para crear nuevos productos
 * Maneja validación, búsqueda de duplicados, categorías y creación
 */
export class NewProductLogic {
  constructor(apiConfig = {}) {
    this.upsertProcessor = new UpsertProcessor(apiConfig);
    this.categoryValidator = new CategoryValidator(apiConfig);
    this.isProcessing = false;
  }

  /**
   * ✅ NUEVA FUNCIÓN: Cargar categorías válidas de la base de datos
   */
  async loadValidCategories() {
    try {
      console.log('🏷️ NewProductLogic: Cargando categorías válidas...');
      
      const result = await this.categoryValidator.fetchValidCategories();
      
      if (result.success) {
        console.log('✅ NewProductLogic: Categorías cargadas exitosamente:', result.categories.length);
        return {
          success: true,
          categories: result.categories,
          message: 'Categorías cargadas correctamente'
        };
      } else {
        console.error('❌ NewProductLogic: Error cargando categorías:', result.error);
        return {
          success: false,
          error: result.error,
          categories: []
        };
      }
    } catch (error) {
      console.error('💥 NewProductLogic: Excepción cargando categorías:', error);
      return {
        success: false,
        error: error.message,
        categories: []
      };
    }
  }

  /**
   * ✅ MEJORADA: Validar campos obligatorios del formulario
   */
  validateFormData(formData) {
    const errors = [];
    const requiredFields = [
      { field: 'code', label: 'Código' },
      { field: 'name', label: 'Nombre' },
      { field: 'category', label: 'Categoría' },
      { field: 'cost', label: 'Costo' },
      { field: 'price', label: 'Precio' },
      { field: 'stock', label: 'Stock' }
    ];

    requiredFields.forEach(({ field, label }) => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        errors.push(`${label} es obligatorio`);
      }
    });

    // Validaciones específicas
    if (formData.cost && parseFloat(formData.cost) < 0) {
      errors.push('El costo debe ser mayor o igual a 0');
    }

    if (formData.price && parseFloat(formData.price) < 0) {
      errors.push('El precio debe ser mayor o igual a 0');
    }

    if (formData.stock && parseInt(formData.stock) < 0) {
      errors.push('El stock debe ser mayor o igual a 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * ✅ NUEVA FUNCIÓN: Validar categoría contra las disponibles en BD
   */
  async validateCategory(category) {
    try {
      console.log(`🏷️ NewProductLogic: Validando categoría "${category}"...`);
      
      // Si no hay categorías cargadas, cargarlas primero
      if (!this.categoryValidator.hasValidCategories()) {
        const loadResult = await this.loadValidCategories();
        if (!loadResult.success) {
          return {
            isValid: false,
            error: 'No se pudieron cargar las categorías para validar'
          };
        }
      }

      const validCategories = this.categoryValidator.getValidCategories();
      
      // ✅ LOGS DE DEBUG PARA VER QUE ESTÁ PASANDO
      console.log('🔍 DEBUG: Categorías válidas cargadas:', validCategories);
      console.log('🔍 DEBUG: Categoría a validar:', category);
      console.log('🔍 DEBUG: Categoría normalizada:', category.toLowerCase().trim());
      
      // ✅ NORMALIZAR AMBAS PARTES PARA COMPARACIÓN
      const categoryToValidate = category.toLowerCase().trim();
      const normalizedValidCategories = validCategories.map(cat => cat.toLowerCase().trim());
      
      console.log('🔍 DEBUG: Categorías válidas normalizadas:', normalizedValidCategories);
      console.log('🔍 DEBUG: ¿Incluye la categoría?', normalizedValidCategories.includes(categoryToValidate));
      
      const isValid = normalizedValidCategories.includes(categoryToValidate);
      
      console.log(`${isValid ? '✅' : '❌'} NewProductLogic: Categoría "${category}" es ${isValid ? 'válida' : 'inválida'}`);
      
      return {
        isValid,
        error: isValid ? null : `La categoría "${category}" no existe en la base de datos`
      };
    } catch (error) {
      console.error('💥 NewProductLogic: Error validando categoría:', error);
      return {
        isValid: false,
        error: `Error técnico validando categoría: ${error.message}`
      };
    }
  }

  /**
   * Preparar datos del producto para procesamiento
   */
  prepareProductData(formData) {
    console.log('📦 NewProductLogic: Preparando datos del formulario...');
    
    const productData = {
      code: formData.code?.trim() || '',
      name: formData.name?.trim() || '',
      category: formData.category?.trim() || '',
      cost: parseFloat(formData.cost) || 0,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
      barcode: formData.barcode?.trim() || '',
      unit: formData.unity?.trim() || '',
      flavor_count: parseInt(formData.flavor_count) || 0,
      description: formData.description?.trim() || ''
    };

    console.log('📋 NewProductLogic: Datos antes de normalizar:', productData);
    return productData;
  }

  /**
   * Normalizar datos del producto
   */
  normalizeProductData(productData) {
    console.log('🔧 NewProductLogic: Normalizando producto...');
    
    const normalizedProduct = FieldNormalizer.normalizeProduct(productData);
    
    console.log('✅ NewProductLogic: Producto normalizado:', normalizedProduct);
    return normalizedProduct;
  }

  /**
   * Verificar si el código ya existe
   */
  async checkCodeExists(code) {
    try {
      console.log(`🔍 NewProductLogic: Verificando si código "${code}" existe...`);
      
      const searchResult = await this.upsertProcessor.findProductByCode(code);
      
      if (searchResult.error) {
        console.error(`❌ NewProductLogic: Error técnico buscando código "${code}":`, searchResult.error);
        return {
          exists: false,
          error: searchResult.error,
          product: null
        };
      }

      if (searchResult.found) {
        console.log(`⚠️ NewProductLogic: Código "${code}" YA EXISTE:`, searchResult.product.id);
        return {
          exists: true,
          error: null,
          product: searchResult.product
        };
      } else {
        console.log(`✅ NewProductLogic: Código "${code}" disponible para crear`);
        return {
          exists: false,
          error: null,
          product: null
        };
      }
      
    } catch (error) {
      console.error(`💥 NewProductLogic: Excepción verificando código "${code}":`, error);
      return {
        exists: false,
        error: error.message,
        product: null
      };
    }
  }

  /**
   * Crear producto nuevo
   */
  async createProduct(normalizedProduct) {
    try {
      console.log(`➕ NewProductLogic: Creando producto con código "${normalizedProduct.code}"...`);
      
      const result = await this.upsertProcessor.createProduct(normalizedProduct);
      
      if (result.success) {
        console.log(`✅ NewProductLogic: Producto creado exitosamente:`, result.productId);
        
        // Emitir evento para actualizar la tabla en el componente principal
        this.emitProductCreatedEvent(result, normalizedProduct);
        
        return {
          success: true,
          message: `Producto "${normalizedProduct.code}" creado exitosamente`,
          productId: result.productId,
          product: normalizedProduct
        };
      } else {
        console.error(`❌ NewProductLogic: Error creando producto "${normalizedProduct.code}":`, result.message);
        return {
          success: false,
          message: result.message,
          productId: null
        };
      }
      
    } catch (error) {
      console.error(`💥 NewProductLogic: Excepción creando producto "${normalizedProduct.code}":`, error);
      return {
        success: false,
        message: `Error técnico: ${error.message}`,
        productId: null
      };
    }
  }

  /**
   * ✅ CORREGIDO: Emitir evento de producto creado (sin rentabilidad calculada en frontend)
   */
  emitProductCreatedEvent(result, normalizedProduct) {
    console.log('📡 NewProductLogic: Emitiendo evento productCreated...');
    
    const eventData = {
      success: true,
      source: 'NewProductInventary',
      productId: result.productId,
      code: normalizedProduct.code,
      message: `Producto "${normalizedProduct.code}" creado desde formulario nuevo producto`,
      createdProduct: normalizedProduct,
      timestamp: new Date().toISOString(),
      // ✅ DATOS PARA ACTUALIZAR LA TABLA (sin rentabilidad - la calcula el backend)
      tableUpdate: {
        action: 'CREATE',
        productData: {
          id: result.productId,
          codigo: normalizedProduct.code,
          nombre: normalizedProduct.name,
          category: normalizedProduct.category,
          costo: normalizedProduct.cost,
          precio: normalizedProduct.price,
          stock: normalizedProduct.stock,
          barcode: normalizedProduct.barcode,
          unit: normalizedProduct.unit,
          flavor_count: normalizedProduct.flavor_count,
          description: normalizedProduct.description
          // ✅ ELIMINADO: rentabilidad - se calcula automáticamente en el backend
        }
      }
    };

    // ✅ EMITIR EVENTO GLOBAL para que el componente principal lo escuche
    const event = new CustomEvent('productCreated', {
      detail: eventData
    });

    window.dispatchEvent(event);
    console.log('✅ NewProductLogic: Evento productCreated emitido:', eventData);
  }

  /**
   * Emitir evento de error de creación
   */
  emitProductCreationErrorEvent(error, code) {
    console.log('📡 NewProductLogic: Emitiendo evento productCreationError...');
    
    const eventData = {
      success: false,
      source: 'NewProductInventary',
      code: code,
      error: error,
      message: `Error creando producto "${code}": ${error}`,
      timestamp: new Date().toISOString()
    };

    const event = new CustomEvent('productCreationError', {
      detail: eventData
    });

    window.dispatchEvent(event);
    console.log('🔴 NewProductLogic: Evento productCreationError emitido:', eventData);
  }

  /**
   * ✅ MEJORADO: MÉTODO PRINCIPAL con validación de categorías
   */
  async processNewProduct(formData) {
    if (this.isProcessing) {
      console.warn('⚠️ NewProductLogic: Ya hay un procesamiento en curso');
      return { success: false, message: 'Ya hay un procesamiento en curso' };
    }

    this.isProcessing = true;

    try {
      console.log('\n🚀 NewProductLogic: === INICIANDO PROCESAMIENTO NUEVO PRODUCTO ===');
      
      // PASO 1: Validar campos obligatorios
      console.log('📋 NewProductLogic: Paso 1 - Validando formulario...');
      const validation = this.validateFormData(formData);
      
      if (!validation.isValid) {
        console.error('❌ NewProductLogic: Validación fallida:', validation.errors);
        return {
          success: false,
          message: `Campos incompletos: ${validation.errors.join(', ')}`,
          type: 'validation'
        };
      }

      // PASO 2: Validar categoría contra la base de datos
      console.log('🏷️ NewProductLogic: Paso 2 - Validando categoría...');
      const categoryValidation = await this.validateCategory(formData.category);
      
      if (!categoryValidation.isValid) {
        console.error('❌ NewProductLogic: Categoría inválida:', categoryValidation.error);
        return {
          success: false,
          message: categoryValidation.error,
          type: 'validation'
        };
      }

      // PASO 3: Preparar y normalizar datos
      console.log('🔧 NewProductLogic: Paso 3 - Preparando datos...');
      const productData = this.prepareProductData(formData);
      const normalizedProduct = this.normalizeProductData(productData);

      // PASO 4: Verificar si código ya existe
      console.log('🔍 NewProductLogic: Paso 4 - Verificando duplicados...');
      const codeCheck = await this.checkCodeExists(normalizedProduct.code);
      
      if (codeCheck.error) {
        console.error('❌ NewProductLogic: Error técnico en verificación:', codeCheck.error);
        this.emitProductCreationErrorEvent(codeCheck.error, normalizedProduct.code);
        return {
          success: false,
          message: `Error técnico: ${codeCheck.error}`,
          type: 'technical'
        };
      }

      if (codeCheck.exists) {
        console.warn('⚠️ NewProductLogic: Código duplicado detectado');
        return {
          success: false,
          message: 'Producto duplicado',
          type: 'duplicate',
          existingProduct: codeCheck.product,
          formData: formData // Mantener datos para el formulario
        };
      }

      // PASO 5: Crear producto
      console.log('➕ NewProductLogic: Paso 5 - Creando producto...');
      const createResult = await this.createProduct(normalizedProduct);
      
      console.log(`🎯 NewProductLogic: === PROCESAMIENTO ${createResult.success ? 'EXITOSO' : 'FALLIDO'} ===\n`);
      
      if (!createResult.success) {
        this.emitProductCreationErrorEvent(createResult.message, normalizedProduct.code);
      }
      
      return createResult;

    } catch (error) {
      console.error('💥 NewProductLogic: Excepción en procesamiento:', error);
      this.emitProductCreationErrorEvent(error.message, formData.code);
      return {
        success: false,
        message: `Error inesperado: ${error.message}`,
        type: 'exception'
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Calcular margen para preview
   */
  calculateMargin(cost, price) {
    const costNum = parseFloat(cost) || 0;
    const priceNum = parseFloat(price) || 0;
    if (costNum === 0) return 0;
    return (((priceNum - costNum) / costNum) * 100).toFixed(1);
  }

  /**
   * Verificar si hay procesamiento activo
   */
  isCurrentlyProcessing() {
    return this.isProcessing;
  }

  /**
   * ✅ NUEVA FUNCIÓN: Limpiar cache de categorías
   */
  clearCategoriesCache() {
    this.categoryValidator.clearCache();
    console.log('🧹 NewProductLogic: Cache de categorías limpiado');
  }

  /**
   * ✅ NUEVA FUNCIÓN: Obtener categorías cargadas (para uso externo)
   */
  getLoadedCategories() {
    return this.categoryValidator.getValidCategories();
  }
}