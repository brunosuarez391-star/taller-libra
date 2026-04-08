import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Vehiculos from './pages/Vehiculos'
import Ordenes from './pages/Ordenes'
import NuevaOT from './pages/NuevaOT'
import VehiculoPublico from './pages/VehiculoPublico'

export default function App() {
  const [ordenes, setOrdenes] = useState([])

  const handleCrearOT = (ot) => {
    setOrdenes(prev => [...prev, ot])
  }

  const handleActualizarEstado = (otNumero, nuevoEstado) => {
    setOrdenes(prev => prev.map(ot =>
      ot.ot_numero === otNumero ? { ...ot, estado: nuevoEstado } : ot
    ))
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Página pública (sin layout, accesible por QR) */}
        <Route path="/flota/:codigo" element={<VehiculoPublico ordenes={ordenes} />} />

        {/* App principal con layout */}
        <Route path="*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard ordenes={ordenes} />} />
              <Route path="/vehiculos" element={<Vehiculos />} />
              <Route path="/ordenes" element={<Ordenes ordenes={ordenes} onActualizarEstado={handleActualizarEstado} />} />
              <Route path="/nueva-ot" element={<NuevaOT onCrear={handleCrearOT} />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  )
}
