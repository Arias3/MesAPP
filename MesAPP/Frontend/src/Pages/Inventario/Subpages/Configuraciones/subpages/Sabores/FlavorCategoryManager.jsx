import React, { useState, useEffect } from 'react';
import { Edit, Trash2, X } from 'lucide-react';
import { flavorCategoryService } from './../../../../../../services/Flavors/FlavorCategoryService';
import { categoryService } from './../../../../../../services/Category/CategoryService';
import { CreateFlavorButton } from './../../../../../../components/Inventario/button/Flavors/CreateFlavorButton';
import Pagination from './../../../../../../components/Inventario/button/Pagination/Pagination';
import './FlavorCategoryManager.css';

/**
 * FlavorCategoryManager - Componente unificado para gestión de sabores y sus categorías
 */
export const FlavorCategoryManager = () => {
  // Estados principales
  const [flavors, setFlavors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Estados de filtrado y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Consistente con CategoryManager

  // Estados de modales (solo editModal y deleteModal, CreateFlavorButton maneja la creación)
  const [editModal, setEditModal] = useState({
    isOpen: false,
    flavor: null,
    name: '',
    status: 1,
    selectedCategories: []
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    flavor: null,
    isLoading: false
  });

  // Cargar datos al inicio
  useEffect(() => {
    loadData();
  }, []);

  // Resetear página cuando cambie el número de sabores filtrados
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategoryFilter, showActiveOnly]);

  /**
   * Cargar sabores y categorías
   */
  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar sabores con categorías
      const flavorsResult = await flavorCategoryService.getFlavorsWithCategories();
      if (flavorsResult.success) {
        setFlavors(flavorsResult.data);
      } else {
        setMessage(`Error cargando sabores: ${flavorsResult.error}`);
      }

      // Cargar categorías
      const categoriesResult = await categoryService.getAllCategories();
      if (categoriesResult.success) {
        setCategories(categoriesResult.data.filter(cat => cat.activo));
      } else {
        setMessage(`Error cargando categorías: ${categoriesResult.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Crear sabor con categorías (para CreateFlavorButton)
   */
  const handleCreateFlavor = async (flavorData, selectedCategories) => {
    if (!flavorData.name.trim()) {
      setMessage('El nombre del sabor es obligatorio');
      throw new Error('El nombre del sabor es obligatorio');
    }

    if (selectedCategories.length === 0) {
      setMessage('Debe seleccionar al menos una categoría');
      throw new Error('Debe seleccionar al menos una categoría');
    }

    try {
      const result = await flavorCategoryService.createFlavorWithCategories(
        { name: flavorData.name.trim() },
        selectedCategories
      );

      if (result.success) {
        setMessage('Sabor creado y asociado exitosamente');
        await loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      throw error; // Re-lanzar para que CreateFlavorButton maneje el error
    }
  };

  /**
   * Manejar mensajes
   */
  const handleMessage = (msg) => {
    setMessage(msg);
  };

  /**
   * Actualizar sabor completo (nombre, estado y categorías)
   */
  const handleUpdateFlavor = async () => {
    if (!editModal.name.trim()) {
      setMessage('El nombre del sabor es obligatorio');
      return;
    }

    setLoading(true);
    try {
      // Actualizar sabor básico
      const updateResult = await flavorCategoryService.flavorService.updateFlavor(editModal.flavor.id, {
        name: editModal.name.trim(),
        status: editModal.status
      });

      if (!updateResult.success) {
        throw new Error(updateResult.error);
      }

      // Actualizar asociaciones de categorías
      const associationResult = await flavorCategoryService.flavorService.associateFlavorWithCategories(
        editModal.flavor.id,
        editModal.selectedCategories
      );

      if (!associationResult.success) {
        console.warn('Sabor actualizado pero error en asociaciones:', associationResult.error);
      }

      setEditModal({ isOpen: false, flavor: null, name: '', status: 1, selectedCategories: [] });
      setMessage('Sabor actualizado exitosamente');
      await loadData();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Eliminar sabor
   */
  const handleDeleteFlavor = async () => {
    if (!deleteModal.flavor) return;

    setDeleteModal(prev => ({ ...prev, isLoading: true }));
    try {
      const result = await flavorCategoryService.flavorService.deleteFlavor(deleteModal.flavor.id);

      if (result.success) {
        setDeleteModal({ isOpen: false, flavor: null, isLoading: false });
        setMessage('Sabor eliminado exitosamente');
        await loadData();
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
   * Abrir modal de edición
   */
  const openEditModal = (flavor) => {
    setEditModal({
      isOpen: true,
      flavor,
      name: flavor.name,
      status: flavor.status,
      selectedCategories: flavor.categories.map(cat => cat.id)
    });
  };

  /**
   * Confirmar eliminación
   */
  const confirmDeleteFlavor = (flavor) => {
    setDeleteModal({
      isOpen: true,
      flavor: flavor,
      isLoading: false
    });
  };

  /**
   * Cancelar eliminación
   */
  const cancelDelete = () => {
    if (!deleteModal.isLoading) {
      setDeleteModal({ isOpen: false, flavor: null, isLoading: false });
    }
  };

  /**
   * Manejar cambio de página
   */
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  /**
   * Filtrar sabores
   */
  const filteredFlavors = flavors.filter(flavor => {
    const matchesSearch = flavor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryFilter === '' || 
      flavor.categories.some(cat => cat.id === parseInt(selectedCategoryFilter));
    const matchesStatus = !showActiveOnly || flavor.status === 1;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calcular elementos para la página actual
  const totalPages = Math.ceil(filteredFlavors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFlavors = filteredFlavors.slice(startIndex, endIndex);

  return (
    <div className="flavor-category-manager">
      {/* Mensaje de estado */}
      {message && (
        <div className={`flavor-category-manager__message ${
          message.includes('Error') ? 'flavor-category-manager__message--error' : 'flavor-category-manager__message--success'
        }`}>
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="flavor-category-manager__message-close">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flavor-category-manager__header">
        <div className="flavor-category-manager__title">
          <h2>Gestión de Sabores</h2>
        </div>
        
        <div className="flavor-category-manager__actions">
          <CreateFlavorButton
            onCreateFlavor={handleCreateFlavor}
            loading={loading}
            onMessage={handleMessage}
            categories={categories}
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="flavor-category-manager__filters">
        {/* Búsqueda */}
        <div className="flavor-category-manager__filter-group">
          <input
            type="text"
            placeholder="Buscar sabores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flavor-category-manager__filter-input"
          />
        </div>

        {/* Filtro por categoría */}
        <div className="flavor-category-manager__filter-group">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="flavor-category-manager__filter-select"
          >
            <option value="">Todas las categorías</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.categoria}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro activos */}
        <div className="flavor-category-manager__filter-group">
          <label className="flavor-category-manager__filter-checkbox-wrapper">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
            />
            <span>Solo activos</span>
          </label>
        </div>

        {/* Estadísticas */}
        <div className="flavor-category-manager__filter-stats">
          Mostrando {currentFlavors.length} de {filteredFlavors.length} sabores
        </div>
      </div>

      {/* Tabla */}
      <div className="flavor-category-manager__table-container">
        <div className="flavor-category-manager__table-wrapper">
          <table className="flavor-category-manager__table">
            <thead>
              <tr>
                <th>Sabor</th>
                <th>Estado</th>
                <th>Categorías Asociadas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="flavor-category-manager__loading-cell">
                    <div className="flavor-category-manager__loading-content">
                      <div className="flavor-category-manager__loading-spinner"></div>
                      <span>Cargando sabores...</span>
                    </div>
                  </td>
                </tr>
              ) : currentFlavors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="flavor-category-manager__empty-cell">
                    {filteredFlavors.length === 0 && flavors.length > 0
                      ? 'No se encontraron sabores con los filtros aplicados'
                      : 'No hay sabores registrados'
                    }
                  </td>
                </tr>
              ) : (
                currentFlavors.map((flavor) => (
                  <tr key={flavor.id} className="flavor-category-manager__table-row">
                    <td>
                      <span className="flavor-category-manager__name">{flavor.name}</span>
                    </td>
                    <td>
                      <span className={`flavor-category-manager__status-badge ${
                        flavor.status === 1
                          ? 'flavor-category-manager__status-badge--active'
                          : 'flavor-category-manager__status-badge--inactive'
                      }`}>
                        {flavor.status === 1 ? '🟢 Activo' : '🔴 Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="flavor-category-manager__categories">
                        {flavor.categories.length === 0 ? (
                          <span className="flavor-category-manager__no-categories">Sin categorías</span>
                        ) : (
                          flavor.categories.map((category) => (
                            <span
                              key={category.id}
                              className="flavor-category-manager__category-badge"
                            >
                              {category.categoria}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="flavor-category-manager__actions-cell">
                      <div className="flavor-category-manager__actions">
                        <button
                          onClick={() => openEditModal(flavor)}
                          disabled={loading}
                          className="flavor-category-manager__action-btn flavor-category-manager__action-btn--edit"
                          title="Editar sabor"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => confirmDeleteFlavor(flavor)}
                          disabled={loading}
                          className="flavor-category-manager__action-btn flavor-category-manager__action-btn--delete"
                          title="Eliminar sabor"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación con componente existente */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Modal Editar Sabor */}
      {editModal.isOpen && (
        <div className="flavor-category-manager__modal-overlay">
          <div className="flavor-category-manager__modal">
            <h3 className="flavor-category-manager__modal-title">Editar Sabor</h3>
            
            <div className="flavor-category-manager__modal-form">
              <div className="flavor-category-manager__form-group">
                <label className="flavor-category-manager__form-label">
                  Nombre del Sabor
                </label>
                <input
                  type="text"
                  value={editModal.name}
                  onChange={(e) => setEditModal(prev => ({ ...prev, name: e.target.value }))}
                  className="flavor-category-manager__form-input"
                  maxLength={50}
                />
              </div>

              <div className="flavor-category-manager__form-group">
                <label className="flavor-category-manager__form-label">
                  Estado
                </label>
                <select
                  value={editModal.status}
                  onChange={(e) => setEditModal(prev => ({ ...prev, status: parseInt(e.target.value) }))}
                  className="flavor-category-manager__form-select"
                >
                  <option value={1}>Activo</option>
                  <option value={0}>Inactivo</option>
                </select>
              </div>

              <div className="flavor-category-manager__form-group">
                <label className="flavor-category-manager__form-label">
                  Categorías Aplicables
                </label>
                <div className="flavor-category-manager__categories-list">
                  {categories.map((category) => (
                    <label key={category.id} className="flavor-category-manager__category-option">
                      <input
                        type="checkbox"
                        checked={editModal.selectedCategories.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditModal(prev => ({
                              ...prev,
                              selectedCategories: [...prev.selectedCategories, category.id]
                            }));
                          } else {
                            setEditModal(prev => ({
                              ...prev,
                              selectedCategories: prev.selectedCategories.filter(id => id !== category.id)
                            }));
                          }
                        }}
                      />
                      <span>{category.categoria}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flavor-category-manager__modal-buttons">
              <button
                onClick={() => setEditModal({ isOpen: false, flavor: null, name: '', status: 1, selectedCategories: [] })}
                className="flavor-category-manager__modal-btn flavor-category-manager__modal-btn--cancel"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateFlavor}
                disabled={loading}
                className="flavor-category-manager__modal-btn flavor-category-manager__modal-btn--primary"
              >
                {loading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {deleteModal.isOpen && (
        <div className="flavor-category-manager__modal-overlay">
          <div className="flavor-category-manager__modal">
            <h3 className="flavor-category-manager__modal-title">Confirmar Eliminación</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              ¿Estás seguro de que quieres eliminar el sabor "{deleteModal.flavor?.name}"? 
              Esta acción no se puede deshacer y se eliminarán todas sus asociaciones con categorías.
            </p>
            
            <div className="flavor-category-manager__modal-buttons">
              <button
                onClick={cancelDelete}
                disabled={deleteModal.isLoading}
                className="flavor-category-manager__modal-btn flavor-category-manager__modal-btn--cancel"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteFlavor}
                disabled={deleteModal.isLoading}
                className="flavor-category-manager__modal-btn flavor-category-manager__modal-btn--danger"
              >
                {deleteModal.isLoading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlavorCategoryManager;