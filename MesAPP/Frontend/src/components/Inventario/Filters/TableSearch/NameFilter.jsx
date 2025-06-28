import React from 'react';
import { Search } from 'lucide-react';
import './ProductFilters.module.css';

const NameFilter = ({ 
  value = '', 
  onChange, 
  placeholder = "Buscar por nombre...",
  className = '',
  disabled = false 
}) => {
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleClear = () => {
    if (onChange) {
      onChange('');
    }
  };

  return (
    <div className={`name-filter ${className}`}>
      <label className="filter-label">
        Nombre del Producto
      </label>
      
      <div className="filter-input-container">
        <div className="input-wrapper">
          <Search className="input-icon" />
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="filter-input"
            disabled={disabled}
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="clear-button"
              title="Limpiar búsqueda"
              disabled={disabled}
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      {value && (
        <div className="filter-info">
          Buscando: "<strong>{value}</strong>"
        </div>
      )}
    </div>
  );
};

export default NameFilter;