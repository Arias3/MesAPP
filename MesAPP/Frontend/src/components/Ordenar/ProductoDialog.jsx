import React, { useState, useEffect } from 'react';
import './ProductoDialog.css'; // Asegúrate de tener estilos para el diálogo

const fetchProductos = async () => {
    const API_HOST = import.meta.env.VITE_API_HOST;
    const res = await fetch(`http://${API_HOST}:5000/api/ordenar/productos`);
    const text = await res.text();
    if (!res.ok) throw new Error('Error al obtener productos');
    return JSON.parse(text);
};

const fetchSabores = async () => {
    const API_HOST = import.meta.env.VITE_API_HOST;
    const res = await fetch(`http://${API_HOST}:5000/api/ordenar/sabores`);
    const text = await res.text();
    if (!res.ok) throw new Error('Error al obtener sabores');
    return JSON.parse(text);
};

function ProductoDialog({ open, initialData = {}, onClose, onSave, isNew }) {
    const [productos, setProductos] = useState([]);
    const [sabores, setSabores] = useState([]);
    const [nombre, setNombre] = useState('');
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [saboresSeleccionados, setSaboresSeleccionados] = useState([]);
    const [adicional, setAdicional] = useState(false);
    const [notas, setNotas] = useState('');
    const [llevar, setLlevar] = useState(initialData.llevar || 0);

    useEffect(() => {
        setLlevar(initialData.llevar || 0);
    }, [initialData]);

    useEffect(() => {
        if (!open) return;

        let isMounted = true;

        fetchProductos().then(data => {
            if (isMounted) setProductos(data);
        });
        fetchSabores().then(data => {
            if (isMounted) setSabores(data);
        });

        if (isNew) {
            setNombre('');
            setNotas('');
            setAdicional(false);
            setProductoSeleccionado(null);
            setSaboresSeleccionados(
                initialData.sabores
                    ? initialData.sabores.split(',').map(s => s.trim())
                    : []
            );
        } else {
            setNombre(initialData.name || '');
            setNotas(initialData.notas || '');
            setAdicional(false);
            setProductoSeleccionado(null);
            setSaboresSeleccionados(
                initialData.sabores
                    ? initialData.sabores.split(',').map(s => s.trim())
                    : []
            );
        }

        return () => { isMounted = false; };
        // eslint-disable-next-line
    }, [open]);

    useEffect(() => {
        // Busca el producto seleccionado por nombre exacto
        const prod = productos.find(p => p.name === nombre);
        setProductoSeleccionado(prod || null);

        if (prod) {
            setSaboresSeleccionados(prev => {
                // Mantén los sabores ya seleccionados hasta flavor_count
                const nuevos = prev.slice(0, prod.flavor_count);
                while (nuevos.length < prod.flavor_count) {
                    nuevos.push('');
                }
                return nuevos;
            });
        } else {
            setSaboresSeleccionados([]);
        }
    }, [nombre, productos]);

    // Manejar cambio de sabor
    const handleSaborChange = (idx, value) => {
        setSaboresSeleccionados(prev => {
            const arr = [...prev];
            arr[idx] = value;
            return arr;
        });
    };

    if (!open) return null;

    return (
        <div className="producto-dialog-backdrop">
            <div className="producto-dialog">
                <h2>Seleccionar producto</h2>
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        onSave({
                            name: nombre,
                            sabores: saboresSeleccionados.filter(Boolean).join(', '),
                            notas,
                            llevar,
                            price: productoSeleccionado?.price || 0
                        });
                    }}
                >
                    {/* Autocompletado de producto */}
                    <div className="producto-dialog-field">
                        <label>Producto:</label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            list="productos-list"
                            required
                            autoFocus
                        />
                        <datalist id="productos-list">
                            {productos.map(p => (
                                <option key={p.id} value={p.name} />
                            ))}
                        </datalist>
                    </div>

                    {/* Selectores de sabores */}
                    {productoSeleccionado &&
                        saboresSeleccionados.map((sabor, idx) => (
                            <div className="producto-dialog-field" key={idx}>
                                <label>Sabor {idx + 1}:</label>
                                <select
                                    value={sabor}
                                    onChange={e => handleSaborChange(idx, e.target.value)}
                                    required
                                >
                                    <option value="">Selecciona un sabor</option>
                                    {sabores.map(s => (
                                        <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        ))}

                    {productoSeleccionado && (
                        <div className="producto-dialog-field">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={!!llevar}
                                    onChange={e => setLlevar(e.target.checked ? 1 : 0)}
                                />
                                Para llevar
                            </label>
                        </div>
                    )}

                    {/* Notas */}
                    <div className="producto-dialog-field">
                        <label>Notas:</label>
                        <input
                            type="text"
                            value={notas}
                            onChange={e => setNotas(e.target.value)}
                            placeholder="Ej: Sin azúcar"
                        />
                    </div>

                    <div className="producto-dialog-actions">
                        <button type="button" onClick={onClose}>Cancelar</button>
                        <button type="submit" disabled={!productoSeleccionado || saboresSeleccionados.some(s => !s)}>
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ProductoDialog;