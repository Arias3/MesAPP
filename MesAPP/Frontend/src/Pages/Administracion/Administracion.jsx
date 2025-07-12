import React, { useState } from "react";
import MenuButton from '../../components/Ordenar/MenuBotton.jsx';
import GestionPersonal from '../../components/Administracion/Personal.jsx';
import Mesas from '../../components/Administracion/Mesas.jsx';
import Helados from '../../components/Administracion/helados.jsx';
import './Administracion.css';


const TABS = [
    { key: "personal", label: "Personal" },
    { key: "mesas", label: "Mesas" },
    { key: "helados", label: "Helados" }
];

function Administracion() {
    const [tab, setTab] = useState("personal");

    return (
        <div className="administracion-background">
            <div className="admin-header">
                <MenuButton />
                <div className="admin-title">ADMINISTRACIÓN</div>
                <nav className="admin-tabs">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            className={`admin-tab-btn${tab === t.key ? " selected" : ""}`}
                            onClick={() => setTab(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="admin-content">
                {tab === "personal" && <GestionPersonal />}
                {tab === "mesas" && <Mesas />}
                {tab === "helados" && <Helados />}
            </div>
        </div>
    );
}

export default Administracion;