import React from 'react'
import { tieneConfig } from '../lib/supabase'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Inicio', icon: '📊' },
  { id: 'flota', label: 'Flota', icon: '🚛' },
  { id: 'ordenes', label: 'Órdenes', icon: '📋' },
  { id: 'historial', label: 'Historial', icon: '🔍' },
  { id: 'config', label: 'Config', icon: '⚙️' },
]

export default function Layout({ seccionActiva, setSeccionActiva, children }) {
  const conectado = tieneConfig()

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
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-semibold ${
            conectado
              ? 'bg-green-500/20 text-green-300'
              : 'bg-white/10 text-white/40'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${conectado ? 'bg-green-400 animate-pulse' : 'bg-white/30'}`} />
            {conectado ? 'Online' : 'Offline'}
          </div>
          <div className="text-white/30 text-[10px]">
            {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-24 max-w-4xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-1 py-1.5 flex justify-around z-40">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setSeccionActiva(item.id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all relative ${
              seccionActiva === item.id
                ? 'text-libra-dark'
                : 'text-gray-400'
            }`}
          >
            <span className={`text-base transition-transform ${seccionActiva === item.id ? 'scale-110' : ''}`}>
              {item.icon}
            </span>
            <span className={`text-[9px] font-semibold ${
              seccionActiva === item.id ? 'text-libra-dark' : 'text-gray-400'
            }`}>
              {item.label}
            </span>
            {seccionActiva === item.id && (
              <div className="w-5 h-0.5 bg-libra-mid rounded-full" />
            )}
            {item.id === 'config' && !conectado && (
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
