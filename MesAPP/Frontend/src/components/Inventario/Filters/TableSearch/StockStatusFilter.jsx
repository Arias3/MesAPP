import React from 'react';
import { Package, AlertTriangle, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import './ProductFilters.module.css';

const StockStatusFilter = ({ 
  value = 'all', 
  onChange, 
  stockStates = [], // ← RECIBE ESTADOS DEL PADRE
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

  // Mapeo de iconos y colores por estado
  const stateIconMap = {
    'Sin Stock': { icon: XCircle, color: 'text-red-600' },
    'Bajo Stock': { icon: AlertTriangle, color: 'text-yellow-600' },
    'Normal': { icon: CheckCircle, color: 'text-green-600' }
  };

  // Procesar estados únicos recibidos del padre
  const uniqueStockStates = [...new Set(stockStates)].sort();

  // Crear opciones dinámicamente basadas en lo que existe
  const stockOptions = [
    { 
      value: 'all', 
      label: 'Todos los estados', 
      icon: Package, 
      color: 'text-gray-600'
    },
    ...uniqueStockStates.map(state => ({
      value: state.toLowerCase().replace(' ', '_'), // "Bajo Stock" -> "bajo_stock"
      label: state,
      icon: stateIconMap[state]?.icon || Package,
      color: stateIconMap[state]?.color || 'text-gray-600'
    }))
  ];

  const selectedOption = stockOptions.find(opt => opt.value === value) || stockOptions[0];
  const SelectedIcon = selectedOption.icon;

  return (
    <div className={`stock-status-filter ${className}`}>
      <label className="filter-label">
        Estado de Stock
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
            {stockOptions.map((option) => (
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
    </div>
  );
};

export default StockStatusFilter;