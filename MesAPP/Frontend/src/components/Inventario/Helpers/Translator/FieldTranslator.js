// FieldTranslator.js - Módulo para traducir nombres de campos

export const FieldTranslator = {
  // Diccionario de traducciones
  translations: {
    'Code': 'Código',
    'Category': 'Categoría',
    'Name': 'Nombre',
    'Cost': 'Costo',
    'Price': 'Precio',
    'Stock': 'Inventario',
    'Barcode': 'Código de Barras',
    'Unit': 'Unidad',
    'Image_URL': 'Imagen del Producto',
    'Flavor_Count': 'Cantidad de Sabores',
    'Description': 'Descripción'
  },

  // Función principal para traducir un campo
  translate: function(fieldName) {
    return this.translations[fieldName] || fieldName;
  },

  // Función para traducir múltiples campos
  translateFields: function(fields) {
    return fields.map(field => this.translate(field));
  },

  // Función para obtener todos los campos requeridos en español
  getRequiredFieldsInSpanish: function() {
    const requiredFields = [
      'Code', 'Category', 'Name', 'Cost', 'Price', 'Stock',
      'Barcode', 'Unit', 'Image_URL', 'Flavor_Count', 'Description'
    ];
    return requiredFields.map(field => ({
      original: field,
      spanish: this.translate(field)
    }));
  },

  // Función para crear una lista formateada en español
  formatFieldList: function(fields) {
    return fields.map(field => this.translate(field)).join(', ');
  },

  // Función para obtener el placeholder apropiado
  getPlaceholder: function(fieldName, isEditable = true) {
    const spanishName = this.translate(fieldName);
    if (isEditable) {
      return `Completar ${spanishName.toLowerCase()}...`;
    } else {
      return `${spanishName} ya completado`;
    }
  },

  // Función para obtener mensajes de error personalizados
  getErrorMessage: function(fieldName) {
    const spanishName = this.translate(fieldName);
    return `${spanishName} es obligatorio`;
  },

  // Función para obtener el indicador de campo requerido
  getRequiredIndicator: function(fieldName) {
    const spanishName = this.translate(fieldName);
    return ` *${spanishName} es obligatorio`;
  }
};

// Versión alternativa más avanzada con contexto
export const AdvancedFieldTranslator = {
  translations: {
    'Code': {
      label: 'Código',
      placeholder: 'Ingrese el código del producto',
      error: 'El código es obligatorio',
      description: 'Código único del producto'
    },
    'Category': {
      label: 'Categoría',
      placeholder: 'Seleccione una categoría',
      error: 'La categoría es obligatoria',
      description: 'Categoría del producto'
    },
    'Name': {
      label: 'Nombre',
      placeholder: 'Ingrese el nombre del producto',
      error: 'El nombre es obligatorio',
      description: 'Nombre del producto'
    },
    'Cost': {
      label: 'Costo',
      placeholder: 'Ingrese el costo',
      error: 'El costo es obligatorio',
      description: 'Costo de adquisición'
    },
    'Price': {
      label: 'Precio',
      placeholder: 'Ingrese el precio de venta',
      error: 'El precio es obligatorio',
      description: 'Precio de venta al público'
    },
    'Stock': {
      label: 'Inventario',
      placeholder: 'Ingrese la cantidad en stock',
      error: 'El inventario es obligatorio',
      description: 'Cantidad disponible en inventario'
    },
    'Barcode': {
      label: 'Código de Barras',
      placeholder: 'Ingrese el código de barras',
      error: 'El código de barras es obligatorio',
      description: 'Código de barras del producto'
    },
    'Unit': {
      label: 'Unidad',
      placeholder: 'Ingrese la unidad de medida',
      error: 'La unidad es obligatoria',
      description: 'Unidad de medida (ej: pza, kg, lt)'
    },
    'Image_URL': {
      label: 'URL de Imagen',
      placeholder: 'Ingrese la URL de la imagen',
      error: 'La URL de imagen es obligatoria',
      description: 'Dirección web de la imagen del producto'
    },
    'Flavor_Count': {
      label: 'Cantidad de Sabores',
      placeholder: 'Ingrese la cantidad de sabores',
      error: 'La cantidad de sabores es obligatoria',
      description: 'Número de sabores disponibles'
    },
    'Description': {
      label: 'Descripción',
      placeholder: 'Ingrese la descripción del producto',
      error: 'La descripción es obligatoria',
      description: 'Descripción detallada del producto'
    }
  },

  get: function(fieldName, property = 'label') {
    const field = this.translations[fieldName];
    return field ? field[property] : fieldName;
  },

  getLabel: function(fieldName) {
    return this.get(fieldName, 'label');
  },

  getPlaceholder: function(fieldName) {
    return this.get(fieldName, 'placeholder');
  },

  getError: function(fieldName) {
    return this.get(fieldName, 'error');
  },

  getDescription: function(fieldName) {
    return this.get(fieldName, 'description');
  }
};

// Constantes para usar directamente
export const FIELD_LABELS = {
  'Code': 'Código',
  'Category': 'Categoría',
  'Name': 'Nombre',
  'Cost': 'Costo',
  'Price': 'Precio',
  'Stock': 'Inventario',
  'Barcode': 'Código de Barras',
  'Unit': 'Unidad',
  'Image_URL': 'Imagen del Producto',
  'Flavor_Count': 'Cantidad de Sabores',
  'Description': 'Descripción'
};

// Función simple para traducir rápidamente
export const translateField = (fieldName) => FIELD_LABELS[fieldName] || fieldName;