import React, { useState, useRef } from 'react';
import { Upload, Download, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { ImportButtonLogic } from './importInventary.js';
import styles from './module.module.css';

const ImportButton = ({ onImportComplete, apiBaseUrl = 'http://localhost:5000/api' }) => {
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

  const handleDownloadTemplate = () => {
    importLogic.generateTemplate();
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await importLogic.processImport(selectedFile, setProgress);
      
      if (result.success) {
        setSuccess(result.message);
        // Llamar al callback para actualizar la lista de productos
        if (onImportComplete) {
          setTimeout(() => {
            onImportComplete();
          }, 1000);
        }
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
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

      {/* Modal de confirmación */}
      {showModal && (
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
              {/* Botón para descargar plantilla */}
              <button
                onClick={handleDownloadTemplate}
                className={styles.downloadButton}
                disabled={loading}
              >
                <Download className="h-4 w-4" />
                Descargar Plantilla Excel
              </button>

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
                  <div className={styles.fileInfoItem}>
                    <span className={styles.fileInfoLabel}>Tipo:</span>
                    <span className={styles.fileInfoValue}>{selectedFile.type || 'Excel'}</span>
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
                    <strong>Código:</strong> Código único del producto (opcional)
                  </li>
                  <li className={styles.formatItem}>
                    <CheckCircle className="h-4 w-4" />
                    <strong>Nombre:</strong> Nombre del producto (obligatorio)
                  </li>
                  <li className={styles.formatItem}>
                    <CheckCircle className="h-4 w-4" />
                    <strong>Costo:</strong> Costo del producto (obligatorio, número)
                  </li>
                  <li className={styles.formatItem}>
                    <CheckCircle className="h-4 w-4" />
                    <strong>Precio:</strong> Precio de venta (obligatorio, número)
                  </li>
                  <li className={styles.formatItem}>
                    <CheckCircle className="h-4 w-4" />
                    <strong>Stock:</strong> Cantidad en inventario (obligatorio, número entero)
                  </li>
                  <li className={styles.formatItem}>
                    <CheckCircle className="h-4 w-4" />
                    <strong>Barcode:</strong> Código de barras (opcional)
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
                </ul>
              </div>

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
                    disabled={loading || !selectedFile}
                  >
                    {loading ? 'Importando...' : 'Confirmar Importación'}
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