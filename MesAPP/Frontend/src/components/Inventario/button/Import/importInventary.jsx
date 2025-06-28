import React, { useState, useRef } from 'react';
import { Upload, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { ImportButtonLogic } from './importInventary.js';
import styles from './../button.module.css';

const ImportButton = ({ 
  apiBaseUrl = `http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}/api`
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isClosing, setIsClosing] = useState(false);
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
        alert('No se preocupe, solo necesitamos que seleccione un archivo de Excel. Por favor elija un archivo que termine en .xlsx o .xls');
        return;
      }

      setSelectedFile(file);
      setShowModal(true);
      setError('');
      setSuccess('');
      setIsClosing(false);
    }
  };

  // ✅ FUNCIÓN MEJORADA PARA CERRAR MODAL CON CONFIRMACIÓN
  const closeModalWithConfirmation = (shouldEmitEvent = false, eventData = null) => {
    console.log('🔄 ImportButton: Iniciando cierre de modal...');
    setIsClosing(true);
    
    // Limpiar estados
    setTimeout(() => {
      setShowModal(false);
      setSelectedFile(null);
      setError('');
      setSuccess('');
      setProgress('');
      setIsClosing(false);
      
      // Limpiar el input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      console.log('✅ ImportButton: Modal cerrado completamente');
      
      // ✅ EMITIR EVENTO DESPUÉS DE QUE EL MODAL SE HAYA CERRADO
      if (shouldEmitEvent && eventData) {
        console.log('📡 ImportButton: Emitiendo evento después del cierre:', eventData);
        window.dispatchEvent(new CustomEvent('importModalClosed', {
          detail: eventData
        }));
      }
      
    }, 300); // Dar tiempo para la animación de cierre
  };

  const handleConfirmImport = async () => {
    // Validar que tengamos archivo para procesar
    if (!selectedFile) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await importLogic.processImport(
        selectedFile, 
        setProgress
      );
      
      if (result.success) {
        setSuccess(result.message);
        
        // Cerrar modal después de éxito completo
        setTimeout(() => {
          closeModalWithConfirmation();
          
          // Emitir evento para recargar productos
          window.dispatchEvent(new CustomEvent('importCompleted'));
        }, 3000); // Reducido de 8000 a 3000ms
        
      } else if (result.needsManualEdit) {
        console.log('🚨 ImportButton: Se necesita edición manual');
        console.log('📦 ImportButton: Datos completos a enviar:', result);
        
        // Mostrar mensaje positivo al usuario
        setSuccess('¡Perfecto! Vamos a mejorar juntos algunos productos. Preparando la ventana de edición...');
        
        // ✅ CERRAR MODAL PRIMERO, LUEGO EMITIR EVENTO
        setTimeout(() => {
          console.log('🔄 ImportButton: Cerrando modal antes de abrir ManualEditInterface...');
          closeModalWithConfirmation(true, result); // Cerrar Y emitir evento
        }, 2500); // Reducido de 5000 a 2500ms
        
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('No se preocupe, solo necesitamos intentar de nuevo: ' + err.message);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleCloseModal = () => {
    if (!loading && !isClosing) {
      closeModalWithConfirmation();
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
        <span>Cargar mis productos</span>
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
        <div className={`${styles.modalOverlay} ${isClosing ? styles.modalClosing : ''}`}>
          <div className={`${styles.modalContent} ${isClosing ? styles.modalContentClosing : ''}`}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Cargar sus Productos desde Excel</h3>
              <button 
                onClick={handleCloseModal} 
                className={styles.closeButton}
                disabled={loading || isClosing}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Información del archivo seleccionado */}
              {selectedFile && (
                <div className={styles.fileInfo}>
                  <div className={styles.fileInfoTitle}>Su archivo seleccionado:</div>
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
                  Su archivo de Excel debe tener estas columnas:
                </div>
                <ul className={styles.formatList}>
                  <li className={styles.formatItem}>
                    <CheckCircle className="h-4 w-4" />
                    <strong>Code:</strong> Código por producto (requerido)
                  </li>
                  <li className={styles.formatItem}>
                    <CheckCircle className="h-4 w-4" />
                    <strong>Category:</strong> Categoría del producto (requerido)
                  </li>
                  <li className={styles.formatItem}>
                    <CheckCircle className="h-4 w-4" />
                    <strong>Name:</strong> Nombre del producto (requerido)
                  </li>
                  <li className={styles.formatItem}>
                    <CheckCircle className="h-4 w-4" />
                    <strong>Cost:</strong> Costo de producción (requerido, solo números)
                  </li>
                  <li className={styles.formatItem}>
                    <CheckCircle className="h-4 w-4" />
                    <strong>Price:</strong> Precio de venta (requerido, solo números)
                  </li>
                  <li className={styles.formatItem}>
                    <CheckCircle className="h-4 w-4" />
                    <strong>Stock:</strong> Total en inventario (requerido)
                  </li>
                  <li className={styles.formatItem}>
                    <CheckCircle className="h-4 w-4" />
                    <strong>Barcode:</strong> Código de barras (opcional)
                  </li>
                  <li className={styles.formatItem}>
                    <CheckCircle className="h-4 w-4" />
                    <strong>Unit:</strong> Unidad de medida (requerido)[kg, unidad]
                  </li>
                  <li className={styles.formatItem}>
                    <CheckCircle className="h-4 w-4" />
                    <strong>Image_URL:</strong> Nombre guardado (opcional)
                  </li>
                  <li className={styles.formatItem}>
                    <CheckCircle className="h-4 w-4" />
                    <strong>Flavor_Count:</strong> Sabores de helado (opcional, solo números)
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
                  Advertencias:
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
                  <li className={styles.formatItem}>
                    <AlertTriangle className="h-4 w-4" />
                    En el botón <strong>Exportar</strong> encuentra una <strong>plantilla válida</strong>
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
                  <div className={styles.errorTitle}>Necesitamos revisar algo:</div>
                  <div className={styles.errorText}>{error}</div>
                </div>
              )}

              {/* Mensaje de éxito o información */}
              {success && (
                <div className={styles.successMessage}>
                  <div className={styles.successTitle}>
                    {success.includes('Perfecto') ? '🎯 Vamos a mejorar juntos' : '¡Felicidades! Todo salió perfecto'}
                  </div>
                  <div className={styles.successText}>{success}</div>
                  {success.includes('Perfecto') && (
                    <div className={styles.progressText} style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                      {isClosing ? 'Cerrando...' : 'Esta ventana se cerrará en unos segundos...'}
                    </div>
                  )}
                </div>
              )}

              {/* Estado de carga */}
              {loading && (
                <div className={styles.loading}>
                  <div className={styles.loadingSpinner}></div>
                  <span className={styles.loadingText}>Trabajando en sus productos...</span>
                </div>
              )}

              {/* Botones de acción */}
              {!success && (
                <div className={styles.actionButtons}>
                  <button
                    onClick={handleCloseModal}
                    className={styles.cancelButton}
                    disabled={loading || isClosing}
                  >
                    Mejor no ahora
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    className={styles.confirmButton}
                    disabled={loading || !selectedFile || isClosing}
                  >
                    {loading ? 'Trabajando...' : 'Sí, cargar mis productos'}
                  </button>
                </div>
              )}

              {/* Botón de cerrar solo para importación exitosa completa */}
              {success && !success.includes('Perfecto') && (
                <div className={styles.actionButtons}>
                  <button
                    onClick={handleCloseModal}
                    className={styles.confirmButton}
                    disabled={isClosing}
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