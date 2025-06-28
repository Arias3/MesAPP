import React from 'react';
import ProductFiltersBox from './Filtros/FiltersBox.jsx';
import InventoryActionsBar from './Importaciones/ActionBar.jsx';
import './FullInventoryBar.css';

const FullInventoryBar = ({ 
  // Props para filtros
  filters = {
    name: '',
    category: 'all',
    stockStatus: 'all',
    margin: 'all'
  },
  onFiltersChange,
  categories = [],
  stockStates = [],
  
  // Props para acciones
  apiBaseUrl,
  onProductCreated,
  
  // Props generales
  className = '',
  disabled = false,
  loading = false 
}) => {

  return (
    <div className={`full-inventory-bar ${className}`}>
      
      {/* Contenedor de Filtros - Reutilizable */}
      <div className="filters-section">
        <ProductFiltersBox
          filters={filters}
          onFiltersChange={onFiltersChange}
          categories={categories}
          stockStates={stockStates}
          disabled={disabled || loading}
        />
      </div>

      {/* Contenedor de Acciones - Ya existente */}
      <div className="actions-section">
        <InventoryActionsBar
          apiBaseUrl={apiBaseUrl}
          onProductCreated={onProductCreated}
          disabled={disabled || loading}
        />
      </div>

      {/* Separador visual opcional */}
      <div className="sections-separator"></div>

    </div>
  );
};

export default FullInventoryBar;