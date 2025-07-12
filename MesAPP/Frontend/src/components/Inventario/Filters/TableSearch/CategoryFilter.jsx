import React from 'react';
import styles from './ProductFilters.module.css';
import { Tag } from 'lucide-react';

const CategoryFilter = ({
  value = 'all',
  onChange,
  categories = [],
  disabled = false
}) => {
  const handleSelectChange = (e) => {
    if (onChange) onChange(e.target.value);
  };

  const handleClear = () => {
    if (onChange) onChange('all');
  };

  const showClear = value !== 'all';
  const uniqueCategories = [...new Set(categories)].sort();

  return (
    <div className={styles['category-filter']}>
      <label className={styles['filter-label']}>Categoría</label>

      <div className={styles['filter-input-container']}>
        <div className={styles['select-wrapper']}>
          <Tag className={`${styles['input-icon']} ${styles['category-icon']}`} />
          <select
            className={styles['filter-select']}
            value={value}
            onChange={handleSelectChange}
            disabled={disabled}
          >
            <option value="all">Todas las categorías</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
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
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryFilter;
