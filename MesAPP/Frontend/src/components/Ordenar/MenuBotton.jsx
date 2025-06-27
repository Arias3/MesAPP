import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const botones = [
  'ORDENAR',
  'CAJA',
  'VENTAS',
  'INVENTARIO',
  'REPORTES',
  'PERSONAL'
];

function MenuBotton() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <style>
        {`
        .menu-toggle-btn {
          position: fixed;
          top: 24px;
          left: 0;
          z-index: 101;
          background: #d9d9d9;
          border: none;
          border-top-right-radius: 20px;
          border-bottom-right-radius: 20px;
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
          width: 65px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: flex-end; /* Cambiado para alinear a la derecha */
          padding-right: 18px;      /* Cambiado para separar del borde derecho */
          cursor: pointer;
          box-shadow: 2px 0 12px rgba(0,0,0,0.13);
          transition: background 0.2s;
        }
        .menu-toggle-btn:hover {
          background: #e6e6e6;
        }
        .menu-toggle-icon {
          width: 32px;
          height: 32px;
          display: block;
        }
        .menu-toggle-icon rect {
          fill: #1f484e;
        }
        .menu-botton-drawer {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: 260px;
          background: #d9d9d9;
          box-shadow: 2px 0 16px rgba(0,0,0,0.18);
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(.4,0,.2,1);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px 16px 16px 16px;
          border-top-right-radius: 40px;
          border-bottom-right-radius: 40px;
        }
        .menu-botton-drawer.open {
          transform: translateX(0);
        }
        .menu-botton-logo {
          width: 80px;
          margin-bottom: 32px;
        }
        .menu-botton-buttons {
          display: flex;
          flex-direction: column;
          gap: 18px;
          width: 100%;
        }
        .menu-botton-btn {
          width: 100%;
          padding: 12px 0;
          border: none;
          border-radius: 0.5em;
          background: #1f484e;
          color: #fff;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .menu-botton-btn:hover {
          background: #145055;
        }
        .menu-botton-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.25);
          z-index: 999;
        }
        `}
      </style>
      <button
        className="menu-toggle-btn"
        aria-label="Abrir menú"
        onClick={() => setOpen(true)}
        style={{ display: open ? 'none' : 'flex' }}
      >
        <svg className="menu-toggle-icon" viewBox="0 0 32 32">
          <rect x="6" y="9" width="20" height="3" rx="1.5"/>
          <rect x="6" y="15" width="20" height="3" rx="1.5"/>
          <rect x="6" y="21" width="20" height="3" rx="1.5"/>
        </svg>
      </button>
      {open && <div className="menu-botton-backdrop" onClick={() => setOpen(false)} />}
      <nav className={`menu-botton-drawer${open ? ' open' : ''}`}>
        <img src="/logo.png" alt="Logo" className="menu-botton-logo" />
        <div className="menu-botton-buttons">
          {botones.map((nombre) => (
            <button
              key={nombre}
              className="menu-botton-btn"
              onClick={() => {
                setOpen(false);
                navigate(`/${nombre.toLowerCase()}`);
              }}
            >
              {nombre}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}

export default MenuBotton;