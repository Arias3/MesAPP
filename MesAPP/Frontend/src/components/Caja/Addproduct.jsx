import React, { useState } from 'react';
import './AddProduct.css';

const fetchProductos = async () => {
    const API_HOST = import.meta.env.VITE_API_HOST;
    const res = await fetch(`http://${API_HOST}:5000/api/ordenar/productos`);
    const text = await res.text();
    if (!res.ok) throw new Error('Error al obtener productos');
    return JSON.parse(text);
};

function AddProduct({ open, onClose, onSave }) {
    const [productos, setProductos] = useState([]);
    const [nombre, setNombre] = useState('');
    const [llevar, setLlevar] = useState(0);

    // Obtener productos solo una vez al cargar
    if (open && productos.length === 0) {
        fetchProductos().then(setProductos).catch(console.error);
    }

    const productoSeleccionado = productos.find(p => p.name === nombre);

    if (!open) return null;

    return (
        <div className="add-producto-backdrop">
            <div className="add-producto">
                <h2>Seleccionar producto</h2>
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        if (!productoSeleccionado) return;
                        onSave({
                            name: nombre,
                            price: productoSeleccionado.price,
                            para_llevar: llevar
                        });
                        setNombre('');
                        setLlevar(0);
                    }}
                >
                    <div className="add-producto-field">
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

                    <div className="add-producto-field">
                        <label>
                            <input
                                type="checkbox"
                                checked={!!llevar}
                                onChange={e => setLlevar(e.target.checked ? 1 : 0)}
                            />
                            Para llevar
                        </label>
                    </div>

                    <div className="add-producto-actions">
                        <button type="button" onClick={onClose}>Cancelar</button>
                        <button type="submit" disabled={!productoSeleccionado}>
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddProduct;
