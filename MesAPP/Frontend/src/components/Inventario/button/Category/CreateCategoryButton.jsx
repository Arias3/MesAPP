import React, { useState, useEffect } from 'react';
import styles from './CreateCategoryButton.module.css';

/**
 * CreateCategoryButton - Componente moderno para crear categorías con modal
 */
export const CreateCategoryButton = ({ 
  onCreateCategory, 
  loading = false,
  onMessage = () => {} 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    lowStock: ''
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

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      onMessage('Ingresa un nombre para la categoría');
      return;
    }

    if (formData.lowStock === '' || isNaN(parseInt(formData.lowStock))) {
      onMessage('Ingresa un valor numérico válido para el stock bajo');
      return;
    }

    try {
      await onCreateCategory({
        categoria: formData.name.trim(),
        low_stock: parseInt(formData.lowStock)
      });
      
      setFormData({ name: '', lowStock: '' });
      setIsOpen(false);
      
    } catch (error) {
      onMessage(`Error: ${error.message}`);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', lowStock: '' });
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
            <span className={styles.triggerIcon}>✨</span>
            <span className={styles.triggerText}>Nueva Categoría</span>
          </button>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className={styles.overlay} onClick={handleOverlayClick}>
          <div className={styles.modal}>
            <div className={styles.header}>
              <h3 className={styles.title}>
                <span>✨</span>
                Nueva Categoría
              </h3>
            </div>
            
            <div className={styles.form}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Nombre de la categoría</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ej: Bebidas, Postres, Malteadas.."
                  className={styles.input}
                  autoFocus
                />
              </div>
              
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Alerta de stock bajo</label>
                <input 
                  type="number"
                  value={formData.lowStock}
                  onChange={(e) => handleInputChange('lowStock', e.target.value)}
                  onKeyPress={handleKeyPress}
                  step="1"
                  min="0"
                  placeholder="5"
                  className={`${styles.input} ${styles.inputNumber}`}
                />
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
                  disabled={loading}
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

export default CreateCategoryButton;