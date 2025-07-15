import { useState, useEffect } from 'react';
import { X, Package, Save, Edit, ChevronDown } from 'lucide-react';
import { FlavorValidator } from './../../Helpers/Validators/Flavor/FlavorValidator.js'; // ✅ NUEVO IMPORT
import styles from './EditProductModal.module.css';

function EditProductModal({ product, onClose, onProductUpdated, apiConfig = {}, apiBaseUrl }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFlavorInfo, setIsLoadingFlavorInfo] = useState(false); // ✅ NUEVO - específico para cargar info de sabores
  
  // ✅ NUEVOS ESTADOS para dropdown de sabores
  const [currentCategoryFlavorInfo, setCurrentCategoryFlavorInfo] = useState(null);
  const [showFlavorDropdown, setShowFlavorDropdown] = useState(false);
  
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

  // ✅ NUEVA INSTANCIA del FlavorValidator
  const [flavorValidator] = useState(() => new FlavorValidator(apiConfig));

  // ✅ NUEVA FUNCIÓN: Cargar información de sabores para la categoría del producto
  const loadFlavorInfoForCategory = async (categoryName) => {
    if (!categoryName || categoryName.trim() === '') {
      console.log('🏷️ EditProductModal: Categoría vacía, no se puede cargar info de sabores');
      setCurrentCategoryFlavorInfo(null);
      return;
    }

    try {
      setIsLoadingFlavorInfo(true);
      console.log('🏷️ EditProductModal: Cargando información de sabores para categoría:', categoryName);
      
      // ✅ OBTENER RESUMEN DE SABORES (incluye búsqueda insensible a mayúsculas)
      const summaryResult = await flavorValidator.getFlavorsSummary();
      
      if (summaryResult.success) {
        // ✅ BÚSQUEDA INSENSIBLE A MAYÚSCULAS/MINÚSCULAS
        const normalizedSearchCategory = categoryName.toLowerCase().trim();
        const matchingCategory = summaryResult.data.find(cat => 
          cat.categoryName.toLowerCase().trim() === normalizedSearchCategory
        );
        
        if (matchingCategory) {
          console.log('✅ EditProductModal: Categoría encontrada:', matchingCategory);
          setCurrentCategoryFlavorInfo(matchingCategory);
        } else {
          console.warn('⚠️ EditProductModal: Categoría no encontrada en base de sabores:', categoryName);
          console.log('   📋 Categorías disponibles:', summaryResult.data.map(c => c.categoryName));
          setCurrentCategoryFlavorInfo({
            categoryName: categoryName,
            maxFlavors: 0,
            activeFlavors: 0,
            flavorNames: []
          });
        }
      } else {
        console.error('❌ EditProductModal: Error obteniendo resumen de sabores:', summaryResult.error);
        setCurrentCategoryFlavorInfo(null);
      }
    } catch (error) {
      console.error('💥 EditProductModal: Excepción cargando información de sabores:', error);
      setCurrentCategoryFlavorInfo(null);
    } finally {
      setIsLoadingFlavorInfo(false);
    }
  };

  // ✅ EFECTO: Cargar información de sabores cuando se abre el modal
  useEffect(() => {
    if (product && product.category) {
      console.log('🔄 EditProductModal: Producto recibido, cargando info de sabores para:', product.category);
      loadFlavorInfoForCategory(product.category);
    }
  }, [product]);

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

  // ✅ NUEVA FUNCIÓN: Verificar si la categoría actual permite sabores
  const canEditFlavors = () => {
    if (!currentCategoryFlavorInfo) return false;
    return currentCategoryFlavorInfo.maxFlavors > 0;
  };

  // ✅ NUEVA FUNCIÓN: Generar opciones para flavor_count dropdown
  const generateFlavorCountOptions = () => {
    if (!canEditFlavors()) return [];
    
    const maxFlavors = currentCategoryFlavorInfo.maxFlavors;
    
    return Array.from({ length: maxFlavors + 1 }, (_, i) => ({
      value: i,
      label: `${i} ${i === 1 ? 'sabor' : 'sabores'}`
    }));
  };

  // ✅ NUEVA FUNCIÓN: Handler para seleccionar flavor_count
  const handleFlavorCountSelect = (value) => {
    handleInputChange('flavor_count', value.toString());
    setShowFlavorDropdown(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // ✅ Si cambia la categoría, recargar información de sabores
    if (field === 'category') {
      console.log('🔄 EditProductModal: Categoría cambiada a:', value);
      loadFlavorInfoForCategory(value);
      setShowFlavorDropdown(false); // Cerrar dropdown de sabores
    }
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
              <label className={styles.label}>
                Cantidad de Sabores
                {currentCategoryFlavorInfo && (
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>
                    {isLoadingFlavorInfo 
                      ? ' (Verificando...)' 
                      : canEditFlavors() 
                      ? ` (Máx: ${currentCategoryFlavorInfo.maxFlavors})` 
                      : ' (Sin sabores disponibles)'
                    }
                  </span>
                )}
              </label>
              
              {isLoadingFlavorInfo ? (
                // ✅ ESTADO DE CARGA
                <input
                  type="text"
                  value="Cargando información..."
                  className={styles.input}
                  disabled={true}
                  style={{
                    backgroundColor: '#f8f9fa',
                    color: '#6c757d',
                    cursor: 'wait'
                  }}
                />
              ) : canEditFlavors() ? (
                // ✅ DROPDOWN para categorías que SÍ permiten sabores
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => !isLoading && setShowFlavorDropdown(!showFlavorDropdown)}
                    className={styles.input}
                    disabled={isLoading}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      background: '#ffffff',
                      width: '100%'
                    }}
                  >
                    <span>
                      {formData.flavor_count !== '' 
                        ? `${formData.flavor_count} ${formData.flavor_count === '1' ? 'sabor' : 'sabores'}`
                        : 'Seleccionar cantidad...'
                      }
                    </span>
                    <ChevronDown style={{ width: '16px', height: '16px', color: '#64748b' }} />
                  </button>
                  
                  {showFlavorDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {generateFlavorCountOptions().map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleFlavorCountSelect(option.value)}
                          disabled={isLoading}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            background: 'white',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#1e293b'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.target.style.background = 'white'}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // ✅ INPUT DESHABILITADO para categorías que NO permiten sabores
                <input
                  type="number"
                  min="0"
                  value={currentCategoryFlavorInfo ? '0' : ''}
                  className={styles.input}
                  placeholder={currentCategoryFlavorInfo ? '0' : 'Categoría sin información de sabores'}
                  disabled={true}
                  style={{
                    backgroundColor: '#f8f9fa',
                    color: '#6c757d',
                    cursor: 'not-allowed'
                  }}
                />
              )}
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
              disabled={isLoading || isLoadingFlavorInfo}
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