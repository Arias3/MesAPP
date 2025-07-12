/**
 * HttpClient - Cliente HTTP súper simple
 */
export class HttpClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || `http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}`;
    console.log(`🌐 HttpClient: URL base: ${this.baseURL}`);
  }

  /**
   * Realizar petición HTTP básica
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Agregar body si existe
    if (options.body) {
      requestOptions.body = JSON.stringify(options.body);
    }

    console.log(`🌐 ${requestOptions.method} ${url}`);
    if (options.body) {
      console.log('📤 Body:', options.body);
    }

    try {
      const response = await fetch(url, requestOptions);
      const data = await response.json();

      console.log(`📥 Response ${response.status}:`, data);

      if (!response.ok) {
        throw new Error(data.error || data.message || `Error ${response.status}`);
      }

      return data;

    } catch (error) {
      console.error(`❌ Error en ${requestOptions.method} ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Métodos básicos
   */
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  }

  async put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Instancia por defecto
export const httpClient = new HttpClient();

export default HttpClient;