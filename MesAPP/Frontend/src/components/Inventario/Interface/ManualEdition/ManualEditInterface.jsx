import React, { useState, useEffect } from 'react';
import { X, Trash2, CheckCircle } from 'lucide-react';
import './ManualEditInterface.css';

export const ManualEditInterface = ({ 
  data, // { completeRows, incompleteRows, availableCategories, summary }
  onSave, 
  onCancel 
}) => {
  const [editedRows, setEditedRows] = useState({});
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [deletedRows, setDeletedRows] = useState(new Set());
  const [isSaved, setIsSaved] = useState(false);

  // Solo trabajamos con incompleteRows para edición
  const rowsToEdit = data.incompleteRows || [];

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

  const handleDeleteRow = (rowIndex) => {
    if (confirm('¿Está seguro de que desea eliminar esta fila completa?')) {
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

  const handleSave = () => {
    // Validar todos los datos editados antes de guardar
    const { hasErrors, allErrors } = validateAllEditedRows();
    
    if (hasErrors) {
      setValidationErrors(allErrors);
      
      // Ir a la primera fila con errores
      const firstErrorRowIndex = Object.keys(allErrors)[0];
      setCurrentRowIndex(parseInt(firstErrorRowIndex));
      
      alert('Hay campos obligatorios sin completar. Por favor, revise las filas marcadas con errores.');
      return;
    }

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
  };

  const handleFinalSave = () => {
    // Crear el gran listado final
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

    onSave(finalCorrectedRows);
  };

  const handleCancel = () => {
    if (confirm('¿Está seguro de que desea cancelar? Se perderán todos los cambios.')) {
      onCancel();
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
      <div className="manual-edit-interface">
        <div className="header">
          <h3>Edición Manual de Datos</h3>
          <button onClick={handleCancel} className="close-btn">
            <X />
          </button>
        </div>
        <div className="no-rows-message">
          <p>No hay filas para editar o todas han sido eliminadas.</p>
          <button onClick={handleCancel} className="cancel-btn">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  // Pantalla de confirmación después de guardar
  if (isSaved) {
    const correctedCount = Object.keys(editedRows).length - deletedRows.size;
    const totalCount = data.completeRows.length + correctedCount;
    
    return (
      <div className="manual-edit-interface">
        <div className="header">
          <h3>Resultados Guardados</h3>
          <button onClick={handleFinalSave} className="close-btn">
            <X />
          </button>
        </div>
        <div className="save-success">
          <CheckCircle className="success-icon" />
          <h4>¡Cambios guardados exitosamente!</h4>
          <div className="save-summary">
            <p><strong>Productos completos originales:</strong> {data.completeRows.length}</p>
            <p><strong>Productos corregidos:</strong> {correctedCount}</p>
            <p><strong>Productos eliminados:</strong> {deletedRows.size}</p>
            <p><strong>Total final a procesar:</strong> {totalCount}</p>
          </div>
          <button onClick={handleFinalSave} className="save-btn">
            Cerrar y Continuar
          </button>
        </div>
      </div>
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
    <div className="manual-edit-interface">
      <div className="header">
        <div className="header-content">
          <h3>Edición Manual de Datos</h3>
          <p>Fila {currentPosition} de {availableRows.length} (Fila {currentRow.rowNumber} del Excel)</p>
        </div>
        <button onClick={handleCancel} className="close-btn">
          <X />
        </button>
      </div>

      <div className="progress-section">
        <div className="progress-bar">
          <div 
            className="progress" 
            style={{ width: `${(currentPosition / availableRows.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="row-info">
        <div className="row-header">
          <h4>Información de la Fila</h4>
          <button 
            onClick={() => handleDeleteRow(currentRowIndex)}
            className="delete-row-btn"
            title="Eliminar fila completa"
          >
            <Trash2 />
            Eliminar Fila
          </button>
        </div>

        {/* Mostrar campos que necesitan ser completados */}
        {editableFields.length > 0 && (
          <div className="warning-section">
            <h5>Campos a Completar ({editableFields.length})</h5>
            <p>Los siguientes campos están vacíos y necesitan ser completados:</p>
            <div className="field-list">
              {editableFields.join(', ')}
            </div>
          </div>
        )}

        {/* Mostrar campos que no se pueden editar */}
        {nonEditableFields.length > 0 && (
          <div className="info-section">
            <h5>Campos Ya Completados ({nonEditableFields.length})</h5>
            <p>Los siguientes campos ya tienen datos válidos:</p>
            <div className="field-list">
              {nonEditableFields.join(', ')}
            </div>
          </div>
        )}
      </div>

      <div className="fields-editor">
        <div className="fields-grid">
          {requiredFields.map(fieldName => {
            const isEditable = editableFields.includes(fieldName);
            const hasError = currentRowErrors[fieldName];
            
            if (fieldName === 'Category') {
              return (
                <div key={fieldName} className="field-group">
                  <label className={hasError ? 'error-label' : ''}>
                    {fieldName} 
                    {hasError && <span className="required-indicator"> *Obligatorio</span>}
                    {!isEditable && <span className="complete-indicator"> ✓</span>}
                  </label>
                  <select 
                    value={editedData[fieldName] || ''}
                    onChange={(e) => handleFieldChange(currentRowIndex, fieldName, e.target.value)}
                    className={hasError ? 'error' : (isEditable ? 'editable' : 'readonly')}
                    disabled={!isEditable}
                  >
                    <option value="">Seleccionar categoría...</option>
                    {data.availableCategories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {hasError && <span className="error-message">Este campo es obligatorio</span>}
                </div>
              );
            }

            return (
              <div key={fieldName} className="field-group">
                <label className={hasError ? 'error-label' : ''}>
                  {fieldName} 
                  {hasError && <span className="required-indicator"> *Obligatorio</span>}
                  {!isEditable && <span className="complete-indicator"> ✓</span>}
                </label>
                <input
                  type={['Cost', 'Price', 'Flavor_Count', 'Stock'].includes(fieldName) ? 'number' : 'text'}
                  value={editedData[fieldName] || ''}
                  onChange={(e) => handleFieldChange(currentRowIndex, fieldName, e.target.value)}
                  className={hasError ? 'error' : (isEditable ? 'editable' : 'readonly')}
                  disabled={!isEditable}
                  placeholder={isEditable ? 'Completar campo...' : 'Campo ya completado'}
                />
                {hasError && <span className="error-message">Este campo es obligatorio</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="navigation">
        <button 
          onClick={() => navigateToRow('prev')}
          disabled={availableIndexes.indexOf(currentRowIndex) === 0}
          className="nav-btn"
        >
          ← Anterior
        </button>
        
        <span className="nav-counter">
          {currentPosition} / {availableRows.length}
        </span>
        
        <button 
          onClick={() => navigateToRow('next')}
          disabled={availableIndexes.indexOf(currentRowIndex) === availableIndexes.length - 1}
          className="nav-btn"
        >
          Siguiente →
        </button>
      </div>

      <div className="actions">
        <button onClick={handleCancel} className="cancel-btn">
          Cancelar
        </button>
        <button onClick={handleSave} className="save-btn">
          Guardar Cambios ({data.completeRows.length + availableRows.length} productos)
        </button>
      </div>

      <div className="summary-footer">
        <div className="summary-stats">
          <span>Completos: {data.completeRows.length}</span>
          <span>Editando: {availableRows.length}</span>
          <span>Eliminados: {deletedRows.size}</span>
          <span>Total: {data.completeRows.length + availableRows.length}</span>
        </div>
      </div>
    </div>
  );
};