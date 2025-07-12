import React, { useState } from 'react';
import { Download, FileSpreadsheet, X, CheckCircle, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from './exportInventary.module.css'

const ExportButton = ({ apiBaseUrl = `http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}` }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState('inventory');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleButtonClick = () => {
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    if (!loading) {
      setShowModal(false);
      setExportType('inventory');
      setError('');
      setSuccess('');
    }
  };

  // Obtener productos desde la API
  const fetchProductsFromAPI = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/productos`);
      
      if (!response.ok) {
        throw new Error(`Error al obtener productos: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📡 Respuesta del servidor:', data);
      
      if (!data.success || !Array.isArray(data.data)) {
        throw new Error('Formato de respuesta inesperado del servidor');
      }
      
      if (data.data.length === 0) {
        throw new Error('No hay productos disponibles en la base de datos');
      }
      
      console.log(`✅ Se obtuvieron ${data.data.length} productos de la API`);
      return data.data;
    } catch (error) {
      console.error('❌ Error al obtener productos:', error);
      throw new Error('Error de conexión: ' + error.message);
    }
  };

  // Formatear datos para exportación
  const formatDataForExport = (products) => {
    console.log('🔄 Formateando datos para exportación:', products.length, 'productos');
    console.log('👀 Primer producto a formatear:', products[0]);
    
    return products.map(product => ({
      'Code': product.codigo || '',
      'Category': product.category || '',
      'Name': product.nombre || '',
      'Cost': parseFloat(product.costo) || 0,
      'Price': parseFloat(product.precio) || 0,
      'Profiability': product.rentabilidad || '',
      'Stock': product.stock || '',
      'Barcode': product.barcode || '',
      'Unit': product.unit || '',
      'Flavor_Count': parseInt(product.flavor_count) || 0,
      'Description': product.description || '',
      'Ganancy': product.costo > 0 ? 
        (((parseFloat(product.precio) - parseFloat(product.costo)) / parseFloat(product.costo)) * 100).toFixed(2) : '0.00',
      'Total_Stock': (parseFloat(product.precio) * (parseFloat(product.stock) || 0)).toFixed(2)
    }));
  };

  // Exportar inventario completo
  const exportInventory = async () => {
    try {
      console.log('🚀 Iniciando exportación de inventario completo...');
      const products = await fetchProductsFromAPI();
      
      if (!products || products.length === 0) {
        throw new Error('No hay productos para exportar');
      }

      console.log(`📊 Formateando ${products.length} productos para Excel...`);
      const formattedData = formatDataForExport(products);
      
      // Crear el archivo Excel
      console.log('📝 Creando archivo Excel...');
      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      
      // Configurar ancho de columnas
      ws['!cols'] = [
        { wch: 15 }, // Código
        { wch: 25 }, // Categoría
        { wch: 35 }, // Nombre
        { wch: 10 }, // Costo
        { wch: 10 }, // Precio
        { wch: 15 }, // Rentabilidad
        { wch: 10 }, // Stock
        { wch: 18 }, // Código de Barras
        { wch: 12 }, // Unidad
        { wch: 12 }, // Cantidad Sabores
        { wch: 50 }, // Descripción
        { wch: 18 }, // Margen Calculado
        { wch: 18 }  // Valor Total Stock
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
      
      // Generar nombre de archivo
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
      const timeStr = now.toTimeString().slice(0, 5).replace(':', ''); // HHMM
      const filename = `inventario_completo_${dateStr}_${timeStr}.xlsx`;
      
      // Descargar archivo
      console.log(`💾 Descargando archivo: ${filename}`);
      XLSX.writeFile(wb, filename);
      
      console.log('✅ Exportación completada exitosamente');
      return {
        success: true,
        message: `Se exportaron ${products.length} productos exitosamente`,
        filename: filename,
        count: products.length
      };
      
    } catch (error) {
      console.error('❌ Error durante la exportación:', error);
      throw new Error(error.message);
    }
  };

  // Descargar plantilla fija
  const downloadTemplate = async () => {
    try {
      // Descargar el archivo desde assets/inventario/plantilla.xlsx
      const response = await fetch('/assets/inventario/plantilla.xlsx');
      
      if (!response.ok) {
        throw new Error('No se pudo encontrar la plantilla');
      }
      
      const blob = await response.blob();
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_inventario.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return {
        success: true,
        message: 'Plantilla descargada exitosamente',
        filename: 'plantilla_inventario.xlsx'
      };
      
    } catch (error) {
      throw new Error('Error al descargar la plantilla: ' + error.message);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let result;

      if (exportType === 'inventory') {
        result = await exportInventory();
      } else if (exportType === 'template') {
        result = await downloadTemplate();
      } else {
        throw new Error('Tipo de exportación no válido');
      }

      if (result.success) {
        setSuccess(result.message);
      } else {
        setError(result.message);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getExportDescription = () => {
    switch (exportType) {
      case 'inventory':
        return 'Exportar todos los productos del inventario con información completa incluyendo margen de ganancia y valor total por producto.';
      case 'template':
        return 'Descargar plantilla con el formato correcto para importar productos. Incluye ejemplos y todas las columnas requeridas.';
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
        <span>Exportar mi inventario</span>
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
                  {/* Exportar inventario completo */}
                  <label className={`${styles.exportTypeOption} ${exportType === 'inventory' ? styles.selected : ''}`}>
                    <input
                      type="radio"
                      name="exportType"
                      value="inventory"
                      checked={exportType === 'inventory'}
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

                  {/* Descargar plantilla */}
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
                        Descargar plantilla para importar productos
                      </p>
                    </div>
                  </label>
                </div>
              </div>

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
                  <div className={styles.progressText}>
                    {exportType === 'inventory' ? 'Generando archivo Excel...' : 'Descargando plantilla...'}
                  </div>
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
                    {loading ? 
                      (exportType === 'inventory' ? 'Exportando...' : 'Descargando...') : 
                      (exportType === 'inventory' ? 'Exportar' : 'Descargar')
                    }
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