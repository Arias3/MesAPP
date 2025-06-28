import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import NameFilter from './../../Filters/TableSearch/NameFilter.jsx';
import CategoryFilter from './../../Filters/TableSearch/CategoryFilter.jsx';
import StockStatusFilter from './../../Filters/TableSearch/StockStatusFilter.jsx';
import MarginFilter from './../../Filters/TableSearch/MarginFilter.jsx';
import './FiltersBox.css';

const ProductFiltersBox = ({ 
  filters = {
    name: '',
    category: 'all',
    stockStatus: 'all',
    margin: 'all'
  },
  onFiltersChange,
  categories = [],
  stockStates = [],
  className = '',
  disabled = false 
}) => {

  // Handler para cambio de filtro individual
  const handleFilterChange = (filterType, value) => {
    if (onFiltersChange) {
      onFiltersChange({
        ...filters,
        [filterType]: value
      });
    }
  };

  // Handler para limpiar todos los filtros
  const handleClearAllFilters = () => {
    const clearedFilters = {
      name: '',
      category: 'all',
      stockStatus: 'all',
      margin: 'all'
    };
    
    if (onFiltersChange) {
      onFiltersChange(clearedFilters);
    }
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = 
    filters.name !== '' ||
    filters.category !== 'all' ||
    filters.stockStatus !== 'all' ||
    filters.margin !== 'all';

  // Contar filtros activos
  const activeFiltersCount = [
    filters.name !== '',
    filters.category !== 'all',
    filters.stockStatus !== 'all',
    filters.margin !== 'all'
  ].filter(Boolean).length;

  return (
    <div className={`product-filters-box ${className}`}>
      
      {/* Header del contenedor */}
      <div className="filters-header">
        <div className="filters-title-section">
          <Filter className="filters-icon" />
          <div className="filters-title-content">
            <h3 className="filters-title">Filtros de Búsqueda</h3>
            <p className="filters-subtitle">
              {hasActiveFilters 
                ? `${activeFiltersCount} filtro${activeFiltersCount > 1 ? 's' : ''} activo${activeFiltersCount > 1 ? 's' : ''}`
                : 'Todos los productos'
              }
            </p>
          </div>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={handleClearAllFilters}
            className="clear-all-button"
            disabled={disabled}
            title="Limpiar todos los filtros"
          >
            <RotateCcw className="clear-all-icon" />
            <span>Limpiar Todo</span>
          </button>
        )}
      </div>

      {/* Contenedor de filtros */}
      <div className="filters-grid">
        
        {/* Filtro por Nombre */}
        <div className="filter-item">
          <NameFilter
            value={filters.name}
            onChange={(value) => handleFilterChange('name', value)}
            placeholder="Buscar productos..."
            disabled={disabled}
          />
        </div>

        {/* Filtro por Categoría */}
        <div className="filter-item">
          <CategoryFilter
            value={filters.category}
            onChange={(value) => handleFilterChange('category', value)}
            categories={categories}
            disabled={disabled}
          />
        </div>

        {/* Filtro por Estado de Stock */}
        <div className="filter-item">
          <StockStatusFilter
            value={filters.stockStatus}
            onChange={(value) => handleFilterChange('stockStatus', value)}
            stockStates={stockStates}
            disabled={disabled}
          />
        </div>

        {/* Filtro por Margen */}
        <div className="filter-item">
          <MarginFilter
            value={filters.margin}
            onChange={(value) => handleFilterChange('margin', value)}
            disabled={disabled}
          />
        </div>

      </div>

      {/* Información de resultados */}
      {hasActiveFilters && (
        <div className="filters-summary">
          <div className="summary-content">
            <span className="summary-text">
              Filtrando por:
            </span>
            <div className="active-filters-list">
              {filters.name && (
                <span className="active-filter-tag name-tag">
                  Nombre: "{filters.name}"
                </span>
              )}
              {filters.category !== 'all' && (
                <span className="active-filter-tag category-tag">
                  Categoría: {filters.category}
                </span>
              )}
              {filters.stockStatus !== 'all' && (
                <span className="active-filter-tag stock-tag">
                  Estado: {filters.stockStatus}
                </span>
              )}
              {filters.margin !== 'all' && (
                <span className="active-filter-tag margin-tag">
                  Margen: {filters.margin === 'high' ? 'Alto' : 'Bajo'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFiltersBox;