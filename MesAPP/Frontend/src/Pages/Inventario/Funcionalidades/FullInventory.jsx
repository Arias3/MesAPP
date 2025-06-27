import { useState, useEffect } from "react";
import { Search, Package, TrendingUp, AlertTriangle, Edit, Trash2, Eye, X } from "lucide-react";
import ImportButton from './../../../components/Inventario/button/Import/importInventary.jsx';
import ExportButton from './../../../components/Inventario/button/Export/exportInventary.jsx';
import NewProductInventary from './../../../components/Inventario/button/PlusMinus/NewProduct/NewProductInventary.jsx';
import { ManualEditInterface } from './../../../components/Inventario/Interface/ManualEdition/ManualEditInterface.jsx';
import './FullInventory.css';

function FullInventory() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estado para productos - inicialmente vacío (vendrá de la base de datos)
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ ESTADOS PARA CONTROL DE IMPORTACIÓN
  const [fixedTable, setFixedTable] = useState(0); // 0: inicial, 1: después de ManualEditInterface
  const [importOpen, setImportOpen] = useState(1); // 1: activo, 0: cerrado
  const [manualEditData, setManualEditData] = useState(null); // Datos para ManualEditInterface
  const [showManualEdit, setShowManualEdit] = useState(false); // Mostrar ManualEditInterface
  const [correctedData, setCorrectedData] = useState(null); // Datos corregidos desde ManualEditInterface

  // ✅ FUNCIÓN FETCHPRODUCTSAPI CORREGIDA
  const fetchProductsFromAPI = async () => {
    setLoading(true);
    try {
      console.log('🔄 Cargando productos desde la API...');
      const response = await fetch('http://localhost:5000/api/productos');
      
      console.log('📡 Respuesta del servidor:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Datos recibidos del servidor:', data);
        
        // ✅ FIX: Verificar estructura y mapear correctamente
        if (data.success && Array.isArray(data.data)) {
          console.log('👀 Primer producto del backend:', data.data[0]);
          
          // ✅ FIX: Mapeo CORRECTO según lo que devuelve el backend
          const mappedProducts = data.data.map(product => ({
            id: product.id,
            name: product.nombre,           // ✅ backend devuelve 'nombre'
            category: product.category,     // ✅ backend devuelve 'category'
            stock: parseInt(product.stock) || 0,
            cost: parseFloat(product.costo) || 0,   // ✅ backend devuelve 'costo'
            price: parseFloat(product.precio) || 0, // ✅ backend devuelve 'precio'
            barcode: product.barcode,
            codigo: product.codigo
          }));
          
          console.log('✅ Productos mapeados correctamente:', mappedProducts.length, 'productos');
          console.log('👀 Primer producto mapeado:', mappedProducts[0]);
          setProducts(mappedProducts);
        } else {
          console.error('❌ Formato de respuesta inesperado:', data);
          alert('Error: Formato de respuesta del servidor no válido');
        }
      } else {
        console.error('❌ Error HTTP:', response.status, response.statusText);
        alert(`Error del servidor: ${response.status}`);
      }
    } catch (error) {
      console.error('💥 Error completo al cargar productos:', error);
      alert('Error de conexión al cargar productos desde el servidor');
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos al montar el componente
  useEffect(() => {
    fetchProductsFromAPI();
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.codigo && product.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStockBadgeClass = (stock) => {
    if (stock === 0) return "bg-red-100 text-red-800 badge-danger";
    if (stock < 10) return "bg-yellow-100 text-yellow-800 badge-warning";
    return "bg-green-100 text-green-800 badge-normal";
  };

  const getMargin = (price, cost) => {
    if (cost === 0) return 0;
    return (((price - cost) / cost) * 100).toFixed(1);
  };

  const getMarginClass = (margin) => {
    if (margin > 50) return "bg-green-100 text-green-800 badge-normal";
    if (margin > 20) return "bg-yellow-100 text-yellow-800 badge-warning";
    return "bg-red-100 text-red-800 badge-danger";
  };

  const handleEdit = (product) => {
    console.log('Editar producto:', product);
    // Funcionalidad de edición se implementará externamente
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de que desea eliminar este producto?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/productos/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setProducts(products.filter(p => p.id !== id));
          alert('Producto eliminado exitosamente');
        } else {
          alert('Error al eliminar el producto');
        }
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        alert('Error al eliminar el producto');
      }
    }
  };

  const handleView = (product) => {
    console.log('Ver producto:', product);
    // Funcionalidad de vista se implementará externamente
  };

  // ✅ FUNCIÓN CALLBACK PARA CUANDO SE COMPLETE LA IMPORTACIÓN
  const handleImportComplete = () => {
    console.log('✅ Importación completada, recargando productos...');
    fetchProductsFromAPI(); // Recargar productos después de importar
    
    // ✅ RESETEAR TODOS LOS ESTADOS DE IMPORTACIÓN
    setFixedTable(0);
    setImportOpen(1);
    setManualEditData(null);
    setShowManualEdit(false);
    setCorrectedData(null);
  };

  // ✅ FUNCIÓN PARA MANEJAR CUANDO SE NECESITA EDICIÓN MANUAL
  const handleNeedsManualEdit = (editData) => {
    console.log('📝 Se necesita edición manual, abriendo ManualEditInterface...');
    console.log('📦 Datos recibidos para edición:', editData);
    
    // Guardar datos para ManualEditInterface
    setManualEditData(editData);
    setShowManualEdit(true);
    
    // importOpen permanece en 1 para mantener el modal abierto debajo
  };

  // ✅ FUNCIÓN PARA MANEJAR GUARDADO DESDE MANUALEDITINTERFACE
  const handleManualEditSave = (correctedRows) => {
    console.log('💾 Guardando datos corregidos desde ManualEditInterface...');
    console.log('📋 Filas corregidas:', correctedRows);
    
    // Cambiar estados para el siguiente procesamiento
    setFixedTable(1);
    setCorrectedData(correctedRows);
    setShowManualEdit(false);
    setManualEditData(null);
    
    // El ImportButton se activará con fixedTable=1 y correctedData
    console.log('🔄 Estados actualizados: fixedTable=1, correctedData preparada');
  };

  // ✅ FUNCIÓN PARA CANCELAR EDICIÓN MANUAL
  const handleManualEditCancel = () => {
    console.log('❌ Cancelando edición manual...');
    setShowManualEdit(false);
    setManualEditData(null);
    setFixedTable(0);
    setCorrectedData(null);
    
    // El ImportButton debería cerrar su modal también
    setImportOpen(1);
  };

  // Función callback para cuando se cree un nuevo producto
  const handleProductCreated = () => {
    console.log('➕ Nuevo producto creado, recargando productos...');
    fetchProductsFromAPI(); // Recargar productos después de crear
  };

  // Estadísticas calculadas
  const stats = {
    total: products.length,
    lowStock: products.filter(p => p.stock > 0 && p.stock < 10).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0)
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 fullinventory-container">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 shadow-hover">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 gradient-text">Inventario Completo</h1>
                <p className="text-gray-600">Gestión de productos</p>
              </div>
            </div>
            {/* Botón de Nuevo Producto */}
            <NewProductInventary 
              onProductCreated={handleProductCreated}
              apiBaseUrl="http://localhost:5000/api"
            />
          </div>

          {/* Estadísticas - 1 fila con 4 columnas */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Productos</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="stats-item yellow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">Stock Bajo</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.lowStock}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            
            <div className="stats-item red">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">Agotados</p>
                  <p className="text-2xl font-bold text-red-900">{stats.outOfStock}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            
            <div className="stats-item green">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Valor Total</p>
                  <p className="text-2xl font-bold text-green-900">${stats.totalValue.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="flex flex-col md:flex-row gap-4 items-center mobile-stack">
            <div className="flex-1 relative search-container">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar productos por nombre, categoría o código..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent input-focus-effect"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <ExportButton 
                apiBaseUrl="http://localhost:5000/api"
              />
              
              {/* ✅ IMPORTBUTTON CON TODOS LOS PROPS NECESARIOS */}
              <ImportButton 
                onImportComplete={handleImportComplete}
                onNeedsManualEdit={handleNeedsManualEdit}
                apiBaseUrl="http://localhost:5000/api"
                fixedTable={fixedTable}
                importOpen={importOpen}
                setImportOpen={setImportOpen}
                correctedData={correctedData}
              />
            </div>
          </div>

          {/* Resumen */}
          <div className="flex items-center space-x-6 mt-4 text-sm text-gray-600">
            <span>Total de productos: <span className="font-semibold text-gray-900">{products.length}</span></span>
            <span>Productos mostrados: <span className="font-semibold text-gray-900">{filteredProducts.length}</span></span>
            {loading && <span className="text-blue-600">Cargando productos...</span>}
            {/* ✅ DEBUG INFO */}
            {process.env.NODE_ENV === 'development' && (
              <>
                <span className="text-xs text-gray-400">fixedTable: {fixedTable}</span>
                <span className="text-xs text-gray-400">importOpen: {importOpen}</span>
                <span className="text-xs text-gray-400">showManualEdit: {showManualEdit ? 'true' : 'false'}</span>
              </>
            )}
          </div>
        </div>

        {/* Tabla de productos */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden shadow-hover">
          <div className="overflow-x-auto">
            <table className="w-full table-responsive">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      Cargando productos...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm ? 'No se encontraron productos que coincidan con tu búsqueda.' : 'No hay productos registrados'}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => {
                    const margin = getMargin(product.price, product.cost);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50 table-hover-row smooth-transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.codigo || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockBadgeClass(product.stock)}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          ${product.cost?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          ${product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMarginClass(margin)}`}>
                            {margin}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockBadgeClass(product.stock)}`}>
                            {product.stock === 0 ? "Sin Stock" : 
                             product.stock < 10 ? "Bajo Stock" : "Normal"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors duration-200 action-btn edit-btn"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded transition-colors duration-200 action-btn delete-btn"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleView(product)}
                              className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors duration-200 action-btn view-btn"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ✅ MANUALEDITINTERFACE - SE SOBREPONE CUANDO showManualEdit = true */}
        {showManualEdit && manualEditData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
              <ManualEditInterface
                data={manualEditData}
                onSave={handleManualEditSave}
                onCancel={handleManualEditCancel}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FullInventory;