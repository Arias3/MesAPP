import React from 'react';
import { DollarSign, X } from 'lucide-react';
import styles from './ProductFilters.module.css';

const PriceFilter = ({ 
  value = { price: '', operator: 'equal' }, 
  onChange, 
  className = '',
  disabled = false 
}) => {
  
  const operators = [
    { value: 'equal', label: 'Igual a', symbol: '=' },
    { value: 'greater', label: 'Mayor que', symbol: '>' },
    { value: 'less', label: 'Menor que', symbol: '<' },
    { value: 'greaterOrEqual', label: 'Mayor o igual', symbol: '≥' },
    { value: 'lessOrEqual', label: 'Menor o igual', symbol: '≤' }
  ];

  const handlePriceChange = (e) => {
    const newPrice = e.target.value;
    // Solo permitir números y punto decimal
    if (newPrice === '' || /^\d*\.?\d*$/.test(newPrice)) {
      if (onChange) {
        onChange({
          ...value,
          price: newPrice
        });
      }
    }
  };

  const handleOperatorChange = (e) => {
    const newOperator = e.target.value;
    if (onChange) {
      onChange({
        ...value,
        operator: newOperator
      });
    }
  };

  const handleClear = () => {
    if (onChange) {
      onChange({ price: '', operator: 'equal' });
    }
  };

  const showClear = value.price !== '';

  return (
    <div className={`${styles['price-filter']} ${className}`}>
      <label className={styles['filter-label']}>
        Filtro por Precio
      </label>
      
      <div className={styles['filter-input-container']}>
        <div className={styles['input-wrapper']}>
          <DollarSign className={`${styles['input-icon']} ${styles['price-icon']}`} />
          <select
            value={value.operator}
            onChange={handleOperatorChange}
            className={styles['filter-select']}
            disabled={disabled}
            style={{ 
              width: '4rem', 
              paddingLeft: '2.75rem', 
              paddingRight: '0.5rem',
              marginRight: '0.5rem',
              borderRight: '1px solid rgba(31, 72, 78, 0.2)'
            }}
          >
            {operators.map(operator => (
              <option key={operator.value} value={operator.value}>
                {operator.symbol}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={value.price}
            onChange={handlePriceChange}
            placeholder="0.00"
            className={styles['filter-input']}
            disabled={disabled}
            style={{ 
              paddingLeft: '0.5rem',
              flex: 1
            }}
          />
          
          {showClear && (
            <button
              type="button"
              onClick={handleClear}
              className={styles['clear-button']}
              disabled={disabled}
              title="Limpiar precio"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceFilter;