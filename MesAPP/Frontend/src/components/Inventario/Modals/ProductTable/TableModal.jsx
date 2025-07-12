import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import ProductFiltersBox from './../../Helpers/BarCreation/Filtros/FiltersBox';
import TableInfoBar from './../../Helpers/BarCreation/Table/TableInfoBar';
import ProductTable from './../../Tables/ProductTable';
import Pagination from './../../button/Pagination/Pagination';
import PageSizeSelector from './../../button/PageSelector/PageSizeSelector';
import DownloadTableButton from './../../button/Download/DownloadTableButton';
import './TableModal.css';

const TableModal = ({ 
  isOpen, 
  onClose,
  // Datos de productos
  products,
  filteredProducts,
  loading,
  // Filtros
  filters,
  onFiltersChange,
  categories,
  stockStates,
  // Acciones de tabla
  onEdit,
  onDelete,
  onView
}) => {
  // ✅ TODOS LOS HOOKS VAN PRIMERO - ANTES DE CUALQUIER RETURN
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Por defecto 10 en modal

  // ✅ Hook para manejar eventos del teclado y scroll
  useEffect(() => {
    // Solo actúa cuando el modal está abierto
    if (isOpen) {
      const handleEscapeKey = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';

      // Cleanup cuando el modal se cierre o el componente se desmonte
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
        document.body.style.overflow = 'unset';
      };
    }
    
    // Si el modal no está abierto, asegurarse de que el scroll esté habilitado
    if (!isOpen) {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  // ✅ Hook para resetear página cuando cambian filtros o pageSize
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredProducts.length, pageSize]);

  // ✅ AHORA SÍ - Early return DESPUÉS de todos los hooks
  if (!isOpen) return null;

  // Funciones helper
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
  };

  // FUNCIONES HELPER PARA FILTROS
  const hasActiveFilters = 
    filters.name !== '' ||
    filters.code !== '' ||
    filters.category !== 'all' ||
    filters.stockStatus !== 'all' ||
    filters.margin !== 'all' ||
    filters.price.price !== '';

  // Calcular productos para la página actual
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  return (
    <div 
      className="table-modal-overlay" 
      onClick={handleOverlayClick}
    >
      <div className="table-modal-container">
        
        {/* Header del modal con título estilizado, info bar, selector y descarga */}
        <div className="table-modal-header">
          
          {/* Título estilizado */}
          <h2 className="modal-title">Sistema de Gestión de Inventario</h2>
          
          {/* Controles: Info Bar + Page Selector + Download Button */}
          <div className="header-controls">
            <TableInfoBar
              totalElements={products.length}
              shownElements={filteredProducts.length}
              elementsPerPage={pageSize}
              isExpanded={true} // Sin botón expandir
            />
            
            <PageSizeSelector
              value={pageSize}
              onChange={handlePageSizeChange}
              options={[6, 8, 10, 12, 15]}
            />
            
            <DownloadTableButton
              data={filteredProducts}
              filename="inventario"
              hasFilters={hasActiveFilters}
              disabled={loading || filteredProducts.length === 0}
            />
          </div>
          
          {/* Botón cerrar */}
          <button 
            className="modal-close-btn"
            onClick={onClose}
            title="Cerrar"
          >
            <X className="close-icon" />
          </button>
          
        </div>
        
        {/* Contenido dividido en secciones */}
        
        {/* Header: Solo filtros (fijo) */}
        <div className="table-modal-content-header">
          
          {/* Filtros dentro del modal */}
          <ProductFiltersBox
            filters={filters}
            onFiltersChange={onFiltersChange}
            categories={categories}
            stockStates={stockStates}
            defaultExpanded={true} // Siempre expandido en modal
            disabled={loading}
          />
          
        </div>

        {/* Body: Tabla (scrolleable) */}
        <div className="table-modal-content-body">
          <ProductTable
            products={products}
            loading={loading}
            filteredProducts={currentProducts} // Solo productos de página actual
            searchTerm={filters.name}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            isExpanded={true} // Está en modal
          />
        </div>

        {/* Footer: Paginación (fijo) */}
        <div className="table-modal-content-footer">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
        
      </div>
    </div>
  );
};

export default TableModal;