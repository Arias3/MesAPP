import { httpClient } from './CategoryClient.js';

/**
 * CategoryService - Servicio súper simple para categorías
 */
export class CategoryService {
  constructor(client = httpClient) {
    this.client = client;
  }

  /**
   * Obtener todas las categorías
   */
  async getAllCategories() {
    try {
      console.log('🔄 CategoryService: Obteniendo categorías...');
      
      const response = await this.client.get('/api/categorias');
      
      return {
        success: true,
        data: response.data || [],
        total: response.total || 0,
        message: response.message
      };
    } catch (error) {
      console.error('❌ CategoryService: Error obteniendo categorías:', error.message);
      
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Crear nueva categoría
   */
  async createCategory(categoryData) {
    try {
      console.log('🔄 CategoryService: Creando categoría:', categoryData);
      
      // Validación básica
      if (!categoryData.categoria || categoryData.categoria.trim() === '') {
        throw new Error('El nombre de la categoría es obligatorio');
      }
      
      if (categoryData.low_stock === '' || categoryData.low_stock === null || categoryData.low_stock === undefined || isNaN(parseInt(categoryData.low_stock))) {
        throw new Error('El valor de stock bajo es obligatorio y debe ser un número válido');
      }
      
      const lowStock = parseInt(categoryData.low_stock,10);
      
      const dataToSend = {
        categoria: categoryData.categoria.trim(),
        low_stock: lowStock
      };
      
      console.log('📤 CategoryService: Enviando:', dataToSend);
      
      const response = await this.client.post('/api/categorias', dataToSend);
      
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('❌ CategoryService: Error creando categoría:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Actualizar categoría
   */
  async updateCategory(id, categoryData) {
    try {
      console.log('🔄 CategoryService: Actualizando categoría ID:', id, 'con:', categoryData);
      
      // Validación básica
      if (!categoryData.categoria || categoryData.categoria.trim() === '') {
        throw new Error('El nombre de la categoría es obligatorio');
      }
      
      if (categoryData.low_stock === '' || categoryData.low_stock === null || categoryData.low_stock === undefined || isNaN(parseInt(categoryData.low_stock))) {
        throw new Error('El valor de stock bajo es obligatorio y debe ser un número válido');
      }
      
      const lowStock = parseInt(categoryData.low_stock,10);
      const activo = categoryData.activo === true || categoryData.activo === 'true' || categoryData.activo === 1;
      
      const dataToSend = {
        categoria: categoryData.categoria.trim(),
        activo: activo,
        low_stock: lowStock
      };
      
      console.log('📤 CategoryService: Enviando:', dataToSend);
      
      const response = await this.client.put(`/api/categorias/${id}`, dataToSend);
      
      return {
        success: true,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('❌ CategoryService: Error actualizando categoría:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Eliminar categoría permanentemente
   */
  async deleteCategory(id) {
    try {
      console.log('🔄 CategoryService: Eliminando categoría ID:', id);
      
      const response = await this.client.delete(`/api/categorias/${id}`);
      
      return {
        success: true,
        message: response.message
      };
    } catch (error) {
      console.error('❌ CategoryService: Error eliminando categoría:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Instancia por defecto
export const categoryService = new CategoryService();

export default CategoryService;