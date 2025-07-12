/**
 * HTTPClient - Componente generalizado para todas las peticiones HTTP
 * Maneja configuración, errores, headers y responses de forma unificada
 */
export class HTTPClient {
  constructor(config = {}) {
    // Configuración por defecto
    this.baseURL = config.baseURL || `http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}`;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers
    };
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 0;
  }

  /**
   * Realizar petición HTTP genérica
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      },
      ...options
    };

    // Manejar body para POST/PUT
    if (options.body && typeof options.body === 'object') {
      requestOptions.body = JSON.stringify(options.body);
    }

    console.log(`🚀 HTTPClient: ${requestOptions.method} ${url}`);
    console.log('📤 Request options:', requestOptions);

    try {
      const response = await this._makeRequestWithTimeout(url, requestOptions);
      const data = await response.json();
      
      console.log(`📥 HTTPClient: Response ${response.status}`, data);

      // Manejar errores HTTP
      if (!response.ok) {
        throw this._createHTTPError(response, data);
      }

      return {
        success: true,
        data: data,
        status: response.status,
        headers: response.headers
      };

    } catch (error) {
      console.error(`❌ HTTPClient: Error en ${requestOptions.method} ${url}:`, error);
      
      return {
        success: false,
        error: error.message,
        status: error.status || null,
        originalError: error
      };
    }
  }

  /**
   * Métodos de conveniencia para verbos HTTP
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { 
      ...options, 
      method: 'POST', 
      body 
    });
  }

  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { 
      ...options, 
      method: 'PUT', 
      body 
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Petición con timeout
   */
  async _makeRequestWithTimeout(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Timeout: La petición tardó más de ${this.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Crear error HTTP personalizado
   */
  _createHTTPError(response, data) {
    const message = data?.frontendMessage 
      || data?.message 
      || `Error HTTP ${response.status}: ${response.statusText}`;
    
    const error = new Error(message);
    error.status = response.status;
    error.statusText = response.statusText;
    error.data = data;
    
    return error;
  }

  /**
   * Configurar headers globales
   */
  setDefaultHeaders(headers) {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * Cambiar URL base
   */
  setBaseURL(baseURL) {
    this.baseURL = baseURL;
  }
}

/**
 * APIService - Servicio específico para la API de productos
 * Utiliza HTTPClient como base y añade métodos específicos del dominio
 */
export class ProductAPIService {
  constructor(config = {}) {
    this.httpClient = new HTTPClient(config);
  }

  /**
   * Obtener categorías válidas
   */
  async getValidCategories() {
    console.log('🔍 ProductAPI: Obteniendo categorías válidas...');
    
    const result = await this.httpClient.get('/api/categorias/names');
    
    if (result.success) {
      return {
        success: true,
        categories: result.data.data || [],
        message: 'Categorías obtenidas correctamente'
      };
    }
    
    return {
      success: false,
      error: result.error,
      categories: []
    };
  }

  /**
   * Importar productos a la base de datos
   */
  async importProducts(products, options = {}) {
    console.log(`📡 ProductAPI: Importando ${products.length} productos...`);
    
    const requestBody = {
      productos: products,
      replaceAll: options.replaceAll || true,
      ...options
    };

    const result = await this.httpClient.post('/api/productos/import', requestBody);
    
    if (result.success) {
      return {
        success: true,
        imported: result.data.imported || 0,
        message: result.data.frontendMessage || 'Productos importados correctamente',
        data: result.data
      };
    }
    
    return {
      success: false,
      error: result.error,
      imported: 0
    };
  }

  /**
   * ✅ CORREGIDO: Buscar producto por código exacto usando la nueva ruta
   */
  async findByCode(code) {
    console.log(`🔍 ProductAPI: Buscando producto por código exacto: "${code}"`);
    
    const result = await this.httpClient.get(`/api/productos/search/by-code/${encodeURIComponent(code)}`);
    
    if (result.success) {
      return {
        success: true,
        found: result.data.found || false,
        data: result.data.data || null,
        message: result.data.found ? 'Producto encontrado' : 'Producto no encontrado'
      };
    }
    
    // Si es 404, no es error técnico sino que no existe
    if (result.status === 404) {
      return {
        success: true,
        found: false,
        data: null,
        message: 'Producto no encontrado'
      };
    }
    
    return {
      success: false,
      found: false,
      error: result.error,
      data: null
    };
  }

  /**
   * Crear producto individual
   */
  async createProduct(product) {
    console.log('➕ ProductAPI: Creando producto...');
    
    const result = await this.httpClient.post('/api/productos', product);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: result.data.frontendMessage || 'Producto creado correctamente'
      };
    }
    
    return {
      success: false,
      error: result.error
    };
  }

  /**
   * Actualizar producto existente
   */
  async updateProduct(id, product) {
    console.log(`✏️ ProductAPI: Actualizando producto ${id}...`);
    
    const result = await this.httpClient.put(`/api/productos/${id}`, product);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: result.data.frontendMessage || 'Producto actualizado correctamente'
      };
    }
    
    return {
      success: false,
      error: result.error
    };
  }

  /**
   * Obtener productos con filtros
   */
  async getProducts(filters = {}) {
    console.log('📋 ProductAPI: Obteniendo productos...');
    
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/api/productos${queryParams ? `?${queryParams}` : ''}`;
    
    return this.httpClient.get(endpoint);
  }

  /**
   * Eliminar producto
   */
  async deleteProduct(id) {
    console.log(`🗑️ ProductAPI: Eliminando producto ${id}...`);
    return this.httpClient.delete(`/api/productos/${id}`);
  }
}

/**
 * Factory para crear instancias configuradas
 */
export class APIFactory {
  static createProductAPI(config = {}) {
    return new ProductAPIService(config);
  }

  static createHTTPClient(config = {}) {
    return new HTTPClient(config);
  }

  static createCustomAPI(config = {}) {
    // Para otros servicios que necesiten HTTPClient
    return new HTTPClient(config);
  }
}

/**
 * Instancia global para reutilización (opcional)
 */
export const productAPI = APIFactory.createProductAPI();
export const httpClient = APIFactory.createHTTPClient();