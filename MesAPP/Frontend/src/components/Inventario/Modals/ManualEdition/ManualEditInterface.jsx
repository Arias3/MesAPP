import React, { useState, useEffect } from 'react';
import { X, Trash2, CheckCircle, Info } from 'lucide-react';
import { useConfirmationModal, confirmationPresets } from './../Confirmaciones/ConfirmationModal.jsx';
import { ManualEditInterfaceLogic } from './ManualEditInterface.js';
import { FieldTranslator } from './../../Helpers/Translator/FieldTranslator.js';
import styles from './ManualEditInterface.module.css';

export const ManualEditInterface = ({ 
  data,
  onSave, 
  onCancel,
  apiBaseUrl,
  importMode = 'replace' // ✅ NUEVA PROP: Modo de importación
}) => {
  const [editedRows, setEditedRows] = useState({});
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [deletedRows, setDeletedRows] = useState(new Set());
  const [isSaved, setIsSaved] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState('');

  const API_HOST = import.meta.env.VITE_API_HOST;
  const API_PORT = import.meta.env.VITE_API_PORT;
  const API_BASE_URL = apiBaseUrl || `http://${API_HOST}:${API_PORT}`;

  const { ConfirmationModalComponent, showConfirmation } = useConfirmationModal();

  const rowsToEdit = (data.data ? data.data.incompleteRows : data.incompleteRows) || [];

  // ✅ NUEVO: Crear instancia de ManualEditInterfaceLogic
  const [logic] = useState(() => new ManualEditInterfaceLogic({
    baseURL: API_BASE_URL
  }, importMode));

  // ✅ ACTUALIZAR modo cuando cambie la prop
  useEffect(() => {
    logic.setImportMode(importMode);
    console.log('🔧 ManualEditInterface: Modo actualizado a:', importMode);
  }, [importMode, logic]);

  // ✅ NUEVO: Obtener categorías con sabores de forma compatible
  const getCategoriesWithFlavors = () => {
    // Soportar ambas estructuras para compatibilidad
    if (data.categoriesWithFlavors) {
      return data.categoriesWithFlavors;
    }
    
    // Fallback a estructura antigua
    if (data.availableCategories) {
      return data.availableCategories.map(category => ({
        categoryName: typeof category === 'string' ? category : category.categoryName,
        maxFlavors: typeof category === 'object' ? category.maxFlavors : null
      }));
    }
    
    return [];
  };

  // ✅ NUEVO: Obtener información de una categoría específica
  const getCategoryInfo = (categoryName) => {
    const categories = getCategoriesWithFlavors();
    const category = categories.find(cat => cat.categoryName === categoryName);
    return category || { categoryName, maxFlavors: 0 };
  };

  // ✅ NUEVO: Manejar cambio de categoría y ajustar Flavor_Count automáticamente
  const handleCategoryChange = (rowIndex, fieldName, value) => {
    const categoryInfo = getCategoryInfo(value);
    
    // Actualizar categoría
    setEditedRows(prev => ({
      ...prev,
      [rowIndex]: {
        ...prev[rowIndex],
        [fieldName]: value,
        // ✅ AUTO-AJUSTAR Flavor_Count cuando cambia categoría
        Flavor_Count: categoryInfo.maxFlavors === 0 ? 0 : (prev[rowIndex]?.Flavor_Count || 0)
      }
    }));

    // Limpiar errores
    setValidationErrors(prev => ({
      ...prev,
      [rowIndex]: {
        ...prev[rowIndex],
        [fieldName]: false,
        Flavor_Count: false // También limpiar error de Flavor_Count
      }
    }));
  };

  // CAMPOS REQUERIDOS
  const requiredFields = [
    'Code', 'Category', 'Name', 'Cost', 'Price', 'Stock',
    'Barcode', 'Unit', 'Flavor_Count', 'Description'
  ];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = '17px';
    
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, []);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && !isClosing && !isProcessing) {
        event.preventDefault();
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isClosing, isProcessing]);

  useEffect(() => {
    const initialData = {};
    rowsToEdit.forEach((row, index) => {
      initialData[index] = { ...row.originalRow };
    });
    setEditedRows(initialData);
  }, [rowsToEdit]);

  const handleFieldChange = (rowIndex, fieldName, value) => {
    setEditedRows(prev => ({
      ...prev,
      [rowIndex]: {
        ...prev[rowIndex],
        [fieldName]: value
      }
    }));

    setValidationErrors(prev => ({
      ...prev,
      [rowIndex]: {
        ...prev[rowIndex],
        [fieldName]: false
      }
    }));
  };

  const validateRowData = (rowData) => {
    const errors = {};

    requiredFields.forEach(field => {
      const value = rowData[field];
      const isEmpty = value === null || value === undefined || 
                     (typeof value === 'string' && value.trim() === '') ||
                     value === '';
      
      if (isEmpty) {
        errors[field] = true;
      }
    });

    return errors;
  };

  const validateAllEditedRows = () => {
    const allErrors = {};
    let hasErrors = false;

    Object.keys(editedRows).forEach(rowIndex => {
      if (deletedRows.has(parseInt(rowIndex))) return;
      
      const rowErrors = validateRowData(editedRows[rowIndex]);
      if (Object.keys(rowErrors).length > 0) {
        allErrors[rowIndex] = rowErrors;
        hasErrors = true;
      }
    });

    return { hasErrors, allErrors };
  };

  const handleDeleteRow = async (rowIndex) => {
    const confirmed = await showConfirmation(confirmationPresets.deleteRow);
    
    if (confirmed) {
      setDeletedRows(prev => new Set([...prev, rowIndex]));
      
      if (currentRowIndex === rowIndex) {
        const nextAvailableIndex = findNextAvailableRow(rowIndex);
        if (nextAvailableIndex !== -1) {
          setCurrentRowIndex(nextAvailableIndex);
        }
      }
    }
  };

  const findNextAvailableRow = (currentIndex) => {
    const totalRows = rowsToEdit.length;
    
    for (let i = currentIndex + 1; i < totalRows; i++) {
      if (!deletedRows.has(i)) return i;
    }
    
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (!deletedRows.has(i)) return i;
    }
    
    return -1;
  };

  const getAvailableRows = () => {
    return rowsToEdit.filter((_, index) => !deletedRows.has(index));
  };

  const handleSave = async () => {
    const { hasErrors, allErrors } = validateAllEditedRows();
    
    if (hasErrors) {
      setValidationErrors(allErrors);
      
      const firstErrorRowIndex = Object.keys(allErrors)[0];
      setCurrentRowIndex(parseInt(firstErrorRowIndex));
      
      await showConfirmation(confirmationPresets.validationError);
      return;
    }

    const confirmed = await showConfirmation(confirmationPresets.saveChanges);
    
    if (confirmed) {
      const correctedEditedRows = Object.keys(editedRows)
        .filter(rowIndex => !deletedRows.has(parseInt(rowIndex)))
        .map(rowIndex => ({
          originalRow: editedRows[rowIndex],
          rowNumber: rowsToEdit[rowIndex].rowNumber
        }));

      const finalCorrectedRows = [
        ...data.completeRows,
        ...correctedEditedRows
      ];

      console.log('📋 Gran listado final:', {
        completeRowsOriginal: data.completeRows.length,
        correctedRows: correctedEditedRows.length,
        deletedRows: deletedRows.size,
        totalFinal: finalCorrectedRows.length,
        importMode: importMode
      });

      setIsSaved(true);
    }
  };

  const handleCloseAfterSave = () => {
    console.log('🔄 ManualEditInterface: Cerrando después de guardado exitoso...');
    setIsClosing(true);
    
    setTimeout(() => {
      onCancel();
    }, 300);
  };

  const handleFinalSave = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      setProcessingProgress('Preparando productos...');
      
      const correctedEditedRows = Object.keys(editedRows)
        .filter(rowIndex => !deletedRows.has(parseInt(rowIndex)))
        .map(rowIndex => ({
          originalRow: editedRows[rowIndex],
          rowNumber: rowsToEdit[rowIndex].rowNumber
        }));

      console.log('🚀 ManualEditInterface: Iniciando procesamiento final');
      console.log(`📊 Productos completos: ${data.completeRows.length}`);
      console.log(`📊 Productos corregidos: ${correctedEditedRows.length}`);
      console.log(`🎯 Modo de importación: ${importMode}`);

      const result = await logic.processAllProducts(
        data.completeRows,
        correctedEditedRows,
        setProcessingProgress
      );

      if (result.success) {
        console.log('✅ ManualEditInterface: Procesamiento exitoso:', result);
        setProcessingProgress(result.message);
        
        setTimeout(() => {
          handleCloseAfterSave();
        }, 2000);
        
      } else {
        throw new Error(result.message || 'Error en el procesamiento');
      }
      
    } catch (error) {
      console.error('❌ ManualEditInterface: Error en procesamiento final:', error);
      setProcessingProgress('');
      setIsProcessing(false);
      
      alert(`Error al procesar productos: ${error.message}`);
    }
  };

  const handleCancel = async () => {
    if (isClosing || isProcessing) return;
    
    const confirmed = await showConfirmation(confirmationPresets.cancelChanges);
    
    if (confirmed) {
      setIsClosing(true);
      
      setTimeout(() => {
        onCancel();
      }, 300);
    }
  };

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget && !isClosing && !isProcessing) {
      handleCancel();
    }
  };

  const navigateToRow = (direction) => {
    if (isProcessing) return;
    
    const availableIndexes = rowsToEdit
      .map((_, index) => index)
      .filter(index => !deletedRows.has(index));
    
    const currentPosition = availableIndexes.indexOf(currentRowIndex);
    
    if (direction === 'prev' && currentPosition > 0) {
      setCurrentRowIndex(availableIndexes[currentPosition - 1]);
    } else if (direction === 'next' && currentPosition < availableIndexes.length - 1) {
      setCurrentRowIndex(availableIndexes[currentPosition + 1]);
    }
  };

  // Si no hay filas disponibles
  const availableRows = getAvailableRows();
  if (availableRows.length === 0 && !isSaved) {
    return (
      <>
        <div className={`${styles.modalOverlay} ${isClosing ? styles.modalClosing : ''}`} onClick={handleOverlayClick}>
          <div className={`${styles.manualEditInterface} ${styles.modalContent} ${isClosing ? styles.modalContentClosing : ''}`}>
            <div className={styles.header}>
              <h3>Edición Manual de Datos</h3>
              <button onClick={handleCancel} className={styles.closeBtn}>
                <X />
              </button>
            </div>
            <div className={styles.noRowsMessage}>
              <p>No hay filas para editar o todas han sido eliminadas.</p>
              <button onClick={handleCancel} className={styles.cancelBtn}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
        <ConfirmationModalComponent />
      </>
    );
  }

  // ✅ ACTUALIZADO: Pantalla de confirmación después de guardar con modo
  if (isSaved) {
    const correctedCount = Object.keys(editedRows).length - deletedRows.size;
    const totalCount = data.completeRows.length + correctedCount;
    
    return (
      <>
        <div className={`${styles.modalOverlay} ${isClosing ? styles.modalClosing : ''}`} onClick={handleOverlayClick}>
          <div className={`${styles.manualEditInterface} ${styles.modalContent} ${isClosing ? styles.modalContentClosing : ''}`}>
            <div className={styles.header}>
              <h3>Resultados Guardados</h3>
              {!isProcessing && (
                <button onClick={handleCloseAfterSave} className={styles.closeBtn}>
                  <X />
                </button>
              )}
            </div>
            
            <div className={styles.modeInfo}>
              <Info className={styles.infoIcon} />
              <span>Modo: <strong>{importMode === 'replace' ? 'Reemplazar Inventario' : 'Actualizar/Crear'}</strong></span>
            </div>
            
            <div className={styles.saveSuccess}>
              <CheckCircle className={styles.successIcon} />
              <h4>¡Cambios guardados exitosamente!</h4>
              <div className={styles.saveSummary}>
                <p><strong>Productos completos originales:</strong> {data.completeRows.length}</p>
                <p><strong>Productos corregidos:</strong> {correctedCount}</p>
                <p><strong>Productos eliminados:</strong> {deletedRows.size}</p>
                <p><strong>Total final a procesar:</strong> {totalCount}</p>
                <p><strong>Método de procesamiento:</strong> {importMode === 'replace' ? 'Reemplazar todo el inventario' : 'Actualizar existentes + crear nuevos'}</p>
              </div>
              
              {isProcessing && (
                <div className={styles.processingSection}>
                  <div className={styles.processingSpinner}></div>
                  <p className={styles.processingText}>{processingProgress}</p>
                </div>
              )}
              
              {!isProcessing && (
                <button onClick={handleFinalSave} className={styles.saveBtn}>
                  {importMode === 'replace' 
                    ? `Reemplazar Inventario (${totalCount} productos)` 
                    : `Actualizar/Crear Productos (${totalCount} productos)`
                  }
                </button>
              )}
            </div>
          </div>
        </div>
        <ConfirmationModalComponent />
      </>
    );
  }

  const currentRow = rowsToEdit[currentRowIndex];
  const editedData = editedRows[currentRowIndex] || {};
  const currentRowErrors = validationErrors[currentRowIndex] || {};

  if (deletedRows.has(currentRowIndex)) {
    const nextIndex = findNextAvailableRow(currentRowIndex);
    if (nextIndex !== -1) {
      setCurrentRowIndex(nextIndex);
    }
    return null;
  }

  if (!currentRow) return null;

  // Determinar campos editables y no editables
  const editableFields = [];
  const nonEditableFields = [];

  requiredFields.forEach(field => {
    const value = currentRow.originalRow[field];
    const isEmpty = value === null || value === undefined || 
                   (typeof value === 'string' && value.trim() === '') ||
                   value === '';
    
    if (isEmpty) {
      editableFields.push(field);
    } else {
      nonEditableFields.push(field);
    }
  });

  const availableIndexes = rowsToEdit
    .map((_, index) => index)
    .filter(index => !deletedRows.has(index));
  const currentPosition = availableIndexes.indexOf(currentRowIndex) + 1;

  // ✅ NUEVO: Información de categoría actual para Flavor_Count
  const currentCategory = editedData['Category'];
  const categoryInfo = getCategoryInfo(currentCategory);
  const maxFlavors = categoryInfo.maxFlavors || 0;

  return (
    <>
      <div className={`${styles.modalOverlay} ${isClosing ? styles.modalClosing : ''}`} onClick={handleOverlayClick}>
        <div className={`${styles.manualEditInterface} ${styles.modalContent} ${isClosing ? styles.modalContentClosing : ''}`}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h3>Edición Manual de Datos</h3>
              <p>Producto {currentPosition} de {availableRows.length} (Producto {currentRow.rowNumber} del Excel)</p>
              <div className={styles.modeIndicator}>
                <Info className={styles.modeIcon} />
                <span>Modo: <strong>{importMode === 'replace' ? 'Reemplazar' : 'Actualizar/Crear'}</strong></span>
              </div>
            </div>
            <button onClick={handleCancel} className={styles.closeBtn} disabled={isClosing || isProcessing}>
              <X />
            </button>
          </div>

          <div className={styles.progressSection}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progress}
                style={{ width: `${(currentPosition / availableRows.length) * 100}%` }}
              />
            </div>
          </div>
          
          <div className={styles.summaryFooter}>
            <div className={styles.summaryStats}>
              <span>Completos: {data.completeRows.length}</span>
              <span>Editando: {availableRows.length}</span>
              <span>Eliminados: {deletedRows.size}</span>
              <span>Total: {data.completeRows.length + availableRows.length}</span>
            </div>
          </div>

          <div className={styles.rowInfo}>
            <div className={styles.rowHeader}>
              <h4>Información del producto</h4>
              <button 
                onClick={() => handleDeleteRow(currentRowIndex)}
                className={styles.deleteRowBtn}
                title="Eliminar fila completa"
                disabled={isClosing || isProcessing}
              >
                <Trash2 />
                Eliminar producto
              </button>
            </div>

            {editableFields.length > 0 && (
              <div className={styles.warningSection}>
                <h5>Campos a Completar ({editableFields.length})</h5>
                <p>Los siguientes campos están vacíos y necesitan ser completados:</p>
                <div className={styles.fieldList}>
                  {FieldTranslator.formatFieldList(editableFields)}
                </div>
              </div>
            )}

            {nonEditableFields.length > 0 && (
              <div className={styles.infoSection}>
                <h5>Campos Ya Completados ({nonEditableFields.length})</h5>
                <p>Los siguientes campos ya tienen datos válidos:</p>
                <div className={styles.fieldList}>
                  {FieldTranslator.formatFieldList(nonEditableFields)}
                </div>
              </div>
            )}
          </div>

          <div className={styles.fieldsEditor}>
            <div className={styles.fieldsGrid}>
              {requiredFields.map(fieldName => {
                const isEditable = editableFields.includes(fieldName);
                const hasError = currentRowErrors[fieldName];
                const spanishLabel = FieldTranslator.translate(fieldName);
                
                if (fieldName === 'Category') {
                  const categoriesWithFlavors = getCategoriesWithFlavors();
                  
                  return (
                    <div key={fieldName} className={styles.fieldGroup}>
                      <label className={hasError ? styles.errorLabel : ''}>
                        {spanishLabel}
                        {hasError && <span className={styles.requiredIndicator}> *Obligatorio</span>}
                        {!isEditable && <span className={styles.completeIndicator}> ✓</span>}
                      </label>
                      <select 
                        value={editedData[fieldName] || ''}
                        onChange={(e) => handleCategoryChange(currentRowIndex, fieldName, e.target.value)}
                        className={hasError ? styles.error : (isEditable ? styles.editable : styles.readonly)}
                        disabled={!isEditable || isClosing || isProcessing}
                      >
                        <option value="">Seleccionar categoría...</option>
                        {categoriesWithFlavors.map(category => (
                          <option key={category.categoryName} value={category.categoryName}>
                            {category.categoryName}
                            {category.maxFlavors !== null && category.maxFlavors !== undefined 
                              ? ` (${category.maxFlavors} sabores)` 
                              : ''
                            }
                          </option>
                        ))}
                      </select>
                      {hasError && (
                        <span className={styles.errorMessage}>
                          {FieldTranslator.getErrorMessage(fieldName)}
                        </span>
                      )}
                    </div>
                  );
                }

                // ✅ NUEVO: DROPDOWN DINÁMICO PARA FLAVOR_COUNT
                if (fieldName === 'Flavor_Count') {
                  const currentFlavorCount = editedData[fieldName] || 0;
                  const hasValidCategory = currentCategory && currentCategory !== '';
                  const isFlavorCountEditable = isEditable && hasValidCategory;
                  
                  return (
                    <div key={fieldName} className={styles.fieldGroup}>
                      <label className={hasError ? styles.errorLabel : ''}>
                        {spanishLabel}
                        {hasError && <span className={styles.requiredIndicator}> *Obligatorio</span>}
                        {!isEditable && <span className={styles.completeIndicator}> ✓</span>}
                        {hasValidCategory && (
                          <span className={styles.categoryInfo}> 
                            (Máx: {maxFlavors})
                          </span>
                        )}
                      </label>
                      
                      {maxFlavors === 0 ? (
                        // Si la categoría no tiene sabores, mostrar input bloqueado con valor 0
                        <input
                          type="number"
                          value={0}
                          className={styles.readonly}
                          disabled={true}
                          placeholder="Sin sabores disponibles"
                        />
                      ) : (
                        // Si la categoría tiene sabores, mostrar dropdown dinámico
                        <select 
                          value={currentFlavorCount}
                          onChange={(e) => handleFieldChange(currentRowIndex, fieldName, parseInt(e.target.value))}
                          className={hasError ? styles.error : (isFlavorCountEditable ? styles.editable : styles.readonly)}
                          disabled={!isFlavorCountEditable || isClosing || isProcessing}
                        >
                          {!hasValidCategory && (
                            <option value="">Primero selecciona categoría...</option>
                          )}
                          {hasValidCategory && Array.from({ length: maxFlavors + 1 }, (_, i) => (
                            <option key={i} value={i}>
                              {i} {i === 1 ? 'sabor' : 'sabores'}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      {hasError && (
                        <span className={styles.errorMessage}>
                          {FieldTranslator.getErrorMessage(fieldName)}
                        </span>
                      )}
                      
                      {!hasValidCategory && isEditable && (
                        <span className={styles.helpText}>
                        </span>
                      )}
                    </div>
                  );
                }

                // Campos normales (sin cambios)
                return (
                  <div key={fieldName} className={styles.fieldGroup}>
                    <label className={hasError ? styles.errorLabel : ''}>
                      {spanishLabel}
                      {hasError && <span className={styles.requiredIndicator}> *Obligatorio</span>}
                      {!isEditable && <span className={styles.completeIndicator}> ✓</span>}
                    </label>
                    <input
                      type={['Cost', 'Price', 'Stock'].includes(fieldName) ? 'number' : 'text'}
                      value={editedData[fieldName] || ''}
                      onChange={(e) => handleFieldChange(currentRowIndex, fieldName, e.target.value)}
                      className={hasError ? styles.error : (isEditable ? styles.editable : styles.readonly)}
                      disabled={!isEditable || isClosing || isProcessing}
                      placeholder={FieldTranslator.getPlaceholder(fieldName, isEditable)}
                    />
                    {hasError && (
                      <span className={styles.errorMessage}>
                        {FieldTranslator.getErrorMessage(fieldName)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.navigation}>
            <button 
              onClick={() => navigateToRow('prev')}
              disabled={availableIndexes.indexOf(currentRowIndex) === 0 || isClosing || isProcessing}
              className={styles.navBtn}
            >
              ← Anterior
            </button>
            
            <span className={styles.navCounter}>
              {currentPosition} / {availableRows.length}
            </span>
            
            <button 
              onClick={() => navigateToRow('next')}
              disabled={availableIndexes.indexOf(currentRowIndex) === availableIndexes.length - 1 || isClosing || isProcessing}
              className={styles.navBtn}
            >
              Siguiente →
            </button>
          </div>

          <div className={styles.actions}>
            <button onClick={handleCancel} className={styles.cancelBtn} disabled={isClosing || isProcessing}>
              Cancelar
            </button>
            <button onClick={handleSave} className={styles.saveBtn} disabled={isClosing || isProcessing}>
              Guardar Cambios ({data.completeRows.length + availableRows.length} productos)
            </button>
          </div>
        </div>
      </div>
      
      <ConfirmationModalComponent />
    </>
  );
};