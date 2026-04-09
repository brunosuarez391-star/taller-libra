import { Link, useLocation } from 'react-router-dom'
import { EMPRESA } from '../lib/data'

const NAV = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/vehiculos', label: 'Flota', icon: '🚛' },
  { path: '/ordenes', label: 'OTs', icon: '📋' },
  { path: '/nueva-ot', label: '+ Nueva OT', icon: '➕' },
  { path: '/presupuestos', label: 'Presupuestos', icon: '💰' },
]

export default function Layout({ children }) {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#1F3864] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">LIBRA FLEET</h1>
            <p className="text-xs text-blue-200">{EMPRESA.nombre}</p>
          </div>
          <div className="text-right text-xs text-blue-200 hidden sm:block">
            <p>{EMPRESA.direccion}</p>
            <p>Tel: {EMPRESA.tel}</p>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-[#2E75B6] text-white sticky top-0 z-50 shadow">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {NAV.map(({ path, label, icon }) => (
            <Link
              key={path}
              to={path}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                pathname === path
                  ? 'bg-[#1F3864] text-white'
                  : 'text-blue-100 hover:bg-[#1F3864]/50'
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
      <footer className="bg-[#D6E4F0] text-center text-xs text-slate-500 py-3 mt-8">
        {EMPRESA.nombre} | {EMPRESA.ciudad} | {EMPRESA.tel}
      </footer>
    </div>
  )
}
