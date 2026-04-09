import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Vehiculos from './pages/Vehiculos'
import Ordenes from './pages/Ordenes'
import NuevaOT from './pages/NuevaOT'
import Presupuestos from './pages/Presupuestos'
import VehiculoPublico from './pages/VehiculoPublico'
import { getOrdenes, getVehiculos, getClientes } from './lib/api'

export default function App() {
  const [ordenes, setOrdenes] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)

  const cargarDatos = async () => {
    try {
      const [ots, vehs, cls] = await Promise.all([getOrdenes(), getVehiculos(), getClientes()])
      setOrdenes(ots || [])
      setVehiculos(vehs || [])
      setClientes(cls || [])
    } catch (err) {
      console.error('Error cargando datos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2E75B6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#1F3864] font-bold">Cargando Libra Fleet...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/flota/:codigo" element={<VehiculoPublico />} />
        <Route path="*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard ordenes={ordenes} vehiculos={vehiculos} />} />
              <Route path="/vehiculos" element={<Vehiculos vehiculos={vehiculos} onRefresh={cargarDatos} />} />
              <Route path="/ordenes" element={<Ordenes ordenes={ordenes} onRefresh={cargarDatos} />} />
              <Route path="/nueva-ot" element={<NuevaOT vehiculos={vehiculos} clientes={clientes} onCrear={cargarDatos} />} />
              <Route path="/presupuestos" element={<Presupuestos vehiculos={vehiculos} clientes={clientes} />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  )
}
