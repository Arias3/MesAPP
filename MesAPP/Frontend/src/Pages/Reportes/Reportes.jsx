import React, { useEffect, useState } from "react";
import MenuButton from "../../components/Ordenar/MenuBotton.jsx";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const API_HOST = import.meta.env.VITE_API_HOST;
const API_PORT = import.meta.env.VITE_API_PORT || 5000;

function formatFecha(fechaStr) {
  // Devuelve DD-MM-YYYY
  const d = new Date(fechaStr);
  return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
}

function Reportes() {
  const [cierres, setCierres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://${API_HOST}:${API_PORT}/api/resportes/cierres/ultimos`)
      .then(res => res.json())
      .then(data => {
        setCierres(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Datos para la gráfica
  const chartData = {
    labels: cierres.map(c => formatFecha(c.fecha)),
    datasets: [
      {
        label: "Recaudado",
        data: cierres.map(c => Number(c.total)),
        fill: false,
        borderColor: "#1976d2",
        backgroundColor: "#1976d2",
        tension: 0.3,
        pointRadius: 5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => value.toLocaleString("es-CO"),
        },
      },
    },
  };

  return (
    <div className="ordenes-background" style={{ display: "flex", flexDirection: "row", gap: 32 }}>
      <MenuButton />
      <div style={{ flex: 2, padding: 24 }}>
        <div className="ventas-title-outer">REPORTES</div>
        <div style={{ background: "#fff", borderRadius: 12, padding: 16 }}>
          {loading ? (
            <div style={{ textAlign: "center" }}>Cargando...</div>
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <button className="ventas-nav-btn" style={{ fontWeight: "bold" }}>
            CORTE DIARIO
          </button>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, marginTop: 48 }}>
        {cierres
          .slice()
          .reverse()
          .map((cierre, idx) => (
            <div
              key={cierre.fecha}
              style={{
                background: "#e0e0e0",
                borderRadius: 16,
                padding: "24px 16px",
                marginBottom: 8,
                boxShadow: idx === 1 ? "0 0 0 3px #1976d2" : "none",
                border: idx === 1 ? "2px solid #1976d2" : "none",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                {formatFecha(cierre.fecha)}
              </div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>
                {Number(cierre.total).toLocaleString("es-CO")}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default Reportes;