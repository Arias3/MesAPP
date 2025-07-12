import React from 'react';
import { Package, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';
import styles from './ProductFilters.module.css';

const StockStatusFilter = ({ 
  value = 'all', 
  onChange, 
  stockStates = [], 
  className = '',
  disabled = false 
}) => {
  const handleSelectChange = (e) => {
    if (onChange) onChange(e.target.value);
  };

  const handleClear = () => {
    if (onChange) onChange('all');
  };

  const stateIconMap = {
    'Sin Stock': { icon: XCircle, color: 'text-red-600' },
    'Bajo Stock': { icon: AlertTriangle, color: 'text-yellow-600' },
    'Normal': { icon: CheckCircle, color: 'text-green-600' }
  };

  const uniqueStockStates = [...new Set(stockStates)].sort();

  const stockOptions = [
    {
      value: 'all',
      label: 'Todos los estados',
      icon: Package,
      color: 'text-gray-600'
    },
    ...uniqueStockStates.map(state => ({
      value: state.toLowerCase().replace(/ /g, '_'),
      label: state,
      icon: stateIconMap[state]?.icon || Package,
      color: stateIconMap[state]?.color || 'text-gray-600'
    }))
  ];

  const selectedOption = stockOptions.find(opt => opt.value === value) || stockOptions[0];
  const SelectedIcon = selectedOption.icon;
  const showClear = value !== 'all';

  return (
    <div className={`${styles['stock-status-filter']} ${className}`}>
      <label className={styles['filter-label']}>Estado de Stock</label>

      <div className={styles['filter-input-container']}>
        <div className={styles['select-wrapper']}>
          <SelectedIcon className={`${styles['input-icon']} ${styles['stock-icon']} ${selectedOption.color}`} />
          <select
            className={styles['filter-select']}
            value={value}
            onChange={handleSelectChange}
            disabled={disabled}
          >
            {stockOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {showClear && (
            <button
              type="button"
              className={styles['clear-button']}
              onClick={handleClear}
              disabled={disabled}
              title="Limpiar filtro"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockStatusFilter;