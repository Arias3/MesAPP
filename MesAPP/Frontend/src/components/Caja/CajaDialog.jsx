import React, { useEffect, useState, useRef } from "react";
import { FaTrashAlt } from "react-icons/fa";
import AddProduct from "./Addproduct.jsx";
import PayDialog from "./PayDialog.jsx";
import "./CajaDialog.css";
import nequiImg from '../../assets/nequi.png';

const API_HOST = import.meta.env.VITE_API_HOST;
const API_PORT = import.meta.env.VITE_API_PORT || 5000;

const METODOS = [
    {
        key: "Transferencia",
        icon: <img src={nequiImg} alt="Nequi" style={{ width: 30, height: 30, objectFit: "contain" }} />
    },
    { key: "Tarjeta", icon: <span style={{ fontSize: 28 }}>💳</span> },
    { key: "Efectivo", icon: <span style={{ fontSize: 28 }}>💲</span> }
];

function CajaDialog({ mesa, onClose, onUpdate }) {
    const [orden, setOrden] = useState(null);
    const [metodo, setMetodo] = useState(null);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [imprimir, setImprimir] = useState(false);
    const [macro, setMacro] = useState(true);
    const [productos, setProductos] = useState([]);
    const [pagoDividido, setPagoDividido] = useState(false);
    const [showPayDialog, setShowPayDialog] = useState(false);
    const [dividido, setDividido] = useState(null); // guarda { tarjeta, transferencia, efectivo }


    const dialogRef = useRef(null);

    useEffect(() => {
        fetch(`http://${API_HOST}:${API_PORT}/api/caja/mesa/${mesa}`)
            .then(res => res.json())
            .then(data => {
                setOrden(data);
                setMetodo(data.type || null);
                setProductos(data.productos || []);
            });
    }, [mesa]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dialogRef.current && !dialogRef.current.contains(event.target)) {
                onClose && onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    if (!orden) return null;

    const productosConDesechable = () => {
        const paraLlevarCount = productos.filter(p => p.para_llevar === 1).length;
        const lista = [...productos];
        if (paraLlevarCount > 0) {
            lista.push({
                name: "Desechable",
                price: paraLlevarCount * 1000,
                para_llevar: 0
            });
        }
        return lista;
    };

    const handleAgregarProducto = (nuevoProducto) => {
        setProductos(prev => [...prev, nuevoProducto]);
        setShowAddProduct(false);
    };

    const handleEliminar = async () => {
        await fetch(`http://${API_HOST}:${API_PORT}/api/caja/mesa/${mesa}`, { method: "DELETE" });
        onClose && onClose();
        onUpdate && onUpdate();
    };

    const handleCobrar = async () => {

        if (!metodo) {
            alert("Debes seleccionar un método de pago antes de cobrar.");
            return;
        }

        const finalProductos = productosConDesechable();
        const descripcion = finalProductos.map(p => p.name).filter(Boolean).join(',');
        const total = finalProductos.reduce((acc, prod) => acc + Number(prod.price), 0);

        const metodoPago = metodo === "Dividido" ? dividido : { [metodo]: total };

        // Liberrar la mesa
        await fetch(`http://${API_HOST}:${API_PORT}/api/ventas/${mesa}/disponible`, {
            method: "PUT"
        });

        // Datos para la venta
        const now = new Date();
        const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
        const time = now.toTimeString().slice(0, 8); // HH:mm:ss
        const seller = localStorage.getItem("username") || "Desconocido";
        const table_number = mesa;


        // Registrar venta
        await fetch(`http://${API_HOST}:${API_PORT}/api/ventas/sales`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                table_number: mesa,
                date,
                time,
                description: descripcion,
                total,
                type: metodo,
                seller,
                NumOrden: orden.ordenNum
            })
        });

        await fetch(`http://${API_HOST}:${API_PORT}/api/ventas/${mesa}/borrar`, {
            method: "DELETE"
        });

        

        onClose && onClose();
        onUpdate && onUpdate();
    };



    const finalProductos = productosConDesechable();

    return (
        <div className="caja-dialog-overlay">
            <div className="caja-dialog" ref={dialogRef}>
                <div className="caja-dialog-header">
                    <span className="caja-dialog-title">
                        ORDEN #{String(orden.ordenNum || 0).padStart(2, "0")}
                    </span>
                    <button className="caja-dialog-delete" onClick={handleEliminar}>
                        <FaTrashAlt size={22} />
                    </button>
                </div>

                <div className="caja-dialog-table-scroll">
                    <table className="caja-dialog-table">
                        <tbody>
                            {finalProductos.length > 0 ? (
                                finalProductos.map((prod, idx) => (
                                    <tr key={`${prod.name}-${idx}`}>
                                        <td>
                                            {prod.name}
                                            {prod.para_llevar === 1 && <span style={{ marginLeft: 8, color: "#888" }}>🛍</span>}
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            {Number(prod.price).toLocaleString("es-CO")}
                                        </td>
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
                    ${finalProductos.reduce((acc, prod) => acc + Number(prod.price), 0).toLocaleString("es-CO")}
                </div>

                <button className="caja-dialog-add" onClick={() => setShowAddProduct(true)}>
                    Agregar productos
                </button>

                {showAddProduct && (
                    <AddProduct
                        open={showAddProduct}
                        onClose={() => setShowAddProduct(false)}
                        onSave={handleAgregarProducto}
                        isNew={true}
                    />
                )}
                <div className="caja-dialog-checkboxes">
                    <label >
                        <input
                            type="checkbox"
                            checked={pagoDividido}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setPagoDividido(checked);
                                if (checked) {
                                    setShowPayDialog(true);
                                }
                            }}
                        />
                        Pagar dividido
                    </label>
                </div>

                {showPayDialog && (
                    <PayDialog
                        open={showPayDialog}
                        total={finalProductos.reduce((acc, p) => acc + Number(p.price), 0)}
                        onClose={() => setShowPayDialog(false)}
                        onSave={(data) => {
                            setDividido(data);
                            setMetodo("Dividido");
                            setShowPayDialog(false);
                        }}
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
                        Ingresar a sistema automáticamente
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
