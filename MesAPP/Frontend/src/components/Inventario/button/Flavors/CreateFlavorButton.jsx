import React, { useState, useEffect } from 'react';
import styles from './CreateFlavorButton.module.css';

/**
 * CreateFlavorButton - Componente moderno para crear sabores con modal
 */
export const CreateFlavorButton = ({ 
  onCreateFlavor, 
  loading = false,
  onMessage = () => {},
  categories = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    selectedCategories: []
  });

  // Cerrar modal con Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (categoryId, isChecked) => {
    if (isChecked) {
      setFormData(prev => ({
        ...prev,
        selectedCategories: [...prev.selectedCategories, categoryId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedCategories: prev.selectedCategories.filter(id => id !== categoryId)
      }));
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      onMessage('Ingresa un nombre para el sabor');
      return;
    }

    if (formData.selectedCategories.length === 0) {
      onMessage('Debe seleccionar al menos una categoría');
      return;
    }

    try {
      await onCreateFlavor({
        name: formData.name.trim()
      }, formData.selectedCategories);
      
      setFormData({ name: '', selectedCategories: [] });
      setIsOpen(false);
      
    } catch (error) {
      onMessage(`Error: ${error.message}`);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', selectedCategories: [] });
    setIsOpen(false);
    onMessage('');
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.trigger}>
          <button 
            onClick={() => setIsOpen(true)}
            className={styles.triggerButton}
            disabled={loading}
          >
            <span className={styles.triggerIcon}>🍨</span>
            <span className={styles.triggerText}>Nuevo Sabor</span>
          </button>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className={styles.overlay} onClick={handleOverlayClick}>
          <div className={styles.modal}>
            <div className={styles.header}>
              <h3 className={styles.title}>
                <span>🍨</span>
                Nuevo Sabor
              </h3>
            </div>
            
            <div className={styles.form}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Nombre del sabor</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ej: Vainilla, Chocolate, Fresa..."
                  className={styles.input}
                  maxLength={50}
                  autoFocus
                />
              </div>
              
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Categorías aplicables</label>
                <div className={styles.categoriesList}>
                  {categories.length === 0 ? (
                    <div className={styles.noCategories}>
                      No hay categorías disponibles
                    </div>
                  ) : (
                    categories.map((category) => (
                      <label key={category.id} className={styles.categoryOption}>
                        <input
                          type="checkbox"
                          checked={formData.selectedCategories.includes(category.id)}
                          onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                          className={styles.checkbox}
                        />
                        <span className={styles.categoryName}>{category.categoria}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              
              <div className={styles.actions}>
                <button 
                  onClick={handleCancel}
                  className={`${styles.button} ${styles.buttonCancel}`}
                  disabled={loading}
                >
                  <span>✕</span>
                  <span>Cancelar</span>
                </button>
                
                <button 
                  onClick={handleCreate}
                  disabled={loading || categories.length === 0}
                  className={`${styles.button} ${styles.buttonCreate}`}
                >
                  {loading ? (
                    <>
                      <span className={styles.spinner}></span>
                      <span>Creando...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Crear</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateFlavorButton;