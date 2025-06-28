import React, { useState, useEffect } from 'react';
import { X, Trash2, CheckCircle } from 'lucide-react';
import { useConfirmationModal, confirmationPresets } from '../../Modals/Confirmaciones/ConfirmationModal.jsx';
import { FieldNormalizer } from '../../button/Import/Procesamiento/FieldNormalizer.js'; // ✅ IMPORTAR IGUAL QUE EN IMPORTBUTTONLOGIC
import styles from './ManualEditInterface.module.css';

export const ManualEditInterface = ({ 
  data, // { completeRows, incompleteRows, availableCategories, summary }
  onSave, 
  onCancel,
  apiBaseUrl // ✅ RECIBIR API_BASE_URL COMO PROP
}) => {
  const [editedRows, setEditedRows] = useState({});
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [deletedRows, setDeletedRows] = useState(new Set());
  const [isSaved, setIsSaved] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // ✅ USAR API_BASE_URL DE PROP O FALLBACK
  const API_HOST = import.meta.env.VITE_API_HOST;
  const API_PORT = import.meta.env.VITE_API_PORT;
  const API_BASE_URL = apiBaseUrl || `http://${API_HOST}:${API_PORT}`;

  // ✅ HOOK PARA MODAL DE CONFIRMACIÓN
  const { ConfirmationModalComponent, showConfirmation } = useConfirmationModal();

  // Solo trabajamos con incompleteRows para edición
  const rowsToEdit = (data.data ? data.data.incompleteRows : data.incompleteRows) || [];

  // ✅ EFECTO PARA PREVENIR SCROLL DEL FONDO
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = '17px';
    
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, []);

  // ✅ EFECTO PARA MANEJAR ESC KEY
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && !isClosing) {
        event.preventDefault();
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isClosing]);

  useEffect(() => {
    // Inicializar datos editables solo para filas incompletas
    const initialData = {};
    rowsToEdit.forEach((row, index) => {
      // Usar originalRow como base para edición
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

    // Limpiar error de validación cuando el usuario escribe
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
    const requiredFields = [
      'Code', 'Category', 'Name', 'Cost', 'Price', 'Stock',
      'Barcode', 'Unit', 'Image_URL', 'Flavor_Count', 'Description'
    ];

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
      // Solo validar filas que no han sido eliminadas
      if (deletedRows.has(parseInt(rowIndex))) return;
      
      const rowErrors = validateRowData(editedRows[rowIndex]);
      if (Object.keys(rowErrors).length > 0) {
        allErrors[rowIndex] = rowErrors;
        hasErrors = true;
      }
    });

    return { hasErrors, allErrors };
  };

  // ✅ FUNCIÓN MEJORADA PARA ELIMINAR FILA CON MODAL ESTILIZADO
  const handleDeleteRow = async (rowIndex) => {
    const confirmed = await showConfirmation(confirmationPresets.deleteRow);
    
    if (confirmed) {
      setDeletedRows(prev => new Set([...prev, rowIndex]));
      
      // Si estamos en la fila eliminada, ir a la siguiente disponible
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
    
    // Buscar hacia adelante
    for (let i = currentIndex + 1; i < totalRows; i++) {
      if (!deletedRows.has(i)) return i;
    }
    
    // Buscar hacia atrás
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (!deletedRows.has(i)) return i;
    }
    
    return -1; // No hay filas disponibles
  };

  const getAvailableRows = () => {
    return rowsToEdit.filter((_, index) => !deletedRows.has(index));
  };

  // ✅ FUNCIÓN IGUAL QUE EN IMPORTBUTTONLOGIC PARA CONVERTIR FILAS A PRODUCTOS
  const convertRowsToProducts = (rows) => {
    console.log('🔄 ManualEditInterface: Convirtiendo filas a productos normalizados...');
    console.log('   - Filas a convertir:', rows.length);
    
    const products = rows.map(rowData => {
      return FieldNormalizer.normalizeFromExcelRow(rowData.originalRow, rowData.rowNumber);
    });
    
    console.log('✅ ManualEditInterface: Productos normalizados:', products.length);
    console.log('   - Primer producto normalizado:', products[0]);
    
    return products;
  };

  // ✅ FUNCIÓN IGUAL QUE EN IMPORTBUTTONLOGIC PARA ENVIAR A BASE DE DATOS
  const importToDatabase = async (products) => {
    try {
      console.log('📡 ManualEditInterface: Enviando productos a la base de datos...');
      console.log('   - Total productos a enviar:', products.length);
      console.log('   - URL de destino:', `${API_BASE_URL}/api/productos/import`);
      
      const response = await fetch(`${API_BASE_URL}/api/productos/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productos: products,
          replaceAll: true
        }),
      });

      const data = await response.json();
      
      console.log('📡 ManualEditInterface: Respuesta del servidor:', response.status, response.statusText);
      console.log('📦 ManualEditInterface: Datos de respuesta:', data);

      if (!response.ok) {
        throw new Error(data.frontendMessage || data.message || 'Error al procesar los datos');
      }

      console.log('✅ ManualEditInterface: Productos guardados exitosamente');
      return data;
    } catch (error) {
      console.error('❌ ManualEditInterface: Error al enviar a BD:', error);
      throw new Error('Error al guardar en la base de datos: ' + error.message);
    }
  };

  // ✅ FUNCIÓN MEJORADA PARA GUARDAR CON VALIDACIÓN ESTILIZADA
  const handleSave = async () => {
    // Validar todos los datos editados antes de guardar
    const { hasErrors, allErrors } = validateAllEditedRows();
    
    if (hasErrors) {
      setValidationErrors(allErrors);
      
      // Ir a la primera fila con errores
      const firstErrorRowIndex = Object.keys(allErrors)[0];
      setCurrentRowIndex(parseInt(firstErrorRowIndex));
      
      // ✅ MOSTRAR ERROR CON MODAL ESTILIZADO
      await showConfirmation(confirmationPresets.validationError);
      return;
    }

    // ✅ CONFIRMAR GUARDADO CON MODAL ESTILIZADO
    const confirmed = await showConfirmation(confirmationPresets.saveChanges);
    
    if (confirmed) {
      // Crear el gran listado: completeRows + editedRows corregidas
      const correctedEditedRows = Object.keys(editedRows)
        .filter(rowIndex => !deletedRows.has(parseInt(rowIndex)))
        .map(rowIndex => ({
          originalRow: editedRows[rowIndex],
          rowNumber: rowsToEdit[rowIndex].rowNumber
        }));

      // Combinar productos completos + productos corregidos
      const finalCorrectedRows = [
        ...data.completeRows, // Productos que ya estaban bien
        ...correctedEditedRows // Productos que fueron corregidos
      ];

      console.log('📋 Gran listado final:', {
        completeRowsOriginal: data.completeRows.length,
        correctedRows: correctedEditedRows.length,
        deletedRows: deletedRows.size,
        totalFinal: finalCorrectedRows.length
      });

      // Mostrar confirmación de guardado
      setIsSaved(true);
    }
  };

  // ✅ FUNCIÓN PARA CERRAR SIN CONFIRMACIÓN (DESPUÉS DE GUARDADO EXITOSO)
  const handleCloseAfterSave = () => {
    console.log('🔄 ManualEditInterface: Cerrando después de guardado exitoso...');
    setIsClosing(true);
    
    setTimeout(() => {
      onCancel();
    }, 300);
  };

  // ✅ FUNCIÓN MEJORADA USANDO FIELDNORMALIZER IGUAL QUE IMPORTBUTTONLOGIC

  const handleFinalSave = async () => {
    // 1️⃣ CREAR GRAN LISTADO: productos buenos + productos corregidos
    const correctedEditedRows = Object.keys(editedRows)
      .filter(rowIndex => !deletedRows.has(parseInt(rowIndex)))
      .map(rowIndex => ({
        originalRow: editedRows[rowIndex],
        rowNumber: rowsToEdit[rowIndex].rowNumber
      }));

    const finalCorrectedRows = [
      ...data.completeRows,      // Productos que ya estaban bien
      ...correctedEditedRows     // Productos que fueron corregidos
    ];

    console.log('📋 Gran listado final:', {
      completeRowsOriginal: data.completeRows.length,
      correctedRows: correctedEditedRows.length,
      deletedRows: deletedRows.size,
      totalFinal: finalCorrectedRows.length
    });

    if (onSave) {
      onSave(finalCorrectedRows);
    } else {
      try {
        // 2️⃣ PASAR A FIELDNORMALIZER igual que ImportButtonLogic
        console.log('🔄 ManualEditInterface: Convirtiendo filas a productos normalizados...');
        const normalizedProducts = finalCorrectedRows.map(rowData => {
          return FieldNormalizer.normalizeFromExcelRow(rowData.originalRow, rowData.rowNumber);
        });
        
        console.log('✅ ManualEditInterface: Productos normalizados:', normalizedProducts.length);

        // 3️⃣ ENVIAR A BASE DE DATOS igual que ImportButtonLogic
        console.log('📡 ManualEditInterface: Enviando a base de datos...');
        const response = await fetch(`${API_BASE_URL}/api/productos/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productos: normalizedProducts,
            replaceAll: true
          }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.frontendMessage || result.message || 'Error al guardar productos');
        }

        console.log('✅ ManualEditInterface: Productos guardados exitosamente');
        
        // 4️⃣ ENVIAR SEÑAL A FULLINVENTORY PARA ACTUALIZAR TABLA
        window.dispatchEvent(new CustomEvent('databaseUpdated', {
          detail: {
            success: true,
            processedCount: result.imported || normalizedProducts.length,
            message: result.frontendMessage || 'Productos actualizados exitosamente',
            source: 'manualEditInterface'
          }
        }));
        
        console.log('📡 Señal databaseUpdated emitida correctamente');
        
        // 5️⃣ CERRAR MODAL
        handleCloseAfterSave();
        
      } catch (error) {
        console.error('❌ Error en ManualEditInterface:', error);
        
        // Enviar señal de error
        window.dispatchEvent(new CustomEvent('databaseUpdateError', {
          detail: {
            success: false,
            error: error.message,
            source: 'manualEditInterface'
          }
        }));
        
        alert(`Error al procesar datos: ${error.message}`);
      }
    }
  };

  // ✅ FUNCIÓN MEJORADA PARA CANCELAR CON MODAL ESTILIZADO
  const handleCancel = async () => {
    if (isClosing) return; // Prevenir múltiples clicks
    
    const confirmed = await showConfirmation(confirmationPresets.cancelChanges);
    
    if (confirmed) {
      console.log('🔄 ManualEditInterface: Iniciando cierre...');
      setIsClosing(true);
      
      // Esperar animación de cierre antes de ejecutar onCancel
      setTimeout(() => {
        onCancel();
      }, 300);
    }
  };

  // ✅ FUNCIÓN PARA MANEJAR CLICK EN OVERLAY
  const handleOverlayClick = (event) => {
    // Solo cerrar si se hace click directamente en el overlay, no en el contenido
    if (event.target === event.currentTarget && !isClosing) {
      handleCancel();
    }
  };

  const navigateToRow = (direction) => {
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

  // Si todas las filas han sido eliminadas o no hay filas para editar
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

  // Pantalla de confirmación después de guardar
  if (isSaved) {
    const correctedCount = Object.keys(editedRows).length - deletedRows.size;
    const totalCount = data.completeRows.length + correctedCount;
    
    return (
      <>
        <div className={`${styles.modalOverlay} ${isClosing ? styles.modalClosing : ''}`} onClick={handleOverlayClick}>
          <div className={`${styles.manualEditInterface} ${styles.modalContent} ${isClosing ? styles.modalContentClosing : ''}`}>
            <div className={styles.header}>
              <h3>Resultados Guardados</h3>
              <button onClick={handleCloseAfterSave} className={styles.closeBtn}>
                <X />
              </button>
            </div>
            <div className={styles.saveSuccess}>
              <CheckCircle className={styles.successIcon} />
              <h4>¡Cambios guardados exitosamente!</h4>
              <div className={styles.saveSummary}>
                <p><strong>Productos completos originales:</strong> {data.completeRows.length}</p>
                <p><strong>Productos corregidos:</strong> {correctedCount}</p>
                <p><strong>Productos eliminados:</strong> {deletedRows.size}</p>
                <p><strong>Total final a procesar:</strong> {totalCount}</p>
              </div>
              <button onClick={handleFinalSave} className={styles.saveBtn}>
                Procesar y Continuar
              </button>
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

  // Si la fila actual fue eliminada, encontrar la siguiente disponible
  if (deletedRows.has(currentRowIndex)) {
    const nextIndex = findNextAvailableRow(currentRowIndex);
    if (nextIndex !== -1) {
      setCurrentRowIndex(nextIndex);
    }
    return null;
  }

  if (!currentRow) return null;

  // Determinar qué campos están completos (no editables) y cuáles necesitan edición
  const requiredFields = ['Code', 'Category', 'Name', 'Cost', 'Price', 'Stock', 'Barcode', 'Unit', 'Image_URL', 'Flavor_Count', 'Description'];
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

  return (
    <>
      <div className={`${styles.modalOverlay} ${isClosing ? styles.modalClosing : ''}`} onClick={handleOverlayClick}>
        <div className={`${styles.manualEditInterface} ${styles.modalContent} ${isClosing ? styles.modalContentClosing : ''}`}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h3>Edición Manual de Datos</h3>
              <p>Fila {currentPosition} de {availableRows.length} (Fila {currentRow.rowNumber} del Excel)</p>
            </div>
            <button onClick={handleCancel} className={styles.closeBtn} disabled={isClosing}>
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

          <div className={styles.rowInfo}>
            <div className={styles.rowHeader}>
              <h4>Información de la Fila</h4>
              <button 
                onClick={() => handleDeleteRow(currentRowIndex)}
                className={styles.deleteRowBtn}
                title="Eliminar fila completa"
                disabled={isClosing}
              >
                <Trash2 />
                Eliminar Fila
              </button>
            </div>

            {/* Mostrar campos que necesitan ser completados */}
            {editableFields.length > 0 && (
              <div className={styles.warningSection}>
                <h5>Campos a Completar ({editableFields.length})</h5>
                <p>Los siguientes campos están vacíos y necesitan ser completados:</p>
                <div className={styles.fieldList}>
                  {editableFields.join(', ')}
                </div>
              </div>
            )}

            {/* Mostrar campos que no se pueden editar */}
            {nonEditableFields.length > 0 && (
              <div className={styles.infoSection}>
                <h5>Campos Ya Completados ({nonEditableFields.length})</h5>
                <p>Los siguientes campos ya tienen datos válidos:</p>
                <div className={styles.fieldList}>
                  {nonEditableFields.join(', ')}
                </div>
              </div>
            )}
          </div>

          <div className={styles.fieldsEditor}>
            <div className={styles.fieldsGrid}>
              {requiredFields.map(fieldName => {
                const isEditable = editableFields.includes(fieldName);
                const hasError = currentRowErrors[fieldName];
                
                if (fieldName === 'Category') {
                  return (
                    <div key={fieldName} className={styles.fieldGroup}>
                      <label className={hasError ? styles.errorLabel : ''}>
                        {fieldName} 
                        {hasError && <span className={styles.requiredIndicator}> *Obligatorio</span>}
                        {!isEditable && <span className={styles.completeIndicator}> ✓</span>}
                      </label>
                      <select 
                        value={editedData[fieldName] || ''}
                        onChange={(e) => handleFieldChange(currentRowIndex, fieldName, e.target.value)}
                        className={hasError ? styles.error : (isEditable ? styles.editable : styles.readonly)}
                        disabled={!isEditable || isClosing}
                      >
                        <option value="">Seleccionar categoría...</option>
                        {data.availableCategories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      {hasError && <span className={styles.errorMessage}>Este campo es obligatorio</span>}
                    </div>
                  );
                }

                return (
                  <div key={fieldName} className={styles.fieldGroup}>
                    <label className={hasError ? styles.errorLabel : ''}>
                      {fieldName} 
                      {hasError && <span className={styles.requiredIndicator}> *Obligatorio</span>}
                      {!isEditable && <span className={styles.completeIndicator}> ✓</span>}
                    </label>
                    <input
                      type={['Cost', 'Price', 'Flavor_Count', 'Stock'].includes(fieldName) ? 'number' : 'text'}
                      value={editedData[fieldName] || ''}
                      onChange={(e) => handleFieldChange(currentRowIndex, fieldName, e.target.value)}
                      className={hasError ? styles.error : (isEditable ? styles.editable : styles.readonly)}
                      disabled={!isEditable || isClosing}
                      placeholder={isEditable ? 'Completar campo...' : 'Campo ya completado'}
                    />
                    {hasError && <span className={styles.errorMessage}>Este campo es obligatorio</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.navigation}>
            <button 
              onClick={() => navigateToRow('prev')}
              disabled={availableIndexes.indexOf(currentRowIndex) === 0 || isClosing}
              className={styles.navBtn}
            >
              ← Anterior
            </button>
            
            <span className={styles.navCounter}>
              {currentPosition} / {availableRows.length}
            </span>
            
            <button 
              onClick={() => navigateToRow('next')}
              disabled={availableIndexes.indexOf(currentRowIndex) === availableIndexes.length - 1 || isClosing}
              className={styles.navBtn}
            >
              Siguiente →
            </button>
          </div>

          <div className={styles.actions}>
            <button onClick={handleCancel} className={styles.cancelBtn} disabled={isClosing}>
              Cancelar
            </button>
            <button onClick={handleSave} className={styles.saveBtn} disabled={isClosing}>
              Guardar Cambios ({data.completeRows.length + availableRows.length} productos)
            </button>
          </div>

          <div className={styles.summaryFooter}>
            <div className={styles.summaryStats}>
              <span>Completos: {data.completeRows.length}</span>
              <span>Editando: {availableRows.length}</span>
              <span>Eliminados: {deletedRows.size}</span>
              <span>Total: {data.completeRows.length + availableRows.length}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* ✅ MODAL DE CONFIRMACIÓN ESTILIZADO */}
      <ConfirmationModalComponent />
    </>
  );
};