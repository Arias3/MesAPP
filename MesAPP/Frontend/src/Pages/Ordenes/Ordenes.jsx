import React, { useState } from 'react';
import MenuButton from '../../components/Ordenar/MenuBotton.jsx';
import TableSelector from '../../components/Ordenar/TableSelector.jsx';
import OrdenesFooter from '../../components/Ordenar/OrdenesFooter.jsx';
import ProductoDialog from '../../components/Ordenar/ProductoDialog.jsx';
import './Ordenes.css';

function Ordenes() {
  const [mesa, setMesa] = useState(1);
  const [imprimirFactura, setImprimirFactura] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  // Estado para las tarjetas de productos
  const [cards, setCards] = useState([
  ]);

  // Calcula el subtotal sumando los precios de las cards
  const subtotal = cards.reduce((acc, card) => acc + (Number(card.price) || 0), 0);


  const handleCardClick = (idx) => {
    setEditIndex(idx);
    setDialogOpen(true);
  };

  const handleAddCard = () => {
    setEditIndex(null);
    setDialogOpen(true);
  };

  const handleSaveCard = (data) => {
    if (editIndex === null) {
      setCards([...cards, data]);
    } else {
      setCards(cards.map((c, i) => (i === editIndex ? data : c)));
    }
    setDialogOpen(false);
    setEditIndex(null);
  };

  const pedido = {
    numero: "190601", // Puedes generar un número único o usar un timestamp
    fecha: new Date().toISOString().slice(0, 10),
    hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    Mesa: `Mesa ${mesa}`,
    items: cards.map(card => ({
      nombre: card.nombre,
      sabores: card.sabores,
      notas: card.notas,
    }))
  };

  const enviarPedido = () => {
    const ws = new WebSocket("ws://localhost:3000");
    ws.onopen = () => {
      ws.send(JSON.stringify(pedido));
      ws.close();
    };
  };

  return (
    <div className="ordenes-background">
      <MenuButton />
      <div className="ordenes-container">
        <label className="ordenes-label" htmlFor="mesa-select">MESA:</label>
        <TableSelector mesa={mesa} setMesa={setMesa} />
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