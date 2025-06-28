export class FieldNormalizer {
  
  // Normalizar un producto individual
  static normalizeProduct(product) {
    const normalized = { ...product };
    
    // Campos de texto que deben convertirse a minúsculas
    const textFields = [
      'category',
      'code', 
      'name',
      'barcode',
      'unit',
      'image_url',
      'description'
    ];

    textFields.forEach(field => {
      if (normalized[field] && typeof normalized[field] === 'string') {
        normalized[field] = normalized[field].toLowerCase().trim();
      }
    });

    // Campos numéricos se mantienen como están
    // cost, price, stock, flavor_count

    return normalized;
  }

  // Normalizar un array de productos
  static normalizeProductArray(products) {
    if (!Array.isArray(products)) {
      throw new Error('Se esperaba un array de productos');
    }

    return products.map(product => this.normalizeProduct(product));
  }

  // Normalizar datos desde Excel (convertir fila a producto normalizado)
  static normalizeFromExcelRow(row, rowNumber) {
    const product = {
      category: row['Category'],
      code: row['Code'],
      name: row['Name'],
      cost: row['Cost'],
      price: row['Price'],
      stock: row['Stock'],
      barcode: row['Barcode'],
      unit: row['Unit'],
      image_url: row['Image_URL'],
      flavor_count: row['Flavor_Count'],
      description: row['Description'],
      _excelRow: rowNumber
    };

    return this.normalizeProduct(product);
  }

  // Normalizar campos específicos individualmente (útil para correcciones)
  static normalizeField(fieldName, value) {
    const textFields = [
      'category',
      'code', 
      'name',
      'barcode',
      'unit',
      'image_url',
      'description'
    ];

    if (textFields.includes(fieldName) && typeof value === 'string') {
      return value.toLowerCase().trim();
    }

    return value;
  }

  // Obtener lista de campos que se normalizan
  static getNormalizableFields() {
    return [
      'category',
      'code', 
      'name',
      'barcode',
      'unit',
      'image_url',
      'description'
    ];
  }
}