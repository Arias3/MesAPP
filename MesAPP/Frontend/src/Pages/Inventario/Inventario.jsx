import { useState } from "react";
import Fastview from "./Funcionalidades/FastView";
import FullInventory from "./Funcionalidades/FullInventory";
import MenuButton from '../../components/Ordenar/MenuBotton.jsx';

import "./Inventario.css"; // CSS general

function Inventario() {
  const [activeTab, setActiveTab] = useState("fastview"); // Tab activo por defecto

  return (
    <div className="inventario-container">
      <MenuButton />
      <h1>Inventario</h1>
      
      {/* Barra de navegación superior */}
      <nav className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === "fastview" ? "active" : ""}`}
          onClick={() => setActiveTab("fastview")}
        >
          Vista Rápida
        </button>
        <button 
          className={`tab-button ${activeTab === "fullinventory" ? "active" : ""}`}
          onClick={() => setActiveTab("fullinventory")}
        >
          Inventario Completo
        </button>
      </nav>

      {/* Contenido dinámico según el tab seleccionado */}
      <div className="tab-content">
        {activeTab === "fastview" && <Fastview />}
        {activeTab === "fullinventory" && <FullInventory />}
      </div>
    </div>
  );
}

export default Inventario;