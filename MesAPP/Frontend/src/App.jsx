import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Inventario from './Pages/Inventario/Inventario'
import Ordenes from './Pages/Ordenes/Ordenes'
import Caja from './Pages/Caja/Caja'
import Ventas from './Pages/Ventas/Ventas'
import Reportes from './Pages/Reportes/Reportes'
import Personal from './Pages/Personal/Personal'
import Helados from './Pages/Helados/helados'
import Login from './Pages/Access/Login'
import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/ordenar" element={<Ordenes />} />
        <Route path="/caja" element={<Caja />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/personal" element={<Personal />} />
        <Route path="/Helados" element={<Helados />} />
      </Routes>
    </Router>
  )
}

export default App