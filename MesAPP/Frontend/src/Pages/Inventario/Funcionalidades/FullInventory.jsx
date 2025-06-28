import { useState, useEffect } from "react";
import { Search, Package, TrendingUp, AlertTriangle } from "lucide-react";
import InventoryActionsBar from './../../../components/Inventario/Handlers/Importaciones/ActionBar.jsx';
import ProductTable from './../../../components/Inventario/Tables/ProductTable.jsx';
import EditProductModal from '../../../components/Inventario/Modals/Ediciones/EditProductModal.jsx';
import { ManualEditInterface } from './../../../components/Inventario/Interface/ManualEdition/ManualEditInterface.jsx';
import { useConfirmationModal, confirmationPresets } from '../../../components/Inventario/Modals/Confirmaciones/ConfirmationModal.jsx';
import ViewProductModal from './../../../components/Inventario/Modals/Visualizaciones/ViewProductModal.jsx';
import './FullInventory.css';

function FullInventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const API_BASE_URL = `http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}`;
  
  // Estado para productos
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Estados para ManualEditInterface
  const [manualEditData, setManualEditData] = useState(null);
  const [showManualEdit, setShowManualEdit] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Estados para modal de edición
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Hook para confirmaciones estilizadas
  const { ConfirmationModalComponent, showConfirmation } = useConfirmationModal();

  // Función para cargar productos desde la API
  const fetchProductsFromAPI = async () => {
    setLoading(true);
    try {
      console.log('🔄 Cargando productos desde la API...');
      const response = await fetch(`${API_BASE_URL}/api/productos`);
      
      console.log('📡 Respuesta del servidor:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Datos recibidos del servidor:', data);
        
        if (data.success && Array.isArray(data.data)) {
          console.log('👀 Primer producto del backend:', data.data[0]);
          
          const mappedProducts = data.data.map(product => ({
            id: product.id,
            name: product.nombre,
            category: product.category,
            stock: parseInt(product.stock),
            cost: parseFloat(product.costo),
            price: parseFloat(product.precio),
            barcode: product.barcode,
            codigo: product.codigo,
            unity: product.unity,
            image_url: product.image_url,
            flavor_count: product.flavor_count,
            description: product.description
          }));
          
          console.log('✅ Productos mapeados correctamente:', mappedProducts.length, 'productos');
          console.log('👀 Primer producto mapeado:', mappedProducts[0]);
          setProducts(mappedProducts);
        } else {
          console.error('❌ Formato de respuesta inesperado:', data);
        }
      } else {
        console.error('❌ Error HTTP:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('💥 Error completo al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos al montar el componente
  useEffect(() => {
    fetchProductsFromAPI();
  }, []);

  // Listeners de eventos
  useEffect(() => {
    console.log('🔧 FullInventory: Configurando listeners de eventos...');
    
    const handleImportModalClosed = (event) => {
      console.log('🎯 FullInventory: Modal de import cerrado, procesando resultado...');
      const result = event.detail;
      
      if (!result) {
        console.error('❌ FullInventory: No hay datos en event.detail');
        return;
      }
      
      if (result.needsManualEdit && result.data) {
        console.log('🚨 FullInventory: Se necesita edición manual');
        
        if (!result.data.incompleteRows || result.data.incompleteRows.length === 0) {
          console.log('⚠️ FullInventory: No hay filas incompletas para editar');
          fetchProductsFromAPI();
          return;
        }
        
        console.log('⏰ FullInventory: Iniciando transición a ManualEditInterface...');
        setIsTransitioning(true);
        
        setTimeout(() => {
          console.log('🔓 FullInventory: Abriendo ManualEditInterface...');
          setManualEditData(result.data);
          setShowManualEdit(true);
          setIsTransitioning(false);
        }, 500);
        
      } else if (result.success) {
        console.log('✅ FullInventory: Import exitoso, recargando productos...');
        fetchProductsFromAPI();
      }
    };
    
    const handleImportCompleted = () => {
      console.log('✅ FullInventory: Importación completada exitosamente, recargando productos...');
      fetchProductsFromAPI();
    };

    const handleDatabaseUpdated = (event) => {
      console.log('🎯 FullInventory: Base de datos actualizada, procesando resultado...');
      const result = event.detail;
      
      if (result.success) {
        console.log('✅ FullInventory: Base de datos actualizada exitosamente');
        console.log(`📊 FullInventory: ${result.processedCount} productos procesados por ${result.source}`);
        fetchProductsFromAPI();
        console.log(`🎉 ${result.message}`);
      }
    };

    const handleDatabaseUpdateError = (event) => {
      console.error('❌ FullInventory: Error en actualización de base de datos:', event.detail);
      const result = event.detail;
      console.error(`💥 Error desde ${result.source}: ${result.error}`);
    };

    const handleManualEditCompleted = (event) => {
      console.log('🎯 FullInventory: ManualEditInterface completado (legacy), procesando resultado...');
      const result = event.detail;
      
      if (result.success) {
        console.log('✅ FullInventory: Edición manual exitosa (legacy), recargando productos...');
        fetchProductsFromAPI();
      } else {
        console.error('❌ FullInventory: Error en edición manual (legacy):', result.message);
      }
    };

    const handleProductUpdated = (event) => {
      console.log('🎯 FullInventory: Producto actualizado, procesando resultado...');
      console.log('📦 Event.detail completo:', event.detail);
      
      const result = event.detail;
      
      if (result.success && result.updatedProduct) {
        console.log('✅ FullInventory: Producto actualizado exitosamente');
        console.log(`📊 FullInventory: Producto ${result.updatedProduct.id} actualizado por ${result.source}`);
        
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product.id === result.updatedProduct.id ? {
              ...product,
              ...result.updatedProduct,
              name: result.updatedProduct.nombre || result.updatedProduct.name,
              cost: parseFloat(result.updatedProduct.costo) || parseFloat(result.updatedProduct.cost),
              price: parseFloat(result.updatedProduct.precio) || parseFloat(result.updatedProduct.price),
              stock: parseInt(result.updatedProduct.stock),
              category: result.updatedProduct.category,
              codigo: result.updatedProduct.codigo,
              barcode: result.updatedProduct.barcode,
              unity: result.updatedProduct.unity,
              image_url: result.updatedProduct.image_url,
              flavor_count: parseInt(result.updatedProduct.flavor_count) || 0,
              description: result.updatedProduct.description
            } : product
          )
        );
        
        console.log(`🎉 ${result.message}`);
      } else {
        console.error('❌ FullInventory: Error al actualizar producto:', result.message);
      }
    };
    
    // Registrar listeners
    window.addEventListener('importModalClosed', handleImportModalClosed);
    window.addEventListener('importCompleted', handleImportCompleted);
    window.addEventListener('databaseUpdated', handleDatabaseUpdated);
    window.addEventListener('databaseUpdateError', handleDatabaseUpdateError);
    window.addEventListener('manualEditCompleted', handleManualEditCompleted);
    window.addEventListener('productUpdated', handleProductUpdated);
    
    console.log('✅ FullInventory: Listeners configurados correctamente');
    
    // Cleanup
    return () => {
      console.log('🧹 FullInventory: Limpiando listeners...');
      window.removeEventListener('importModalClosed', handleImportModalClosed);
      window.removeEventListener('importCompleted', handleImportCompleted);
      window.removeEventListener('databaseUpdated', handleDatabaseUpdated);
      window.removeEventListener('databaseUpdateError', handleDatabaseUpdateError);
      window.removeEventListener('manualEditCompleted', handleManualEditCompleted);
      window.removeEventListener('productUpdated', handleProductUpdated);
    };
  }, []);

  // Filtrar productos
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.codigo && product.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handlers para modal de edición
  const handleEdit = (product) => {
    console.log('✏️ Editando producto:', product);
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    setEditingProduct(null);
  };

  const handleProductUpdated = (updatedProduct) => {
    console.log('✅ Producto actualizado via props:', updatedProduct);
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirmation(confirmationPresets.deleteProduct);
    
    if (confirmed) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/productos/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setProducts(products.filter(p => p.id !== id));
          console.log('✅ Producto eliminado exitosamente');
        } else {
          console.error('❌ Error al eliminar el producto');
        }
      } catch (error) {
        console.error('Error al eliminar producto:', error);
      }
    }
  };

  const handleView = (product) => {
    console.log('👁️ Ver producto:', product);
    setViewingProduct(product);
    setShowViewModal(true);
  };

  const handleViewModalClose = () => {
    setShowViewModal(false);
    setViewingProduct(null);
  };

  const handleManualEditClose = () => {
    console.log('🔄 FullInventory: Cerrando ManualEditInterface...');
    setShowManualEdit(false);
    setManualEditData(null);
    setIsTransitioning(false);
  };

  const handleProductCreated = () => {
    console.log('➕ Nuevo producto creado, recargando productos...');
    fetchProductsFromAPI();
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
        
        {/* Header Section - SIMPLIFICADO */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 shadow-hover">
          
          {/* Título - SIN botón de nuevo producto */}
          <div className="flex items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 gradient-text">
                  Inventario Completo
                </h1>
                <p className="text-gray-600">Gestión de productos</p>
              </div>
            </div>
          </div>

          {/* Estadísticas en 4 columnas */}
          <div className="stats-container">
            <div className="stats-item blue">
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

          {/* Barra de búsqueda - SIN botones de import/export */}
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
          </div>

          {/* Resumen de información */}
          <div className="flex items-center space-x-6 mt-4 text-sm text-gray-600">
            <span>
              Total de productos: <span className="font-semibold text-gray-900">{products.length}</span>
            </span>
            <span>
              Productos mostrados: <span className="font-semibold text-gray-900">{filteredProducts.length}</span>
            </span>
            {loading && <span className="text-blue-600">Cargando productos...</span>}
            {isTransitioning && <span className="text-orange-600">Preparando edición manual...</span>}
          </div>
        </div>

        {/* ✅ NUEVA BARRA DE ACCIONES */}
        <InventoryActionsBar 
          apiBaseUrl={API_BASE_URL}
          onProductCreated={handleProductCreated}
        />

        {/* Tabla de productos */}
        <ProductTable
          products={products}
          loading={loading}
          filteredProducts={filteredProducts}
          searchTerm={searchTerm}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />

        {/* Modal de edición de producto */}
        {showEditModal && editingProduct && (
          <EditProductModal
            product={editingProduct}
            onClose={handleEditModalClose}
            onProductUpdated={handleProductUpdated}
            apiBaseUrl={API_BASE_URL}
          />
        )}

        {/* Modal de edición manual */}
        {showManualEdit && manualEditData && (
          <div className="manual-edit-modal-overlay">
            <div className="manual-edit-modal-container">
              <ManualEditInterface
                data={manualEditData}
                onCancel={handleManualEditClose}
                apiBaseUrl={API_BASE_URL}
              />
            </div>
          </div>
        )}

        {showViewModal && viewingProduct && (
          <ViewProductModal
            product={viewingProduct}
            onClose={handleViewModalClose}
          />
        )}

        {/* Debug panel (solo en desarrollo) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-panel">
            <div>showManualEdit: {showManualEdit ? '✅' : '❌'}</div>
            <div>showEditModal: {showEditModal ? '✅' : '❌'}</div>
            <div>editingProduct: {editingProduct ? '✅' : '❌'}</div>
            <div>manualEditData: {manualEditData ? '✅' : '❌'}</div>
            <div>isTransitioning: {isTransitioning ? '✅' : '❌'}</div>
            <div>Products: {products.length}</div>
            <div>showViewModal: {showViewModal ? '✅' : '❌'}</div>
            <div>viewingProduct: {viewingProduct ? '✅' : '❌'}</div>
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      <ConfirmationModalComponent />
    </div>
  );
}

export default FullInventory;