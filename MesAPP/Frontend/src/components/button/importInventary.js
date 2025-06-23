import * as XLSX from 'xlsx';

export class ImportButtonLogic {
  constructor(apiBaseUrl = 'http://localhost:5000/api') {
    this.apiBaseUrl = apiBaseUrl;
    this.requiredColumns = ['Código', 'Nombre', 'Costo', 'Precio', 'Stock', 'Barcode'];
  }

  // Leer archivo Excel
  readExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          resolve(jsonData);
        } catch (error) {
          reject(new Error('Error al leer el archivo Excel: ' + error.message));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  // Validar estructura del Excel
  validateExcelStructure(data) {
    if (!data || data.length === 0) {
      return {
        valid: false,
        error: 'El archivo está vacío o no contiene datos válidos'
      };
    }

    const firstRow = data[0];
    const fileColumns = Object.keys(firstRow);
    
    // Verificar que existan las columnas requeridas
    const missingColumns = this.requiredColumns.filter(col => !fileColumns.includes(col));
    
    if (missingColumns.length > 0) {
      return {
        valid: false,
        error: `Faltan las siguientes columnas: ${missingColumns.join(', ')}`
      };
    }

    return { valid: true };
  }

  // Validar datos de productos
  validateProductData(data) {
    const errors = [];
    const validProducts = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 porque empezamos en fila 2 (después del header)
      const product = {
        codigo: row['Código'],
        nombre: row['Nombre'],
        costo: row['Costo'],
        precio: row['Precio'],
        stock: row['Stock'],
        barcode: row['Barcode']
      };

      // Validaciones
      if (!product.nombre || product.nombre.toString().trim() === '') {
        errors.push(`Fila ${rowNumber}: El nombre es obligatorio`);
      }

      if (!product.costo || isNaN(parseFloat(product.costo)) || parseFloat(product.costo) < 0) {
        errors.push(`Fila ${rowNumber}: El costo debe ser un número válido mayor o igual a 0`);
      }

      if (!product.precio || isNaN(parseFloat(product.precio)) || parseFloat(product.precio) < 0) {
        errors.push(`Fila ${rowNumber}: El precio debe ser un número válido mayor o igual a 0`);
      }

      if (!product.stock || isNaN(parseInt(product.stock)) || parseInt(product.stock) < 0) {
        errors.push(`Fila ${rowNumber}: El stock debe ser un número entero válido mayor o igual a 0`);
      }

      if (errors.length === 0 || errors.filter(e => e.includes(`Fila ${rowNumber}`)).length === 0) {
        validProducts.push({
          codigo: product.codigo || null,
          nombre: product.nombre.toString().trim(),
          costo: parseFloat(product.costo),
          precio: parseFloat(product.precio),
          stock: parseInt(product.stock),
          barcode: product.barcode ? product.barcode.toString().trim() : null
        });
      }
    });

    return { errors, validProducts };
  }

  // Enviar datos al servidor
  async importToDatabase(products) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/productos/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productos: products,
          replaceAll: true // Indica que se deben reemplazar todos los productos
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al importar productos');
      }

      return data;
    } catch (error) {
      throw new Error('Error de conexión: ' + error.message);
    }
  }

  // Proceso completo de importación
  async processImport(file, onProgress) {
    try {
      // Paso 1: Leer archivo
      onProgress?.('Leyendo archivo Excel...');
      const rawData = await this.readExcelFile(file);

      // Paso 2: Validar estructura
      onProgress?.('Validando estructura del archivo...');
      const structureValidation = this.validateExcelStructure(rawData);
      if (!structureValidation.valid) {
        throw new Error(structureValidation.error);
      }

      // Paso 3: Validar datos
      onProgress?.('Validando datos de productos...');
      const { errors, validProducts } = this.validateProductData(rawData);
      
      if (errors.length > 0) {
        throw new Error('Errores en los datos:\n' + errors.join('\n'));
      }

      if (validProducts.length === 0) {
        throw new Error('No se encontraron productos válidos para importar');
      }

      // Paso 4: Importar a base de datos
      onProgress?.(`Importando ${validProducts.length} productos...`);
      const result = await this.importToDatabase(validProducts);

      return {
        success: true,
        message: `Se importaron ${validProducts.length} productos exitosamente`,
        data: result
      };

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Generar template de Excel para descarga
  generateTemplate() {
    const templateData = [
      {
        'Código': 'P001',
        'Nombre': 'Ejemplo Producto 1',
        'Costo': 10.50,
        'Precio': 15.75,
        'Stock': 100,
        'Barcode': '1234567890123'
      },
      {
        'Código': 'P002',
        'Nombre': 'Ejemplo Producto 2',
        'Costo': 25.00,
        'Precio': 37.50,
        'Stock': 50,
        'Barcode': '9876543210987'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    
    // Descargar archivo
    XLSX.writeFile(wb, 'plantilla_productos.xlsx');
  }
}