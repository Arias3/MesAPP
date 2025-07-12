import { flavorService } from './FlavorService.js';
import { categoryService } from './../Category/CategoryService.js';

/**
 * FlavorCategoryService - Servicio especializado para gestión de relaciones entre sabores y categorías
 * Maneja operaciones complejas que involucran ambas entidades
 */
export class FlavorCategoryService {
  constructor(flavorSvc = flavorService, categorySvc = categoryService) {
    this.flavorService = flavorSvc;
    this.categoryService = categorySvc;
  }

  /**
   * Obtener todos los sabores con sus categorías asociadas
   */
  async getFlavorsWithCategories() {
    try {
      console.log('🔄 FlavorCategoryService: Obteniendo sabores con categorías...');
      
      // Obtener todos los sabores
      const flavorsResult = await this.flavorService.getAllFlavors();
      if (!flavorsResult.success) {
        throw new Error(flavorsResult.error);
      }

      // Para cada sabor, obtener sus categorías
      const flavorsWithCategories = [];
      for (const flavor of flavorsResult.data) {
        const categoriesResult = await this.flavorService.getFlavorCategories(flavor.id);
        
        flavorsWithCategories.push({
          ...flavor,
          categories: categoriesResult.success ? categoriesResult.data : []
        });
      }

      return {
        success: true,
        data: flavorsWithCategories,
        total: flavorsWithCategories.length,
        message: `${flavorsWithCategories.length} sabores obtenidos con sus categorías`
      };
    } catch (error) {
      console.error('❌ FlavorCategoryService: Error obteniendo sabores con categorías:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Obtener todas las categorías con sus sabores asociados
   */
  async getCategoriesWithFlavors() {
    try {
      console.log('🔄 FlavorCategoryService: Obteniendo categorías con sabores...');
      
      // Obtener todas las categorías activas
      const categoriesResult = await this.categoryService.getAllCategories();
      if (!categoriesResult.success) {
        throw new Error(categoriesResult.error);
      }

      // Para cada categoría, obtener sus sabores
      const categoriesWithFlavors = [];
      for (const category of categoriesResult.data) {
        const flavorsResult = await this.flavorService.getCategoryFlavors(category.id);
        
        categoriesWithFlavors.push({
          ...category,
          flavors: flavorsResult.success ? flavorsResult.data : []
        });
      }

      return {
        success: true,
        data: categoriesWithFlavors,
        total: categoriesWithFlavors.length,
        message: `${categoriesWithFlavors.length} categorías obtenidas con sus sabores`
      };
    } catch (error) {
      console.error('❌ FlavorCategoryService: Error obteniendo categorías con sabores:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Crear sabor y asociarlo inmediatamente con categorías
   */
  async createFlavorWithCategories(flavorData, categoryIds) {
    try {
      console.log('🔄 FlavorCategoryService: Creando sabor con categorías:', { flavorData, categoryIds });
      
      // Validaciones
      if (!flavorData || !flavorData.name) {
        throw new Error('Datos del sabor incompletos');
      }

      if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new Error('Debe seleccionar al menos una categoría');
      }

      // Validar que las categorías existan y estén activas
      const validationResult = await this.validateCategories(categoryIds);
      if (!validationResult.success) {
        throw new Error(validationResult.error);
      }

      // Crear el sabor
      const flavorResult = await this.flavorService.createFlavor(flavorData);
      if (!flavorResult.success) {
        throw new Error(flavorResult.error);
      }

      // Obtener el ID del sabor creado (necesitamos implementar esto en el backend)
      // Por ahora, obtenemos todos los sabores y buscamos el último creado
      const allFlavorsResult = await this.flavorService.getAllFlavors();
      if (!allFlavorsResult.success) {
        throw new Error('Error obteniendo sabor creado');
      }

      // Buscar el sabor por nombre (asumiendo que es único)
      const createdFlavor = allFlavorsResult.data.find(f => f.name === flavorData.name.trim());
      if (!createdFlavor) {
        throw new Error('No se pudo encontrar el sabor creado');
      }

      // Asociar con categorías
      const associationResult = await this.flavorService.associateFlavorWithCategories(
        createdFlavor.id, 
        categoryIds
      );

      if (!associationResult.success) {
        console.warn('⚠️ Sabor creado pero error asociando categorías:', associationResult.error);
      }

      return {
        success: true,
        data: {
          flavor: createdFlavor,
          categoriesAssociated: associationResult.success
        },
        message: `Sabor "${flavorData.name}" creado y asociado con ${categoryIds.length} categorías`
      };
    } catch (error) {
      console.error('❌ FlavorCategoryService: Error creando sabor con categorías:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validar que las categorías existan y estén activas
   */
  async validateCategories(categoryIds) {
    try {
      console.log('🔄 FlavorCategoryService: Validando categorías:', categoryIds);
      
      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new Error('Lista de categorías inválida');
      }

      // Obtener todas las categorías
      const categoriesResult = await this.categoryService.getAllCategories();
      if (!categoriesResult.success) {
        throw new Error('Error obteniendo categorías');
      }

      const existingCategories = categoriesResult.data;
      const invalidCategories = [];
      const inactiveCategories = [];

      for (const categoryId of categoryIds) {
        const category = existingCategories.find(c => c.id === parseInt(categoryId));
        
        if (!category) {
          invalidCategories.push(categoryId);
        } else if (!category.activo) {
          inactiveCategories.push(category.categoria);
        }
      }

      if (invalidCategories.length > 0) {
        throw new Error(`Categorías no encontradas: ${invalidCategories.join(', ')}`);
      }

      if (inactiveCategories.length > 0) {
        throw new Error(`Categorías inactivas: ${inactiveCategories.join(', ')}`);
      }

      return {
        success: true,
        message: 'Todas las categorías son válidas'
      };
    } catch (error) {
      console.error('❌ FlavorCategoryService: Error validando categorías:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener resumen de asociaciones (estadísticas)
   */
  async getAssociationSummary() {
    try {
      console.log('🔄 FlavorCategoryService: Generando resumen de asociaciones...');
      
      // Obtener sabores con categorías
      const flavorsResult = await this.getFlavorsWithCategories();
      if (!flavorsResult.success) {
        throw new Error(flavorsResult.error);
      }

      // Obtener categorías con sabores
      const categoriesResult = await this.getCategoriesWithFlavors();
      if (!categoriesResult.success) {
        throw new Error(categoriesResult.error);
      }

      const flavors = flavorsResult.data;
      const categories = categoriesResult.data;

      // Calcular estadísticas
      const totalFlavors = flavors.length;
      const totalCategories = categories.length;
      const flavorsWithCategories = flavors.filter(f => f.categories.length > 0).length;
      const flavorsWithoutCategories = totalFlavors - flavorsWithCategories;
      const categoriesWithFlavors = categories.filter(c => c.flavors.length > 0).length;
      const categoriesWithoutFlavors = totalCategories - categoriesWithFlavors;

      // Sabor con más categorías
      const flavorWithMostCategories = flavors.reduce((prev, current) => 
        (current.categories.length > prev.categories.length) ? current : prev
      );

      // Categoría con más sabores
      const categoryWithMostFlavors = categories.reduce((prev, current) => 
        (current.flavors.length > prev.flavors.length) ? current : prev
      );

      const summary = {
        totals: {
          flavors: totalFlavors,
          categories: totalCategories,
          associations: flavors.reduce((sum, f) => sum + f.categories.length, 0)
        },
        flavors: {
          withCategories: flavorsWithCategories,
          withoutCategories: flavorsWithoutCategories,
          withMostCategories: {
            name: flavorWithMostCategories.name,
            count: flavorWithMostCategories.categories.length
          }
        },
        categories: {
          withFlavors: categoriesWithFlavors,
          withoutFlavors: categoriesWithoutFlavors,
          withMostFlavors: {
            name: categoryWithMostFlavors.categoria,
            count: categoryWithMostFlavors.flavors.length
          }
        }
      };

      return {
        success: true,
        data: summary,
        message: 'Resumen generado exitosamente'
      };
    } catch (error) {
      console.error('❌ FlavorCategoryService: Error generando resumen:', error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Duplicar asociaciones de un sabor a otro
   */
  async duplicateFlavorAssociations(sourceFlavor, targetFlavor) {
    try {
      console.log('🔄 FlavorCategoryService: Duplicando asociaciones:', { sourceFlavor, targetFlavor });
      
      // Validaciones
      if (!sourceFlavor || !targetFlavor) {
        throw new Error('IDs de sabores requeridos');
      }

      if (sourceFlavor === targetFlavor) {
        throw new Error('No se puede duplicar asociaciones del mismo sabor');
      }

      // Obtener categorías del sabor origen
      const categoriesResult = await this.flavorService.getFlavorCategories(sourceFlavor);
      if (!categoriesResult.success) {
        throw new Error(categoriesResult.error);
      }

      if (categoriesResult.data.length === 0) {
        throw new Error('El sabor origen no tiene categorías asociadas');
      }

      // Extraer IDs de categorías
      const categoryIds = categoriesResult.data.map(c => c.id);

      // Asociar al sabor destino
      const associationResult = await this.flavorService.associateFlavorWithCategories(
        targetFlavor, 
        categoryIds
      );

      if (!associationResult.success) {
        throw new Error(associationResult.error);
      }

      return {
        success: true,
        data: {
          categoriesDuplicated: categoryIds.length,
          categoryIds: categoryIds
        },
        message: `${categoryIds.length} asociaciones duplicadas exitosamente`
      };
    } catch (error) {
      console.error('❌ FlavorCategoryService: Error duplicando asociaciones:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generar JSON de categorías con sabores (para exportar)
   */
  async generateCategoriesJSON() {
    try {
      console.log('🔄 FlavorCategoryService: Generando JSON de categorías...');
      
      const categoriesResult = await this.getCategoriesWithFlavors();
      if (!categoriesResult.success) {
        throw new Error(categoriesResult.error);
      }

      // Filtrar solo categorías activas con sabores activos
      const activeCategories = categoriesResult.data
        .filter(category => category.activo)
        .map(category => ({
          id: category.id,
          name: category.categoria,
          flavors: category.flavors
            .filter(flavor => flavor.status === 1)
            .map(flavor => ({
              id: flavor.id,
              name: flavor.name
            }))
        }))
        .filter(category => category.flavors.length > 0);

      const jsonData = {
        categories: activeCategories,
        generatedAt: new Date().toISOString(),
        totalCategories: activeCategories.length,
        totalFlavors: activeCategories.reduce((sum, cat) => sum + cat.flavors.length, 0)
      };

      return {
        success: true,
        data: jsonData,
        message: `JSON generado con ${activeCategories.length} categorías`
      };
    } catch (error) {
      console.error('❌ FlavorCategoryService: Error generando JSON:', error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
}

// Instancia por defecto
export const flavorCategoryService = new FlavorCategoryService();

export default FlavorCategoryService;