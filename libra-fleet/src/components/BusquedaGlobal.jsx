import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

/**
 * Búsqueda global que busca en vehículos, OTs y clientes
 * Muestra dropdown con resultados agrupados
 */
export default function BusquedaGlobal({ vehiculos = [], ordenes = [], clientes = [] }) {
  const [query, setQuery] = useState('')
  const [abierto, setAbierto] = useState(false)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Cerrar al clickear fuera
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setAbierto(true)
      }
      if (e.key === 'Escape') {
        setAbierto(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const q = query.trim().toLowerCase()
  const hayQuery = q.length >= 1

  // Buscar vehículos
  const vehiculosMatch = hayQuery
    ? vehiculos.filter(v =>
        (v.codigo || '').toLowerCase().includes(q) ||
        (v.modelo || '').toLowerCase().includes(q) ||
        (v.marca || '').toLowerCase().includes(q) ||
        (v.tipo || '').toLowerCase().includes(q) ||
        (v.clientes?.nombre || '').toLowerCase().includes(q)
      ).slice(0, 5)
    : []

  // Buscar OTs (por número, patente en observaciones, o cliente)
  const ordenesMatch = hayQuery
    ? ordenes.filter(o =>
        (o.ot_numero || '').toLowerCase().includes(q) ||
        (o.observaciones || '').toLowerCase().includes(q) ||
        (o.clientes?.nombre || '').toLowerCase().includes(q) ||
        (o.vehiculos?.codigo || '').toLowerCase().includes(q) ||
        (o.servicio_nombre || '').toLowerCase().includes(q)
      ).slice(0, 5)
    : []

  // Buscar clientes
  const clientesMatch = hayQuery
    ? clientes.filter(c =>
        (c.nombre || '').toLowerCase().includes(q) ||
        (c.contacto || '').toLowerCase().includes(q) ||
        (c.telefono || '').includes(q)
      ).slice(0, 5)
    : []

  const totalResultados = vehiculosMatch.length + ordenesMatch.length + clientesMatch.length
  const hayResultados = totalResultados > 0
  const mostrarDropdown = abierto && (hayQuery || !hayResultados)

  const limpiar = () => {
    setQuery('')
    setAbierto(false)
    inputRef.current?.blur()
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setAbierto(true)}
          placeholder="Buscar OT, vehículo, cliente..."
          className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200 rounded-lg pl-9 pr-16 py-2 text-sm focus:bg-white focus:text-slate-800 focus:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
        />
        <svg className="absolute left-3 top-2.5 w-4 h-4 text-blue-200 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <div className="absolute right-2 top-2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={limpiar}
              className="text-xs text-blue-200 hover:text-white px-1"
              aria-label="Limpiar"
            >
              ✕
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] text-blue-200 bg-white/10 border border-white/20 px-1.5 py-0.5 rounded font-mono">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Dropdown de resultados */}
      {mostrarDropdown && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-[70vh] overflow-y-auto z-50">
          {!hayQuery ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              <p className="mb-2">Empezá a escribir para buscar...</p>
              <p className="text-xs">OTs · Vehículos · Clientes · Patentes</p>
            </div>
          ) : !hayResultados ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              No se encontraron resultados para "<strong>{query}</strong>"
            </div>
          ) : (
            <>
              {vehiculosMatch.length > 0 && (
                <div className="border-b border-slate-100">
                  <div className="px-3 py-2 bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                    🚛 Vehículos ({vehiculosMatch.length})
                  </div>
                  {vehiculosMatch.map(v => (
                    <Link
                      key={v.id}
                      to={`/vehiculo/${v.codigo}`}
                      onClick={limpiar}
                      className="block px-3 py-2 hover:bg-slate-50 transition border-b border-slate-50 last:border-0"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-mono font-bold text-[#1F3864] text-sm">{v.codigo}</p>
                          <p className="text-xs text-slate-500">{v.marca} {v.modelo} {v.tipo}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-600">{v.clientes?.nombre}</p>
                          <p className="text-xs text-slate-400">{v.km_actuales?.toLocaleString('es-AR')} km</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {ordenesMatch.length > 0 && (
                <div className="border-b border-slate-100">
                  <div className="px-3 py-2 bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                    📋 Órdenes de Trabajo ({ordenesMatch.length})
                  </div>
                  {ordenesMatch.map(ot => (
                    <Link
                      key={ot.id}
                      to="/ordenes"
                      onClick={limpiar}
                      className="block px-3 py-2 hover:bg-slate-50 transition border-b border-slate-50 last:border-0"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-bold text-[#1F3864] text-sm">{ot.ot_numero}</p>
                            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                              ot.estado === 'Finalizado' ? 'bg-green-100 text-green-700' :
                              ot.estado === 'En proceso' ? 'bg-blue-100 text-blue-700' :
                              ot.estado === 'Ingresado' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>{ot.estado}</span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {ot.vehiculos?.codigo} · {ot.clientes?.nombre} · {ot.servicio_nombre}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400 whitespace-nowrap ml-2">
                          {new Date(ot.created_at).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {clientesMatch.length > 0 && (
                <div>
                  <div className="px-3 py-2 bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                    👥 Clientes ({clientesMatch.length})
                  </div>
                  {clientesMatch.map(c => (
                    <div
                      key={c.id}
                      className="px-3 py-2 border-b border-slate-50 last:border-0"
                    >
                      <p className="font-bold text-[#1F3864] text-sm">{c.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {c.contacto && <span>{c.contacto}</span>}
                        {c.telefono && <span className="ml-2">📞 {c.telefono}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
