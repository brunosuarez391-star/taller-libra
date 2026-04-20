import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Vehiculos from './pages/Vehiculos'
import Ordenes from './pages/Ordenes'
import NuevaOT from './pages/NuevaOT'
import Presupuestos from './pages/Presupuestos'
import Facturacion from './pages/Facturacion'
import VehiculoPublico from './pages/VehiculoPublico'
import Cerebro from './pages/Cerebro'
import Marketing from './pages/Marketing'
import Finanzas from './pages/Finanzas'
import Clientes from './pages/Clientes'
import Inventario from './pages/Inventario'
import Equipo from './pages/Equipo'
import Agenda from './pages/Agenda'
import {
  getOrdenes, getVehiculos, getClientes,
  getGastos, getInventario, getMovimientosInventario, getMecanicos, getAgenda,
} from './lib/api'

export default function App() {
  const [ordenes, setOrdenes] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [clientes, setClientes] = useState([])
  const [gastos, setGastos] = useState([])
  const [insumos, setInsumos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [mecanicos, setMecanicos] = useState([])
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const cargarDatos = async () => {
    setLoadError(null)
    try {
      const [ots, vehs, cls, gs, ins, movs, mecs, tns] = await Promise.all([
        getOrdenes().catch(() => []),
        getVehiculos().catch(() => []),
        getClientes().catch(() => []),
        getGastos().catch(() => []),
        getInventario().catch(() => []),
        getMovimientosInventario().catch(() => []),
        getMecanicos().catch(() => []),
        getAgenda().catch(() => []),
      ])
      setOrdenes(ots || [])
      setVehiculos(vehs || [])
      setClientes(cls || [])
      setGastos(gs || [])
      setInsumos(ins || [])
      setMovimientos(movs || [])
      setMecanicos(mecs || [])
      setTurnos(tns || [])
    } catch (err) {
      console.error('Error cargando datos:', err)
      setLoadError(err.message || 'Error de conexión')
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
            {loadError && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 px-4 py-2 text-sm text-yellow-800 mb-4 rounded-r">
                ⚠️ No se pudieron cargar algunos datos: {loadError}. Verificá conexión y schema Supabase.
              </div>
            )}
            <Routes>
              <Route path="/" element={<Dashboard ordenes={ordenes} vehiculos={vehiculos} />} />
              <Route path="/cerebro" element={<Cerebro ordenes={ordenes} vehiculos={vehiculos} clientes={clientes} gastos={gastos} onRefresh={cargarDatos} />} />
              <Route path="/vehiculos" element={<Vehiculos vehiculos={vehiculos} onRefresh={cargarDatos} />} />
              <Route path="/ordenes" element={<Ordenes ordenes={ordenes} onRefresh={cargarDatos} />} />
              <Route path="/nueva-ot" element={<NuevaOT vehiculos={vehiculos} clientes={clientes} onCrear={cargarDatos} />} />
              <Route path="/clientes" element={<Clientes clientes={clientes} vehiculos={vehiculos} ordenes={ordenes} onRefresh={cargarDatos} />} />
              <Route path="/presupuestos" element={<Presupuestos vehiculos={vehiculos} clientes={clientes} />} />
              <Route path="/facturacion" element={<Facturacion ordenes={ordenes} vehiculos={vehiculos} clientes={clientes} />} />
              <Route path="/finanzas" element={<Finanzas ordenes={ordenes} gastos={gastos} onRefresh={cargarDatos} />} />
              <Route path="/marketing" element={<Marketing />} />
              <Route path="/inventario" element={<Inventario insumos={insumos} movimientos={movimientos} onRefresh={cargarDatos} />} />
              <Route path="/equipo" element={<Equipo ordenes={ordenes} mecanicos={mecanicos} onRefresh={cargarDatos} />} />
              <Route path="/agenda" element={<Agenda clientes={clientes} vehiculos={vehiculos} mecanicos={mecanicos} turnos={turnos} onRefresh={cargarDatos} />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  )
}
