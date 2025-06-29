import React, { useEffect, useState } from "react";
import MenuButton from "../../components/Ordenar/MenuBotton.jsx";

const API_HOST = import.meta.env.VITE_API_HOST;
const API_PORT = import.meta.env.VITE_API_PORT || 5000;
const ROLES = ["admin", "mesero", "cocinero"];

function GestionPersonal() {
  const [personal, setPersonal] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState(ROLES[0]);
  const [error, setError] = useState("");


  // Obtener todo el personal
  const fetchPersonal = async () => {
    try {
      const res = await fetch(`http://${API_HOST}:${API_PORT}/api/staff`);
      const data = await res.json();
      setPersonal(data);
      setError("");
    } catch (e) {
      setError("Ocurrió un error al guardar los cambios.");
    }
  };

  // Actualizar rol en la base de datos
  const handleRoleChange = async (id, newRole) => {
    try {
      await fetch(`http://${API_HOST}:${API_PORT}/api/staff/${id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      setPersonal(personal =>
        personal.map(p =>
          p.id === id ? { ...p, role: newRole } : p
        )
      );
      setError("");
    } catch (e) {
      setError("Ocurrió un error al guardar los cambios.");
    }
  };

  // Actualizar nombre en la base de datos
  const handleNameSave = async (id) => {
    try {
      await fetch(`http://${API_HOST}:${API_PORT}/api/staff/${id}/name`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      setPersonal(personal =>
        personal.map(p =>
          p.id === id ? { ...p, name: editName } : p
        )
      );
      setEditId(null);
      setEditName("");
      setError("");
    } catch (e) {
      setError("Ocurrió un error al guardar los cambios.");
    }
  };

  // Agregar nuevo miembro
  const handleAddMember = async () => {
    if (!newName.trim()) return;
    await fetch(`http://${API_HOST}:${API_PORT}/api/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, role: newRole }),
    });
    setNewName("");
    setNewRole(ROLES[0]);
    setShowAdd(false);
    fetchPersonal();
  };

  useEffect(() => {
    fetchPersonal();
  }, []);

  return (
    <div className="ordenes-background">
      <style>
        {`
.container-personal {
    background: #d9d9d9;
    border-radius: 1.4em;
    padding: clamp(8px, 2vw, 12px) clamp(8px, 2vw, 18px);
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    gap: clamp(4px, 1vw, 12px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    max-width: 90vw;
    width: min(600px, 90vw);
    min-width: 220px;
    flex-wrap: wrap;
    margin-top: 32px;
}
.label-personal {
    font-size: clamp(1.5rem, 2vw, 2.5rem);
    font-weight: bold;
    color: #1f484e;
    margin-right: clamp(4px, 1vw, 16px);
    text-align: center;
    margin: 0;
}
.table-personal th {
    background: #1f484e;
    color: #fff;
    font-weight: bold;
    border-bottom: 2px solid #145055;
}
.table-personal td {
    color: #1f484e;
    background: #f7fafb;
    border-bottom: 1px solid #c2d1d3;
}
.table-personal tr:nth-child(even) td {
    background: #e3ecee;
}
select.role-select-personal {
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid #b0b0b0;
    font-size: 1rem;
    background: #fff;
    color: #1f484e;
}
.edit-btn-personal {
    margin-left: 8px;
    background: #1f484e;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 2px 8px;
    cursor: pointer;
    font-size: 0.95em;
    transition: background 0.2s;
}
.edit-btn-personal:hover {
    background: #145055;
}
.save-btn-personal, .cancel-btn-personal {
    margin-left: 4px;
    background: #28a745;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 2px 8px;
    cursor: pointer;
    font-size: 0.95em;
    transition: background 0.2s;
}
.cancel-btn-personal {
    background: #dc3545;
}
`}
      </style>
      <MenuButton />
      <div className="container-personal">
        <h2 className="label-personal">
          PERSONAL
        </h2>
        <button
          className="add-btn-personal"
          onClick={() => setShowAdd(v => !v)}
        >
          {showAdd ? "Cancelar" : "Agregar miembro"}
        </button>
        {showAdd && (
          <div className="add-form-personal">
            <input
              type="text"
              placeholder="Nombre"
              value={newName}
              onChange={e => {
                const value = e.target.value.replace(/[^a-zA-Z\s]/g, "").toLowerCase();
                setNewName(value);
              }}
              style={{
                padding: "4px 8px",
                borderRadius: 4,
                border: "1px solid #b0b0b0",
                fontSize: "1em",
                width: 120,
              }}
            />
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              className="role-select-personal"
            >
              {ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <button
              className="save-btn-personal"
              onClick={handleAddMember}
              disabled={!newName.trim()}
            >
              Guardar
            </button>
          </div>
        )}
        <div style={{ width: "100%", marginTop: 16 }}>
          <table
            className="table-personal"
            style={{
              width: "100%",
              borderRadius: 8,
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: "left", color: "#1f484e" }}>Nombre</th>
                <th style={{ textAlign: "center", color: "#1f484e" }}>Rol</th>
              </tr>
            </thead>
            <tbody>
              {personal.map((persona) => (
                <tr key={persona.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>
                    {editId === persona.id ? (
                      <>
                        <input
                          type="text"
                          value={editName}
                          onChange={e => {
                            // Solo letras y espacios, convierte a minúsculas
                            const value = e.target.value.replace(/[^a-zA-Z\s]/g, "").toLowerCase();
                            setEditName(value);
                          }}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            border: "1px solid #b0b0b0",
                            fontSize: "1em",
                            width: "70%",
                          }}
                        />
                        <button
                          className="save-btn-personal"
                          onClick={() => handleNameSave(persona.id)}
                          disabled={!editName.trim()}
                        >
                          Guardar
                        </button>
                        <button
                          className="cancel-btn-personal"
                          onClick={() => { setEditId(null); setEditName(""); }}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        {persona.name}
                        <button
                          className="edit-btn-personal"
                          onClick={() => { setEditId(persona.id); setEditName(persona.name); }}
                          title="Editar nombre"
                        >
                          ✎
                        </button>
                      </>
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <select
                      className="role-select-personal"
                      value={persona.role}
                      onChange={e => handleRoleChange(persona.id, e.target.value)}
                    >
                      {ROLES.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default GestionPersonal;