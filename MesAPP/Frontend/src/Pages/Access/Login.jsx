import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

function Login() {
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
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('role', data.role);
        localStorage.setItem('username', username);

        if (data.role.toLowerCase() === 'mesero') {
          navigate('/ordenes');
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
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-button" onClick={handleLogin}>
            Ingresar
          </button>
        </div>
      </div>
    </>
  );
}

  export default Login;
