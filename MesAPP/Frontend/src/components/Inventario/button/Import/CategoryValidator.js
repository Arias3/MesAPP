export class CategoryValidator {
  constructor(apiBaseUrl = 'http://localhost:5000/api') {
    this.apiBaseUrl = apiBaseUrl;
    this.validCategories = [];
    // Campos obligatorios para validar completitud
    this.requiredFields = [
      'Code', 'Category', 'Name', 'Cost', 'Price', 'Stock',
      'Barcode', 'Unit', 'Image_URL', 'Flavor_Count', 'Description'
    ];
  }

  // Obtener categorías válidas de la base de datos
  async fetchValidCategories() {
    // Si ya las tenemos, no volver a buscarlas
    if (this.validCategories.length > 0) {
      return {
        success: true,
        categories: this.validCategories
      };
    }

    try {
      const url = `${this.apiBaseUrl}/categorias/names`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error en la respuesta del servidor');
      }
      
      this.validCategories = data.data || [];
      
      // Si la BD está vacía, es un error real
      if (this.validCategories.length === 0) {
        throw new Error('No hay categorías disponibles en la base de datos');
      }
      
      return {
        success: true,
        categories: this.validCategories
      };
    } catch (error) {
      // NO FALLBACK - si falla la BD, falla el proceso
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validar una categoría individual
  validateSingleCategory(categoryName) {
    // Categoría vacía
    if (!categoryName || categoryName.trim() === '') {
      return {
        valid: false,
        reason: 'EMPTY'
      };
    }

    // Normalizar para comparar (sin importar mayúsculas/minúsculas)
    const normalizedInput = categoryName.toString().toLowerCase().trim();
    const matchedCategory = this.validCategories.find(
      cat => cat.toLowerCase().trim() === normalizedInput
    );

    if (matchedCategory) {
      return {
        valid: true,
        correctName: matchedCategory // Devolver el nombre correcto de la BD
      };
    }

    return {
      valid: false,
      reason: 'NOT_FOUND'
    };
  }

  // Validar completitud de campos de una fila
  validateRowCompleteness(row) {
    const emptyFields = [];

    this.requiredFields.forEach(field => {
      const value = row[field];
      // Campos vacíos: null, undefined, string vacío
      const isEmpty = value === null || value === undefined || 
                     (typeof value === 'string' && value.trim() === '');
      
      if (isEmpty) {
        emptyFields.push(field);
      }
    });

    return {
      isComplete: emptyFields.length === 0,
      emptyFields: emptyFields
    };
  }

  // FUNCIÓN PRINCIPAL: Separar productos completos de incompletos
  async validateExcelData(rawData) {
    try {
      // 1. Obtener categorías de la BD
      const categoryResult = await this.fetchValidCategories();
      if (!categoryResult.success) {
        throw new Error(categoryResult.error);
      }

      const completeRows = [];    // Productos perfectos
      const incompleteRows = [];  // Productos con problemas

      // 2. Procesar cada fila
      rawData.forEach((row, index) => {
        const rowNumber = index + 2; // Número de fila en Excel
        
        // Validar categoría
        const categoryValidation = this.validateSingleCategory(row['Category']);
        
        // Preparar fila procesada
        let processedRow = { ...row };
        
        // Si categoría es inválida, limpiarla
        if (!categoryValidation.valid) {
          processedRow['Category'] = '';
        } else {
          // Si categoría es válida, usar el nombre correcto de la BD
          processedRow['Category'] = categoryValidation.correctName;
        }
        
        // Validar completitud de campos
        const completenessValidation = this.validateRowCompleteness(processedRow);
        
        // Clasificar fila
        if (categoryValidation.valid && completenessValidation.isComplete) {
          // PRODUCTO PERFECTO: categoría válida + todos los campos llenos
          const completeRow = {
            rowNumber: rowNumber,
            originalRow: processedRow
          };
          completeRows.push(completeRow);
          
        } else {
          // PRODUCTO CON PROBLEMAS: categoría inválida ó campos vacíos
          const incompleteRow = {
            rowNumber: rowNumber,
            originalRow: processedRow,
            issues: {
              emptyFields: completenessValidation.emptyFields
            }
          };
          incompleteRows.push(incompleteRow);
        }
      });

      // 3. Retornar resultados separados
      return {
        success: true,
        data: {
          completeRows: completeRows,        // Productos perfectos
          incompleteRows: incompleteRows,    // Productos con problemas + campos vacíos
          availableCategories: this.validCategories, // Lista de categorías válidas
          summary: {
            total: rawData.length,
            complete: completeRows.length,
            incomplete: incompleteRows.length
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}