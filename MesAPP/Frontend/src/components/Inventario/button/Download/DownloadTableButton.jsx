import React, { useState } from 'react';
import { Download, FileSpreadsheet, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import './DownloadTableButton.css';

const DownloadTableButton = ({ 
  data = [], 
  filename = 'inventario',
  disabled = false,
  hasFilters = false 
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);

  // Función para formatear datos para Excel con nombres en inglés
  const formatDataForExcel = (data) => {
    if (!data || data.length === 0) return [];

    // Función para calcular margen
    const calculateMargin = (price, cost) => {
      if (cost === 0) return '0.0';
      return (((price - cost) / cost) * 100).toFixed(1);
    };

    // Función para obtener estado de stock
    const getStockStatus = (stock) => {
      if (stock === 0) return 'Out of Stock';
      if (stock < 10) return 'Low Stock';
      return 'Normal';
    };

    // Formatear datos con nombres en inglés
    return data.map(item => ({
      'Code': item.codigo || '',
      'Name': item.name || '',
      'Category': item.category || '',
      'Stock': item.stock || 0,
      'Cost': item.cost || 0,
      'Price': item.price || 0,
      'Margin': calculateMargin(item.price, item.cost),
      'Status': getStockStatus(item.stock),
      'Barcode': item.barcode || '',
      'Unit': item.unity || item.unit || 'unidad',
      'Image_URL': item.image_url || '',
      'Flavor_Count': item.flavor_count || 0,
      'Description': item.description || '',
      'Margin_Calculated': item.cost > 0 ? 
        (((item.price - item.cost) / item.cost) * 100).toFixed(2) : '0.00',
      'Total_Stock_Value': (item.price * (item.stock || 0)).toFixed(2)
    }));
  };

  // Función para crear Excel formateado
  const createFormattedExcel = (data, filename) => {
    const formattedData = formatDataForExcel(data);
    
    // Crear hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    
    // Configurar ancho de columnas
    ws['!cols'] = [
      { wch: 15 }, // Code
      { wch: 35 }, // Name
      { wch: 20 }, // Category
      { wch: 10 }, // Stock
      { wch: 12 }, // Cost
      { wch: 12 }, // Price
      { wch: 12 }, // Margin
      { wch: 15 }, // Status
      { wch: 18 }, // Barcode
      { wch: 12 }, // Unit
      { wch: 30 }, // Image_URL
      { wch: 12 }, // Flavor_Count
      { wch: 50 }, // Description
      { wch: 18 }, // Margin_Calculated
      { wch: 18 }  // Total_Stock_Value
    ];
    
    // Obtener rango de celdas
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    // Aplicar formato a headers
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellRef]) continue;
      
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1F484E" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }
    
    // Aplicar formato a celdas de datos
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellRef]) continue;
        
        ws[cellRef].s = {
          alignment: { horizontal: "left", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "E5E7EB" } },
            bottom: { style: "thin", color: { rgb: "E5E7EB" } },
            left: { style: "thin", color: { rgb: "E5E7EB" } },
            right: { style: "thin", color: { rgb: "E5E7EB" } }
          }
        };
      }
    }
    
    // Aplicar formato especial a columnas numéricas
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      // Columna Cost (4)
      const costCell = XLSX.utils.encode_cell({ r: row, c: 4 });
      if (ws[costCell]) {
        ws[costCell].s = {
          ...ws[costCell].s,
          numFmt: '"$"#,##0.00'
        };
      }
      
      // Columna Price (5)
      const priceCell = XLSX.utils.encode_cell({ r: row, c: 5 });
      if (ws[priceCell]) {
        ws[priceCell].s = {
          ...ws[priceCell].s,
          numFmt: '"$"#,##0.00'
        };
      }
      
      // Columna Margin (6)
      const marginCell = XLSX.utils.encode_cell({ r: row, c: 6 });
      if (ws[marginCell]) {
        ws[marginCell].s = {
          ...ws[marginCell].s,
          numFmt: '0.0"%"'
        };
      }
      
      // Columna Total_Stock_Value (14)
      const totalCell = XLSX.utils.encode_cell({ r: row, c: 14 });
      if (ws[totalCell]) {
        ws[totalCell].s = {
          ...ws[totalCell].s,
          numFmt: '"$"#,##0.00'
        };
      }
    }
    
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    
    // Descargar archivo
    XLSX.writeFile(wb, filename);
  };

  // Handler para descarga
  const handleDownload = async () => {
    if (disabled || isDownloading || data.length === 0) return;

    setIsDownloading(true);

    try {
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 800));

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const filterSuffix = hasFilters ? '_filtered' : '_complete';
      const finalFilename = `${filename}_${timestamp}${filterSuffix}.xlsx`;

      createFormattedExcel(data, finalFilename);

      // Mostrar estado de completado
      setDownloadComplete(true);
      setTimeout(() => {
        setDownloadComplete(false);
      }, 2000);

    } catch (error) {
      console.error('Error al descargar:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Determinar el icono a mostrar
  const getIcon = () => {
    if (downloadComplete) return <Check className="download-icon" />;
    if (isDownloading) return <div className="download-spinner" />;
    return <Download className="download-icon" />;
  };

  // Determinar el texto a mostrar
  const getText = () => {
    if (downloadComplete) return 'Descargado';
    if (isDownloading) return 'Descargando...';
    return 'Descargar';
  };

  return (
    <button
      className={`download-table-btn ${isDownloading ? 'downloading' : ''} ${downloadComplete ? 'completed' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={handleDownload}
      disabled={disabled || isDownloading || data.length === 0}
      title={`Descargar tabla ${hasFilters ? 'filtrada' : 'completa'} (${data.length} productos)`}
    >
      <FileSpreadsheet className="download-bg-icon" />
      {getIcon()}
      <span className="download-text">{getText()}</span>
      {hasFilters && (
        <span className="filter-indicator">Filtrado</span>
      )}
    </button>
  );
};

export default DownloadTableButton;