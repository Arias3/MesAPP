import React, { useEffect, useState } from "react";
import MenuButton from "../../components/Ordenar/MenuBotton.jsx";
import "./Ventas.css";

const API_HOST = import.meta.env.VITE_API_HOST;
const API_PORT = import.meta.env.VITE_API_PORT || 5000;

function formatDate(date) {
  return date.toISOString().slice(0, 10); // "2025-06-29"
}

function formatTime(timeStr) {
  // Asegura formato HH:MM
  return timeStr.slice(0, 5);
}

function Ventas() {
  const [fecha, setFecha] = useState(() => {
    const hoy = new Date();
    hoy.setHours(hoy.getHours() - hoy.getTimezoneOffset() / 60); // Ajuste zona horaria
    return formatDate(hoy);
  });
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch ventas por fecha
  const fetchVentas = async (fechaBuscar) => {
    setLoading(true);
    const res = await fetch(`http://${API_HOST}:${API_PORT}/api/ventas?date=${fechaBuscar}`);
    const data = await res.json();
    setVentas(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchVentas(fecha);
  }, [fecha]);

  // Navegación entre días
  const cambiarDia = (dias) => {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    setFecha(formatDate(nuevaFecha));
  };

  // Determina si estamos en hoy
  const hoyStr = formatDate(new Date());
  const esHoy = fecha === hoyStr;

  const totalEfectivo = ventas
    .filter(v => v.type && v.type.toLowerCase() === "efectivo")
    .reduce((acc, v) => acc + Number(v.total), 0);

  const totalElectronicos = ventas
    .filter(v => v.type && (v.type.toLowerCase() === "tarjeta" || v.type.toLowerCase() === "transferencia"))
    .reduce((acc, v) => acc + Number(v.total), 0);

  const totalIngresos = totalEfectivo + totalElectronicos;

  return (
    <div className="ordenes-background">
      <MenuButton />
      <div className="ventas-title-outer">
        Historial de ventas y pedidos
      </div>
      <div className="ventas-container">
        <div>
          {!esHoy && (
            <button className="ventas-nav-btn" onClick={() => cambiarDia(1)}>
              Día siguiente
            </button>
          )}
          <button className="ventas-nav-btn" onClick={() => cambiarDia(-1)}>
            Día anterior
          </button>
          {!esHoy && (
            <span style={{ marginLeft: 12, color: "#1f484e", fontWeight: "bold" }}>
              {fecha}
            </span>
          )}
          {esHoy && (
            <span style={{ marginLeft: 12, color: "#1f484e", fontWeight: "bold" }}>
              Hoy ({fecha})
            </span>
          )}
        </div>
        {loading ? (
          <div style={{ marginTop: 24, textAlign: "center" }}>Cargando...</div>
        ) : (
          <table className="ventas-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Descripción</th>
                <th>Total</th>
                <th>Método</th>
                <th>Vendedor</th>
              </tr>
            </thead>
            <tbody>
              {ventas.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#888" }}>
                    No hay ventas para esta fecha.
                  </td>
                </tr>
              ) : (
                ventas.map((venta) => (
                  <tr key={venta.id}>
                    <td>{formatTime(venta.time)}</td>
                    <td className="descripcion-cell">{venta.description}</td>
                    <td>${Number(venta.total).toFixed(2)}</td>
                    <td>{venta.type}</td>
                    <td>{venta.seller}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      <div className="ventas-footer">
        <div>
          <span className="ventas-footer-label">TOTAL EFECTIVO:</span>
          <span className="ventas-footer-total"> ${Math.round(totalEfectivo)}</span>
        </div>
        <div>
          <span className="ventas-footer-label">TOTAL ELECTRÓNICOS:</span>
          <span className="ventas-footer-total"> ${Math.round(totalElectronicos)}</span>
        </div>
        <div>
          <span className="ventas-footer-label">TOTAL INGRESOS:</span>
          <span className="ventas-footer-total"> ${Math.round(totalIngresos)}</span>
        </div>
      </div>
    </div>
  );
}

export default Ventas;