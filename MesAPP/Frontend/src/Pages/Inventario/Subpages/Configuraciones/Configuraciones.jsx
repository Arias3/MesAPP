import { useState } from 'react';
import CategoryManager from './subpages/Categorias/CategoryManager';
import FlavorCategoryManager from './subpages/Sabores/FlavorCategoryManager';
import './Configuraciones.css'; // Importar el CSS

function Configuraciones() {
  const [activeTab, setActiveTab] = useState('categories');

  return (
    <div className="configuraciones-container">
      {/* Header */}
      <div className="configuraciones-header">
        <h2>Configuraciones del Sistema</h2>
      </div>

      {/* Navigation Tabs */}
      <nav className="configuraciones-navigation">
        {[
          { id: 'categories', label: 'Categorías', icon: '📂' },
          { id: 'flavors', label: 'Sabores', icon: '🍦' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`configuraciones-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Content Area */}
      <div className="configuraciones-content">
        {activeTab === 'categories' && <CategoryManager />}
        {activeTab === 'flavors' && <FlavorCategoryManager />}
      </div>
    </div>
  );
}

export default Configuraciones;