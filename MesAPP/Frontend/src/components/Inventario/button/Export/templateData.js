// Datos de ejemplo para plantillas de productos - Heladería
export const TEMPLATE_PRODUCTS = [
  {
    'Code': 'ML001',
    'Category': 'Malteadas',
    'Name': 'Malteada de Chocolate Premium',
    'Cost': 2.50,
    'Price': 4.50,
    'Profitability': '80.00%',
    'Stock': '45',
    'Barcode': '1234567890123',
    'Unit': 'unidad',
    'Image_URL': 'https://ejemplo.com/malteada-chocolate.jpg',
    'Flavor_Count': 3,
    'Description': 'Deliciosa malteada de chocolate con helado premium, crema batida y topping de chocolate'
  },
  {
    'Code': 'PS001',
    'Category': 'Postres',
    'Name': 'Brownie con Helado Vainilla',
    'Cost': 1.80,
    'Price': 3.75,
    'Profitability': '108.33%',
    'Stock': '25',
    'Barcode': '9876543210987',
    'Unit': 'unidad',
    'Image_URL': 'https://ejemplo.com/brownie-helado.jpg',
    'Flavor_Count': 0,
    'Description': 'Brownie casero tibio acompañado de helado de vainilla y salsa de chocolate'
  },
  {
    'Code': 'BE001',
    'Category': 'Bebidas Embotelladas',
    'Name': 'Agua Natural 500ml',
    'Cost': 0.35,
    'Price': 1.00,
    'Profitability': '185.71%',
    'Stock': '120',
    'Barcode': '5555666677778',
    'Unit': 'unidad',
    'Image_URL': 'https://ejemplo.com/agua-natural.jpg',
    'Flavor_Count': 0,
    'Description': 'Agua natural purificada en botella de 500ml'
  },
  {
    'Code': 'HE001',
    'Category': 'Helados',
    'Name': 'Helado Artesanal Fresa',
    'Cost': 0.85,
    'Price': 2.25,
    'Profitability': '164.71%',
    'Stock': '2.5',
    'Barcode': '2222333344445',
    'Unit': 'kilogramos',
    'Image_URL': 'https://ejemplo.com/helado-fresa.jpg',
    'Flavor_Count': 1,
    'Description': 'Helado artesanal de fresa con trozos de fruta natural, cremoso y refrescante'
  },
  {
    'Code': 'ML002',
    'Category': 'Malteadas',
    'Name': 'Malteada Oreo Cookies',
    'Cost': 2.75,
    'Price': 5.25,
    'Profitability': '90.91%',
    'Stock': '30',
    'Barcode': '7777888899990',
    'Unit': 'unidad',
    'Image_URL': 'https://ejemplo.com/malteada-oreo.jpg',
    'Flavor_Count': 2,
    'Description': 'Malteada con helado de vainilla, galletas Oreo trituradas y crema batida'
  },
  {
    'Code': 'BE002',
    'Category': 'Bebidas Embotelladas',
    'Name': 'Jugo de Naranja Natural 350ml',
    'Cost': 0.95,
    'Price': 2.50,
    'Profitability': '163.16%',
    'Stock': '80',
    'Barcode': '1111222233334',
    'Unit': 'unidad',
    'Image_URL': 'https://ejemplo.com/jugo-naranja.jpg',
    'Flavor_Count': 0,
    'Description': 'Jugo de naranja 100% natural, sin conservantes ni azúcares añadidos'
  },
  {
    'Code': 'PS002',
    'Category': 'Postres',
    'Name': 'Copa de Frutas con Helado',
    'Cost': 2.20,
    'Price': 4.25,
    'Profitability': '93.18%',
    'Stock': '15',
    'Barcode': '6666777788889',
    'Unit': 'unidad',
    'Image_URL': 'https://ejemplo.com/copa-frutas.jpg',
    'Flavor_Count': 0,
    'Description': 'Selección de frutas frescas de temporada con helado de vainilla y miel'
  },
  {
    'Code': 'TO001',
    'Category': 'Toppings',
    'Name': 'Topping de Chocolate Líquido',
    'Cost': 3.50,
    'Price': 8.75,
    'Profitability': '150.00%',
    'Stock': '1.2',
    'Barcode': '4444555566667',
    'Unit': 'kilogramos',
    'Image_URL': 'https://ejemplo.com/topping-chocolate.jpg',
    'Flavor_Count': 0,
    'Description': 'Salsa de chocolate premium para acompañar helados, malteadas y postres'
  }
];

// Configuración de columnas para Excel
export const EXCEL_COLUMN_WIDTHS = [
  { wch: 15 }, // Code
  { wch: 25 }, // Category
  { wch: 35 }, // Name
  { wch: 10 }, // Cost
  { wch: 10 }, // Price
  { wch: 15 }, // Profitability
  { wch: 10 }, // Stock
  { wch: 18 }, // Barcode
  { wch: 12 }, // Unit
  { wch: 30 }, // Image_URL
  { wch: 12 }, // Flavor_Count
  { wch: 50 }  // Description
];

// Configuración de columnas para exportación completa (con campos calculados)
export const EXCEL_EXPORT_COLUMN_WIDTHS = [
  { wch: 15 }, // Code
  { wch: 25 }, // Category
  { wch: 35 }, // Name
  { wch: 10 }, // Cost
  { wch: 10 }, // Price
  { wch: 15 }, // Profitability
  { wch: 10 }, // Stock
  { wch: 18 }, // Barcode
  { wch: 12 }, // Unit
  { wch: 30 }, // Image_URL
  { wch: 12 }, // Flavor_Count
  { wch: 50 }, // Description
  { wch: 18 }, // Margen_Calculado
  { wch: 18 }  // Valor_Total_Stock
];

// Configuración de columnas para reportes
export const EXCEL_REPORT_COLUMN_WIDTHS = {
  summary: [{ wch: 35 }, { wch: 25 }],
  categories: [{ wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 }],
  products: EXCEL_EXPORT_COLUMN_WIDTHS
};

// Categorías específicas de heladería
export const SAMPLE_CATEGORIES = [
  'Malteadas',
  'Helados',
  'Postres',
  'Bebidas Embotelladas',
  'Bebidas Calientes',
  'Toppings',
  'Conos y Recipientes',
  'Complementos',
  'Promociones',
  'Temporada'
];

// Unidades de medida específicas para heladería
export const COMMON_UNITS = [
  'unidad',
  'kilogramos', 
  'libras'
];

// Prefijos de códigos por categoría para heladería
export const CATEGORY_CODE_PREFIXES = {
  'Malteadas': 'ML',
  'Helados': 'HE',
  'Postres': 'PS',
  'Bebidas Embotelladas': 'BE',
  'Bebidas Calientes': 'BC',
  'Toppings': 'TO',
  'Conos y Recipientes': 'CR',
  'Complementos': 'CO',
  'Promociones': 'PR',
  'Temporada': 'TE'
};

// Sabores comunes para productos con múltiples sabores
export const COMMON_FLAVORS = [
  'Vainilla',
  'Chocolate',
  'Fresa',
  'Cookies & Cream',
  'Menta con Chocolate',
  'Caramelo',
  'Pistacho',
  'Mango',
  'Coco',
  'Café',
  'Dulce de Leche',
  'Frambuesa',
  'Limón',
  'Banana Split',
  'Rocky Road'
];

// Función helper para generar códigos de ejemplo específicos de heladería
export const generateSampleCode = (category, index) => {
  const prefix = CATEGORY_CODE_PREFIXES[category] || 'GN';
  return `${prefix}${String(index).padStart(3, '0')}`;
};

// Función helper para calcular rentabilidad
export const calculateProfitability = (cost, price) => {
  if (cost <= 0) return '0.00%';
  const margin = ((price - cost) / cost) * 100;
  return `${margin.toFixed(2)}%`;
};

// Validadores para los campos específicos de heladería
export const FIELD_VALIDATORS = {
  code: (value) => ({
    isValid: value && value.trim().length > 0,
    message: 'El código es obligatorio'
  }),
  category: (value) => ({
    isValid: value && value.trim().length > 0 && SAMPLE_CATEGORIES.includes(value),
    message: `La categoría debe ser una de: ${SAMPLE_CATEGORIES.join(', ')}`
  }),
  name: (value) => ({
    isValid: value && value.trim().length > 0,
    message: 'El nombre es obligatorio'
  }),
  cost: (value) => ({
    isValid: !isNaN(parseFloat(value)) && parseFloat(value) >= 0,
    message: 'El costo debe ser un número válido mayor o igual a 0'
  }),
  price: (value) => ({
    isValid: !isNaN(parseFloat(value)) && parseFloat(value) >= 0,
    message: 'El precio debe ser un número válido mayor o igual a 0'
  }),
  stock: (value) => ({
    isValid: value !== undefined && value !== null && value.toString().trim() !== '',
    message: 'El stock es obligatorio'
  }),
  unit: (value) => ({
    isValid: !value || COMMON_UNITS.includes(value),
    message: `La unidad debe ser: ${COMMON_UNITS.join(', ')}`
  }),
  flavor_count: (value) => ({
    isValid: value === '' || value === null || value === undefined || (!isNaN(parseInt(value)) && parseInt(value) >= 0),
    message: 'El conteo de sabores debe ser un número entero válido mayor o igual a 0'
  })
};

// Productos sugeridos por categoría para heladería
export const SUGGESTED_PRODUCTS_BY_CATEGORY = {
  'Malteadas': [
    'Malteada de Chocolate',
    'Malteada de Vainilla',
    'Malteada Oreo',
    'Malteada de Fresa',
    'Malteada Banana Split',
    'Malteada de Caramelo'
  ],
  'Helados': [
    'Helado de Vainilla',
    'Helado de Chocolate',
    'Helado de Fresa',
    'Helado Cookies & Cream',
    'Helado de Menta',
    'Helado de Pistacho'
  ],
  'Postres': [
    'Brownie con Helado',
    'Copa de Frutas',
    'Banana Split',
    'Sundae de Chocolate',
    'Crepe con Helado',
    'Waffle con Helado'
  ],
  'Bebidas Embotelladas': [
    'Agua Natural',
    'Jugo de Naranja',
    'Jugo de Manzana',
    'Refresco de Cola',
    'Agua Saborizada',
    'Té Helado'
  ],
  'Toppings': [
    'Salsa de Chocolate',
    'Salsa de Caramelo',
    'Chispas de Chocolate',
    'Nueces Picadas',
    'Crema Batida',
    'Cerezas al Marrasquino'
  ]
};