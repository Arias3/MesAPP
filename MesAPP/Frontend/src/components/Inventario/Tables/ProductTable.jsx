import { useState, useEffect } from 'react';
import { Edit, Trash2, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import TableInfoBar from './../Helpers/BarCreation/Table/TableInfoBar';
import Pagination from './../button/Pagination/Pagination';
import './ProductTable.css';

const ProductTable = ({ 
  products, 
  loading, 
  filteredProducts, 
  searchTerm, 
  onEdit, 
  onDelete, 
  onView,
  onExpand,
  isExpanded = false,
  getStockStatus // NUEVA PROP: función dinámica para obtener estado de stock
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  // Estados de paginación solo para modo normal
  const [currentPage, setCurrentPage] = useState(1);
  const elementsPerPage = 6; // Fijo en 6 para modo normal

  // NUEVO: Estado para almacenar los estados de stock dinámicos
  const [productStockStates, setProductStockStates] = useState({});
  const [loadingStockStates, setLoadingStockStates] = useState(true);

  // NUEVA FUNCIÓN: Cargar estados de stock dinámicamente
  const loadStockStates = async () => {
    if (!getStockStatus || filteredProducts.length === 0) {
      setLoadingStockStates(false);
      return;
    }

    setLoadingStockStates(true);
    try {
      const stockStates = {};
      
      // Cargar estados de stock para todos los productos visibles
      for (const product of filteredProducts) {
        try {
          const status = await getStockStatus(product.stock, product.category);
          stockStates[product.id] = status;
        } catch (error) {
          console.error(`❌ ProductTable: Error obteniendo estado para producto ${product.id}:`, error);
          // Fallback a lógica por defecto
          stockStates[product.id] = getDefaultStockStatus(product.stock);
        }
      }
      
      setProductStockStates(stockStates);
    } catch (error) {
      console.error('❌ ProductTable: Error cargando estados de stock:', error);
    } finally {
      setLoadingStockStates(false);
    }
  };

  // Función fallback para estado de stock por defecto
  const getDefaultStockStatus = (stock) => {
    if (stock === 0) return "Sin Stock";
    if (stock < 10) return "Bajo Stock";
    return "Normal";
  };

  // Cargar estados de stock cuando cambien los productos filtrados
  useEffect(() => {
    loadStockStates();
  }, [filteredProducts, getStockStatus]);

  // Función para obtener el estado de stock de un producto
  const getProductStockStatus = (product) => {
    if (loadingStockStates) {
      return "Cargando...";
    }
    
    // Si tenemos el estado dinámico, usarlo
    if (productStockStates[product.id]) {
      return productStockStates[product.id];
    }
    
    // Fallback si no hay función getStockStatus
    if (!getStockStatus) {
      return getDefaultStockStatus(product.stock);
    }
    
    return "Sin datos";
  };

  // Función para ordenar los productos
  const sortProducts = (products, sortConfig) => {
    if (!sortConfig.key) return products;

    return [...products].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Función para manejar click en header de columna
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    if (!isExpanded) {
      setCurrentPage(1); // Solo resetear en modo normal
    }
  };

  // Función para obtener el icono de ordenamiento
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <div className="sort-icon-placeholder"></div>;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="sort-icon active" /> : 
      <ChevronDown className="sort-icon active" />;
  };

  // FUNCIÓN MODIFICADA: Obtener clases de badge de stock usando estado dinámico
  const getStockBadgeClass = (product) => {
    const status = getProductStockStatus(product);
    
    switch (status) {
      case "Sin Stock":
        return "badge badge-danger";
      case "Bajo Stock":
        return "badge badge-warning";
      case "Normal":
        return "badge badge-success";
      case "Cargando...":
        return "badge badge-info";
      default:
        return "badge badge-secondary";
    }
  };

  // Función para calcular margen
  const getMargin = (price, cost) => {
    if (cost === 0) return 0;
    return (((price - cost) / cost) * 100).toFixed(1);
  };

  // Función para obtener clases de badge de margen
  const getMarginClass = (margin) => {
    if (margin > 50) return "badge badge-success";
    if (margin > 20) return "badge badge-warning";
    return "badge badge-danger";
  };

  // Aplicar ordenamiento
  const sortedProducts = sortProducts(filteredProducts, sortConfig);

  // Paginación solo para modo normal
  let currentProducts = sortedProducts;
  let totalPages = 1;
  
  if (!isExpanded) {
    totalPages = Math.ceil(sortedProducts.length / elementsPerPage);
    const startIndex = (currentPage - 1) * elementsPerPage;
    const endIndex = startIndex + elementsPerPage;
    currentProducts = sortedProducts.slice(startIndex, endIndex);
  }

  // Manejar cambio de página (solo modo normal)
  const handlePageChange = (page) => {
    if (!isExpanded) {
      setCurrentPage(page);
    }
  };

  // Resetear página cuando cambian los filtros (solo modo normal)
  useEffect(() => {
    if (!isExpanded) {
      setCurrentPage(1);
    }
  }, [filteredProducts.length, isExpanded]);

  return (
    <div className="product-table-wrapper">
      {/* Barra de información superior - solo en modo normal */}
      {!isExpanded && (
        <TableInfoBar
          totalElements={products.length}
          shownElements={filteredProducts.length}
          elementsPerPage={elementsPerPage}
          onExpand={onExpand}
          isExpanded={isExpanded}
        />
      )}
      {/* Paginación inferior - solo en modo normal */}
      {!isExpanded && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
      {/* Contenedor de la tabla */}
      <div className="product-table-container">
        <div className="table-wrapper">
          <table className="product-table">
            <thead>
              <tr>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('codigo')}
                >
                  <div className="header-content">
                    <span>Código</span>
                    {getSortIcon('codigo')}
                  </div>
                </th>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('name')}
                >
                  <div className="header-content">
                    <span>Nombre</span>
                    {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('category')}
                >
                  <div className="header-content">
                    <span>Categoría</span>
                    {getSortIcon('category')}
                  </div>
                </th>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('stock')}
                >
                  <div className="header-content">
                    <span>Stock</span>
                    {getSortIcon('stock')}
                  </div>
                </th>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('cost')}
                >
                  <div className="header-content">
                    <span>Costo</span>
                    {getSortIcon('cost')}
                  </div>
                </th>
                <th 
                  className="sortable-header"
                  onClick={() => handleSort('price')}
                >
                  <div className="header-content">
                    <span>Precio</span>
                    {getSortIcon('price')}
                  </div>
                </th>
                <th className="non-sortable-header">
                  <span>Margen</span>
                </th>
                <th className="non-sortable-header">
                  <span>Estado</span>
                </th>
                <th className="non-sortable-header actions-header">
                  <span>Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="loading-cell">
                    <div className="loading-content">
                      <div className="loading-spinner"></div>
                      <span>Cargando productos...</span>
                    </div>
                  </td>
                </tr>
              ) : currentProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-cell">
                    <div className="empty-content">
                      {searchTerm ? 
                        'No se encontraron productos que coincidan con tu búsqueda.' : 
                        'No hay productos registrados'
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                currentProducts.map(product => {
                  const margin = getMargin(product.price, product.cost);
                  const stockStatus = getProductStockStatus(product);
                  
                  return (
                    <tr key={product.id} className="table-row">
                      <td className="table-cell">
                        <span className="cell-content">
                          {product.codigo || '-'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="cell-content font-medium">
                          {product.name}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-category">
                          {product.category}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={getStockBadgeClass(product)}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="cell-content">
                          ${product.cost?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="cell-content">
                          ${product.price.toFixed(2)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={getMarginClass(margin)}>
                          {margin}%
                        </span>
                      </td>
                      <td className="table-cell">
                        {/* MODIFICADO: Ahora usa estado dinámico */}
                        <span className={getStockBadgeClass(product)}>
                          {stockStatus}
                        </span>
                      </td>
                      <td className="table-cell actions-cell">
                        <div className="actions-container">
                          <button
                            onClick={() => onEdit(product)}
                            className="action-btn edit-btn"
                            title="Editar"
                          >
                            <Edit className="action-icon" />
                          </button>
                          <button
                            onClick={() => onDelete(product.id)}
                            className="action-btn delete-btn"
                            title="Eliminar"
                          >
                            <Trash2 className="action-icon" />
                          </button>
                          <button
                            onClick={() => onView(product)}
                            className="action-btn view-btn"
                            title="Ver detalles"
                          >
                            <Eye className="action-icon" />
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
        
        {/* Información de ordenamiento */}
        {sortConfig.key && (
          <div className="sort-info">
            Ordenado por <strong>{sortConfig.key}</strong> ({sortConfig.direction === 'asc' ? 'Ascendente' : 'Descendente'})
          </div>
        )}

        {/* NUEVO: Indicador de estados de stock cargando */}
        {loadingStockStates && !loading && (
          <div className="stock-loading-indicator">
            <div className="loading-spinner-small"></div>
            <span>Cargando estados de stock dinámicos...</span>
          </div>
        )}
      </div>

    </div>
  );
};

export default ProductTable;