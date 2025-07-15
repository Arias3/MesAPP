import { useState, useEffect } from 'react';
import { Plus, X, Package, Save, ChevronDown } from 'lucide-react';
import { NewProductLogic } from './NewProduct.js';
import { FlavorValidator } from './../../Helpers/Validators/Flavor/FlavorValidator.js'; // ✅ NUEVO IMPORT
import { useConfirmationModal, confirmationPresets } from './../Confirmaciones/ConfirmationModal.jsx';
import styles from './NewProduct.module.css';

function NewProduct({ onProductCreated, apiConfig = {} }) {
  // Estados del modal y formulario
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  
  // Estados para validación visual
  const [fieldErrors, setFieldErrors] = useState({});
  
  // ✅ MODIFICADO: Estados para categorías con sabores y dropdown de sabores
  const [categoriesWithFlavors, setCategoriesWithFlavors] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showFlavorDropdown, setShowFlavorDropdown] = useState(false); // ✅ NUEVO
  
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

  // Instancias de lógica de negocio
  const [productLogic] = useState(() => new NewProductLogic(apiConfig));
  const [flavorValidator] = useState(() => new FlavorValidator(apiConfig)); // ✅ NUEVO
  
  // Hook para modal de confirmación
  const { ConfirmationModalComponent, showConfirmation } = useConfirmationModal();

  // ✅ NUEVA FUNCIÓN: Cargar categorías con información de sabores
  const loadCategoriesWithFlavors = async () => {
    try {
      setIsLoadingCategories(true);
      console.log('🏷️ NewProduct: Cargando categorías con información de sabores...');
      
      const result = await flavorValidator.getFlavorsSummary();
      
      if (result.success) {
        setCategoriesWithFlavors(result.data);
        console.log('✅ NewProduct: Categorías con sabores cargadas:', result.data);
      } else {
        console.error('❌ NewProduct: Error cargando categorías:', result.error);
        
        // Fallback: cargar categorías simples si falla
        console.log('🔄 NewProduct: Intentando fallback a categorías simples...');
        const fallbackResult = await productLogic.loadValidCategories();
        
        if (fallbackResult.success) {
          // Convertir a formato con sabores (sin información de sabores)
          const fallbackCategories = fallbackResult.categories.map(cat => ({
            categoryName: cat,
            maxFlavors: null,
            activeFlavors: null,
            flavorNames: []
          }));
          setCategoriesWithFlavors(fallbackCategories);
          console.log('✅ NewProduct: Fallback a categorías simples exitoso');
        } else {
          await showConfirmation({
            title: 'Error al Cargar Categorías',
            message: 'No se pudieron cargar las categorías disponibles',
            type: 'warning',
            confirmText: 'Entendido',
            showCancel: false
          });
        }
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
      loadCategoriesWithFlavors();
    }
  }, [showModal]);

  // ✅ NUEVA FUNCIÓN: Obtener información de sabores para una categoría
  const getCategoryInfo = (categoryName) => {
    const category = categoriesWithFlavors.find(cat => cat.categoryName === categoryName);
    return category || { categoryName, maxFlavors: 0, activeFlavors: 0, flavorNames: [] };
  };

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

    // ✅ NUEVA VALIDACIÓN: Flavor_Count vs categoría seleccionada
    if (data.category && data.flavor_count !== '') {
      const categoryInfo = getCategoryInfo(data.category);
      const flavorCount = parseInt(data.flavor_count) || 0;
      
      // Si la categoría no permite sabores pero se especificó flavor_count > 0
      if (categoryInfo.maxFlavors === 0 && flavorCount > 0) {
        errors.flavor_count = true;
      }
      
      // Si flavor_count excede el máximo permitido
      if (categoryInfo.maxFlavors > 0 && flavorCount > categoryInfo.maxFlavors) {
        errors.flavor_count = true;
      }
      
      // Si flavor_count es negativo
      if (flavorCount < 0) {
        errors.flavor_count = true;
      }
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

  // ✅ NUEVA FUNCIÓN: Handler para seleccionar flavor_count
  const handleFlavorCountSelect = (value) => {
    handleInputChange('flavor_count', value.toString());
    setShowFlavorDropdown(false);
  };
  // ✅ MODIFICADA: Handler para seleccionar categoría con auto-ajuste de flavor_count
  const handleCategorySelect = (categoryName) => {
    const categoryInfo = getCategoryInfo(categoryName);
    
    setFormData(prev => ({
      ...prev,
      category: categoryName,
      // ✅ AUTO-AJUSTAR flavor_count según la categoría
      flavor_count: categoryInfo.maxFlavors === 0 ? '0' : prev.flavor_count
    }));
    
    setShowCategoryDropdown(false);
    setShowFlavorDropdown(false); // ✅ CERRAR dropdown de sabores también
    
    // Limpiar errores relacionados
    setFieldErrors(prev => ({
      ...prev,
      category: false,
      flavor_count: false
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
      flavor_count: '',
      description: ''
    });
    setFieldErrors({});
    setShowCategoryDropdown(false);
    setShowFlavorDropdown(false); // ✅ CERRAR ambos dropdowns
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

  // ✅ NUEVA FUNCIÓN: Generar opciones para flavor_count dropdown
  const generateFlavorCountOptions = () => {
    if (!formData.category) return [];
    
    const categoryInfo = getCategoryInfo(formData.category);
    const maxFlavors = categoryInfo.maxFlavors || 0;
    
    return Array.from({ length: maxFlavors + 1 }, (_, i) => ({
      value: i,
      label: `${i} ${i === 1 ? 'sabor' : 'sabores'}`
    }));
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

                {/* Fila 2: Categoría (DROPDOWN MEJORADO) y Unidad */}
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
                        {categoriesWithFlavors.length > 0 ? (
                          categoriesWithFlavors.map((category, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleCategorySelect(category.categoryName)}
                              className={styles.dropdownItem}
                              disabled={isLoading}
                            >
                              {category.categoryName}
                              {category.maxFlavors !== null && category.maxFlavors !== undefined && (
                                <span className={styles.categoryFlavorInfo}>
                                  ({category.maxFlavors} sabores)
                                </span>
                              )}
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

                {/* Fila 4: Stock y Cantidad de Sabores (DROPDOWN INTELIGENTE) */}
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

                {/* ✅ NUEVO: Campo inteligente para Flavor_Count con dropdown bonito */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Cantidad de Sabores
                    {formData.category && (
                      <span className={styles.flavorCountInfo}>
                        (Máx: {getCategoryInfo(formData.category).maxFlavors || 0})
                      </span>
                    )}
                  </label>
                  
                  <div className={styles.dropdownContainer}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isLoading && formData.category && getCategoryInfo(formData.category).maxFlavors > 0) {
                          setShowFlavorDropdown(!showFlavorDropdown);
                        }
                      }}
                      className={`${getFieldClass('flavor_count')} ${styles.dropdownButton}`}
                      disabled={isLoading || !formData.category || getCategoryInfo(formData.category).maxFlavors === 0}
                    >
                      <span className={styles.dropdownText}>
                        {!formData.category 
                          ? 'Primero selecciona categoría'
                          : getCategoryInfo(formData.category).maxFlavors === 0
                          ? '0 sabores (sin opciones)'
                          : formData.flavor_count !== '' 
                          ? `${formData.flavor_count} ${formData.flavor_count === '1' ? 'sabor' : 'sabores'}`
                          : 'Seleccionar cantidad...'
                        }
                      </span>
                      <ChevronDown className={styles.dropdownIcon} />
                    </button>
                    
                    {showFlavorDropdown && formData.category && getCategoryInfo(formData.category).maxFlavors > 0 && (
                      <div className={styles.dropdownMenu}>
                        {generateFlavorCountOptions().map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleFlavorCountSelect(option.value)}
                            className={styles.dropdownItem}
                            disabled={isLoading}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {fieldErrors.flavor_count && (
                    <span className={styles.fieldHint}>
                      {!formData.category 
                        ? 'Selecciona una categoría primero'
                        : 'Cantidad de sabores inválida para esta categoría'
                      }
                    </span>
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