import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Inventario from './Pages/Inventario'
import Ordenes from './Pages/Ordenes'
import Caja from './Pages/Caja'
import Login from './Pages/Login'
import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <nav>
        <Link to="/">Inicio</Link> |{' '}
        <Link to="/inventario">Inventario</Link> |{' '}
        <Link to="/ordenes">Ordenes</Link> |{' '}
        <Link to="/caja">Caja</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/ordenes" element={<Ordenes />} />
        <Route path="/caja" element={<Caja />} />
      </Routes>
    </Router>
  )
}

export default App