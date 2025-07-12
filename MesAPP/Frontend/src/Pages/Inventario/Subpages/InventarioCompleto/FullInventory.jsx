import { useState, useEffect } from "react";
import { Package, TrendingUp, AlertTriangle, DollarSign } from "lucide-react";
import InventoryActionsBar from '../../../../components/Inventario/Helpers/BarCreation/Importaciones/ActionBar.jsx';
import ProductTable from '../../../../components/Inventario/Tables/ProductTable.jsx';
import TableModal from '../../../../components/Inventario/Modals/ProductTable/TableModal.jsx';
import EditProductModal from '../../../../components/Inventario/Modals/Ediciones/EditProductModal.jsx';
import { ManualEditInterface } from '../../../../components/Inventario/Modals/ManualEdition/ManualEditInterface.jsx';
import { useConfirmationModal, confirmationPresets } from '../../../../components/Inventario/Modals/Confirmaciones/ConfirmationModal.jsx';
import ViewProductModal from '../../../../components/Inventario/Modals/Visualizaciones/ViewProductModal.jsx';
import { statisticsService } from '../../../../services/Statistics/StatisticsService.js';
import './FullInventory.css';

function FullInventory() {
  const API_BASE_URL = `http://${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}`;
  
  // Estado para productos
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // NUEVO: Estado para configuración de categorías
  const [categoriesConfig, setCategoriesConfig] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Estados para ManualEditInterface
  const [manualEditData, setManualEditData] = useState(null);
  const [showManualEdit, setShowManualEdit] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Estado para el modo de importación
  const [importMode, setImportMode] = useState('replace');

  // Estados para modal de edición
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Estado para modal de tabla expandida
  const [isTableExpanded, setIsTableExpanded] = useState(false);

  // Estados para filtros
  const [filters, setFilters] = useState({
    name: '',
    code: '',
    category: 'all',
    stockStatus: 'all',
    margin: 'all',
    price: { price: '', operator: 'equal' }
  });

  // Hook para confirmaciones estilizadas
  const { ConfirmationModalComponent, showConfirmation } = useConfirmationModal();

  // NUEVA FUNCIÓN: Cargar configuración de categorías
  const loadCategoriesConfig = async (forceRefresh = false) => {
    try {
      console.log('📊 FullInventory: Cargando configuración de categorías...');
      const result = await statisticsService.getCategoriesConfig(forceRefresh);
      
      if (result.success) {
        setCategoriesConfig(result.data.config);
        console.log('✅ FullInventory: Configuración de categorías cargada:', result.data.config);
        
        if (result.cached) {
          console.log('💾 FullInventory: Configuración obtenida desde cache');
        } else {
          console.log('🔄 FullInventory: Configuración actualizada desde servidor');
        }
      } else {
        console.error('❌ FullInventory: Error cargando configuración:', result.error);
      }
    } catch (error) {
      console.error('💥 FullInventory: Error al cargar configuración de categorías:', error);
    }
  };

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

  // Cargar productos y configuración al montar el componente
  useEffect(() => {
    const loadInitialData = async () => {
      // Cargar en paralelo para mejor performance
      await Promise.all([
        fetchProductsFromAPI(),
        loadCategoriesConfig()
      ]);
    };
    
    loadInitialData();
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
      
      if (result.importMode) {
        console.log('🔧 FullInventory: Modo de importación del resultado:', result.importMode);
        setImportMode(result.importMode);
      }
      
      if (result.needsManualEdit && result.data) {
        console.log('🚨 FullInventory: Se necesita edición manual');
        console.log('🎯 FullInventory: Modo para ManualEditInterface:', result.importMode || importMode);
        
        if (!result.data.incompleteRows || result.data.incompleteRows.length === 0) {
          console.log('⚠️ FullInventory: No hay filas incompletas para editar');
          fetchProductsFromAPI();
          return;
        }
        
        console.log('⏰ FullInventory: Iniciando transición a ManualEditInterface...');
        setIsTransitioning(true);
        
        setTimeout(() => {
          console.log('🔓 FullInventory: Abriendo ManualEditInterface...');
          console.log('📋 FullInventory: Datos para ManualEdit:', result.data);
          console.log('🎯 FullInventory: Modo final a pasar:', result.importMode || importMode);
          
          setManualEditData(result.data);
          setShowManualEdit(true);
          setIsTransitioning(false);
        }, 500);
        
      } else if (result.success) {
        console.log('✅ FullInventory: Import exitoso, recargando productos...');
        fetchProductsFromAPI();
      }
    };
    
    const handleImportModeChanged = (event) => {
      console.log('🎯 FullInventory: Modo de importación actualizado en tiempo real:', event.detail);
      setImportMode(event.detail.mode);
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

    const handleProductCreated = (event) => {
      console.log('📡 FullInventory: Evento productCreated recibido:', event.detail);
      
      const { success, tableUpdate, source, message } = event.detail;
      
      if (success && tableUpdate && source === 'NewProductInventary') {
        console.log('✅ FullInventory: Producto creado desde NewProduct, actualizando tabla...');
        
        fetchProductsFromAPI();
        console.log(`🎉 FullInventory: ${message}`);
      }
    };

    const handleProductCreationError = (event) => {
      console.error('❌ FullInventory: Error creando producto:', event.detail);
      
      const { source, error, message } = event.detail;
      
      if (source === 'NewProductInventary') {
        console.error('🔴 FullInventory: Error desde NewProduct:', error);
      }
    };

    // NUEVO: Handler para actualizaciones de categorías
    const handleCategoryUpdated = (event) => {
      console.log('🎯 FullInventory: Categoría actualizada, sincronizando datos...');
      const result = event.detail;
      
      if (result.success) {
        console.log('✅ FullInventory: Categoría actualizada exitosamente');
        console.log(`📊 FullInventory: Categoría "${result.category}" - nuevo low_stock: ${result.low_stock}`);
        
        // Limpiar cache y recargar configuración
        statisticsService.clearCache();
        loadCategoriesConfig(true); // Forzar recarga
        
        console.log(`🎉 ${result.message}`);
      } else {
        console.error('❌ FullInventory: Error al actualizar categoría:', result.message);
      }
    };

    // NUEVO: Handler para creación de categorías
    const handleCategoryCreated = (event) => {
      console.log('📡 FullInventory: Nueva categoría creada, actualizando configuración...');
      const result = event.detail;
      
      if (result.success) {
        console.log('✅ FullInventory: Nueva categoría creada exitosamente');
        console.log(`📊 FullInventory: Categoría "${result.category}" creada con low_stock: ${result.low_stock}`);
        
        // Limpiar cache y recargar configuración
        statisticsService.clearCache();
        loadCategoriesConfig(true); // Forzar recarga
        
        console.log(`🎉 ${result.message}`);
      }
    };
    
    // Registrar todos los listeners
    window.addEventListener('importModalClosed', handleImportModalClosed);
    window.addEventListener('importModeChanged', handleImportModeChanged);
    window.addEventListener('importCompleted', handleImportCompleted);
    window.addEventListener('databaseUpdated', handleDatabaseUpdated);
    window.addEventListener('databaseUpdateError', handleDatabaseUpdateError);
    window.addEventListener('manualEditCompleted', handleManualEditCompleted);
    window.addEventListener('productUpdated', handleProductUpdated);
    window.addEventListener('productCreated', handleProductCreated);
    window.addEventListener('productCreationError', handleProductCreationError);
    // NUEVOS: Listeners para categorías
    window.addEventListener('categoryUpdated', handleCategoryUpdated);
    window.addEventListener('categoryCreated', handleCategoryCreated);
    
    console.log('✅ FullInventory: Todos los listeners configurados correctamente');
    
    // Cleanup
    return () => {
      console.log('🧹 FullInventory: Limpiando listeners...');
      window.removeEventListener('importModalClosed', handleImportModalClosed);
      window.removeEventListener('importModeChanged', handleImportModeChanged);
      window.removeEventListener('importCompleted', handleImportCompleted);
      window.removeEventListener('databaseUpdated', handleDatabaseUpdated);
      window.removeEventListener('databaseUpdateError', handleDatabaseUpdateError);
      window.removeEventListener('manualEditCompleted', handleManualEditCompleted);
      window.removeEventListener('productUpdated', handleProductUpdated);
      window.removeEventListener('productCreated', handleProductCreated);
      window.removeEventListener('productCreationError', handleProductCreationError);
      // NUEVOS: Cleanup para categorías
      window.removeEventListener('categoryUpdated', handleCategoryUpdated);
      window.removeEventListener('categoryCreated', handleCategoryCreated);
    };
  }, [importMode]);

  // FUNCIÓN MODIFICADA: Obtener estado de stock dinámico usando StatisticsService
  const getStockStatus = async (stock, category) => {
    return await statisticsService.getStockStatus(stock, category);
  };

  // FUNCIÓN: Calcular margen
  const calculateMargin = (price, cost) => {
    if (cost === 0) return 0;
    return (((price - cost) / cost) * 100);
  };

  // FUNCIÓN MODIFICADA: aplicar filtros usando StatisticsService
  const applyFilters = async (products, filters) => {
    // Primero obtener productos con estados de stock dinámicos
    const productsWithStatus = await statisticsService.getMultipleStockStatus(products);
    
    return productsWithStatus.filter(product => {
      // Filtro por nombre
      if (filters.name && !product.name.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }

      // Filtro por código
      if (filters.code && !product.codigo.toLowerCase().includes(filters.code.toLowerCase())) {
        return false;
      }

      // Filtro por categoría
      if (filters.category !== 'all' && product.category !== filters.category) {
        return false;
      }

      // MODIFICADO: Filtro por estado de stock usando StatisticsService
      if (filters.stockStatus !== 'all') {
        const filterValue = filters.stockStatus.replace('_', ' ');
        
        if (product.stockStatus.toLowerCase() !== filterValue.toLowerCase()) {
          return false;
        }
      }

      // Filtro por margen
      if (filters.margin !== 'all') {
        const margin = calculateMargin(product.price, product.cost);
        const avgMargin = products.reduce((sum, p) => sum + calculateMargin(p.price, p.cost), 0) / products.length;
        
        if (filters.margin === 'high' && margin <= avgMargin) {
          return false;
        }
        if (filters.margin === 'low' && margin > avgMargin) {
          return false;
        }
      }

      // Filtro por precio
      if (filters.price.price !== '') {
        const filterPrice = parseFloat(filters.price.price);
        const productPrice = parseFloat(product.price);
        
        if (isNaN(filterPrice) || isNaN(productPrice)) {
          return false;
        }
        
        switch (filters.price.operator) {
          case 'equal':
            if (Math.abs(productPrice - filterPrice) > 0.01) return false;
            break;
          case 'greater':
            if (productPrice <= filterPrice) return false;
            break;
          case 'less':
            if (productPrice >= filterPrice) return false;
            break;
          case 'greaterOrEqual':
            if (productPrice < filterPrice) return false;
            break;
          case 'lessOrEqual':
            if (productPrice > filterPrice) return false;
            break;
          default:
            break;
        }
      }

      return true;
    });
  };

  // PRODUCTOS FILTRADOS - ahora asíncrono
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  // Aplicar filtros de forma asíncrona
  useEffect(() => {
    const updateFilteredProducts = async () => {
      if (products.length > 0) {
        const filtered = await applyFilters(products, filters);
        setFilteredProducts(filtered);
      } else {
        setFilteredProducts([]);
      }
    };
    
    updateFilteredProducts();
  }, [products, filters]);

  // Handler para cambios de filtros
  const handleFiltersChange = (newFilters) => {
    console.log('🔍 Filtros actualizados:', newFilters);
    console.log('📊 Productos antes del filtro:', products.length);
    setFilters(newFilters);
    // El useEffect se encargará de aplicar los filtros asíncronamente
  };

  // MODIFICADO: EXTRAER DATOS ÚNICOS usando StatisticsService
  const [uniqueCategories, setUniqueCategories] = useState([]);
  const [uniqueStockStates, setUniqueStockStates] = useState([]);
  
  // Calcular datos únicos de forma asíncrona
  useEffect(() => {
    const updateUniqueData = async () => {
      if (products.length > 0) {
        // Categorías únicas
        const categories = [...new Set(products.map(p => p.category))];
        setUniqueCategories(categories);
        
        // Estados de stock únicos usando StatisticsService
        const productsWithStatus = await statisticsService.getMultipleStockStatus(products);
        const stockStates = [...new Set(productsWithStatus.map(p => p.stockStatus))];
        setUniqueStockStates(stockStates);
      } else {
        setUniqueCategories([]);
        setUniqueStockStates([]);
      }
    };
    
    updateUniqueData();
  }, [products]);

  // FUNCIONES HELPER
  const hasActiveFilters = 
    filters.name !== '' ||
    filters.code !== '' ||
    filters.category !== 'all' ||
    filters.stockStatus !== 'all' ||
    filters.margin !== 'all' ||
    filters.price.price !== '';

  const activeFiltersCount = [
    filters.name !== '',
    filters.code !== '',
    filters.category !== 'all',
    filters.stockStatus !== 'all',
    filters.margin !== 'all',
    filters.price.price !== ''
  ].filter(Boolean).length;

  // Handlers para modal de tabla expandida
  const handleExpandTable = () => {
    console.log('🔍 Expandiendo tabla...');
    setIsTableExpanded(true);
  };

  const handleCloseTableModal = () => {
    console.log('🔒 Cerrando tabla expandida...');
    setIsTableExpanded(false);
  };

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

  const handleProductUpdatedViaProps = (updatedProduct) => {
    console.log('✅ Producto actualizado via props:', updatedProduct);
    // Recargar configuración por si cambió alguna categoría
    loadCategoriesConfig();
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

  const handleProductCreatedCallback = (product) => {
    console.log('➕ FullInventory: Callback onProductCreated ejecutado:', product);
    // Recargar configuración por si se creó una nueva categoría
    loadCategoriesConfig();
  };

  // ESTADÍSTICAS CALCULADAS MODIFICADAS: usando StatisticsService
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  });

  // Función para calcular estadísticas asíncronamente
  const calculateStats = async () => {
    if (products.length === 0) {
      setStats({ total: 0, lowStock: 0, outOfStock: 0, totalValue: 0 });
      return;
    }

    try {
      // Usar StatisticsService para procesar productos con estados dinámicos
      const productsWithStatus = await statisticsService.getMultipleStockStatus(products);
      
      const newStats = {
        total: products.length,
        lowStock: productsWithStatus.filter(p => p.stockStatus === "Bajo Stock").length,
        outOfStock: products.filter(p => p.stock === 0).length,
        totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0)
      };
      
      setStats(newStats);
    } catch (error) {
      console.error('❌ FullInventory: Error calculando estadísticas:', error);
    }
  };

  // Recalcular estadísticas cuando cambien los productos
  useEffect(() => {
    calculateStats();
  }, [products]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 fullinventory-container">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          
          {/* Título */}
          <div className="flex items-center mb-6">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Gestión de Inventario
                  {!categoriesConfig && (
                    <span className="text-sm text-amber-600 ml-2">
                      (Cargando configuración...)
                    </span>
                  )}
                </h1>
              </div>
            </div>
          </div>

          {/* Estadísticas en 4 columnas */}
          <div className="stats-container">
            <div className="stats-item blue">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stats-label text-blue-600">Total Productos</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total.toLocaleString('es-ES')}</p>
                </div>
                  <Package className="h-8 w-8 text-gray" />
              </div>
            </div>
            
            <div className="stats-item yellow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stats-label text-yellow-600">Stock Bajo</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.lowStock.toLocaleString('es-ES')}</p>
                </div>
                  <AlertTriangle className="h-8 w-8 text-gray" />
              </div>
            </div>
            
            <div className="stats-item red">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stats-label text-red-600">Agotados</p>
                  <p className="text-2xl font-bold text-red-900">{stats.outOfStock.toLocaleString('es-ES')}</p>
                </div>
                  <AlertTriangle className="h-8 w-8 text-gray" />
              </div>
            </div>
            
            <div className="stats-item green">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stats-label text-green-600">Valor Total</p>
                  <p className="text-2xl font-bold text-green-900">${stats.totalValue.toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}</p>
                </div>
                  <DollarSign className="h-8 w-8 text-gray" />
              </div>
            </div>
          </div>

        </div>

        {/* BARRA DE ACCIONES */}
        <div className="mb-6">
          <InventoryActionsBar 
            apiBaseUrl={API_BASE_URL}
            onProductCreated={handleProductCreatedCallback}
          />
        </div>

        {/* Tabla normal solo visible cuando NO está expandido */}
        {!isTableExpanded && (
          <ProductTable
            products={products}
            loading={loading}
            filteredProducts={filteredProducts}
            searchTerm={filters.name}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            onExpand={handleExpandTable}
            isExpanded={false}
            getStockStatus={getStockStatus} // NUEVA PROP: función dinámica
          />
        )}

        {/* Modal de tabla expandida */}
        {isTableExpanded && (
          <TableModal
            isOpen={isTableExpanded}
            onClose={handleCloseTableModal}
            products={products}
            filteredProducts={filteredProducts}
            loading={loading}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            categories={uniqueCategories}
            stockStates={uniqueStockStates}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            getStockStatus={getStockStatus} // NUEVA PROP: función dinámica
          />
        )}

        {/* Modal de edición de producto */}
        {showEditModal && editingProduct && (
          <EditProductModal
            product={editingProduct}
            onClose={handleEditModalClose}
            onProductUpdated={handleProductUpdatedViaProps}
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
                importMode={importMode}
              />
            </div>
          </div>
        )}

        {/* Modal de visualización */}
        {showViewModal && viewingProduct && (
          <ViewProductModal
            product={viewingProduct}
            onClose={handleViewModalClose}
          />
        )}

      </div>

      {/* Modal de confirmación */}
      <ConfirmationModalComponent />
    </div>
  );
}

export default FullInventory;