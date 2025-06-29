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
    const fetchMesasOcupadas = async () => {
      const API_HOST = import.meta.env.VITE_API_HOST;
      const API_PORT = import.meta.env.VITE_API_PORT || 5000;
      try {
        const res = await fetch(`http://${API_HOST}:${API_PORT}/api/ordenar/sales/pending-tables`);
        const data = await res.json();
        // Si la API devuelve strings, convierte a número:
        const mesas = (data.mesasOcupadas || []).map(Number);
        setMesasOcupadas(mesas);
      } catch (e) {
        setMesasOcupadas([]);
      }
    };
    fetchMesasOcupadas();
  }, []);

  // Calcula el subtotal sumando los precios de las cards
  const subtotal = cards.reduce((acc, card) =>
    acc + (Number(card.price) || 0) + (card.takeaway ? 1000 : 0), 0);


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

  const handleToggleTakeaway = (idx) => {
    setCards(cards.map((card, i) =>
      i === idx ? { ...card, takeaway: !card.takeaway } : card
    ));
  };

  const handleSaveCard = (data) => {
    if (editIndex === null) {
      setCards([...cards, { ...data, takeaway: false }]);
    } else {
      setCards(cards.map((c, i) => (i === editIndex ? { ...data, takeaway: c.takeaway } : c)));
    }
    setDialogOpen(false);
    setEditIndex(null);
  };

  const agregarOrdenDB = async (pedido, total, type) => {
    const API_HOST = import.meta.env.VITE_API_HOST;
    const API_PORT = import.meta.env.VITE_API_PORT || 5000;
    const descripcion = pedido.items.map(item => item.nombre).join(', ');
    const seller = localStorage.getItem('username') || "App";

    const body = {
      table_number: mesa,
      date: pedido.fecha,
      time: pedido.hora,
      description: descripcion,
      total: total,
      type: type,
      seller: seller,
      status: "PENDIENTE"
    };
    await fetch(`http://${API_HOST}:${API_PORT}/api/ordenar/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  };

  const obtenerNuevoNumeroOrden = async () => {
    const API_HOST = import.meta.env.VITE_API_HOST;
    const API_PORT = import.meta.env.VITE_API_PORT || 5000;
    const res = await fetch(`http://${API_HOST}:${API_PORT}/api/ordenar/sales/last-id`);
    const data = await res.json();
    return (data.lastId || 0) + 1;
  };

  const enviarPedido = async () => {
    if (mesa === null) {
      setConfirmMsg("Por favor, seleccionar una Mesa");
      setShowConfirm(true);
      return;
    }
    const API_HOST = import.meta.env.VITE_API_HOST;
    const type = null;
    const total = cards.reduce((acc, card) =>
      acc + (Number(card.price) || 0) + (card.takeaway ? 1000 : 0), 0);

    // Obtén el nuevo número de orden antes de crear el pedido
    const numero = await obtenerNuevoNumeroOrden();

    // Crea el objeto pedido aquí, usando el número generado
    const pedido = {
      numero: numero.toString().padStart(6, "0"),
      fecha: new Date().toISOString().slice(0, 10),
      hora: new Date().toTimeString().slice(0, 8), // "HH:MM:SS"
      Mesa: mesa === 0 ? "Mesa: Mostrador" : `Mesa ${mesa}`,
      total: subtotal,
      items: cards.map(card => ({
        nombre: card.nombre,
        sabores: card.sabores,
        notas: card.takeaway
          ? `PARA LLEVAR${card.notas ? ' - ' + card.notas : ''}`
          : card.notas || "",
      }))
    };

    if (imprimirFactura) {
      const ws = new WebSocket(`ws://${API_HOST}:3000`);
      ws.onopen = () => {
        ws.send(JSON.stringify(pedido));
        ws.close();
      };
      setConfirmMsg("¡Pedido enviado e impresión solicitada!");
    } else {
      setConfirmMsg("¡Pedido enviado correctamente!");
    }

    await agregarOrdenDB(pedido, total, type);
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
              <span className="ordenes-card-nombre">{card.nombre}</span>
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
            <div className="ordenes-card-sabores">{card.sabores}</div>
            <div className="ordenes-card-notas">{card.notas}</div>
            <label
              style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}
              onClick={e => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={!!card.takeaway}
                onChange={e => {
                  handleToggleTakeaway(idx);
                }}
                style={{ marginRight: 6 }}
              />
              Para llevar
            </label>
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