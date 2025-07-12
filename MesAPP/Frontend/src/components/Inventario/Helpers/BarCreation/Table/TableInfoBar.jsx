import React from 'react';
import { Maximize2 } from 'lucide-react';
import './TableInfoBar.css';

const TableInfoBar = ({ 
  totalElements, 
  shownElements, 
  elementsPerPage, 
  onExpand,
  isExpanded = false 
}) => {
  return (
    <div className="table-info-bar">
      <div className="info-stats">
        <div className="stat-item">
          <span className="stat-label">Total:</span>
          <span className="stat-value">{totalElements.toLocaleString('es-ES')}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Mostrados:</span>
          <span className="stat-value">{shownElements.toLocaleString('es-ES')}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Por página:</span>
          <span className="stat-value">{elementsPerPage}</span>
        </div>
      </div>
      
      {!isExpanded && (
        <button 
          className="expand-button"
          onClick={onExpand}
          title="Expandir tabla"
          type="button"
        >
          <Maximize2 className="expand-icon" />
          <span className="expand-text">Expandir</span>
        </button>
      )}
    </div>
  );
};

export default TableInfoBar;