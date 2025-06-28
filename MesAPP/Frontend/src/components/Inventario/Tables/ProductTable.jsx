import { useState } from 'react';
import { Edit, Trash2, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import './ProductTable.css';

const ProductTable = ({ 
  products, 
  loading, 
  filteredProducts, 
  searchTerm, 
  onEdit, 
  onDelete, 
  onView 
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  // Función para ordenar los productos
  const sortProducts = (products, sortConfig) => {
    if (!sortConfig.key) return products;

    return [...products].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Manejar valores nulos/undefined
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      // Convertir a string para comparación alfabética si es necesario
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

  // Función para obtener clases de badge de stock
  const getStockBadgeClass = (stock) => {
    if (stock === 0) return "badge badge-danger";
    if (stock < 10) return "badge badge-warning";
    return "badge badge-success";
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

  // Aplicar ordenamiento a los productos filtrados
  const sortedProducts = sortProducts(filteredProducts, sortConfig);

  return (
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
            ) : sortedProducts.length === 0 ? (
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
              sortedProducts.map(product => {
                const margin = getMargin(product.price, product.cost);
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
                      <span className={getStockBadgeClass(product.stock)}>
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
                      <span className={getStockBadgeClass(product.stock)}>
                        {product.stock === 0 ? "Sin Stock" : 
                         product.stock < 10 ? "Bajo Stock" : "Normal"}
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
    </div>
  );
};

export default ProductTable;