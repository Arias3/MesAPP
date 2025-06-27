import * as XLSX from 'xlsx';
import { 
  TEMPLATE_PRODUCTS, 
  EXCEL_COLUMN_WIDTHS, 
  EXCEL_EXPORT_COLUMN_WIDTHS, 
  EXCEL_REPORT_COLUMN_WIDTHS 
} from './templateData.js';

export class ExportButtonLogic {
  constructor(apiBaseUrl = 'http://localhost:5000/api') {
    this.apiBaseUrl = apiBaseUrl;
  }

  // Obtener productos desde la API
  async fetchProductsFromAPI() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/productos`);
      
      if (!response.ok) {
        throw new Error(`Error al obtener productos: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error('Error de conexión: ' + error.message);
    }
  }

  // Formatear datos para exportación
  formatDataForExport(products) {
    return products.map(product => ({
      'Code': product.code || '',
      'Category': product.category || '',
      'Name': product.name || '',
      'Cost': product.cost || 0,
      'Price': product.price || 0,
      'Profitability': product.profitability || '',
      'Stock': product.stock || '',
      'Barcode': product.barcode || '',
      'Unit': product.unit || '',
      'Image_URL': product.image_url || '',
      'Flavor_Count': product.flavor_count || 0,
      'Description': product.description || '',
      'Margen_Calculado (%)': product.cost > 0 ? 
        (((product.price - product.cost) / product.cost) * 100).toFixed(2) : '0.00',
      'Valor_Total_Stock': (product.price * (parseFloat(product.stock) || 0)).toFixed(2)
    }));
  }

  // Exportar productos actuales a Excel
  async exportCurrentProducts(filename = null) {
    try {
      // Obtener productos de la API
      const products = await this.fetchProductsFromAPI();
      
      if (!products || products.length === 0) {
        throw new Error('No hay productos para exportar');
      }

      // Formatear datos
      const formattedData = this.formatDataForExport(products);
      
      // Crear el archivo Excel
      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      
      // Configurar ancho de columnas usando la configuración modular
      ws['!cols'] = EXCEL_EXPORT_COLUMN_WIDTHS;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
      
      // Generar nombre de archivo si no se proporciona
      if (!filename) {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
        const timeStr = now.toTimeString().slice(0, 5).replace(':', ''); // HHMM
        filename = `inventario_${dateStr}_${timeStr}.xlsx`;
      }
      
      // Descargar archivo
      XLSX.writeFile(wb, filename);
      
      return {
        success: true,
        message: `Se exportaron ${products.length} productos exitosamente`,
        filename: filename,
        count: products.length
      };
      
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Exportar plantilla vacía para importación
  exportTemplate(filename = 'plantilla_productos.xlsx') {
    // Usar los datos de plantilla modulares
    const ws = XLSX.utils.json_to_sheet(TEMPLATE_PRODUCTS);
    const wb = XLSX.utils.book_new();
    
    // Configurar ancho de columnas usando la configuración modular
    ws['!cols'] = EXCEL_COLUMN_WIDTHS;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    
    // Descargar archivo
    XLSX.writeFile(wb, filename);
    
    return {
      success: true,
      message: 'Plantilla descargada exitosamente',
      filename: filename
    };
  }

  // Exportar productos filtrados (por categoría, estado, etc.)
  async exportFilteredProducts(filters = {}, filename = null) {
    try {
      // Obtener todos los productos
      const allProducts = await this.fetchProductsFromAPI();
      
      if (!allProducts || allProducts.length === 0) {
        throw new Error('No hay productos para exportar');
      }

      // Aplicar filtros
      let filteredProducts = allProducts;
      
      if (filters.categoria) {
        filteredProducts = filteredProducts.filter(p => 
          p.category && p.category.toLowerCase().includes(filters.categoria.toLowerCase())
        );
      }
      
      if (filters.stockBajo) {
        filteredProducts = filteredProducts.filter(p => {
          const stock = parseFloat(p.stock) || 0;
          return stock > 0 && stock < 10;
        });
      }
      
      if (filters.sinStock) {
        filteredProducts = filteredProducts.filter(p => {
          const stock = parseFloat(p.stock) || 0;
          return stock === 0;
        });
      }
      
      if (filters.margenMinimo) {
        filteredProducts = filteredProducts.filter(p => {
          const margin = p.cost > 0 ? ((p.price - p.cost) / p.cost) * 100 : 0;
          return margin >= parseFloat(filters.margenMinimo);
        });
      }

      if (filteredProducts.length === 0) {
        throw new Error('No se encontraron productos que coincidan con los filtros aplicados');
      }

      // Formatear datos
      const formattedData = this.formatDataForExport(filteredProducts);
      
      // Crear el archivo Excel
      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      
      // Configurar ancho de columnas
      ws['!cols'] = EXCEL_EXPORT_COLUMN_WIDTHS;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Inventario Filtrado');
      
      // Generar nombre de archivo si no se proporciona
      if (!filename) {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
        filename = `inventario_filtrado_${dateStr}_${timeStr}.xlsx`;
      }
      
      // Descargar archivo
      XLSX.writeFile(wb, filename);
      
      return {
        success: true,
        message: `Se exportaron ${filteredProducts.length} productos filtrados exitosamente`,
        filename: filename,
        count: filteredProducts.length,
        totalProducts: allProducts.length
      };
      
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Generar reporte de estadísticas
  async exportStatisticsReport(filename = null) {
    try {
      const products = await this.fetchProductsFromAPI();
      
      if (!products || products.length === 0) {
        throw new Error('No hay productos para generar el reporte');
      }

      // Calcular estadísticas
      const stats = this._calculateStatistics(products);

      // Agrupar por categorías
      const categoriesStats = this._calculateCategoryStatistics(products);

      // Crear hojas del reporte
      const wb = XLSX.utils.book_new();

      // Hoja 1: Resumen General
      const summaryData = this._generateSummaryData(stats);
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWs['!cols'] = EXCEL_REPORT_COLUMN_WIDTHS.summary;
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen General');

      // Hoja 2: Por Categorías
      const categoryData = this._generateCategoryData(categoriesStats);
      const categoryWs = XLSX.utils.aoa_to_sheet(categoryData);
      categoryWs['!cols'] = EXCEL_REPORT_COLUMN_WIDTHS.categories;
      XLSX.utils.book_append_sheet(wb, categoryWs, 'Por Categorías');

      // Hoja 3: Productos Completos
      const productsData = this.formatDataForExport(products);
      const productsWs = XLSX.utils.json_to_sheet(productsData);
      productsWs['!cols'] = EXCEL_REPORT_COLUMN_WIDTHS.products;
      XLSX.utils.book_append_sheet(wb, productsWs, 'Productos Detallados');

      // Generar nombre de archivo
      if (!filename) {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        filename = `reporte_inventario_${dateStr}.xlsx`;
      }

      // Descargar archivo
      XLSX.writeFile(wb, filename);

      return {
        success: true,
        message: `Reporte de estadísticas generado exitosamente`,
        filename: filename,
        stats: stats
      };

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Métodos privados para cálculos de estadísticas
  _calculateStatistics(products) {
    return {
      totalProducts: products.length,
      totalValue: products.reduce((sum, p) => {
        const stock = parseFloat(p.stock) || 0;
        return sum + (p.price * stock);
      }, 0),
      totalCost: products.reduce((sum, p) => {
        const stock = parseFloat(p.stock) || 0;
        return sum + (p.cost * stock);
      }, 0),
      lowStock: products.filter(p => {
        const stock = parseFloat(p.stock) || 0;
        return stock > 0 && stock < 10;
      }).length,
      outOfStock: products.filter(p => {
        const stock = parseFloat(p.stock) || 0;
        return stock === 0;
      }).length,
      highMargin: products.filter(p => {
        const margin = p.cost > 0 ? ((p.price - p.cost) / p.cost) * 100 : 0;
        return margin > 50;
      }).length,
      withFlavors: products.filter(p => (p.flavor_count || 0) > 0).length,
      averagePrice: products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0
    };
  }

  _calculateCategoryStatistics(products) {
    const categoriesStats = {};
    
    products.forEach(product => {
      const cat = product.category || 'Sin Categoría';
      if (!categoriesStats[cat]) {
        categoriesStats[cat] = {
          count: 0,
          totalValue: 0,
          totalStock: 0,
          avgPrice: 0
        };
      }
      categoriesStats[cat].count++;
      const stock = parseFloat(product.stock) || 0;
      categoriesStats[cat].totalValue += product.price * stock;
      categoriesStats[cat].totalStock += stock;
    });

    // Calcular precio promedio por categoría
    Object.keys(categoriesStats).forEach(cat => {
      const categoryProducts = products.filter(p => (p.category || 'Sin Categoría') === cat);
      categoriesStats[cat].avgPrice = categoryProducts.length > 0 ? 
        categoryProducts.reduce((sum, p) => sum + p.price, 0) / categoryProducts.length : 0;
    });

    return categoriesStats;
  }

  _generateSummaryData(stats) {
    return [
      ['Métrica', 'Valor'],
      ['Total de Productos', stats.totalProducts],
      ['Valor Total del Inventario', `$${stats.totalValue.toFixed(2)}`],
      ['Costo Total del Inventario', `$${stats.totalCost.toFixed(2)}`],
      ['Margen Bruto Total', `$${(stats.totalValue - stats.totalCost).toFixed(2)}`],
      ['Precio Promedio', `$${stats.averagePrice.toFixed(2)}`],
      ['Productos con Stock Bajo', stats.lowStock],
      ['Productos Agotados', stats.outOfStock],
      ['Productos con Alto Margen (>50%)', stats.highMargin],
      ['Productos con Sabores', stats.withFlavors],
      ['Fecha de Reporte', new Date().toLocaleDateString()]
    ];
  }

  _generateCategoryData(categoriesStats) {
    const categoryData = [['Categoría', 'Cantidad', 'Valor Total', 'Stock Total', 'Precio Promedio']];
    
    Object.entries(categoriesStats).forEach(([category, data]) => {
      categoryData.push([
        category,
        data.count,
        `$${data.totalValue.toFixed(2)}`,
        data.totalStock,
        `$${data.avgPrice.toFixed(2)}`
      ]);
    });

    return categoryData;
  }
}