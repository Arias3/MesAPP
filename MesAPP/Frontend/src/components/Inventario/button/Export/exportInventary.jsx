import React, { useState, useRef } from 'react';
import { Download, FileSpreadsheet, Filter, BarChart3, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { ExportButtonLogic } from './exportInventary.js';
import styles from './../button.module.css';

const ExportButton = ({ apiBaseUrl = 'http://localhost:5000/api' }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState('current');
  const [filters, setFilters] = useState({
    categoria: '',
    stockBajo: false,
    sinStock: false,
    margenMinimo: ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const exportLogic = new ExportButtonLogic(apiBaseUrl);

  const handleButtonClick = () => {
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    if (!loading) {
      setShowModal(false);
      setExportType('current');
      setFilters({
        categoria: '',
        stockBajo: false,
        sinStock: false,
        margenMinimo: ''
      });
      setError('');
      setSuccess('');
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let result;

      switch (exportType) {
        case 'current':
          result = await exportLogic.exportCurrentProducts();
          break;
        case 'filtered':
          result = await exportLogic.exportFilteredProducts(filters);
          break;
        case 'template':
          result = exportLogic.exportTemplate();
          break;
        case 'report':
          result = await exportLogic.exportStatisticsReport();
          break;
        default:
          throw new Error('Tipo de exportación no válido');
      }

      if (result.success) {
        setSuccess(result.message);
      } else {
        setError(result.message);
      }

    } catch (err) {
      setError('Error inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getExportDescription = () => {
    switch (exportType) {
      case 'current':
        return 'Exportar todos los productos actuales del inventario con información completa incluyendo margen de ganancia y valor total por producto.';
      case 'filtered':
        return 'Exportar productos que cumplan con los filtros seleccionados. Permite filtrar por categoría, estado de stock y margen mínimo.';
      case 'template':
        return 'Descargar plantilla vacía con el formato correcto para importar productos. Incluye ejemplos y todas las columnas requeridas.';
      case 'report':
        return 'Generar reporte completo con estadísticas detalladas, análisis por categorías y resumen ejecutivo del inventario.';
      default:
        return '';
    }
  };

  return (
    <>
      {/* Botón principal */}
      <button
        onClick={handleButtonClick}
        className={styles.exportInventary}
        disabled={loading}
      >
        <Download className="h-4 w-4" />
        <span>Exportar</span>
      </button>

      {/* Modal de exportación */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Exportar Inventario</h3>
              <button 
                onClick={handleCloseModal} 
                className={styles.closeButton}
                disabled={loading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Tipos de exportación */}
              <div className={styles.exportTypeSection}>
                <h4 className={styles.exportTypeTitle}>Tipo de Exportación:</h4>
                
                <div className={styles.exportTypeList}>
                  {/* Exportar productos actuales */}
                  <label className={`${styles.exportTypeOption} ${exportType === 'current' ? styles.selected : ''}`}>
                    <input
                      type="radio"
                      name="exportType"
                      value="current"
                      checked={exportType === 'current'}
                      onChange={(e) => setExportType(e.target.value)}
                      className={styles.exportTypeRadio}
                      disabled={loading}
                    />
                    <div className={styles.exportTypeContent}>
                      <div className={styles.exportTypeHeader}>
                        <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                        <span className={styles.exportTypeName}>Inventario Completo</span>
                      </div>
                      <p className={styles.exportTypeDescription}>
                        Exportar todos los productos con información detallada
                      </p>
                    </div>
                  </label>

                  {/* Exportar con filtros */}
                  <label className={`${styles.exportTypeOption} ${exportType === 'filtered' ? styles.selected : ''}`}>
                    <input
                      type="radio"
                      name="exportType"
                      value="filtered"
                      checked={exportType === 'filtered'}
                      onChange={(e) => setExportType(e.target.value)}
                      className={styles.exportTypeRadio}
                      disabled={loading}
                    />
                    <div className={styles.exportTypeContent}>
                      <div className={styles.exportTypeHeader}>
                        <Filter className="h-4 w-4 text-purple-600" />
                        <span className={styles.exportTypeName}>Inventario Filtrado</span>
                      </div>
                      <p className={styles.exportTypeDescription}>
                        Exportar productos que cumplan criterios específicos
                      </p>
                    </div>
                  </label>

                  {/* Plantilla */}
                  <label className={`${styles.exportTypeOption} ${exportType === 'template' ? styles.selected : ''}`}>
                    <input
                      type="radio"
                      name="exportType"
                      value="template"
                      checked={exportType === 'template'}
                      onChange={(e) => setExportType(e.target.value)}
                      className={styles.exportTypeRadio}
                      disabled={loading}
                    />
                    <div className={styles.exportTypeContent}>
                      <div className={styles.exportTypeHeader}>
                        <Download className="h-4 w-4 text-green-600" />
                        <span className={styles.exportTypeName}>Plantilla de Importación</span>
                      </div>
                      <p className={styles.exportTypeDescription}>
                        Descargar plantilla vacía para importar productos
                      </p>
                    </div>
                  </label>

                  {/* Reporte de estadísticas */}
                  <label className={`${styles.exportTypeOption} ${exportType === 'report' ? styles.selected : ''}`}>
                    <input
                      type="radio"
                      name="exportType"
                      value="report"
                      checked={exportType === 'report'}
                      onChange={(e) => setExportType(e.target.value)}
                      className={styles.exportTypeRadio}
                      disabled={loading}
                    />
                    <div className={styles.exportTypeContent}>
                      <div className={styles.exportTypeHeader}>
                        <BarChart3 className="h-4 w-4 text-orange-600" />
                        <span className={styles.exportTypeName}>Reporte de Estadísticas</span>
                      </div>
                      <p className={styles.exportTypeDescription}>
                        Generar reporte con estadísticas y análisis detallado
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Filtros para exportación filtrada */}
              {exportType === 'filtered' && (
                <div className={styles.filtersSection}>
                  <h4 className={styles.filtersTitle}>Filtros de Exportación:</h4>
                  
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Categoría:</label>
                    <input
                      type="text"
                      placeholder="Filtrar por categoría..."
                      value={filters.categoria}
                      onChange={(e) => setFilters({...filters, categoria: e.target.value})}
                      className={styles.filterInput}
                      disabled={loading}
                    />
                  </div>

                  <div className={styles.filterGroup}>
                    <div className={styles.filterCheckboxGroup}>
                      <label className={styles.filterCheckbox}>
                        <input
                          type="checkbox"
                          checked={filters.stockBajo}
                          onChange={(e) => setFilters({...filters, stockBajo: e.target.checked})}
                          disabled={loading}
                        />
                        <span>Solo stock bajo (&lt;10)</span>
                      </label>

                      <label className={styles.filterCheckbox}>
                        <input
                          type="checkbox"
                          checked={filters.sinStock}
                          onChange={(e) => setFilters({...filters, sinStock: e.target.checked})}
                          disabled={loading}
                        />
                        <span>Solo productos agotados</span>
                      </label>
                    </div>
                  </div>

                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Margen mínimo (%):</label>
                    <input
                      type="number"
                      placeholder="Ej: 20"
                      value={filters.margenMinimo}
                      onChange={(e) => setFilters({...filters, margenMinimo: e.target.value})}
                      className={styles.filterInput}
                      disabled={loading}
                      min="0"
                      max="1000"
                    />
                  </div>
                </div>
              )}

              {/* Descripción del tipo seleccionado */}
              <div className={styles.descriptionSection}>
                <div className={styles.descriptionHeader}>
                  <CheckCircle className="h-5 w-5" />
                  <h4 className={styles.descriptionTitle}>Descripción:</h4>
                </div>
                <p className={styles.descriptionText}>{getExportDescription()}</p>
              </div>

              {/* Estado de carga */}
              {loading && (
                <div className={styles.progressSection}>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '100%' }}></div>
                  </div>
                  <div className={styles.progressText}>Generando archivo Excel...</div>
                </div>
              )}

              {/* Mensaje de error */}
              {error && (
                <div className={styles.errorMessage}>
                  <div className={styles.errorTitle}>
                    <AlertTriangle className="h-4 w-4" />
                    Error al exportar:
                  </div>
                  <div className={styles.errorText}>{error}</div>
                </div>
              )}

              {/* Mensaje de éxito */}
              {success && (
                <div className={styles.successMessage}>
                  <div className={styles.successTitle}>
                    <CheckCircle className="h-4 w-4" />
                    ¡Exportación exitosa!
                  </div>
                  <div className={styles.successText}>{success}</div>
                </div>
              )}

              {/* Estado de carga */}
              {loading && (
                <div className={styles.loading}>
                  <div className={styles.loadingSpinner}></div>
                  <span className={styles.loadingText}>Procesando exportación...</span>
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
                    onClick={handleExport}
                    className={`${styles.confirmButton} ${styles.export}`}
                    disabled={loading}
                  >
                    {loading ? 'Exportando...' : 'Exportar'}
                  </button>
                </div>
              )}

              {/* Botón de cerrar cuando hay éxito */}
              {success && (
                <div className={styles.actionButtons}>
                  <button
                    onClick={handleCloseModal}
                    className={`${styles.confirmButton} ${styles.export}`}
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

export default ExportButton;