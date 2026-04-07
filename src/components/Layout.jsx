import React from 'react'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Inicio', icon: '📊' },
  { id: 'flota', label: 'Flota', icon: '🚛' },
  { id: 'ordenes', label: 'Órdenes', icon: '📋' },
  { id: 'historial', label: 'Historial', icon: '🔍' },
]

export default function Layout({ seccionActiva, setSeccionActiva, children }) {
  return (
    <div className="min-h-screen bg-libra-bg flex flex-col">
      {/* Header */}
      <header
        className="px-4 py-3 flex items-center justify-between shadow-sm"
        style={{ background: 'linear-gradient(135deg, #1F3864, #2E75B6)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
              <path d="M15 80V20h12v48h32v12H15z" fill="white" />
              <path d="M48 20h37v12H60v12h20v12H60v12h25v12H48V20z" fill="white" opacity="0.7" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">Libra Fleet</h1>
            <p className="text-white/50 text-[10px]">Gestión de Flota · Módulo 1</p>
          </div>
        </div>
        <div className="text-white/40 text-[10px]">
          {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-24 max-w-4xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom nav - mobile first */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-1 py-1.5 flex justify-around z-40">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setSeccionActiva(item.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
              seccionActiva === item.id
                ? 'text-libra-dark'
                : 'text-gray-400'
            }`}
          >
            <span className={`text-lg transition-transform ${seccionActiva === item.id ? 'scale-110' : ''}`}>
              {item.icon}
            </span>
            <span className={`text-[10px] font-semibold ${
              seccionActiva === item.id ? 'text-libra-dark' : 'text-gray-400'
            }`}>
              {item.label}
            </span>
            {seccionActiva === item.id && (
              <div className="w-5 h-0.5 bg-libra-mid rounded-full" />
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
