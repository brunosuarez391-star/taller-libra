import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Vehiculos from './pages/Vehiculos'
import Ordenes from './pages/Ordenes'
import NuevaOT from './pages/NuevaOT'
import Login from './pages/Login'
import { ThemeProvider } from './lib/ThemeContext'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { getOrdenes, getVehiculos, getClientes } from './lib/api'

// Lazy load de páginas pesadas — se cargan bajo demanda al navegar
const Presupuestos = lazy(() => import('./pages/Presupuestos'))
const Facturacion = lazy(() => import('./pages/Facturacion'))
const Cobranzas = lazy(() => import('./pages/Cobranzas'))
const SistemaIA = lazy(() => import('./pages/SistemaIA'))
const VehiculoDetalle = lazy(() => import('./pages/VehiculoDetalle'))
const VehiculoPublico = lazy(() => import('./pages/VehiculoPublico'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#2E75B6] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
      </div>
    </div>
  )
}

function FullScreenLoader({ mensaje = 'Cargando Libra Fleet...' }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#2E75B6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#1F3864] dark:text-blue-300 font-bold">{mensaje}</p>
      </div>
    </div>
  )
}

function ProtectedApp() {
  const { user, loading: authLoading } = useAuth()
  const [ordenes, setOrdenes] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const cargarDatos = async () => {
    try {
      setError(null)
      setLoading(true)
      const [ots, vehs, cls] = await Promise.all([getOrdenes(), getVehiculos(), getClientes()])
      setOrdenes(ots || [])
      setVehiculos(vehs || [])
      setClientes(cls || [])
    } catch (err) {
      console.error('Error cargando datos:', err)
      setError(err.message || 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos cuando haya usuario autenticado
  useEffect(() => {
    if (user) cargarDatos()
  }, [user])

  if (authLoading) return <FullScreenLoader mensaje="Verificando sesión..." />

  if (!user) return <Login />

  if (loading && ordenes.length === 0) return <FullScreenLoader />

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error al cargar</h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">{error}</p>
          <button
            onClick={cargarDatos}
            className="w-full bg-[#1F3864] text-white py-2.5 rounded-lg font-bold hover:bg-[#2E75B6]"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/flota/:codigo" element={
          <Suspense fallback={<PageLoader />}>
            <VehiculoPublico />
          </Suspense>
        } />
        <Route path="*" element={
          <Layout vehiculos={vehiculos} ordenes={ordenes} clientes={clientes}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Dashboard ordenes={ordenes} vehiculos={vehiculos} />} />
                <Route path="/vehiculos" element={<Vehiculos vehiculos={vehiculos} onRefresh={cargarDatos} />} />
                <Route path="/vehiculo/:codigo" element={<VehiculoDetalle vehiculos={vehiculos} ordenes={ordenes} onRefresh={cargarDatos} />} />
                <Route path="/ordenes" element={<Ordenes ordenes={ordenes} onRefresh={cargarDatos} />} />
                <Route path="/nueva-ot" element={<NuevaOT vehiculos={vehiculos} clientes={clientes} onCrear={cargarDatos} />} />
                <Route path="/presupuestos" element={<Presupuestos vehiculos={vehiculos} clientes={clientes} />} />
                <Route path="/facturacion" element={<Facturacion ordenes={ordenes} vehiculos={vehiculos} clientes={clientes} />} />
                <Route path="/cobranzas" element={<Cobranzas ordenes={ordenes} clientes={clientes} />} />
                <Route path="/sistema-ia" element={<SistemaIA vehiculos={vehiculos} ordenes={ordenes} clientes={clientes} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProtectedApp />
      </AuthProvider>
    </ThemeProvider>
  )
}
