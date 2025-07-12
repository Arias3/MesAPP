/**
 * StatisticsClient - Cliente HTTP específico para estadísticas
 */
export class StatisticsClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || `http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}`;
    console.log(`📊 StatisticsClient: URL base: ${this.baseURL}`);
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

    console.log(`📊 StatisticsClient: ${requestOptions.method} ${url}`);
    if (options.body) {
      console.log('📤 StatisticsClient Body:', options.body);
    }

    try {
      const response = await fetch(url, requestOptions);
      const data = await response.json();

      console.log(`📥 StatisticsClient Response ${response.status}:`, data);

      if (!response.ok) {
        throw new Error(data.error || data.message || `Error ${response.status}`);
      }

      return data;

    } catch (error) {
      console.error(`❌ StatisticsClient Error en ${requestOptions.method} ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Obtener estadísticas generales del inventario
   */
  async getGeneralStatistics() {
    return this.request('/api/estadisticas', { method: 'GET' });
  }

  /**
   * Obtener configuración de categorías (low_stock por categoría)
   */
  async getCategoriesConfig() {
    return this.request('/api/estadisticas/categorias-config', { method: 'GET' });
  }

  /**
   * Obtener estadísticas detalladas por categoría
   */
  async getStatisticsByCategory() {
    return this.request('/api/estadisticas/por-categoria', { method: 'GET' });
  }

  /**
   * Método básico GET
   */
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }
}

// Instancia por defecto
export const statisticsClient = new StatisticsClient();

export default StatisticsClient;