import React from 'react';
import { Search, X } from 'lucide-react';
import styles from './ProductFilters.module.css';

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
    <div className={`${styles['name-filter']} ${className}`}>
      <label className={styles['filter-label']}>
        Nombre del Producto
      </label>
      
      <div className={styles['filter-input-container']}>
        <div className={styles['input-wrapper']}>
          <Search className={`${styles['input-icon']} ${styles['name-icon']}`} />
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={styles['filter-input']}
            disabled={disabled}
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className={styles['clear-button']}
              disabled={disabled}
              title="Limpiar filtro de nombre"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NameFilter;