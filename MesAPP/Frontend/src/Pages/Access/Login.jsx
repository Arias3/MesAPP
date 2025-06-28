import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

function Login() {
  const API_HOST = import.meta.env.VITE_API_HOST;
  const [username, setUsername] = useState("");
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Por favor ingresa un nombre de usuario");
      return;
    }



    try {
      const response = await fetch(`http://${API_HOST}:5000/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('role', data.role);
        localStorage.setItem('username', username);

        if (data.role.toLowerCase() === 'mesero') {
          navigate('/ordenar');
        } else {
          navigate('/home'); // o /admin, /dashboard, etc.
        }
      } else {
        setError('Usuario no encontrado');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    }
  };

  return (
    <>
      <div className="login-background"></div>
      <div className="login-container">
        <div className="login-box">
          <img src="/logo.png" alt="Logo de la app" className="login-logo" />
          <div className="login-title">Iniciar sesión</div>

          {/* Formulario que permite enviar con Enter */}
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => {
                const value = e.target.value
                  .toLowerCase()
                  .replace(/[^a-zñáéíóúü]/g, '');
                setUsername(value);
              }}
              className="login-input"
            />
            {error && <p className="error-message-login">{error}</p>}
            <button type="submit" className="login-button">
              Ingresar
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default Login;
