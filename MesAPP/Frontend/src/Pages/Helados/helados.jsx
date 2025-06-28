import React, { useEffect, useState } from "react";
import MenuButton from "../../components/Ordenar/MenuBotton.jsx";

const API_HOST = import.meta.env.VITE_API_HOST;
const API_PORT = import.meta.env.VITE_API_PORT || 5000;

function DisponibilidadHelados() {
    const [sabores, setSabores] = useState([]);
    const [nuevoSabor, setNuevoSabor] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);

    // Obtener todos los sabores (sin filtrar)
    const fetchSabores = async () => {
        const res = await fetch(`http://${API_HOST}:${API_PORT}/api/helados/sabores/all`);
        const data = await res.json();
        setSabores(data);
    };

    useEffect(() => {
        fetchSabores();
    }, []);

    // Cambiar estado del sabor
    const handleToggle = async (id, status) => {
        // Cambia el estado: si es 1 (activo), lo pone en 0 (inactivo), y viceversa
        await fetch(`http://${API_HOST}:${API_PORT}/api/helados/sabores/${id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: status ? 0 : 1 }),
        });
        fetchSabores(); // Refresca la lista después del cambio
    };

    // Agregar nuevo sabor
    const handleAddSabor = async () => {
        if (nuevoSabor.trim()) {
            await fetch(`http://${API_HOST}:${API_PORT}/api/helados/sabores`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: nuevoSabor }),
            });
            setNuevoSabor("");
            setDialogOpen(false);
            fetchSabores();
        }
    };

    return (
        <div className="ordenes-background">
            <style>
                {`
.helados-container {
    background: #d9d9d9;
    border-radius: 1.4em;
    padding: clamp(8px, 2vw, 12px) clamp(8px, 2vw, 18px);
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    gap: clamp(4px, 1vw, 12px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    max-width: 90vw;
    width: min(600px, 90vw);
    min-width: 220px;
    flex-wrap: wrap;
    margin-top: 32px;
}
.helados-label {
    font-size: clamp(1.5rem, 2vw, 2.5rem);
    font-weight: bold;
    color: #1f484e;
    margin-right: clamp(4px, 1vw, 16px);
    text-align: center;
    margin: 0;
}
.helados-table th {
    background: #1f484e;
    color: #fff;
    font-weight: bold;
    border-bottom: 2px solid #145055;
}
.helados-table td {
    color: #1f484e;
    background: #f7fafb;
    border-bottom: 1px solid #c2d1d3;
}
.helados-table tr:nth-child(even) td {
    background: #e3ecee;
}
`}
            </style>
            <MenuButton />
            <div className="helados-container">
                <h2 className="helados-label">
                    DISPONIBILIDAD DE HELADOS
                </h2>
                <div style={{ width: "100%", marginTop: 16 }}>
                    <table
                        className="helados-table"
                        style={{
                            width: "100%",
                            borderRadius: 8,
                            borderCollapse: "collapse",
                        }}
                    >
                        <thead>
                            <tr>
                                <th style={{ width: 40 }}></th>
                                <th style={{ textAlign: "left", color: "#1f484e" }}>Sabor</th>
                                <th style={{ textAlign: "center", color: "#1f484e" }}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sabores.map((sabor) => (
                                <tr key={sabor.id} style={{ borderBottom: "1px solid #eee" }}>
                                    <td style={{ textAlign: "center", color: "#1f484e" }}>
                                        <input
                                            type="checkbox"
                                            checked={!!sabor.status}
                                            onChange={() => handleToggle(sabor.id, sabor.status)}
                                        />
                                    </td>
                                    <td>{sabor.name}</td>
                                    <td style={{ textAlign: "center", color: sabor.status ? "#28a745" : "#dc3545" }}>
                                        {sabor.status ? "Disponible" : "No disponible"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button
                        style={{
                            marginTop: 18,
                            padding: "8px 18px",
                            borderRadius: 8,
                            background: "#1f484e",
                            color: "#fff",
                            fontWeight: "bold",
                            border: "none",
                            fontSize: 16,
                            cursor: "pointer",
                        }}
                        onClick={() => setDialogOpen(true)}
                    >
                        Agregar nuevo sabor
                    </button>
                </div>
            </div>
            {/* Dialogo para agregar sabor */}
            {dialogOpen && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 100,
                    }}
                    onClick={() => setDialogOpen(false)}
                >
                    <div
                        style={{
                            background: "#fff",
                            padding: 24,
                            borderRadius: 12,
                            minWidth: 280,
                            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <label style={{ fontWeight: "bold", color: "#1f484e" }}>
                            Nuevo sabor:
                        </label>
                        <input
                            type="text"
                            value={nuevoSabor}
                            onChange={(e) => setNuevoSabor(e.target.value)}
                            style={{
                                padding: 8,
                                borderRadius: 6,
                                border: "1px solid #ccc",
                            }}
                            autoFocus
                        />
                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                justifyContent: "flex-end",
                            }}
                        >
                            <button
                                style={{
                                    padding: "6px 16px",
                                    borderRadius: 6,
                                    border: "none",
                                    background: "#1f484e",
                                    color: "#fff",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                }}
                                onClick={handleAddSabor}
                            >
                                Agregar
                            </button>
                            <button
                                style={{
                                    padding: "6px 16px",
                                    borderRadius: 6,
                                    border: "none",
                                    background: "#ccc",
                                    color: "#333",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                }}
                                onClick={() => setDialogOpen(false)}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DisponibilidadHelados;