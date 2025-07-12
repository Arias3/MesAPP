const pool = require('../db/pool');
const { EventEmitter } = require('events');

/**
 * CategoryManager - Gestor completo de categorías con integración de carpetas
 * Maneja CRUD de categorías en BD + operaciones de carpetas automáticas
 */
class CategoryManager extends EventEmitter {
  constructor() {
    super();
    this.initializeEvents();
  }

  /**
   * Configurar eventos internos
   */
  initializeEvents() {
    this.on('categoryCreated', (category) => {
      console.log(`🎉 CategoryManager: Evento categoryCreated para "${category.categoria}"`);
    });

    this.on('categoryUpdated', (oldCategory, newCategory) => {
      console.log(`🔄 CategoryManager: Evento categoryUpdated: "${oldCategory.categoria}" → "${newCategory.categoria}"`);
    });

    this.on('categoryDeleted', (category) => {
      console.log(`🗑️  CategoryManager: Evento categoryDeleted para "${category.categoria}"`);
    });

    this.on('folderOperationComplete', (operation) => {
      console.log(`📁 CategoryManager: Operación de carpeta completada: ${operation.action}`);
    });
  }

  /**
   * Obtener todas las categorías
   */
  async getAllCategories() {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM categories ORDER BY categoria ASC'
      );
      
      return {
        success: true,
        data: rows,
        total: rows.length
      };
    } catch (error) {
      console.error('❌ CategoryManager: Error obteniendo categorías:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Obtener solo categorías activas
   */
  async getActiveCategories() {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM categories WHERE activo = true ORDER BY categoria ASC'
      );
      
      return {
        success: true,
        data: rows,
        total: rows.length
      };
    } catch (error) {
      console.error('❌ CategoryManager: Error obteniendo categorías activas:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Obtener nombres de categorías activas
   */
  async getActiveCategoryNames() {
    try {
      const [rows] = await pool.execute(
        'SELECT categoria FROM categories WHERE activo = true ORDER BY categoria ASC'
      );
      
      const names = rows.map(row => row.categoria);
      
      return {
        success: true,
        data: names,
        total: names.length
      };
    } catch (error) {
      console.error('❌ CategoryManager: Error obteniendo nombres de categorías:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Validar si una categoría existe y está activa
   */
  async validateCategory(categoryName) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM categories WHERE categoria = ? AND activo = true',
        [categoryName]
      );
      
      return {
        success: true,
        valid: rows.length > 0,
        exists: rows.length > 0,
        category: rows[0] || null
      };
    } catch (error) {
      console.error('❌ CategoryManager: Error validando categoría:', error);
      return {
        success: false,
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Crear nueva categoría con carpeta automática
   */
  async createCategory(categoryData) {
    try {
      const { categoria, activo = true } = categoryData;
      
      // Validaciones
      if (!categoria || categoria.trim() === '') {
        return {
          success: false,
          error: 'El nombre de la categoría es obligatorio'
        };
      }

      const trimmedCategoria = categoria.trim();

      // Verificar si ya existe
      const [existing] = await pool.execute(
        'SELECT * FROM categories WHERE categoria = ?',
        [trimmedCategoria]
      );

      if (existing.length > 0) {
        return {
          success: false,
          error: 'Ya existe una categoría con ese nombre'
        };
      }

      // Crear en base de datos
      const [result] = await pool.execute(
        'INSERT INTO categories (categoria, activo) VALUES (?, ?)',
        [trimmedCategoria, activo]
      );

      // Obtener categoría creada
      const [newCategory] = await pool.execute(
        'SELECT * FROM categories WHERE id = ?',
        [result.insertId]
      );

      const categoryObj = newCategory[0];

      // Crear carpeta automáticamente si está activa
      let folderResult = { success: true, action: 'skipped' };
      if (activo) {
        const folderPath = fileSystemManager.getCategoryFolderPath(trimmedCategoria);
        folderResult = await fileSystemManager.createFolder(folderPath);
        
        // Emitir evento de operación de carpeta
        this.emit('folderOperationComplete', {
          action: 'create',
          category: trimmedCategoria,
          result: folderResult
        });
      }

      // Emitir evento de categoría creada
      this.emit('categoryCreated', categoryObj);

      return {
        success: true,
        data: categoryObj,
        folderOperation: folderResult,
        message: `Categoría "${trimmedCategoria}" creada exitosamente`
      };

    } catch (error) {
      console.error('❌ CategoryManager: Error creando categoría:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Actualizar categoría existente con gestión de carpetas
   */
  async updateCategory(categoryId, updateData) {
    try {
      const { categoria, activo } = updateData;

      // Obtener categoría actual
      const [existing] = await pool.execute(
        'SELECT * FROM categories WHERE id = ?',
        [categoryId]
      );

      if (existing.length === 0) {
        return {
          success: false,
          error: 'Categoría no encontrada'
        };
      }

      const oldCategory = existing[0];

      // Actualizar en base de datos
      await pool.execute(
        'UPDATE categories SET categoria = ?, activo = ? WHERE id = ?',
        [categoria, activo, categoryId]
      );

      // Obtener categoría actualizada
      const [updated] = await pool.execute(
        'SELECT * FROM categories WHERE id = ?',
        [categoryId]
      );

      const newCategory = updated[0];

      // Gestionar cambios en carpetas
      let folderResult = { success: true, action: 'no_change' };

      if (oldCategory.activo && !activo) {
        // Categoría desactivada → eliminar carpeta
        const folderPath = fileSystemManager.getCategoryFolderPath(oldCategory.categoria);
        folderResult = await fileSystemManager.deleteFolder(folderPath);
        
      } else if (!oldCategory.activo && activo) {
        // Categoría activada → crear carpeta
        const folderPath = fileSystemManager.getCategoryFolderPath(categoria);
        folderResult = await fileSystemManager.createFolder(folderPath);
        
      } else if (oldCategory.activo && activo && oldCategory.categoria !== categoria) {
        // Nombre cambiado y sigue activa → renombrar carpeta
        const oldFolderPath = fileSystemManager.getCategoryFolderPath(oldCategory.categoria);
        const newFolderPath = fileSystemManager.getCategoryFolderPath(categoria);
        folderResult = await fileSystemManager.renameFolder(oldFolderPath, newFolderPath);
      }

      // Emitir eventos
      this.emit('folderOperationComplete', {
        action: 'update',
        oldCategory: oldCategory.categoria,
        newCategory: categoria,
        result: folderResult
      });

      this.emit('categoryUpdated', oldCategory, newCategory);

      return {
        success: true,
        data: newCategory,
        folderOperation: folderResult,
        message: `Categoría actualizada exitosamente`
      };

    } catch (error) {
      console.error('❌ CategoryManager: Error actualizando categoría:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return {
          success: false,
          error: 'Ya existe una categoría con ese nombre'
        };
      }
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Desactivar categoría (soft delete)
   */
  async deactivateCategory(categoryId) {
    try {
      // Obtener categoría actual
      const [existing] = await pool.execute(
        'SELECT * FROM categories WHERE id = ?',
        [categoryId]
      );

      if (existing.length === 0) {
        return {
          success: false,
          error: 'Categoría no encontrada'
        };
      }

      const category = existing[0];

      // Desactivar en base de datos
      await pool.execute(
        'UPDATE categories SET activo = false WHERE id = ?',
        [categoryId]
      );

      // Eliminar carpeta
      const folderPath = fileSystemManager.getCategoryFolderPath(category.categoria);
      const folderResult = await fileSystemManager.deleteFolder(folderPath);

      // Obtener categoría actualizada
      const [updated] = await pool.execute(
        'SELECT * FROM categories WHERE id = ?',
        [categoryId]
      );

      // Emitir eventos
      this.emit('folderOperationComplete', {
        action: 'deactivate',
        category: category.categoria,
        result: folderResult
      });

      return {
        success: true,
        data: updated[0],
        folderOperation: folderResult,
        message: 'Categoría desactivada correctamente'
      };

    } catch (error) {
      console.error('❌ CategoryManager: Error desactivando categoría:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Activar categoría
   */
  async activateCategory(categoryId) {
    try {
      // Obtener categoría actual
      const [existing] = await pool.execute(
        'SELECT * FROM categories WHERE id = ?',
        [categoryId]
      );

      if (existing.length === 0) {
        return {
          success: false,
          error: 'Categoría no encontrada'
        };
      }

      const category = existing[0];

      // Activar en base de datos
      await pool.execute(
        'UPDATE categories SET activo = true WHERE id = ?',
        [categoryId]
      );

      // Crear carpeta
      const folderPath = fileSystemManager.getCategoryFolderPath(category.categoria);
      const folderResult = await fileSystemManager.createFolder(folderPath);

      // Obtener categoría actualizada
      const [updated] = await pool.execute(
        'SELECT * FROM categories WHERE id = ?',
        [categoryId]
      );

      // Emitir eventos
      this.emit('folderOperationComplete', {
        action: 'activate',
        category: category.categoria,
        result: folderResult
      });

      return {
        success: true,
        data: updated[0],
        folderOperation: folderResult,
        message: 'Categoría activada correctamente'
      };

    } catch (error) {
      console.error('❌ CategoryManager: Error activando categoría:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Eliminar categoría permanentemente
   */
  async deleteCategory(categoryId) {
    try {
      // Obtener categoría antes de eliminar
      const [existing] = await pool.execute(
        'SELECT * FROM categories WHERE id = ?',
        [categoryId]
      );

      if (existing.length === 0) {
        return {
          success: false,
          error: 'Categoría no encontrada'
        };
      }

      const category = existing[0];

      // Eliminar carpeta y contenido
      const folderPath = fileSystemManager.getCategoryFolderPath(category.categoria);
      const folderResult = await fileSystemManager.deleteFolder(folderPath);

      // Eliminar de base de datos
      await pool.execute('DELETE FROM categories WHERE id = ?', [categoryId]);

      // Emitir eventos
      this.emit('folderOperationComplete', {
        action: 'delete',
        category: category.categoria,
        result: folderResult
      });

      this.emit('categoryDeleted', category);

      return {
        success: true,
        folderOperation: folderResult,
        message: 'Categoría eliminada permanentemente'
      };

    } catch (error) {
      console.error('❌ CategoryManager: Error eliminando categoría:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new CategoryManager();