import React, { useState } from "react";
import "./login.css";

function Login() {
  const [username, setUsername] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (data.success) {
        // Guarda el rol en el almacenamiento local
        localStorage.setItem('role', data.role);
        localStorage.setItem('username', username);
        navigate('/home');
      } else {
        setError('Usuario no encontrado');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    }
  };


  return (
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
        <button className="login-button" onClick={handleLogin}>
          Ingresar
        </button>
      </div>
    </div>
  );
}

export default Login;
