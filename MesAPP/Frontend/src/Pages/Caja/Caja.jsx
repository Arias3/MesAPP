import React, { useEffect, useState } from "react";
import MenuButton from "../../components/Ordenar/MenuBotton.jsx";
import CajaDialog from "../../components/Caja/CajaDialog.jsx";
import "./Caja.css";

const API_HOST = import.meta.env.VITE_API_HOST;
const API_PORT = import.meta.env.VITE_API_PORT || 5000;

function Caja() {
  const [cuentas, setCuentas] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  useEffect(() => {
    fetch(`http://${API_HOST}:${API_PORT}/api/caja`)
      .then(res => res.json())
      .then(data => setCuentas(data));
  }, []);

  return (
    <div className="ordenes-background">
      <MenuButton />
      <div className="ventas-title-outer">CUENTAS PENDIENTES</div>
      <div className="cuentas-container">
        {cuentas.length === 0 ? (
          <div className="cuentas-empty-msg" style={{ textAlign: "center", color: "#ededed", fontSize: "1.2rem", marginTop: "32px" }}>
            No hay cuentas por cobrar
          </div>
        ) : (
          cuentas.map(cuenta => (
            <div
              className="cuenta-card"
              key={cuenta.id}
              onClick={() => setOrdenSeleccionada(cuenta.NumOrden)}
              style={{ cursor: "pointer" }}
            >
              <div className="title-card">
                MESA: {cuenta.table_number === 0 ? "Mostrador" : cuenta.table_number}
              </div>
              <div className="label-card">
                ${Math.round(cuenta.total)}
              </div>
            </div>
          ))
        )}
      </div>
      {ordenSeleccionada && (
        <CajaDialog
          numOrden={ordenSeleccionada}
          onClose={() => setOrdenSeleccionada(null)}
          onUpdate={() => {
            setOrdenSeleccionada(null);
            fetch(`http://${API_HOST}:${API_PORT}/api/caja`)
              .then(res => res.json())
              .then(data => setCuentas(data));
          }}
        />
      )}
    </div>
  );
}

export default Caja;