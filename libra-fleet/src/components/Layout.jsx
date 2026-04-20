import { Link, useLocation } from 'react-router-dom'
import { EMPRESA } from '../lib/data'
import { useAuth } from '../lib/AuthContext'
import BusquedaGlobal from './BusquedaGlobal'
import ThemeToggle from './ThemeToggle'

const NAV = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/cerebro', label: 'Cerebro', icon: '🧠' },
  { path: '/vehiculos', label: 'Flota', icon: '🚛' },
  { path: '/ordenes', label: 'OTs', icon: '📋' },
  { path: '/nueva-ot', label: 'Nueva OT', icon: '➕' },
  { path: '/agenda', label: 'Agenda', icon: '📅' },
  { path: '/clientes', label: 'Clientes', icon: '👥' },
  { path: '/equipo', label: 'Equipo', icon: '👷' },
  { path: '/inventario', label: 'Inventario', icon: '📦' },
  { path: '/presupuestos', label: 'Presupuestos', icon: '💰' },
  { path: '/facturacion', label: 'Facturación', icon: '🧾' },
  { path: '/cobranzas', label: 'Cobranzas', icon: '💵' },
  { path: '/finanzas', label: 'Finanzas', icon: '📈' },
  { path: '/marketing', label: 'Marketing', icon: '📣' },
  { path: '/sistema-ia', label: 'Sistema IA', icon: '🤖' },
]

export default function Layout({ children, vehiculos = [], ordenes = [], clientes = [] }) {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    if (confirm('¿Cerrar sesión?')) {
      await signOut()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Header */}
      <header className="bg-[#1F3864] dark:bg-slate-950 text-white shadow-lg border-b border-transparent dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="shrink-0">
            <h1 className="text-xl font-bold tracking-tight">LIBRA FLEET</h1>
            <p className="text-xs text-blue-200 hidden sm:block">{EMPRESA.nombre}</p>
          </div>
          <div className="flex-1 max-w-md">
            <BusquedaGlobal vehiculos={vehiculos} ordenes={ordenes} clientes={clientes} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            {user && (
              <button
                onClick={handleLogout}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-red-500/80 border border-white/20 text-blue-100 hover:text-white transition-colors"
                title={`Cerrar sesión (${user.email})`}
                aria-label="Cerrar sesión"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
            <div className="text-right text-xs text-blue-200 hidden lg:block">
              <p>{EMPRESA.direccion}</p>
              <p>Tel: {EMPRESA.tel}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-[#2E75B6] dark:bg-slate-800 text-white sticky top-0 z-40 shadow">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {NAV.map(({ path, label, icon }) => (
            <Link
              key={path}
              to={path}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                pathname === path
                  ? 'bg-[#1F3864] dark:bg-slate-950 text-white'
                  : 'text-blue-100 hover:bg-[#1F3864]/50 dark:hover:bg-slate-700'
              }`}
            >
              <span className="mr-1">{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#D6E4F0] dark:bg-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 py-3 mt-8 border-t border-transparent dark:border-slate-700">
        {EMPRESA.nombre} | {EMPRESA.ciudad} | {EMPRESA.tel}
      </footer>
    </div>
  )
}
