import { flavorClient } from './FlavorClient.js';

/**
 * FlavorService - Servicio para gestión de sabores con validaciones y lógica de negocio
 */
export class FlavorService {
  constructor(client = flavorClient) {
    this.client = client;
  }

  /**
   * Obtener todos los sabores
   */
  async getAllFlavors() {
    try {
      console.log('🔄 FlavorService: Obteniendo sabores...');
      
      const result = await this.client.getAllFlavors();
      
      return {
        success: true,
        data: result.data || [],
        total: result.total || 0,
        message: result.message
      };
    } catch (error) {
      console.error('❌ FlavorService: Error obteniendo sabores:', error.message);
      
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
      console.log('🔄 FlavorService: Creando sabor:', flavorData);
      
      // Validación básica
      if (!flavorData.name || flavorData.name.trim() === '') {
        throw new Error('El nombre del sabor es obligatorio');
      }

      // Validar longitud del nombre
      if (flavorData.name.trim().length > 50) {
        throw new Error('El nombre del sabor no puede exceder 50 caracteres');
      }

      const dataToSend = {
        name: flavorData.name.trim()
      };
      
      console.log('📤 FlavorService: Enviando:', dataToSend);
      
      const result = await this.client.createFlavor(dataToSend);
      
      return {
        success: true,
        data: result.data,
        message: result.message || 'Sabor creado exitosamente'
      };
    } catch (error) {
      console.error('❌ FlavorService: Error creando sabor:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Actualizar sabor completo (nombre y estado)
   */
  async updateFlavor(id, flavorData) {
    try {
      console.log('🔄 FlavorService: Actualizando sabor ID:', id, 'con:', flavorData);
      
      // Validar ID
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de sabor inválido');
      }

      // Validación del nombre si se proporciona
      if (flavorData.name !== undefined) {
        if (!flavorData.name || flavorData.name.trim() === '') {
          throw new Error('El nombre del sabor es obligatorio');
        }
        
        if (flavorData.name.trim().length > 50) {
          throw new Error('El nombre del sabor no puede exceder 50 caracteres');
        }
      }

      // Validación del estado si se proporciona
      if (flavorData.status !== undefined) {
        const status = parseInt(flavorData.status , 10);
        if (isNaN(status) || (status !== 0 && status !== 1)) {
          throw new Error('El estado debe ser 0 (inactivo) o 1 (activo)');
        }
      }

      const results = [];

      // Actualizar nombre si se proporciona
      if (flavorData.name !== undefined) {
        const nameResult = await this.client.updateFlavorName(id, flavorData.name.trim());
        if (!nameResult.success) {
          throw new Error(nameResult.error);
        }
        results.push('nombre actualizado');
      }

      // Actualizar estado si se proporciona
      if (flavorData.status !== undefined) {
        const statusResult = await this.client.updateFlavorStatus(id, parseInt(flavorData.status));
        if (!statusResult.success) {
          throw new Error(statusResult.error);
        }
        results.push('estado actualizado');
      }

      return {
        success: true,
        message: `Sabor actualizado: ${results.join(', ')}`
      };
    } catch (error) {
      console.error('❌ FlavorService: Error actualizando sabor:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Actualizar solo el nombre del sabor
   */
  async updateFlavorName(id, name) {
    try {
      console.log(`🔄 FlavorService: Actualizando nombre de sabor ID ${id}:`, name);
      
      // Validaciones
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de sabor inválido');
      }

      if (!name || name.trim() === '') {
        throw new Error('El nombre del sabor es obligatorio');
      }

      if (name.trim().length > 50) {
        throw new Error('El nombre del sabor no puede exceder 50 caracteres');
      }

      const result = await this.client.updateFlavorName(id, name.trim());
      
      return {
        success: true,
        data: result.data,
        message: result.message || 'Nombre actualizado exitosamente'
      };
    } catch (error) {
      console.error('❌ FlavorService: Error actualizando nombre:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Actualizar solo el estado del sabor
   */
  async updateFlavorStatus(id, status) {
    try {
      console.log(`🔄 FlavorService: Actualizando estado de sabor ID ${id}:`, status);
      
      // Validaciones
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de sabor inválido');
      }

      const statusValue = parseInt(status);
      if (isNaN(statusValue) || (statusValue !== 0 && statusValue !== 1)) {
        throw new Error('El estado debe ser 0 (inactivo) o 1 (activo)');
      }

      const result = await this.client.updateFlavorStatus(id, statusValue);
      
      return {
        success: true,
        data: result.data,
        message: result.message || `Sabor ${statusValue === 1 ? 'activado' : 'desactivado'} exitosamente`
      };
    } catch (error) {
      console.error('❌ FlavorService: Error actualizando estado:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Eliminar sabor permanentemente
   */
  async deleteFlavor(id) {
    try {
      console.log('🔄 FlavorService: Eliminando sabor ID:', id);
      
      // Validaciones
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de sabor inválido');
      }

      const result = await this.client.deleteFlavor(id);
      
      return {
        success: true,
        message: result.message || 'Sabor eliminado exitosamente'
      };
    } catch (error) {
      console.error('❌ FlavorService: Error eliminando sabor:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Asociar sabor con múltiples categorías
   */
  async associateFlavorWithCategories(flavorId, categoryIds) {
    try {
      console.log('🔄 FlavorService: Asociando sabor con categorías:', { flavorId, categoryIds });
      
      // Validaciones
      if (!flavorId || isNaN(parseInt(flavorId))) {
        throw new Error('ID de sabor inválido');
      }

      if (!Array.isArray(categoryIds)) {
        throw new Error('categoryIds debe ser un array');
      }

      if (categoryIds.length === 0) {
        throw new Error('Debe seleccionar al menos una categoría');
      }

      // Validar que todos los IDs sean números válidos
      for (const categoryId of categoryIds) {
        if (!categoryId || isNaN(parseInt(categoryId))) {
          throw new Error(`ID de categoría inválido: ${categoryId}`);
        }
      }

      // Remover duplicados
      const uniqueCategoryIds = [...new Set(categoryIds.map(id => parseInt(id)))];

      const result = await this.client.associateFlavorWithCategories(flavorId, uniqueCategoryIds);
      
      return {
        success: true,
        data: result.data,
        message: result.message || `Sabor asociado con ${uniqueCategoryIds.length} categorías`
      };
    } catch (error) {
      console.error('❌ FlavorService: Error asociando categorías:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener categorías asociadas a un sabor
   */
  async getFlavorCategories(flavorId) {
    try {
      console.log('🔄 FlavorService: Obteniendo categorías del sabor:', flavorId);
      
      // Validaciones
      if (!flavorId || isNaN(parseInt(flavorId))) {
        throw new Error('ID de sabor inválido');
      }

      const result = await this.client.getFlavorCategories(flavorId);
      
      return {
        success: true,
        data: result.data || [],
        total: result.total || 0,
        message: `${result.total || 0} categorías encontradas`
      };
    } catch (error) {
      console.error('❌ FlavorService: Error obteniendo categorías:', error.message);
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
      console.log('🔄 FlavorService: Obteniendo sabores de categoría:', categoryId);
      
      // Validaciones
      if (!categoryId || isNaN(parseInt(categoryId))) {
        throw new Error('ID de categoría inválido');
      }

      const result = await this.client.getCategoryFlavors(categoryId);
      
      return {
        success: true,
        data: result.data || [],
        total: result.total || 0,
        message: `${result.total || 0} sabores encontrados`
      };
    } catch (error) {
      console.error('❌ FlavorService: Error obteniendo sabores de categoría:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Remover asociación específica entre sabor y categoría
   */
  async removeFlavorCategoryAssociation(flavorId, categoryId) {
    try {
      console.log('🔄 FlavorService: Removiendo asociación:', { flavorId, categoryId });
      
      // Validaciones
      if (!flavorId || isNaN(parseInt(flavorId))) {
        throw new Error('ID de sabor inválido');
      }

      if (!categoryId || isNaN(parseInt(categoryId))) {
        throw new Error('ID de categoría inválido');
      }

      const result = await this.client.removeFlavorCategoryAssociation(flavorId, categoryId);
      
      return {
        success: true,
        message: result.message || 'Asociación removida exitosamente'
      };
    } catch (error) {
      console.error('❌ FlavorService: Error removiendo asociación:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Instancia por defecto
export const flavorService = new FlavorService();

export default FlavorService;