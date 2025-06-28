import { useState } from 'react';
import { Plus, X, Package, Save } from 'lucide-react';
import styles from './NewProduct.module.css';

function NewProductInventary({ onProductCreated, apiBaseUrl }) {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    cost: '',
    price: '',
    stock: '',
    barcode: '',
    unity: '',
    image_url: '',
    flavor_count: '',
    description: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      category: '',
      cost: '',
      price: '',
      stock: '',
      barcode: '',
      unity: '',
      image_url: '',
      flavor_count: '',
      description: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.name || !formData.category || !formData.cost || !formData.price || !formData.stock) {
      alert('Por favor, complete los campos obligatorios: Nombre, Categoría, Costo, Precio y Stock');
      return;
    }

    setIsLoading(true);
    
    try {
      // Preparar datos para envío
      const productData = {
        ...formData,
        cost: parseFloat(formData.cost) || 0,
        price: parseFloat(formData.price) || 0,
        stock: parseInt(formData.stock) || 0,
        flavor_count: parseInt(formData.flavor_count) || 0
      };

      // Aquí irá la llamada a la API
      console.log('Enviando producto:', productData);
      
      // Simular llamada a API
      // const response = await fetch(`${apiBaseUrl}/products`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(productData)
      // });
      
      // if (!response.ok) {
      //   throw new Error('Error al crear el producto');
      // }
      
      // const result = await response.json();
      
      // Simular éxito
      setTimeout(() => {
        alert('Producto creado exitosamente');
        resetForm();
        setShowModal(false);
        if (onProductCreated) {
          onProductCreated();
        }
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error al crear producto:', error);
      alert('Error al crear el producto. Por favor, inténtelo de nuevo.');
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setShowModal(false);
  };

  // Calcular margen para preview
  const calculateMargin = () => {
    const cost = parseFloat(formData.cost) || 0;
    const price = parseFloat(formData.price) || 0;
    if (cost === 0) return 0;
    return (((price - cost) / cost) * 100).toFixed(1);
  };

  return (
    <>
      {/* Botón principal */}
      <button
        onClick={() => setShowModal(true)}
        className={styles.newProductButton}
        disabled={isLoading}
      >
        <Plus className={styles.buttonIcon} />
        <span>Añadir nuevo producto</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleSection}>
                <Package className={styles.modalIcon} />
                <h2 className={styles.modalTitle}>Crear Nuevo Producto</h2>
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
                  <label className={styles.label}>Código *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    className={styles.input}
                    placeholder="Código del producto"
                    required
                  />
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

                {/* Fila 6: URL de Imagen */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>URL de Imagen</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => handleInputChange('image_url', e.target.value)}
                    className={styles.input}
                    placeholder="https://ejemplo.com/imagen.jpg"
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

              {/* Preview del margen */}
              {formData.cost && formData.price && (
                <div className={styles.marginPreview}>
                  <span className={styles.marginLabel}>Margen calculado:</span>
                  <span className={styles.marginValue}>{calculateMargin()}%</span>
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
                      <span>Creando...</span>
                    </>
                  ) : (
                    <>
                      <Save className={styles.buttonIcon} />
                      <span>Crear Producto</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default NewProductInventary;