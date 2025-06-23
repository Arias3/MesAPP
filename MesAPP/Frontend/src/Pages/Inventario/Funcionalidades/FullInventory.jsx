import { useState } from "react";
import "./FullInventory.css"; // CSS específico para FullInventory

function FullInventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [products] = useState([
    { id: 1, name: "Producto A", category: "Categoría 1", stock: 45, price: 25.99 },
    { id: 2, name: "Producto B", category: "Categoría 2", stock: 12, price: 15.50 },
    { id: 3, name: "Producto C", category: "Categoría 1", stock: 0, price: 35.00 },
    { id: 4, name: "Producto D", category: "Categoría 3", stock: 78, price: 42.25 },
    { id: 5, name: "Producto E", category: "Categoría 2", stock: 5, price: 18.75 },
  ]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (stock) => {
    if (stock === 0) return "sin-stock";
    if (stock < 10) return "bajo-stock";
    return "normal";
  };

  return (
    <div className="fullinventory-container">
      <h2>Inventario Completo</h2>
      
      <div className="inventory-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Buscar productos..."
            className="input-field search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn-primary search-btn">🔍</button>
        </div>
        
        <div className="action-buttons">
          <button className="btn-primary">Nuevo Producto</button>
          <button className="btn-primary secondary">Exportar</button>
          <button className="btn-primary secondary">Importar</button>
        </div>
      </div>

      <div className="inventory-summary">
        <div className="summary-item">
          <span className="summary-label">Total de productos:</span>
          <span className="summary-value">{products.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Productos mostrados:</span>
          <span className="summary-value">{filteredProducts.length}</span>
        </div>
      </div>

      <div className="table-container">
        <table className="table inventory-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product.id} className={`row-${getStockStatus(product.stock)}`}>
                <td>{product.id}</td>
                <td className="product-name">{product.name}</td>
                <td>{product.category}</td>
                <td className="stock-cell">
                  <span className={`stock-badge ${getStockStatus(product.stock)}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="price-cell">${product.price}</td>
                <td>
                  <span className={`status-badge ${getStockStatus(product.stock)}`}>
                    {product.stock === 0 ? "Sin Stock" : 
                     product.stock < 10 ? "Bajo Stock" : "Normal"}
                  </span>
                </td>
                <td className="actions-cell">
                  <button className="btn-action edit">✏️</button>
                  <button className="btn-action delete">🗑️</button>
                  <button className="btn-action view">👁️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProducts.length === 0 && (
        <div className="no-results">
          <p>No se encontraron productos que coincidan con tu búsqueda.</p>
        </div>
      )}
    </div>
  );
}

export default FullInventory;