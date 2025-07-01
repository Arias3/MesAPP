import React, { useState, useEffect } from "react";
const API_HOST = import.meta.env.VITE_API_HOST;
const API_PORT = import.meta.env.VITE_API_PORT || 5000;

function Mesas() {
  const [cantidad, setCantidad] = useState("");
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  // Obtener cantidad de mesas al cargar
  useEffect(() => {
    async function fetchCantidad() {
      setCargando(true);
      try {
        const res = await fetch(`http://${API_HOST}:${API_PORT}/api/mesas/count`);
        const data = await res.json();
        setCantidad(data.count || 0);
      } catch (e) {
        setMensaje("Error al obtener la cantidad de mesas");
      }
      setCargando(false);
    }
    fetchCantidad();
  }, []);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/, "");
    setCantidad(value ? parseInt(value, 10) : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setCargando(true);
    try {
      // Obtener cantidad actual
      const res = await fetch(`http://${API_HOST}:${API_PORT}/api/mesas/count`);
      const data = await res.json();
      const actual = data.count || 0;
      const nueva = Number(cantidad);

      if (nueva > actual) {
        // Agregar mesas
        await fetch(`http://${API_HOST}:${API_PORT}/api/mesas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cantidad: nueva - actual }),
        });
        setMensaje(`Se agregaron ${nueva - actual} mesas.`);
      } else if (nueva < actual) {
        // Eliminar mesas
        await fetch(`http://${API_HOST}:${API_PORT}/api/mesas`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cantidad: actual - nueva }),
        });
        setMensaje(`Se eliminaron ${actual - nueva} mesas.`);
      } else {
        setMensaje("No hay cambios en la cantidad de mesas.");
      }
    } catch (e) {
      setMensaje("Error al actualizar las mesas.");
    }
    setCargando(false);
  };

  return (
    <div className="mesas-container">
      <style>
        {`
        .mesas-container {
          background: #fff;
          border-radius: 1.4em;
          padding: 40px 32px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          max-width: 420px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .mesas-title {
          font-size: 2rem;
          color: #1f484e;
          font-weight: bold;
          margin-bottom: 24px;
        }
        .mesas-form {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          width: 100%;
        }
        .mesas-input-label {
          font-size: 1.1rem;
          color: #1f484e;
          margin-bottom: 6px;
        }
        .mesas-input {
          font-size: 1.3rem;
          padding: 10px 18px;
          border-radius: 8px;
          border: 1px solid #b0b0b0;
          background: #f7fafb;
          color: #1f484e;
          width: 120px;
          text-align: center;
        }
        .mesas-btn {
          background: #1f484e;
          color: #fff;
          font-size: 1.1rem;
          padding: 10px 28px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          transition: background 0.2s;
        }
        .mesas-btn:hover {
          background: #145055;
        }
        .mesas-msg {
          margin-top: 18px;
          color: #1f484e;
          font-size: 1.1em;
        }
        `}
      </style>
      <div className="mesas-title">Administrar Mesas</div>
      <form className="mesas-form" onSubmit={handleSubmit}>
        <label className="mesas-input-label" htmlFor="cantidad-mesas">
          Cantidad de mesas:
        </label>
        <input
          id="cantidad-mesas"
          className="mesas-input"
          type="number"
          min={1}
          step={1}
          value={cantidad}
          onChange={handleChange}
          required
          disabled={cargando}
        />
        <button className="mesas-btn" type="submit" disabled={cargando}>
          {cargando ? "Guardando..." : "Guardar"}
        </button>
      </form>
      {mensaje && <div className="mesas-msg">{mensaje}</div>}
    </div>
  );
}

export default Mesas;