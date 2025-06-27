import React from 'react';

function OrdenesFooter({ subtotal, imprimirFactura, setImprimirFactura, onEnviar }) {
  return (
    <>
      <style>
        {`
          .ordenes-footer {
            width: 100%;
            background: #d9d9d9;
            border-radius: 1.4em 1.4em 0 0;
            box-shadow: 0 -2px 8px rgba(0,0,0,0.08);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 16px 16px 16px 16px;
            position: fixed;
            bottom: 0;
            left: 0;
            z-index: 10;
            gap: 10px;
          }

          .footer-subtotal {
            width: 100%;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 8px;
          }

          .footer-label {
            font-weight: bold;
            color: #1f484e;
            font-size: 1.5rem;
          }

          .footer-value {
            color: #111;
            font-size: 1.1rem;
          }

          .footer-checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #1f484e;
            justify-content: center;
            width: 100%;
          }

          .footer-enviar-btn {
            background: #1f484e;
            color: #fff;
            border: none;
            border-radius: 0.5em;
            padding: 10px 24px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
            display: block;
            margin: 0 auto;
          }

          .footer-enviar-btn:hover {
            background: #145055;
          }
        `}
      </style>

      <footer className="ordenes-footer">
        <div className="footer-subtotal">
          <span className="footer-label">Subtotal:</span>
          <span className="footer-value">${subtotal}</span>
        </div>
        <label className="footer-checkbox-label">
          <input
            type="checkbox"
            checked={imprimirFactura}
            onChange={e => setImprimirFactura(e.target.checked)}
          />
          Imprimir factura para el cliente
        </label>
        <button className="footer-enviar-btn" onClick={onEnviar}>
          Enviar pedido
        </button>
      </footer>
    </>
  );
}
export default OrdenesFooter;