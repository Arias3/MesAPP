import React from 'react';
import { Hash, X } from 'lucide-react';
import styles from './ProductFilters.module.css';

const CodeFilter = ({
  value = '',
  onChange,
  placeholder = "Buscar por código...",
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
    <div className={`${styles['code-filter']} ${className}`}>
      <label className={styles['filter-label']}>Código del Producto</label>

      <div className={styles['filter-input-container']}>
        <div className={styles['input-wrapper']}>
          <Hash className={`${styles['input-icon']} ${styles['code-icon']}`} />
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
              title="Limpiar filtro de código"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeFilter;
