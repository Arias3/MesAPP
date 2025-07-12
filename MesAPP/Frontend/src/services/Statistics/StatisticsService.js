import { statisticsClient } from './StatisticsClient.js';

/**
 * StatisticsService - Servicio para gestión de estadísticas
 */
export class StatisticsService {
  constructor(client = statisticsClient) {
    this.client = client;
    this.categoriesConfig = null; // Cache para configuración de categorías
    this.lastConfigUpdate = null;
  }

  /**
   * Obtener estadísticas generales del inventario
   */
  async getGeneralStatistics() {
    try {
      console.log('📊 StatisticsService: Obteniendo estadísticas generales...');
      
      const response = await this.client.getGeneralStatistics();
      
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('❌ StatisticsService: Error obteniendo estadísticas generales:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Obtener configuración de categorías con cache
   */
  async getCategoriesConfig(forceRefresh = false) {
    try {
      // Si tenemos cache y no se fuerza refresh, usar cache
      if (this.categoriesConfig && !forceRefresh && this.lastConfigUpdate) {
        const timeSinceUpdate = Date.now() - this.lastConfigUpdate;
        const cacheValidTime = 5 * 60 * 1000; // 5 minutos
        
        if (timeSinceUpdate < cacheValidTime) {
          console.log('💾 StatisticsService: Usando configuración desde cache');
          return {
            success: true,
            data: this.categoriesConfig,
            cached: true,
            message: 'Configuración obtenida desde cache'
          };
        }
      }

      console.log('📊 StatisticsService: Obteniendo configuración de categorías...');
      
      const response = await this.client.getCategoriesConfig();
      
      // Guardar en cache
      this.categoriesConfig = response.data;
      this.lastConfigUpdate = Date.now();
      
      console.log('✅ StatisticsService: Configuración obtenida y guardada en cache');
      console.log('📋 StatisticsService: Total categorías:', response.total);
      
      return {
        success: true,
        data: response.data,
        cached: false,
        total: response.total,
        message: response.message
      };
    } catch (error) {
      console.error('❌ StatisticsService: Error obteniendo configuración de categorías:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Obtener estadísticas por categoría
   */
  async getStatisticsByCategory() {
    try {
      console.log('📊 StatisticsService: Obteniendo estadísticas por categoría...');
      
      const response = await this.client.getStatisticsByCategory();
      
      return {
        success: true,
        data: response.data,
        total: response.total,
        message: response.message
      };
    } catch (error) {
      console.error('❌ StatisticsService: Error obteniendo estadísticas por categoría:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Obtener estado de stock de un producto basado en su categoría
   * Esta es la función clave que reemplaza getStockStatus estático
   */
  async getStockStatus(stock, category) {
    try {
      // Obtener configuración de categorías
      const configResult = await this.getCategoriesConfig();
      
      if (!configResult.success || !configResult.data.config) {
        console.warn('⚠️ StatisticsService: No se pudo obtener configuración, usando valores por defecto');
        // Fallback a lógica original
        if (stock === 0) return "Sin Stock";
        if (stock < 10) return "Bajo Stock";
        return "Normal";
      }

      const categoryConfig = configResult.data.config[category];
      
      if (!categoryConfig) {
        console.warn(`⚠️ StatisticsService: Categoría "${category}" no encontrada en configuración`);
        // Fallback a lógica original
        if (stock === 0) return "Sin Stock";
        if (stock < 10) return "Bajo Stock";
        return "Normal";
      }

      // Lógica dinámica basada en low_stock de la categoría
      if (stock === 0) return "Sin Stock";
      if (stock > 0 && stock <= categoryConfig.low_stock) return "Bajo Stock";
      return "Normal";

    } catch (error) {
      console.error('❌ StatisticsService: Error calculando estado de stock:', error.message);
      // Fallback a lógica original en caso de error
      if (stock === 0) return "Sin Stock";
      if (stock < 10) return "Bajo Stock";
      return "Normal";
    }
  }

  /**
   * Función helper para obtener estado de stock de múltiples productos
   * Optimizada para procesar lotes sin múltiples peticiones
   */
  async getMultipleStockStatus(products) {
    try {
      console.log('📊 StatisticsService: Calculando estado de stock para múltiples productos...');
      
      // Obtener configuración una sola vez
      const configResult = await this.getCategoriesConfig();
      
      if (!configResult.success || !configResult.data.config) {
        console.warn('⚠️ StatisticsService: Usando valores por defecto para todos los productos');
        return products.map(product => ({
          ...product,
          stockStatus: this._getDefaultStockStatus(product.stock)
        }));
      }

      const config = configResult.data.config;
      
      // Procesar todos los productos con la configuración
      const productsWithStatus = products.map(product => {
        const categoryConfig = config[product.category];
        let stockStatus;

        if (!categoryConfig) {
          console.warn(`⚠️ StatisticsService: Categoría "${product.category}" no encontrada`);
          stockStatus = this._getDefaultStockStatus(product.stock);
        } else {
          if (product.stock === 0) {
            stockStatus = "Sin Stock";
          } else if (product.stock > 0 && product.stock <= categoryConfig.low_stock) {
            stockStatus = "Bajo Stock";
          } else {
            stockStatus = "Normal";
          }
        }

        return {
          ...product,
          stockStatus: stockStatus
        };
      });

      console.log('✅ StatisticsService: Estados de stock calculados para', products.length, 'productos');
      return productsWithStatus;

    } catch (error) {
      console.error('❌ StatisticsService: Error calculando estados múltiples:', error.message);
      // Fallback: devolver productos con estados por defecto
      return products.map(product => ({
        ...product,
        stockStatus: this._getDefaultStockStatus(product.stock)
      }));
    }
  }

  /**
   * Función helper privada para estado de stock por defecto (fallback)
   */
  _getDefaultStockStatus(stock) {
    if (stock === 0) return "Sin Stock";
    if (stock < 10) return "Bajo Stock";
    return "Normal";
  }

  /**
   * Limpiar cache de configuración
   */
  clearCache() {
    console.log('🧹 StatisticsService: Limpiando cache de configuración...');
    this.categoriesConfig = null;
    this.lastConfigUpdate = null;
  }

  /**
   * Verificar si el cache es válido
   */
  isCacheValid() {
    if (!this.categoriesConfig || !this.lastConfigUpdate) return false;
    
    const timeSinceUpdate = Date.now() - this.lastConfigUpdate;
    const cacheValidTime = 5 * 60 * 1000; // 5 minutos
    
    return timeSinceUpdate < cacheValidTime;
  }
}

// Instancia por defecto
export const statisticsService = new StatisticsService();

export default StatisticsService;