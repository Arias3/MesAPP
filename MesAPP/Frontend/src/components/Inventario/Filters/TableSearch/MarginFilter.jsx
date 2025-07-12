import React from 'react';
import { TrendingUp, TrendingDown, BarChart3, X } from 'lucide-react';
import styles from './ProductFilters.module.css';

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

  const marginOptions = [
    {
      value: 'all',
      label: 'Todos los márgenes',
      icon: BarChart3,
      color: styles['text-gray-600']
    },
    {
      value: 'high',
      label: 'Mayor Margen',
      icon: TrendingUp,
      color: styles['text-green-600']
    },
    {
      value: 'low',
      label: 'Menor Margen',
      icon: TrendingDown,
      color: styles['text-red-600']
    }
  ];

  const selectedOption = marginOptions.find(opt => opt.value === value) || marginOptions[0];
  const SelectedIcon = selectedOption.icon;
  const showClearButton = value !== 'all';

  return (
    <div className={`${styles['margin-filter']} ${className}`}>
      <label className={styles['filter-label']}>Nivel de Margen</label>

      <div className={styles['filter-input-container']}>
        <div className={styles['select-wrapper']}>
          <SelectedIcon className={`${styles['input-icon']} ${styles['margin-icon']} ${selectedOption.color}`} />
          <select
            value={value}
            onChange={handleSelectChange}
            className={styles['filter-select']}
            disabled={disabled}
          >
            {marginOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {showClearButton && (
            <button
              type="button"
              onClick={handleClear}
              className={styles['clear-button']}
              disabled={disabled}
              title="Limpiar filtro de margen"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarginFilter;
