import { useState, useEffect } from 'react'
import { EMPRESA } from './lib/data'
import { getClientes, getPresupuestosChapa } from './lib/api'
import NuevoPresupuesto from './pages/NuevoPresupuesto'
import ListaTrabajos from './pages/ListaTrabajos'
import Facturacion from './pages/Facturacion'

const TABS = [
  { id: 'nuevo', label: '+ Nuevo presupuesto', icon: '🎨' },
  { id: 'trabajos', label: 'Trabajos', icon: '📋' },
  { id: 'facturacion', label: 'Facturación', icon: '💰' },
]

export default function App() {
  const [tab, setTab] = useState('nuevo')
  const [clientes, setClientes] = useState([])
  const [presupuestos, setPresupuestos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarDatos = async () => {
    try {
      setError(null)
      setLoading(true)
      const [cls, pres] = await Promise.all([
        getClientes().catch(() => []),
        getPresupuestosChapa().catch(() => []),
      ])
      setClientes(cls || [])
      setPresupuestos(pres || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  if (loading && presupuestos.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-orange-300 font-bold">Cargando Libra Chapa y Pintura...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-slate-300 text-sm mb-4">{error}</p>
          <button onClick={cargarDatos} className="w-full bg-orange-500 text-white py-2.5 rounded-lg font-bold hover:bg-orange-600">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎨</span>
              <div>
                <h1 className="text-lg font-bold leading-tight text-orange-400">LIBRA CHAPA Y PINTURA</h1>
                <p className="text-[10px] text-slate-400 leading-tight">{EMPRESA.razon}</p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400 hidden sm:block">
              <p>{EMPRESA.direccion}</p>
              <p>Tel: {EMPRESA.tel} · {EMPRESA.instagram}</p>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 -mb-px">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-bold rounded-t-lg transition-colors ${
                  tab === t.id
                    ? 'bg-slate-50 dark:bg-slate-800 text-orange-500'
                    : 'text-slate-400 hover:text-orange-300 hover:bg-slate-800'
                }`}
              >
                {t.icon} {t.label}
                {t.id === 'trabajos' && presupuestos.length > 0 && (
                  <span className="ml-1.5 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {presupuestos.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'nuevo' && (
          <NuevoPresupuesto
            clientes={clientes}
            onCreado={() => { cargarDatos(); setTab('trabajos') }}
            onRefresh={cargarDatos}
          />
        )}
        {tab === 'trabajos' && (
          <ListaTrabajos
            presupuestos={presupuestos}
            onRefresh={cargarDatos}
          />
        )}
        {tab === 'facturacion' && (
          <Facturacion presupuestos={presupuestos} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-500 text-xs text-center py-4 mt-auto">
        {EMPRESA.razon} | {EMPRESA.ciudad} | {EMPRESA.tel}
      </footer>
    </div>
  )
}
