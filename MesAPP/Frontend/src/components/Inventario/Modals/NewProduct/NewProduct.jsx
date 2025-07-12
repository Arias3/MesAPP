import { useState, useEffect } from 'react';
import { Plus, X, Package, Save, ChevronDown } from 'lucide-react';
import { NewProductLogic } from './NewProduct.js';
import { useConfirmationModal, confirmationPresets } from './../Confirmaciones/ConfirmationModal.jsx';
import styles from './NewProduct.module.css';

function NewProduct({ onProductCreated, apiConfig = {} }) {
  // Estados del modal y formulario
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  
  // Estados para validación visual
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Estados para categorías
  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    code: '',
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

  // Instancia de la lógica de negocio
  const [productLogic] = useState(() => new NewProductLogic(apiConfig));
  
  // Hook para modal de confirmación
  const { ConfirmationModalComponent, showConfirmation } = useConfirmationModal();

  // ✅ NUEVA FUNCIÓN: Cargar categorías de la base de datos
  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      console.log('🏷️ NewProduct: Cargando categorías...');
      
      const result = await productLogic.loadValidCategories();
      
      if (result.success) {
        setCategories(result.categories);
        console.log('✅ NewProduct: Categorías cargadas:', result.categories);
      } else {
        console.error('❌ NewProduct: Error cargando categorías:', result.error);
        await showConfirmation({
          title: 'Error al Cargar Categorías',
          message: result.error || 'No se pudieron cargar las categorías disponibles',
          type: 'warning',
          confirmText: 'Entendido',
          showCancel: false
        });
      }
    } catch (error) {
      console.error('💥 NewProduct: Excepción cargando categorías:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // ✅ EFECTO: Cargar categorías cuando se abre el modal
  useEffect(() => {
    if (showModal) {
      loadCategories();
    }
  }, [showModal]);

  // ✅ NUEVA FUNCIÓN: Validar campos visualmente
  const validateFieldsVisually = (data) => {
    const errors = {};
    const requiredFields = ['code', 'name', 'category', 'cost', 'price', 'stock'];
    
    requiredFields.forEach(field => {
      if (!data[field] || data[field].toString().trim() === '') {
        errors[field] = true;
      }
    });

    // Validaciones específicas de valores
    if (data.cost && parseFloat(data.cost) < 0) {
      errors.cost = true;
    }
    if (data.price && parseFloat(data.price) < 0) {
      errors.price = true;
    }
    if (data.stock && parseInt(data.stock) < 0) {
      errors.stock = true;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handlers del formulario
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // ✅ LIMPIAR ERROR VISUAL al escribir
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: false
      }));
    }
  };

  // ✅ NUEVA FUNCIÓN: Handler para seleccionar categoría
  const handleCategorySelect = (category) => {
    handleInputChange('category', category);
    setShowCategoryDropdown(false);
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
      flavor_count: '',
      description: ''
    });
    setFieldErrors({});
    setShowCategoryDropdown(false);
  };

  // Handler principal del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    // ✅ VALIDACIÓN VISUAL ANTES DE ENVIAR
    const isValid = validateFieldsVisually(formData);
    
    if (!isValid) {
      await showConfirmation({
        title: 'Campos Incompletos',
        message: 'Por favor complete todos los campos obligatorios marcados en amarillo.',
        type: 'warning',
        confirmText: 'Revisar',
        showCancel: false
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('📦 NewProduct: Procesando datos del formulario...');
      
      const result = await productLogic.processNewProduct(formData);
      
      if (result.success) {
        // ✅ PRODUCTO CREADO EXITOSAMENTE
        console.log('✅ NewProduct: Producto creado exitosamente');
        
        // Resetear formulario y cerrar modal
        resetForm();
        setShowModal(false);
        
        // Notificar al componente padre
        if (onProductCreated) {
          onProductCreated(result.product);
        }
        
        // Mostrar confirmación de éxito
        await showConfirmation({
          title: 'Producto Creado',
          message: result.message,
          type: 'success',
          confirmText: 'Perfecto',
          showCancel: false
        });
        
      } else {
        // ❌ ERROR EN LA CREACIÓN
        console.error('❌ NewProduct: Error en creación:', result.message);
        
        if (result.type === 'duplicate') {
          // 🔴 PRODUCTO DUPLICADO - Marcar código como error
          setFieldErrors(prev => ({ ...prev, code: true }));
          
          await showConfirmation(confirmationPresets.duplicateProduct);
          
        } else if (result.type === 'validation') {
          // 🔴 ERROR DE VALIDACIÓN - Revisar campos
          validateFieldsVisually(formData);
          
          await showConfirmation({
            title: 'Campos Incompletos',
            message: result.message,
            type: 'warning',
            confirmText: 'Revisar',
            showCancel: false
          });
          
        } else {
          // 🔴 ERROR TÉCNICO
          await showConfirmation({
            title: 'Error Técnico',
            message: result.message,
            type: 'danger',
            confirmText: 'Entendido',
            showCancel: false
          });
        }
      }
      
    } catch (error) {
      console.error('💥 NewProduct: Excepción en handleSubmit:', error);
      
      await showConfirmation({
        title: 'Error Inesperado',
        message: `Ocurrió un error inesperado: ${error.message}`,
        type: 'danger',
        confirmText: 'Entendido',
        showCancel: false
      });
      
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para cancelar
  const handleCancel = () => {
    if (isLoading) return;
    
    resetForm();
    setShowModal(false);
  };

  // Calcular margen para preview
  const calculateMargin = () => {
    return productLogic.calculateMargin(formData.cost, formData.price);
  };

  // ✅ FUNCIÓN HELPER: Obtener clase CSS para campos
  const getFieldClass = (fieldName) => {
    let className = styles.input;
    if (fieldErrors[fieldName]) {
      className += ` ${styles.inputWarning}`;
    }
    return className;
  };

  return (
    <>
      {/* Botón principal */}
      <button
        onClick={() => setShowModal(true)}
        className={styles.newProductButton}
        disabled={isLoading}
      >
        <Plus className="h-5 w-5" />
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
                    className={getFieldClass('code')}
                    placeholder="Código del producto"
                    required
                    disabled={isLoading}
                  />
                  {fieldErrors.code && (
                    <span className={styles.fieldHint}>Este campo es obligatorio</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Nombre *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={getFieldClass('name')}
                    placeholder="Nombre del producto"
                    required
                    disabled={isLoading}
                  />
                  {fieldErrors.name && (
                    <span className={styles.fieldHint}>Este campo es obligatorio</span>
                  )}
                </div>

                {/* Fila 2: Categoría (DROPDOWN) y Unidad */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Categoría *</label>
                  <div className={styles.dropdownContainer}>
                    <button
                      type="button"
                      onClick={() => !isLoading && setShowCategoryDropdown(!showCategoryDropdown)}
                      className={`${getFieldClass('category')} ${styles.dropdownButton}`}
                      disabled={isLoading || isLoadingCategories}
                    >
                      <span className={styles.dropdownText}>
                        {isLoadingCategories 
                          ? 'Cargando categorías...' 
                          : formData.category || 'Seleccionar categoría'}
                      </span>
                      <ChevronDown className={styles.dropdownIcon} />
                    </button>
                    
                    {showCategoryDropdown && !isLoadingCategories && (
                      <div className={styles.dropdownMenu}>
                        {categories.length > 0 ? (
                          categories.map((category, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleCategorySelect(category)}
                              className={styles.dropdownItem}
                              disabled={isLoading}
                            >
                              {category}
                            </button>
                          ))
                        ) : (
                          <div className={styles.dropdownEmpty}>
                            No hay categorías disponibles
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {fieldErrors.category && (
                    <span className={styles.fieldHint}>Debe seleccionar una categoría</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Unidad</label>
                  <input
                    type="text"
                    value={formData.unity}
                    onChange={(e) => handleInputChange('unity', e.target.value)}
                    className={styles.input}
                    placeholder="Ej: Unidades, Kg, L"
                    disabled={isLoading}
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
                    className={getFieldClass('cost')}
                    placeholder="0.00"
                    required
                    disabled={isLoading}
                  />
                  {fieldErrors.cost && (
                    <span className={styles.fieldHint}>Ingrese un costo válido (≥0)</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Precio *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className={getFieldClass('price')}
                    placeholder="0.00"
                    required
                    disabled={isLoading}
                  />
                  {fieldErrors.price && (
                    <span className={styles.fieldHint}>Ingrese un precio válido (≥0)</span>
                  )}
                </div>

                {/* Fila 4: Stock y Cantidad de Sabores */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Stock *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => handleInputChange('stock', e.target.value)}
                    className={getFieldClass('stock')}
                    placeholder="0"
                    required
                    disabled={isLoading}
                  />
                  {fieldErrors.stock && (
                    <span className={styles.fieldHint}>Ingrese un stock válido (≥0)</span>
                  )}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                  disabled={isLoading || isLoadingCategories}
                >
                  {isLoading ? (
                    <>
                      <div className={styles.spinner}></div>
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span>Crear Producto</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      <ConfirmationModalComponent />
    </>
  );
}

export default NewProduct;