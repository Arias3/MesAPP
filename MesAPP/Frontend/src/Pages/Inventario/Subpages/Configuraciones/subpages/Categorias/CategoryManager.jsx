import React, { useState, useEffect } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { categoryService } from './../../../../../../services/Category/CategoryService';
import { ConfirmationModal } from './../../../../../../components/Inventario/Modals/Confirmaciones/ConfirmationModal';
import { CreateCategoryButton } from './../../../../../../components/Inventario/button/Category/CreateCategoryButton';
import TableInfoBar from './../../../../../../components/Inventario/Helpers/BarCreation/Table/TableInfoBar';
import Pagination from './../../../../../../components/Inventario/button/Pagination/Pagination';
import './CategoryManager.css';

/**
 * CategoryManager - Componente para gestión de categorías con tabla paginada
 */
export const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const categoriesPerPage = 8; // Fijo en 8 elementos por página
  
  // Formulario para editar
  const [editing, setEditing] = useState(null);

  // Estado para confirmación de eliminación
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    category: null,
    isLoading: false
  });

  // Estado para crear nueva categoría
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Cargar categorías al inicio
  useEffect(() => {
    loadCategories();
  }, []);

  // Resetear página cuando cambie el número de categorías
  useEffect(() => {
    setCurrentPage(1);
  }, [categories.length]);

  /**
   * Cargar todas las categorías
   */
  const loadCategories = async () => {
    setLoading(true);
    try {
      const result = await categoryService.getAllCategories();
      
      if (result.success) {
        setCategories(result.data);
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Crear nueva categoría
   */
  const handleCreateCategory = async (categoryData) => {
    try {
      const result = await categoryService.createCategory(categoryData);

      if (result.success) {
        // Remover mensaje automático - solo recargar datos
        await loadCategories();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      throw error;
    }
  };

  /**
   * Manejar mensajes
   */
  const handleMessage = (msg) => {
    setMessage(msg);
  };

  /**
   * Guardar cambios de edición
   */
  const saveEdit = async () => {
    if (!editing.categoria.trim()) {
      setMessage('El nombre no puede estar vacío');
      return;
    }

    if (editing.low_stock === '' || isNaN(parseInt(editing.low_stock))) {
      setMessage('Ingresa un valor numérico válido para el stock bajo');
      return;
    }

    setLoading(true);
    try {
      const result = await categoryService.updateCategory(editing.id, {
        categoria: editing.categoria.trim(),
        activo: editing.activo,
        low_stock: parseInt(editing.low_stock)
      });

      if (result.success) {
        // Remover mensaje automático - solo actualizar y cerrar edición
        setEditing(null);
        await loadCategories();
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Confirmar eliminación
   */
  const confirmDeleteCategory = (category) => {
    setDeleteModal({
      isOpen: true,
      category: category,
      isLoading: false
    });
  };

  /**
   * Eliminar categoría
   */
  const deleteCategory = async () => {
    if (!deleteModal.category) return;

    setDeleteModal(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await categoryService.deleteCategory(deleteModal.category.id);

      if (result.success) {
        // Remover mensaje automático - solo cerrar modal y recargar
        setDeleteModal({ isOpen: false, category: null, isLoading: false });
        await loadCategories();
      } else {
        setMessage(`Error: ${result.error}`);
        setDeleteModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  /**
   * Cancelar eliminación
   */
  const cancelDelete = () => {
    if (!deleteModal.isLoading) {
      setDeleteModal({ isOpen: false, category: null, isLoading: false });
    }
  };

  /**
   * Iniciar edición
   */
  const startEdit = (category) => {
    setEditing({
      id: category.id,
      categoria: category.categoria,
      activo: category.activo,
      low_stock: category.low_stock
    });
  };

  /**
   * Cancelar edición
   */
  const cancelEdit = () => {
    setEditing(null);
  };

  /**
   * Manejar cambio de página
   */
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Calcular elementos para la página actual
  const totalPages = Math.ceil(categories.length / categoriesPerPage);
  const startIndex = (currentPage - 1) * categoriesPerPage;
  const endIndex = startIndex + categoriesPerPage;
  const currentCategories = categories.slice(startIndex, endIndex);

  return (
    <div className="category-manager">
      {/* Mensaje de estado */}
      {message && (
        <div className={`category-manager__message ${message.includes('Error') ? 'category-manager__message--error' : 'category-manager__message--success'}`}>
          {message}
          <button 
            onClick={() => setMessage('')}
            className="category-manager__message-close"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={cancelDelete}
        onConfirm={deleteCategory}
        title="¿Eliminar categoría?"
        message={
          deleteModal.category 
            ? `¿Estás seguro de que quieres eliminar permanentemente la categoría "${deleteModal.category.categoria}"? Esta acción no se puede deshacer.`
            : ''
        }
        type="danger"
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        isLoading={deleteModal.isLoading}
      />

      {/* Header con título */}
      <div className="category-manager__header">
        <div className="category-manager__title">
          <h2>Gestión de Categorías</h2>
        </div>
        
        <div className="category-manager__actions">
          <CreateCategoryButton
            onCreateCategory={handleCreateCategory}
            loading={loading}
            onMessage={handleMessage}
          />
        </div>
      </div>

      {/* Barra de información */}
      <TableInfoBar
        totalElements={categories.length}
        shownElements={currentCategories.length}
        elementsPerPage={categoriesPerPage}
        isExpanded={true} // Sin botón expandir
      />

      {/* Tabla de categorías */}
      <div className="category-manager__table-container">
        <div className="category-manager__table-wrapper">
          <table className="category-manager__table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Stock Bajo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="category-manager__loading-cell">
                    <div className="category-manager__loading-content">
                      <div className="category-manager__loading-spinner"></div>
                      <span>Cargando categorías...</span>
                    </div>
                  </td>
                </tr>
              ) : currentCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="category-manager__empty-cell">
                    <div className="category-manager__empty-content">
                      {categories.length === 0 
                        ? 'No hay categorías registradas' 
                        : 'No hay categorías en esta página'
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                currentCategories.map((category) => (
                  <tr key={category.id} className="category-manager__table-row">
                    {editing && editing.id === category.id ? (
                      // Modo edición - fila expandida
                      <>
                        <td className="category-manager__edit-cell">
                          <input 
                            type="text"
                            value={editing.categoria}
                            onChange={(e) => setEditing({...editing, categoria: e.target.value})}
                            className="category-manager__edit-input"
                            placeholder="Nombre de categoría"
                          />
                        </td>
                        <td className="category-manager__edit-cell">
                          <label className="category-manager__checkbox-label">
                            <input 
                              type="checkbox"
                              checked={editing.activo}
                              onChange={(e) => setEditing({...editing, activo: e.target.checked})}
                              className="category-manager__checkbox"
                            />
                            <span className={`category-manager__status-badge ${editing.activo ? 'active' : 'inactive'}`}>
                              {editing.activo ? 'Activa' : 'Inactiva'}
                            </span>
                          </label>
                        </td>
                        <td className="category-manager__edit-cell">
                          <input 
                            type="number"
                            value={editing.low_stock}
                            onChange={(e) => setEditing({...editing, low_stock: e.target.value})}
                            step="1"
                            min="0"
                            className="category-manager__edit-input category-manager__edit-input--number"
                            placeholder="Stock bajo"
                          />
                        </td>
                        <td className="category-manager__actions-cell">
                          <div className="category-manager__edit-actions">
                            <button 
                              onClick={saveEdit}
                              disabled={loading}
                              className="category-manager__action-btn category-manager__action-btn--save"
                              title="Guardar cambios"
                            >
                              {loading ? '💾' : '✓'}
                            </button>
                            
                            <button 
                              onClick={cancelEdit}
                              className="category-manager__action-btn category-manager__action-btn--cancel"
                              title="Cancelar edición"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // Modo vista normal
                      <>
                        <td className="category-manager__name-cell">
                          <span className="category-manager__name">
                            {category.categoria}
                          </span>
                        </td>
                        <td className="category-manager__status-cell">
                          <span className={`category-manager__status-badge ${category.activo ? 'active' : 'inactive'}`}>
                            {category.activo ? '🟢 Activa' : '🔴 Inactiva'}
                          </span>
                        </td>
                        <td className="category-manager__stock-cell">
                          <span className="category-manager__stock-value">
                            {category.low_stock} unidades
                          </span>
                        </td>
                        <td className="category-manager__actions-cell">
                          <div className="category-manager__actions">
                            <button 
                              onClick={() => startEdit(category)}
                              disabled={loading || editing}
                              className="category-manager__action-btn category-manager__action-btn--edit"
                              title="Editar categoría"
                            >
                              <Edit size={14} />
                            </button>
                            
                            <button 
                              onClick={() => confirmDeleteCategory(category)}
                              disabled={loading || editing}
                              className="category-manager__action-btn category-manager__action-btn--delete"
                              title="Eliminar categoría"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default CategoryManager;