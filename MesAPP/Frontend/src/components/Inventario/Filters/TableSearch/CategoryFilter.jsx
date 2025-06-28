import React from 'react';
import { Tag, ChevronDown } from 'lucide-react';
import './ProductFilters.module.css';

const CategoryFilter = ({ 
  value = 'all', 
  onChange, 
  categories = [],
  className = '',
  disabled = false 
}) => {
  const handleSelectChange = (e) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleClear = () => {
    if (onChange) {
      onChange('all');
    }
  };

  // Obtener categorías únicas y ordenadas
  const uniqueCategories = [...new Set(categories)].sort();
  const selectedCategoryName = value === 'all' ? 'Todas las categorías' : value;

  return (
    <div className={`category-filter ${className}`}>
      <label className="filter-label">
        Categoría
      </label>
      
      <div className="filter-input-container">
        <div className="select-wrapper">
          <Tag className="input-icon" />
          <select
            value={value}
            onChange={handleSelectChange}
            className="filter-select"
            disabled={disabled}
          >
            <option value="all">Todas las categorías</option>
            {uniqueCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <ChevronDown className="select-arrow" />
          
          {value !== 'all' && (
            <button
              type="button"
              onClick={handleClear}
              className="clear-button"
              title="Limpiar filtro"
              disabled={disabled}
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      <div className="filter-info">
        {value === 'all' ? (
          <span>Mostrando todas las categorías ({uniqueCategories.length})</span>
        ) : (
          <span>Filtrando por: "<strong>{selectedCategoryName}</strong>"</span>
        )}
      </div>
    </div>
  );
};

export default CategoryFilter;