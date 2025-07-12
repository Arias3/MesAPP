import { httpClient } from './../Category/CategoryClient';

/**
 * FlavorClient - Cliente HTTP para operaciones de sabores
 * Maneja la comunicación directa con las APIs de sabores
 */
export class FlavorClient {
  constructor(client = httpClient) {
    this.client = client;
  }

  /**
   * Obtener todos los sabores
   */
  async getAllFlavors() {
    try {
      console.log('🔄 FlavorClient: Obteniendo todos los sabores...');
      
      const response = await this.client.get('/api/helados/sabores/all');
      
      console.log('📥 FlavorClient: Sabores obtenidos:', response);
      return {
        success: true,
        data: response || [],
        total: response?.length || 0
      };
    } catch (error) {
      console.error('❌ FlavorClient: Error obteniendo sabores:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Crear nuevo sabor
   */
  async createFlavor(flavorData) {
    try {
      console.log('🔄 FlavorClient: Creando sabor:', flavorData);
      
      const response = await this.client.post('/api/helados/sabores', flavorData);
      
      console.log('📥 FlavorClient: Sabor creado:', response);
      return {
        success: true,
        data: response,
        message: 'Sabor creado exitosamente'
      };
    } catch (error) {
      console.error('❌ FlavorClient: Error creando sabor:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Actualizar nombre de sabor
   */
  async updateFlavorName(id, name) {
    try {
      console.log(`🔄 FlavorClient: Actualizando nombre de sabor ID ${id}:`, name);
      
      const response = await this.client.put(`/api/helados/sabores/${id}`, { name });
      
      console.log('📥 FlavorClient: Nombre actualizado:', response);
      return {
        success: true,
        data: response,
        message: 'Nombre actualizado exitosamente'
      };
    } catch (error) {
      console.error('❌ FlavorClient: Error actualizando nombre:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Actualizar estado de sabor
   */
  async updateFlavorStatus(id, status) {
    try {
      console.log(`🔄 FlavorClient: Actualizando estado de sabor ID ${id}:`, status);
      
      const response = await this.client.put(`/api/helados/sabores/${id}/status`, { status });
      
      console.log('📥 FlavorClient: Estado actualizado:', response);
      return {
        success: true,
        data: response,
        message: 'Estado actualizado exitosamente'
      };
    } catch (error) {
      console.error('❌ FlavorClient: Error actualizando estado:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Eliminar sabor
   */
  async deleteFlavor(id) {
    try {
      console.log(`🔄 FlavorClient: Eliminando sabor ID: ${id}`);
      
      const response = await this.client.delete(`/api/helados/sabores/${id}`);
      
      console.log('📥 FlavorClient: Sabor eliminado:', response);
      return {
        success: true,
        data: response,
        message: 'Sabor eliminado exitosamente'
      };
    } catch (error) {
      console.error('❌ FlavorClient: Error eliminando sabor:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Asociar sabor con categorías
   */
  async associateFlavorWithCategories(flavorId, categoryIds) {
    try {
      console.log(`🔄 FlavorClient: Asociando sabor ${flavorId} con categorías:`, categoryIds);
      
      const response = await this.client.post(`/api/helados/sabores/${flavorId}/categorias`, {
        categoryIds
      });
      
      console.log('📥 FlavorClient: Asociación realizada:', response);
      return {
        success: true,
        data: response,
        message: 'Categorías asociadas exitosamente'
      };
    } catch (error) {
      console.error('❌ FlavorClient: Error asociando categorías:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener categorías de un sabor
   */
  async getFlavorCategories(flavorId) {
    try {
      console.log(`🔄 FlavorClient: Obteniendo categorías del sabor ID: ${flavorId}`);
      
      const response = await this.client.get(`/api/helados/sabores/${flavorId}/categorias`);
      
      console.log('📥 FlavorClient: Categorías obtenidas:', response);
      return {
        success: true,
        data: response || [],
        total: response?.length || 0
      };
    } catch (error) {
      console.error('❌ FlavorClient: Error obteniendo categorías:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Obtener sabores de una categoría
   */
  async getCategoryFlavors(categoryId) {
    try {
      console.log(`🔄 FlavorClient: Obteniendo sabores de categoría ID: ${categoryId}`);
      
      const response = await this.client.get(`/api/helados/categorias/${categoryId}/sabores`);
      
      console.log('📥 FlavorClient: Sabores obtenidos:', response);
      return {
        success: true,
        data: response || [],
        total: response?.length || 0
      };
    } catch (error) {
      console.error('❌ FlavorClient: Error obteniendo sabores de categoría:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Remover asociación específica
   */
  async removeFlavorCategoryAssociation(flavorId, categoryId) {
    try {
      console.log(`🔄 FlavorClient: Removiendo asociación sabor ${flavorId} - categoría ${categoryId}`);
      
      const response = await this.client.delete(`/api/helados/sabores/${flavorId}/categorias/${categoryId}`);
      
      console.log('📥 FlavorClient: Asociación removida:', response);
      return {
        success: true,
        data: response,
        message: 'Asociación removida exitosamente'
      };
    } catch (error) {
      console.error('❌ FlavorClient: Error removiendo asociación:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Instancia por defecto
export const flavorClient = new FlavorClient();

export default FlavorClient;