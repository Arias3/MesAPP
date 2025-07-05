import React, { useEffect, useRef, useState } from "react";
import MenuButton from "../../components/Ordenar/MenuBotton.jsx";
import CajaDialog from "../../components/Caja/CajaDialog.jsx";
import "./Caja.css";

const API_HOST = import.meta.env.VITE_API_HOST;
const API_PORT = import.meta.env.VITE_API_PORT || 5000;

function Caja() {
  const [cuentas, setCuentas] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const dialogRef = useRef(null);

  // Obtener las cuentas
  useEffect(() => {
    const fetchCuentas = async () => {
      try {
        const res = await fetch(`http://${API_HOST}:${API_PORT}/api/caja`);
        const data = await res.json();
        setCuentas(data);
      } catch (error) {
        console.error("Error al obtener cuentas:", error);
      }
    };

    fetchCuentas();
    const intervalId = setInterval(fetchCuentas, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Cerrar CajaDialog al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        ordenSeleccionada &&
        dialogRef.current &&
        !dialogRef.current.contains(event.target)
      ) {
        setOrdenSeleccionada(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ordenSeleccionada]);

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
          cuentas.map((cuenta) => (
            <div
              className="cuenta-card"
              key={cuenta.NumOrden}
              onClick={() => setOrdenSeleccionada(cuenta.table_number)}
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
        <div ref={dialogRef}>
          <CajaDialog
            mesa={ordenSeleccionada}
            onClose={() => setOrdenSeleccionada(null)}
            onUpdate={() => {
              setOrdenSeleccionada(null);
              fetch(`http://${API_HOST}:${API_PORT}/api/caja`)
                .then((res) => res.json())
                .then((data) => setCuentas(data));
            }}
          />
        </div>
      )}
    </div>
  );
}

export default Caja;
