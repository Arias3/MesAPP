import React from 'react';
import { Package, Upload, Download, Plus } from 'lucide-react';
import ImportButton from './../../button/Import/importInventary.jsx';
import ExportButton from './../../button/Export/exportInventary.jsx';
import NewProductInventary from './../../NewProduct/NewProduct.jsx';
import './ActionBar.css';

const InventoryActionsBar = ({ 
  apiBaseUrl, 
  onProductCreated,
  className = '' 
}) => {
  return (
    <div className={`inventory-actions-bar ${className}`}>
      <div className="actions-container">
        {/* Nuevo Producto */}
        <div className="action-item">
          <NewProductInventary 
            onProductCreated={onProductCreated}
            apiBaseUrl={apiBaseUrl}
          />
        </div>

        {/* Separador visual */}
        <div className="actions-separator"></div>

        {/* Importar */}
        <div className="action-item">
          <ImportButton apiBaseUrl={apiBaseUrl} />
        </div>

        {/* Exportar */}
        <div className="action-item">
          <ExportButton apiBaseUrl={apiBaseUrl} />
        </div>
      </div>

      
    </div>
  );
};

export default InventoryActionsBar;