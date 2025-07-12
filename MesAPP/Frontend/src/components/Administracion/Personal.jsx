import React, { useEffect, useState } from "react";

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
    <div className="container-personal">
      <style>
        {`
        .container-personal {
          background: #fff;
          border-radius: 1.4em;
          padding: clamp(16px, 4vw, 32px);
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 20px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.10);
          width: 100%;
          max-width: 1200px;
          margin: 32px auto; /* centra horizontalmente */
          font-size: clamp(1rem, 2vw, 1.2rem);
        }

        .add-form-personal {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
        }

        .table-personal {
          width: 100%;
          border-radius: 12px;
          border-collapse: separate;
          border-spacing: 0;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .table-personal th {
          background: #1f484e;
          color: #f3f3f3;
          font-weight: bold;
          border-bottom: 2px solid #D9D9D9;
          text-align: center;
        }

        .table-personal td {
          color: #1f484e;
          background: #f7fafb;
          border-bottom: 1px solid #c2d1d3;
        }

        .table-personal tr:nth-child(even) td {
          background: #e3ecee;
        }

        .table-personal th, .table-personal td {
          padding: clamp(8px, 1.5vw, 16px);
          font-size: clamp(0.8rem, 1.5vw, 1rem);
        }

        .add-btn-personal, .save-btn-personal, .cancel-btn-personal, .edit-btn-personal {
          font-size: clamp(0.8rem, 1.5vw, 1rem);
          padding: 6px 16px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }

        .add-btn-personal {
          background: #1f484e;
          color: #fff;
        }

        .add-btn-personal:hover {
          background: #145055;
        }

        .save-btn-personal {
          background: #28a745;
          color: #fff;
        }

        .cancel-btn-personal {
          background: #dc3545;
          color: #fff;
        }

        .edit-btn-personal {
          background: #1f484e;
          color: #fff;
          margin-left: 8px;
        }

        .edit-btn-personal:hover {
          background: #145055;
        }

        input[type="text"], select.role-select-personal {
          font-size: clamp(0.9rem, 2vw, 1.1rem);
          padding: 8px 14px;
          border-radius: 6px;
          border: 1px solid #b0b0b0;
          background: #f7fafb;
          color: #1f484e;
          flex: 1;
          min-width: 120px;
        }

        select.role-select-personal {
          background: #fff;
          color: #1f484e;
        }

        @media (max-width: 768px) {
          .add-form-personal {
            flex-direction: column;
            align-items: stretch;
          }

          .table-personal th, .table-personal td {
            padding: 10px;
          }

          input[type="text"], select.role-select-personal {
            width: 100%;
          }
        }


        `}
      </style>
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
              <th style={{ textAlign: "left", color: "#D9D9D9" }}>Nombre</th>
              <th style={{ textAlign: "center", color: "#D9D9D9" }}>Rol</th>
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
  );
}

export default GestionPersonal;