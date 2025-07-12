import { useState } from "react";
import Fastview from "./Subpages/VistaRapida/FastView";
import FullInventory from "./Subpages/InventarioCompleto/FullInventory";
import Configuraciones from "./Subpages/Configuraciones/Configuraciones";
import MenuButton from './../../components/Ordenar/MenuBotton.jsx';

import "./Inventario.css"; // CSS general

function Inventario() {
  const [activeTab, setActiveTab] = useState("fullinventory"); // Tab activo por defecto

  return (
    <div className="inventario-container">
      <MenuButton />
      
      {/* Barra de navegación superior */}
      <nav className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === "fullinventory" ? "active" : ""}`}
          onClick={() => setActiveTab("fullinventory")}
        >
          Inventario Completo
        </button>
        <button 
          className={`tab-button ${activeTab === "configuraciones" ? "active" : ""}`}
          onClick={() => setActiveTab("configuraciones")}
        >
          Configuraciones
        </button>
      </nav>

      {/* Contenido dinámico según el tab seleccionado */}
      <div className="tab-content">
        {activeTab === "fullinventory" && <FullInventory />}
        {activeTab === "configuraciones" && <Configuraciones />}
      </div>
    </div>
  );
}

export default Inventario;