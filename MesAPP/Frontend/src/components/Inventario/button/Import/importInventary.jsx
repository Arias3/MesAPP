import React, { useState, useRef } from 'react';
import { Upload, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { ImportButtonLogic } from './importInventary.js';
import styles from './../button.module.css';

const ImportButton = ({ 
  onImportComplete, 
  onNeedsManualEdit, 
  apiBaseUrl = 'http://localhost:5000/api',
  fixedTable = 0,
  importOpen = 1,
  setImportOpen,
  correctedData = null
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const importLogic = new ImportButtonLogic(apiBaseUrl);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar que sea un archivo Excel
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        alert('Por favor seleccione un archivo Excel válido (.xlsx o .xls)');
        return;
      }

      setSelectedFile(file);
      setShowModal(true);
      setError('');
      setSuccess('');
    }
  };

  // ✅ FUNCIÓN CALLBACK PARA CONTROLAR importOpen
  const handleImportOpenChange = (newState) => {
    if (setImportOpen) {
      setImportOpen(newState);
    }
  };

  const handleConfirmImport = async () => {
    // Si fixedTable = 1, usar correctedData; si fixedTable = 0, usar selectedFile
    if (!selectedFile && fixedTable === 0) return;
    if (!correctedData && fixedTable === 1) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await importLogic.processImport(
        selectedFile, 
        setProgress,
        fixedTable,
        correctedData,
        handleImportOpenChange // ✅ Callback para controlar importOpen
      );
      
      if (result.success) {
        setSuccess(result.message);
        if (onImportComplete) {
          setTimeout(() => {
            onImportComplete();
          }, 1000);
        }
      } else if (result.needsManualEdit) {
        // ✅ SOLO PASAR DATOS A FULLINVENTORY - NO LLAMAR MANUALEDITINTERFACE
        console.log('Se necesita edición manual, enviando datos a FullInventory...');
        
        if (onNeedsManualEdit) {
          onNeedsManualEdit(result.data);
        }
        
        // ✅ IMPORTANTE: No cerrar modal, FullInventory controlará la superposición
        
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error inesperado: ' + err.message);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleCloseModal = () => {
    if (!loading) {
      setShowModal(false);
      setSelectedFile(null);
      setError('');
      setSuccess('');
      setProgress('');
      
      // Limpiar el input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // ✅ RESETEAR importOpen a activo cuando se cierre manualmente
      if (setImportOpen) {
        setImportOpen(1);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // ✅ EFECTO PARA CONTROLAR VISIBILIDAD DEL MODAL BASADO EN importOpen
  React.useEffect(() => {
    if (importOpen === 0 && showModal) {
      setShowModal(false);
    }
  }, [importOpen, showModal]);

  return (
    <>
      {/* Botón principal */}
      <button
        onClick={handleButtonClick}
        className={styles.importInventary}
        disabled={loading}
      >
        <Upload className="h-5 w-5" />
        <span>Importar Excel</span>
      </button>

      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        onChange={handleFileSelect}
        className={styles.fileInput}
      />

      {/* ✅ MODAL DE CONFIRMACIÓN - Solo se muestra si importOpen === 1 */}
      {showModal && importOpen === 1 && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Importar Productos desde Excel</h3>
              <button 
                onClick={handleCloseModal} 
                className={styles.closeButton}
                disabled={loading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* ✅ MOSTRAR INFORMACIÓN DIFERENTE SEGÚN fixedTable */}
              {fixedTable === 1 ? (
                <div className={styles.fixedTableInfo}>
                  <div className={styles.fixedTableTitle}>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Datos corregidos listos para importar
                  </div>
                  <p className={styles.fixedTableText}>
                    Los datos han sido corregidos y están listos para ser procesados.
                    Se procesarán {correctedData ? correctedData.length : 0} productos.
                  </p>
                </div>
              ) : (
                <>
                  {/* Información del archivo seleccionado */}
                  {selectedFile && (
                    <div className={styles.fileInfo}>
                      <div className={styles.fileInfoTitle}>Archivo seleccionado:</div>
                      <div className={styles.fileInfoItem}>
                        <span className={styles.fileInfoLabel}>Nombre:</span>
                        <span className={styles.fileInfoValue}>{selectedFile.name}</span>
                      </div>
                      <div className={styles.fileInfoItem}>
                        <span className={styles.fileInfoLabel}>Tamaño:</span>
                        <span className={styles.fileInfoValue}>{formatFileSize(selectedFile.size)}</span>
                      </div>
                    </div>
                  )}

                  {/* Formato esperado */}
                  <div className={styles.formatSection}>
                    <div className={styles.formatTitle}>
                      <Info className="h-5 w-5" />
                      Formato esperado del Excel:
                    </div>
                    <ul className={styles.formatList}>
                      <li className={styles.formatItem}>
                        <CheckCircle className="h-4 w-4" />
                        <strong>Code:</strong> Código único del producto (obligatorio)
                      </li>
                      <li className={styles.formatItem}>
                        <CheckCircle className="h-4 w-4" />
                        <strong>Category:</strong> Categoría del producto (obligatorio)
                      </li>
                      <li className={styles.formatItem}>
                        <CheckCircle className="h-4 w-4" />
                        <strong>Name:</strong> Nombre del producto (obligatorio)
                      </li>
                      <li className={styles.formatItem}>
                        <CheckCircle className="h-4 w-4" />
                        <strong>Cost:</strong> Costo del producto (obligatorio, número)
                      </li>
                      <li className={styles.formatItem}>
                        <CheckCircle className="h-4 w-4" />
                        <strong>Price:</strong> Precio de venta (obligatorio, número)
                      </li>
                      <li className={styles.formatItem}>
                        <CheckCircle className="h-4 w-4" />
                        <strong>Stock:</strong> Cantidad en inventario (Depende unidad medida)
                      </li>
                      <li className={styles.formatItem}>
                        <CheckCircle className="h-4 w-4" />
                        <strong>Barcode:</strong> Código de barras (opcional)
                      </li>
                      <li className={styles.formatItem}>
                        <CheckCircle className="h-4 w-4" />
                        <strong>Unit:</strong> Unidad de medida (obligatorio)
                      </li>
                      <li className={styles.formatItem}>
                        <CheckCircle className="h-4 w-4" />
                        <strong>Image_URL:</strong> URL de la imagen (opcional)
                      </li>
                      <li className={styles.formatItem}>
                        <CheckCircle className="h-4 w-4" />
                        <strong>Flavor_Count:</strong> Cantidad de sabores (Depende categoría)
                      </li>
                      <li className={styles.formatItem}>
                        <CheckCircle className="h-4 w-4" />
                        <strong>Description:</strong> Descripción del producto (opcional)
                      </li>
                    </ul>
                  </div>

                  {/* Advertencias */}
                  <div className={styles.warningSection}>
                    <div className={styles.warningTitle}>
                      <AlertTriangle className="h-5 w-5" />
                      ¡IMPORTANTE! Advertencias:
                    </div>
                    <ul className={styles.warningList}>
                      <li className={styles.warningItem}>
                        <AlertTriangle className="h-4 w-4" />
                        Esta acción <strong>ELIMINARÁ TODOS</strong> los productos existentes
                      </li>
                      <li className={styles.warningItem}>
                        <AlertTriangle className="h-4 w-4" />
                        Se reemplazarán con los productos del archivo Excel
                      </li>
                      <li className={styles.warningItem}>
                        <AlertTriangle className="h-4 w-4" />
                        Esta acción <strong>NO SE PUEDE DESHACER</strong>
                      </li>
                      <li className={styles.warningItem}>
                        <AlertTriangle className="h-4 w-4" />
                        Asegúrese de tener una copia de seguridad si es necesario
                      </li>
                      <li className={styles.warningItem}>
                        <AlertTriangle className="h-4 w-4" />
                        <strong>VERIFICAR obligatoriedad de los campos</strong> 
                      </li>
                      <li className={styles.warningItem}>
                        <AlertTriangle className="h-4 w-4" />
                        En el botón <strong>Exportar</strong> encuentra una <strong>plantilla válida</strong>
                      </li>
                    </ul>
                  </div>
                </>
              )}

              {/* Progreso de importación */}
              {loading && (
                <div className={styles.progressSection}>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '100%' }}></div>
                  </div>
                  <div className={styles.progressText}>{progress}</div>
                </div>
              )}

              {/* Mensaje de error */}
              {error && (
                <div className={styles.errorMessage}>
                  <div className={styles.errorTitle}>Error al importar:</div>
                  <div className={styles.errorText}>{error}</div>
                </div>
              )}

              {/* Mensaje de éxito */}
              {success && (
                <div className={styles.successMessage}>
                  <div className={styles.successTitle}>¡Importación exitosa!</div>
                  <div className={styles.successText}>{success}</div>
                </div>
              )}

              {/* Estado de carga */}
              {loading && (
                <div className={styles.loading}>
                  <div className={styles.loadingSpinner}></div>
                  <span className={styles.loadingText}>Procesando...</span>
                </div>
              )}

              {/* Botones de acción */}
              {!success && (
                <div className={styles.actionButtons}>
                  <button
                    onClick={handleCloseModal}
                    className={styles.cancelButton}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    className={styles.confirmButton}
                    disabled={loading || (fixedTable === 0 && !selectedFile) || (fixedTable === 1 && !correctedData)}
                  >
                    {loading ? 'Importando...' : (fixedTable === 1 ? 'Procesar Datos Corregidos' : 'Confirmar Importación')}
                  </button>
                </div>
              )}

              {/* Botón de cerrar cuando hay éxito */}
              {success && (
                <div className={styles.actionButtons}>
                  <button
                    onClick={handleCloseModal}
                    className={styles.confirmButton}
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImportButton;