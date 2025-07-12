import { useState, useEffect } from 'react';
import { X, Package, Save, Edit } from 'lucide-react';
import styles from './EditProductModal.module.css';

function EditProductModal({ product, onClose, onProductUpdated, apiBaseUrl }) {
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    codigo: '',
    name: '',
    category: '',
    cost: '',
    price: '',
    stock: '',
    barcode: '',
    unity: '',
    flavor_count: '',
    description: ''
  });

  // Cargar datos del producto al abrir el modal
  useEffect(() => {
    if (product) {
      setFormData({
        codigo: product.codigo || '',
        name: product.name || '',
        category: product.category || '',
        cost: product.cost?.toString() || '',
        price: product.price?.toString() || '',
        stock: product.stock?.toString() || '',
        barcode: product.barcode || '',
        unity: product.unity || '',
        flavor_count: product.flavor_count?.toString() || '',
        description: product.description || ''
      });
    }
  }, [product]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calcular margen para preview
  const calculateMargin = () => {
    const cost = parseFloat(formData.cost) || 0;
    const price = parseFloat(formData.price) || 0;
    if (cost === 0) return '0.0';
    const margin = ((price - cost) / cost) * 100;
    return margin.toFixed(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.name || !formData.category || !formData.cost || !formData.price || !formData.stock) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Preparar datos para envío
      const productData = {
        id: product.id,
        codigo: formData.codigo,
        nombre: formData.name, // Mapear name -> nombre para el backend
        category: formData.category,
        costo: parseFloat(formData.cost) || 0,
        precio: parseFloat(formData.price) || 0,
        stock: parseInt(formData.stock) || 0,
        barcode: formData.barcode,
        unity: formData.unity,
        flavor_count: parseInt(formData.flavor_count) || 0,
        description: formData.description
      };

      console.log('Actualizando producto:', productData);
      
      // Llamada a la API para actualizar
      const response = await fetch(`${apiBaseUrl}/api/productos/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el producto');
      }
      
      const result = await response.json();
      
      // ✅ EMITIR EVENTO GLOBAL PARA ACTUALIZACIÓN DE PRODUCTO
      window.dispatchEvent(new CustomEvent('productUpdated', {
        detail: {
          success: true,
          updatedProduct: result.data || productData,
          originalProduct: product,
          message: 'Producto actualizado exitosamente',
          source: 'editProductModal'
        }
      }));
      
      console.log('📡 EditProductModal: Evento productUpdated emitido');
      
      // Notificar al componente padre (opcional, por compatibilidad)
      if (onProductUpdated) {
        onProductUpdated(result.data || productData);
      }
      
      onClose();
      
    } catch (error) {
      console.error('Error al actualizar producto:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!product) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleSection}>
            <Edit className={styles.modalIcon} />
            <div>
              <h2 className={styles.modalTitle}>Editar Producto</h2>
              <p className={styles.modalSubtitle}>ID: {product.id} - {product.name}</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className={styles.closeButton}
            disabled={isLoading}
          >
            <X className={styles.closeIcon} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            {/* Fila 1: Código y Nombre */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Código</label>
              <input
                type="text"
                value={formData.codigo}
                readOnly={true}
                className={`${styles.input} ${styles.readOnlyInput}`}
                placeholder="Código del producto"
                style={{
                  backgroundColor: '#f8f9fa',
                  color: '#6c757d',
                  cursor: 'not-allowed'
                }}
              />
              <small className={styles.helpText}>El código no puede ser modificado</small>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={styles.input}
                placeholder="Nombre del producto"
                required
              />
            </div>

            {/* Fila 2: Categoría y Unidad */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Categoría *</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={styles.input}
                placeholder="Categoría del producto"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Unidad</label>
              <input
                type="text"
                value={formData.unity}
                onChange={(e) => handleInputChange('unity', e.target.value)}
                className={styles.input}
                placeholder="Ej: Unidades, Kg, L"
              />
            </div>

            {/* Fila 3: Costo y Precio */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Costo *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => handleInputChange('cost', e.target.value)}
                className={styles.input}
                placeholder="0.00"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Precio *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className={styles.input}
                placeholder="0.00"
                required
              />
            </div>

            {/* Fila 4: Stock y Cantidad de Sabores */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Stock *</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', e.target.value)}
                className={styles.input}
                placeholder="0"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Cantidad de Sabores</label>
              <input
                type="number"
                min="0"
                value={formData.flavor_count}
                onChange={(e) => handleInputChange('flavor_count', e.target.value)}
                className={styles.input}
                placeholder="0"
              />
            </div>

            {/* Fila 5: Código de Barras */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Código de Barras</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => handleInputChange('barcode', e.target.value)}
                className={styles.input}
                placeholder="Código de barras del producto"
              />
            </div>

            {/* Fila 7: Descripción */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={styles.textarea}
                placeholder="Descripción detallada del producto"
                rows="3"
              />
            </div>
          </div>

          {/* ✅ NUEVA SECCIÓN UNIFICADA DE MÉTRICAS EN 3 COLUMNAS */}
          {((formData.cost && formData.price) || (product.cost && product.price)) && (
            <div className={styles.productMetrics}>
              
              {/* Columna 1: Margen Calculado */}
              {formData.cost && formData.price && (
                <div className={`${styles.metricItem} ${styles.highlighted} ${
                  parseFloat(formData.cost) > parseFloat(formData.price) ? styles.error : ''
                }`}>
                  <span className={styles.metricLabel}>Margen Calculado</span>
                  <span className={styles.metricValue}>{calculateMargin()}%</span>
                  {parseFloat(formData.cost) > parseFloat(formData.price) && (
                    <span className={styles.metricWarning}>
                      <span className={styles.warningIcon}>⚠️</span>
                      Costo &gt; Precio
                    </span>
                  )}
                </div>
              )}
              
              {/* Columna 2: Margen Actual */}
              <div className={`${styles.metricItem} ${styles.marginCurrent}`}>
                <span className={styles.metricLabel}>Margen Actual</span>
                <span className={styles.metricValue}>
                  {product.cost && product.price 
                    ? `${(((product.price - product.cost) / product.cost) * 100).toFixed(1)}%`
                    : 'N/A'
                  }
                </span>
              </div>
              
              {/* Columna 3: Valor en Stock */}
              <div className={`${styles.metricItem} ${styles.stockValue}`}>
                <span className={styles.metricLabel}>Valor en Stock</span>
                <span className={styles.metricValue}>
                  ${(parseFloat(formData.price || product.price || 0) * 
                    parseInt(formData.stock || product.stock || 0)).toFixed(2)}
                </span>
              </div>
              
            </div>
          )}

          {/* Botones de acción */}
          <div className={styles.actionButtons}>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className={styles.spinner}></div>
                  <span>Actualizando...</span>
                </>
              ) : (
                <>
                  <Save className={styles.buttonIcon} />
                  <span>Actualizar Producto</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProductModal;