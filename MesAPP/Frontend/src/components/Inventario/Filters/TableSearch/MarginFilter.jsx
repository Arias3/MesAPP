import React from 'react';
import { TrendingUp, TrendingDown, BarChart3, ChevronDown } from 'lucide-react';
import './ProductFilters.module.css';

const MarginFilter = ({ 
  value = 'all', 
  onChange, 
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

  // Opciones fijas de filtro por margen
  const marginOptions = [
    { 
      value: 'all', 
      label: 'Todos los márgenes', 
      icon: BarChart3, 
      color: 'text-gray-600'
    },
    { 
      value: 'high', 
      label: 'Mayor Margen', 
      icon: TrendingUp, 
      color: 'text-green-600'
    },
    { 
      value: 'low', 
      label: 'Menor Margen', 
      icon: TrendingDown, 
      color: 'text-red-600'
    }
  ];

  const selectedOption = marginOptions.find(opt => opt.value === value) || marginOptions[0];
  const SelectedIcon = selectedOption.icon;

  return (
    <div className={`margin-filter ${className}`}>
      <label className="filter-label">
        Nivel de Margen
      </label>
      
      <div className="filter-input-container">
        <div className="select-wrapper">
          <SelectedIcon className={`input-icon ${selectedOption.color}`} />
          <select
            value={value}
            onChange={handleSelectChange}
            className="filter-select"
            disabled={disabled}
          >
            {marginOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
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
      
      {value !== 'all' && (
        <div className="filter-info">
          <span className={selectedOption.color}>
            Filtrando por: "<strong>{selectedOption.label}</strong>"
          </span>
        </div>
      )}

      {/* Información adicional sobre los criterios */}
      <div className="filter-help">
        <small className="help-text">
          {value === 'high' && 'Productos con margen superior al promedio'}
          {value === 'low' && 'Productos con margen inferior al promedio'}
          {value === 'all' && 'Mostrando productos con cualquier margen'}
        </small>
      </div>
    </div>
  );
};

export default MarginFilter;