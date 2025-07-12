import { useEffect, useState } from 'react';
import MenuButton from '../../components/Ordenar/MenuBotton.jsx';
import TableSelector from '../../components/Ordenar/TableSelector.jsx';
import OrdenesFooter from '../../components/Ordenar/OrdenesFooter.jsx';
import ProductoDialog from '../../components/Ordenar/ProductoDialog.jsx';
import './Ordenes.css';

function Ordenes() {
  const [mesa, setMesa] = useState(null);
  const [imprimirFactura, setImprimirFactura] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  const [mesasOcupadas, setMesasOcupadas] = useState([]);


  // Estado para las tarjetas de productos
  const [cards, setCards] = useState([
  ]);

  useEffect(() => {
    const API_HOST = import.meta.env.VITE_API_HOST;
    const API_PORT = import.meta.env.VITE_API_PORT || 5000;
    if (mesa && mesa > 0) {
      fetch(`http://${API_HOST}:${API_PORT}/api/mesas/productos/${mesa}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data.productos) && data.productos.length > 0) {
            setCards(data.productos.map(prod => ({
              name: prod.nombre || prod.name || "",
              notas: prod.notas || "",
              llevar: prod.para_llevar ?? prod.llevar ?? 0,
              sabores: prod.sabores || "",
              price: Number(prod.precio ?? prod.price ?? 0)
            })));
          } else {
            setCards([]);
          }
        })
        .catch(() => setCards([]));
    } else {
      setCards([]);
    }
  }, [mesa]);

  const handleCardClick = (idx) => {
    setEditIndex(idx);
    setDialogOpen(true);
  };

  const handleAddCard = () => {
    setEditIndex(null);
    setDialogOpen(true);
  };

  const handleDeleteCard = (idx) => {
    setCards(cards.filter((_, i) => i !== idx));
  };

  const handleSaveCard = (data) => {
    if (editIndex === null) {
      setCards([...cards, { ...data }]); // Elimina takeaway
    } else {
      setCards(cards.map((c, i) => (i === editIndex ? { ...data } : c)));
    }
    setDialogOpen(false);
    setEditIndex(null);
  };

  const subtotal = cards.reduce(
    (acc, card) =>
      acc +
      (Number(card.price) || 0) +
      (card.llevar === 1 ? 1000 : 0),
    0
  );

  const agregarOrdenDB = async (mesa, productos, ordenNum, subtotal) => {
    const API_HOST = import.meta.env.VITE_API_HOST;
    const API_PORT = import.meta.env.VITE_API_PORT || 5000;

    // Enviamos todos los productos de la mesa
    await fetch(`http://${API_HOST}:${API_PORT}/api/ordenar/mesa/${mesa}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productos, ordenNum, subtotal })
    });
  };

  const obtenerNuevoNumeroOrden = async () => {
    const API_HOST = import.meta.env.VITE_API_HOST;
    const API_PORT = import.meta.env.VITE_API_PORT || 5000;
    const res = await fetch(`http://${API_HOST}:${API_PORT}/api/ordenar/lastId`);
    const data = await res.json();
    return data.numero;
  };

  const enviarPedido = async () => {
    const numero = await obtenerNuevoNumeroOrden();

    if (mesa === null) {
      setConfirmMsg("Por favor, seleccionar una Mesa");
      setShowConfirm(true);
      return;
    }
    const API_HOST = import.meta.env.VITE_API_HOST;

    // Prepara los productos con los campos requeridos
    const productos = cards.map(card => ({
      name: card.name,
      notas: card.notas || "",
      sabores: Array.isArray(card.sabores) ? card.sabores : (card.sabores ? card.sabores.split(',') : []),
      llevar: card.llevar || 0,
      price: Number(card.price) || 0
    }));

    // Calcular total con recargo para llevar
    const subtotal = cards.reduce(
      (acc, card) =>
        acc +
        (Number(card.price) || 0) +
        (card.llevar === 1 ? 1000 : 0),
      0
    );

    await agregarOrdenDB(mesa, productos, numero, subtotal);
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString();
    const hora = ahora.toLocaleTimeString();

    const items = cards.map(card => ({
      nombre: card.name,
      sabores: card.sabores || "",
      notas: card.notas || "",
      precio: Number(card.price) || 0,
      llevar: card.llevar || 0
    }));

    const datosImpresion = {
      numero,
      fecha,
      hora,
      items,
      total: subtotal,
      Mesa: `Mesa ${mesa}`
    };

    if (imprimirFactura) {
      const ws = new WebSocket(`ws://${API_HOST}:3000`);
      ws.onopen = () => {
        ws.send(JSON.stringify(datosImpresion));
        ws.close();
      };
      setConfirmMsg("¡Pedido enviado e impresión solicitada!");
    } else {
      setConfirmMsg("¡Pedido enviado correctamente!");
    }
    setShowConfirm(true);
  };

  return (
    <div className="ordenes-background">
      {
        showConfirm && (
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
              zIndex: 1000,
            }}
            onClick={() => {
              setShowConfirm(false);
              window.location.reload(); // Recarga la página
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: 32,
                borderRadius: 12,
                minWidth: 260,
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                textAlign: "center",
                fontWeight: "bold",
                color: "#1f484e",
              }}
              onClick={e => e.stopPropagation()}
            >
              {confirmMsg}
              <div style={{ marginTop: 16 }}>
                <button
                  style={{
                    padding: "8px 24px",
                    borderRadius: 8,
                    background: "#1f484e",
                    color: "#fff",
                    border: "none",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setShowConfirm(false);
                    // Solo recarga si el mensaje es de éxito
                    if (
                      confirmMsg === "¡Pedido enviado correctamente!" ||
                      confirmMsg === "¡Pedido enviado e impresión solicitada!"
                    ) {
                      window.location.reload();
                    }
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )
      }
      <MenuButton />
      <div className="ordenes-container">
        <label className="ordenes-label" htmlFor="mesa-select">MESA:</label>
        <TableSelector mesa={mesa} setMesa={setMesa} mesasOcupadas={mesasOcupadas} />
      </div>
      <div className="ordenes-cards-container">
        {cards.map((card, idx) => (
          <div
            className="ordenes-card"
            key={idx}
            onClick={() => handleCardClick(idx)}
            style={{ cursor: 'pointer' }}
          >
            <div className="ordenes-card-header">
              <span className="ordenes-card-nombre">{card.name}</span>
              <button
                className="ordenes-card-delete"
                onClick={e => {
                  e.stopPropagation();
                  handleDeleteCard(idx);
                }}
                title="Eliminar"
              >
                &#10005;
              </button>
            </div>
            {/* Mostrar sabores si existen */}
            {card.sabores && (
              <div className="ordenes-card-sabores">
                {card.sabores.split(',').join(', ')}
              </div>
            )}
            <div className="ordenes-card-notas">{card.notas}</div>
          </div>
        ))}

        <div
          className="ordenes-card ordenes-card-add"
          onClick={handleAddCard}
        >
          +
        </div>
      </div>
      <ProductoDialog
        open={dialogOpen}
        initialData={editIndex !== null ? cards[editIndex] : {}}
        isNew={editIndex === null}
        onClose={() => { setDialogOpen(false); setEditIndex(null); }}
        onSave={handleSaveCard}
      />
      <OrdenesFooter
        subtotal={subtotal}
        imprimirFactura={imprimirFactura}
        setImprimirFactura={setImprimirFactura}
        onEnviar={enviarPedido}
      />
    </div>
  );
}

export default Ordenes;