import React, { useEffect, useState } from "react";
import { FaTrashAlt } from "react-icons/fa";
import ProductoDialog from "../Ordenar/ProductoDialog.jsx"; // Asegúrate de tener este componente
import "./CajaDialog.css";
import nequiImg from '../../assets/nequi.png';

const API_HOST = import.meta.env.VITE_API_HOST;
const API_PORT = import.meta.env.VITE_API_PORT || 5000;

const METODOS = [
    { key: "Transferencia", icon: <img src={nequiImg} alt="Nequi" style={{ width: 30, height: 30, objectFit: "contain" }} /> },
    { key: "Tarjeta", icon: <span style={{ fontSize: 28 }}>💳</span> },
    { key: "Efectivo", icon: <span style={{ fontSize: 28 }}>💲</span> }
];

function CajaDialog({ numOrden, onClose, onUpdate }) {
    const [orden, setOrden] = useState(null);
    const [metodo, setMetodo] = useState(null);
    const [showProductoDialog, setShowProductoDialog] = useState(false);
    const [imprimir, setImprimir] = useState(false);
    const [macro, setMacro] = useState(true);
    const [productos, setProductos] = useState([]);
    useEffect(() => {
        fetch(`http://${API_HOST}:${API_PORT}/api/caja/orden/${numOrden}`)
            .then(res => res.json())
            .then(data => {
                setOrden(data);
                setMetodo(data.type || null);
                setProductos(data.productos || []);
            });
    }, [numOrden]);

    if (!orden) return null;

    const handleAgregarProducto = (nuevoProducto) => {
        setProductos(prev => [...prev, nuevoProducto]);
        setShowProductoDialog(false);
    };

    const handleEliminar = async () => {
        await fetch(`http://${API_HOST}:${API_PORT}/api/caja/orden/${numOrden}`, { method: "DELETE" });
        onClose && onClose();
        onUpdate && onUpdate();
    };

    const handleCobrar = async () => {
        const descripcion = productos.map(p => p.nombre || p.name).filter(Boolean).join(',');
        const total = productos.reduce((acc, prod) => acc + Number(prod.price), 0);

        await fetch(`http://${API_HOST}:${API_PORT}/api/caja/orden/${numOrden}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: metodo,
                descripcion,
                total,
                status: "PAGO"
            })
        });
        onClose && onClose();
        onUpdate && onUpdate();
    };
    return (
        <div className="caja-dialog-overlay">
            <div className="caja-dialog">
                <div className="caja-dialog-header">
                    <span className="caja-dialog-title">ORDEN #{String(orden.NumOrden).padStart(2, "0")}</span>
                    <button className="caja-dialog-delete" onClick={handleEliminar}>
                        <FaTrashAlt size={22} />
                    </button>
                </div>
                <div className="caja-dialog-table-scroll">
                    <table className="caja-dialog-table">
                        <tbody>
                            {productos.length > 0 ? (
                                productos.map((prod, idx) => (
                                    <tr key={idx}>
                                        <td>{prod.name}</td>
                                        <td style={{ textAlign: "right" }}>{Number(prod.price).toLocaleString("es-CO")}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} style={{ textAlign: "center", color: "#888" }}>
                                        Sin productos
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="caja-dialog-total">
                    ${productos.length > 0
                        ? productos.reduce((acc, prod) => acc + Number(prod.price), 0).toLocaleString("es-CO")
                        : 0}
                </div>
                <button className="caja-dialog-add" onClick={() => setShowProductoDialog(true)}>
                    Agregar productos
                </button>
                {showProductoDialog && (
                    <ProductoDialog
                        open={showProductoDialog}
                        onClose={() => setShowProductoDialog(false)}
                        onSave={handleAgregarProducto}
                        isNew={true}
                    />
                )}
                <div className="caja-dialog-metodos">
                    {METODOS.map(m => (
                        <button
                            key={m.key}
                            className={`caja-dialog-metodo-btn${metodo === m.key ? " selected" : ""}`}
                            onClick={() => setMetodo(m.key)}
                        >
                            {m.icon}
                        </button>
                    ))}
                </div>
                <div className="caja-dialog-checkboxes">
                    <label>
                        <input type="checkbox" checked={macro} onChange={e => setMacro(e.target.checked)} />
                        Ingresar a sistema automaticamente
                    </label>
                    <label>
                        <input type="checkbox" checked={imprimir} onChange={e => setImprimir(e.target.checked)} />
                        Imprimir factura para el cliente
                    </label>
                </div>
                <button className="caja-dialog-cobrar" onClick={handleCobrar}>
                    COBRAR
                </button>
            </div>
        </div>
    );
}

export default CajaDialog;