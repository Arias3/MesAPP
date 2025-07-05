import React, { useState } from 'react';
import './AddProduct.css'; // Asegúrate de que estas clases estén definidas ahí

function PayDialog({ total, onClose, onSave }) {
    const [submitted, setSubmitted] = useState(false);
    const [tarjeta, setTarjeta] = useState(0);
    const [transferencia, setTransferencia] = useState(0);
    const [efectivo, setEfectivo] = useState(0);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);

        const totalPago = tarjeta + transferencia + efectivo;
        if (totalPago !== total) return;

        // Enviar al padre un objeto detallado con los métodos y montos
        onSave({
            tarjeta: tarjeta || 0,
            transferencia: transferencia || 0,
            efectivo: efectivo || 0
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
                            onChange={(e) => setTarjeta(Number(e.target.value))}
                            min="0"
                        />
                    </div>

                    <div className="add-producto-field">
                        <label>Transferencia</label>
                        <input
                            type="number"
                            value={transferencia}
                            onChange={(e) => setTransferencia(Number(e.target.value))}
                            min="0"
                        />
                    </div>

                    <div className="add-producto-field">
                        <label>Efectivo</label>
                        <input
                            type="number"
                            value={efectivo}
                            onChange={(e) => setEfectivo(Number(e.target.value))}
                            min="0"
                        />
                    </div>

                    {submitted && (tarjeta + transferencia + efectivo !== total) && (
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
