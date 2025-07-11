import React, { useState } from 'react';
import './AddProduct.css';

function PayDialog({ total, onClose, onSave }) {
    const [submitted, setSubmitted] = useState(false);
    const [tarjeta, setTarjeta] = useState("");
    const [transferencia, setTransferencia] = useState("");
    const [efectivo, setEfectivo] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);

        const t = Number(tarjeta) || 0;
        const tr = Number(transferencia) || 0;
        const ef = Number(efectivo) || 0;
        const totalPago = t + tr + ef;
        if (totalPago !== total) return;

        // Detectar métodos usados
        const metodos = [];
        if (t > 0) metodos.push("Tarjeta");
        if (tr > 0) metodos.push("Transferencia");
        if (ef > 0) metodos.push("Efectivo");
        const metodosStr = metodos.join("-");

        onSave({
            tarjeta: t,
            transferencia: tr,
            efectivo: ef,
            metodos: metodosStr
        });
    };

    return (
        <div className="add-producto-backdrop">
            <div className="add-producto">
                <form onSubmit={handleSubmit}>
                    <div className="add-producto-field">
                        <label>Tarjeta</label>
                        <input
                            type="number"
                            value={tarjeta}
                            onChange={(e) => setTarjeta(e.target.value)}
                            min="0"
                        />
                    </div>

                    <div className="add-producto-field">
                        <label>Transferencia</label>
                        <input
                            type="number"
                            value={transferencia}
                            onChange={(e) => setTransferencia(e.target.value)}
                            min="0"
                        />
                    </div>

                    <div className="add-producto-field">
                        <label>Efectivo</label>
                        <input
                            type="number"
                            value={efectivo}
                            onChange={(e) => setEfectivo(e.target.value)}
                            min="0"
                        />
                    </div>

                    {submitted && ((Number(tarjeta) || 0) + (Number(transferencia) || 0) + (Number(efectivo) || 0) !== total) && (
                        <div className="add-producto-field" style={{ marginTop: '-8px' }}>
                            <span style={{ color: 'red', fontSize: '0.9rem' }}>
                                La suma ingresada no coincide con el total a pagar.
                            </span>
                        </div>
                    )}

                    <div className="add-producto-actions">
                        <button type="button" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit">
                            Aceptar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PayDialog;