import React, { useState } from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import NameFilter from '../../../Filters/TableSearch/NameFilter.jsx';
import CodeFilter from '../../../Filters/TableSearch/CodeFilter.jsx';
import CategoryFilter from '../../../Filters/TableSearch/CategoryFilter.jsx';
import StockStatusFilter from '../../../Filters/TableSearch/StockStatusFilter.jsx';
import MarginFilter from '../../../Filters/TableSearch/MarginFilter.jsx';
import PriceFilter from '../../../Filters/TableSearch/PriceFilter.jsx';
import './FiltersBox.css';

const ProductFiltersBox = ({ 
  filters = {
    name: '',
    code: '',
    category: 'all',
    stockStatus: 'all',
    margin: 'all',
    price: { price: '', operator: 'equal' }
  },
  onFiltersChange,
  categories = [],
  stockStates = [],
  className = '',
  disabled = false,
  defaultExpanded = false // Nueva prop para estado inicial
}) => {

  // Estado para controlar si está expandido
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

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
  const handleClearAllFilters = (e) => {
    e.stopPropagation(); // Evitar que el click se propague al header
    const clearedFilters = {
      name: '',
      code: '',
      category: 'all',
      stockStatus: 'all',
      margin: 'all',
      price: { price: '', operator: 'equal' }
    };
    
    if (onFiltersChange) {
      onFiltersChange(clearedFilters);
    }
  };

  // Handler para toggle del header
  const handleHeaderClick = () => {
    if (!disabled) {
      setIsExpanded(prev => !prev);
    }
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = 
    filters.name !== '' ||
    filters.code !== '' ||
    filters.category !== 'all' ||
    filters.stockStatus !== 'all' ||
    filters.margin !== 'all' ||
    filters.price.price !== '';

  // Contar filtros activos
  const activeFiltersCount = [
    filters.name !== '',
    filters.code !== '',
    filters.category !== 'all',
    filters.stockStatus !== 'all',
    filters.margin !== 'all',
    filters.price.price !== ''
  ].filter(Boolean).length;

  // Helper para obtener símbolo del operador de precio
  const getPriceOperatorSymbol = (operator) => {
    const symbols = {
      'equal': '=',
      'greater': '>',
      'less': '<',
      'greaterOrEqual': '≥',
      'lessOrEqual': '≤'
    };
    return symbols[operator] || '=';
  };

  return (
    <div 
      className={`product-filters-box ${isExpanded ? 'expanded' : ''} ${className}`}
      data-disabled={disabled}
    >
      
      {/* Header clickeable para expandir/colapsar */}
      <div className="filters-header" onClick={handleHeaderClick}>
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

      {/* Área de filtros activos - SIEMPRE VISIBLE cuando hay filtros */}
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
              {filters.code && (
                <span className="active-filter-tag code-tag">
                  Código: "{filters.code}"
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
              {filters.price.price && (
                <span className="active-filter-tag price-tag">
                  Precio: {getPriceOperatorSymbol(filters.price.operator)} ${filters.price.price}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contenedor de filtros - COLAPSABLE */}
      <div className="filters-grid">
        
        {/* Filtro por Nombre */}
        <div className="filter-item" style={{'--delay': 0}}>
          <NameFilter
            value={filters.name}
            onChange={(value) => handleFilterChange('name', value)}
            placeholder="Buscar productos..."
            disabled={disabled}
          />
        </div>

        {/* Filtro por Código */}
        <div className="filter-item" style={{'--delay': 1}}>
          <CodeFilter
            value={filters.code}
            onChange={(value) => handleFilterChange('code', value)}
            placeholder="Buscar por código..."
            disabled={disabled}
          />
        </div>

        {/* Filtro por Categoría */}
        <div className="filter-item" style={{'--delay': 2}}>
          <CategoryFilter
            value={filters.category}
            onChange={(value) => handleFilterChange('category', value)}
            categories={categories}
            disabled={disabled}
          />
        </div>

        {/* Filtro por Estado de Stock */}
        <div className="filter-item" style={{'--delay': 3}}>
          <StockStatusFilter
            value={filters.stockStatus}
            onChange={(value) => handleFilterChange('stockStatus', value)}
            stockStates={stockStates}
            disabled={disabled}
          />
        </div>

        {/* Filtro por Margen */}
        <div className="filter-item" style={{'--delay': 4}}>
          <MarginFilter
            value={filters.margin}
            onChange={(value) => handleFilterChange('margin', value)}
            disabled={disabled}
          />
        </div>

        {/* Filtro por Precio */}
        <div className="filter-item" style={{'--delay': 5}}>
          <PriceFilter
            value={filters.price}
            onChange={(value) => handleFilterChange('price', value)}
            disabled={disabled}
          />
        </div>

      </div>
    </div>
  );
};

export default ProductFiltersBox;