import { useState } from 'react'
import { ESTADOS_OT } from '../lib/data'
import { actualizarEstadoOT, actualizarOT, actualizarRemitoOT, eliminarOT } from '../lib/api'
import EtiquetaService from '../components/EtiquetaService'

export default function Ordenes({ ordenes, onRefresh }) {
  const [filtro, setFiltro] = useState('todos')
  const [filtroFecha, setFiltroFecha] = useState('todas')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [otSeleccionada, setOtSeleccionada] = useState(null)
  const [editando, setEditando] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [confirmEliminar, setConfirmEliminar] = useState(null)
  const [loading, setLoading] = useState(false)

  // Calcular rango de fechas basado en el filtro
  const rangoFecha = (() => {
    const ahora = new Date()
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
    switch (filtroFecha) {
      case '7dias': {
        const desde = new Date(hoy)
        desde.setDate(desde.getDate() - 7)
        return { desde, hasta: new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59) }
      }
      case '30dias': {
        const desde = new Date(hoy)
        desde.setDate(desde.getDate() - 30)
        return { desde, hasta: new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59) }
      }
      case 'mes': {
        return {
          desde: new Date(ahora.getFullYear(), ahora.getMonth(), 1),
          hasta: new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59),
        }
      }
      case 'personalizado': {
        return {
          desde: fechaDesde ? new Date(fechaDesde + 'T00:00:00') : null,
          hasta: fechaHasta ? new Date(fechaHasta + 'T23:59:59') : null,
        }
      }
      default:
        return null
    }
  })()

  const filtradas = ordenes.filter(o => {
    // Filtro por estado
    if (filtro !== 'todos' && o.estado !== filtro) return false
    // Filtro por fecha
    if (rangoFecha) {
      const fechaOT = new Date(o.created_at)
      if (rangoFecha.desde && fechaOT < rangoFecha.desde) return false
      if (rangoFecha.hasta && fechaOT > rangoFecha.hasta) return false
    }
    return true
  })

  const handleCambiarEstado = async (ot, nuevoEstado) => {
    setLoading(true)
    try {
      await actualizarEstadoOT(ot.id, nuevoEstado)
      await onRefresh()
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setLoading(false)
  }

  const handleEditar = (ot) => {
    setEditando(ot.id)
    // Extraer patente y chofer de observaciones si existen
    const obs = ot.observaciones || ''
    const patMatch = obs.match(/PAT:\s*([^\|]+)/)
    const choMatch = obs.match(/CHOFER:\s*([^\|]+)/)
    const cleanObs = obs.replace(/PAT:\s*[^\|]+\|?\s*/g, '').replace(/CHOFER:\s*[^\|]+\|?\s*/g, '').trim()
    setEditForm({
      km_ingreso: ot.km_ingreso,
      km_proximo: ot.km_proximo,
      mecanico: ot.mecanico,
      chofer: choMatch ? choMatch[1].trim() : '',
      patente: patMatch ? patMatch[1].trim() : '',
      observaciones: cleanObs,
      servicio_nombre: ot.servicio_nombre,
    })
  }

  const handleGuardarEdicion = async (otId) => {
    setLoading(true)
    try {
      const obs = [
        editForm.patente ? `PAT: ${editForm.patente.toUpperCase()}` : '',
        editForm.chofer ? `CHOFER: ${editForm.chofer}` : '',
        editForm.observaciones || '',
      ].filter(Boolean).join(' | ')
      await actualizarOT(otId, {
        km_ingreso: editForm.km_ingreso,
        km_proximo: editForm.km_proximo,
        mecanico: editForm.mecanico,
        observaciones: obs,
        servicio_nombre: editForm.servicio_nombre,
      })
      setEditando(null)
      await onRefresh()
    } catch (err) {
      alert('Error guardando: ' + err.message)
    }
    setLoading(false)
  }

  const handleEliminar = async (otId) => {
    setLoading(true)
    try {
      await eliminarOT(otId)
      setConfirmEliminar(null)
      await onRefresh()
    } catch (err) {
      alert('Error eliminando: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1F3864] dark:text-blue-300 mb-6">Ordenes de Trabajo</h2>

      {/* Filtros por estado */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <button onClick={() => setFiltro('todos')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filtro === 'todos' ? 'bg-[#1F3864] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
          Todos ({ordenes.length})
        </button>
        {ESTADOS_OT.map(estado => {
          const count = ordenes.filter(o => o.estado === estado).length
          return (
            <button key={estado} onClick={() => setFiltro(estado)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filtro === estado ? 'bg-[#2E75B6] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              {estado} ({count})
            </button>
          )
        })}
      </div>

      {/* Filtros por fecha */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">📅 Período:</span>
          {[
            { key: 'todas', label: 'Todas' },
            { key: '7dias', label: 'Últimos 7 días' },
            { key: '30dias', label: 'Últimos 30 días' },
            { key: 'mes', label: 'Mes actual' },
            { key: 'personalizado', label: 'Personalizado' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFiltroFecha(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filtroFecha === key ? 'bg-[#2E75B6] text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
          {filtroFecha === 'personalizado' && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                className="border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-2 py-1 text-xs"
                placeholder="Desde"
              />
              <span className="text-slate-400 dark:text-slate-500 text-xs">→</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                className="border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-2 py-1 text-xs"
                placeholder="Hasta"
              />
            </div>
          )}
          <div className="flex-1"></div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Mostrando <strong className="text-[#1F3864] dark:text-blue-300">{filtradas.length}</strong> de {ordenes.length}
          </span>
        </div>
      </div>

      {/* Modal etiqueta */}
      {otSeleccionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setOtSeleccionada(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#1F3864]">Etiqueta de Service</h3>
              <button onClick={() => setOtSeleccionada(null)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <div className="flex justify-center mb-4">
              <EtiquetaService ot={otSeleccionada} />
            </div>
            <button onClick={() => window.print()} className="w-full bg-[#1F3864] text-white py-2 rounded-lg font-bold hover:bg-[#2E75B6]">
              Imprimir Etiqueta
            </button>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmEliminar(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-red-600 text-lg mb-2">Eliminar OT</h3>
            <p className="text-slate-600 mb-1">¿Estás seguro de eliminar <strong>{confirmEliminar.ot_numero}</strong>?</p>
            <p className="text-slate-500 text-sm mb-4">{confirmEliminar.vehiculos?.codigo} — {confirmEliminar.clientes?.nombre}</p>
            <div className="flex gap-3">
              <button onClick={() => handleEliminar(confirmEliminar.id)} disabled={loading} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50">
                {loading ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
              <button onClick={() => setConfirmEliminar(null)} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg font-bold hover:bg-slate-300">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de OTs */}
      {filtradas.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-8 text-center text-slate-400 dark:text-slate-500">
          No hay OTs {filtro !== 'todos' ? `en estado "${filtro}"` : 'todavía'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtradas.map((ot) => (
            <div key={ot.id} className="bg-white dark:bg-slate-800 rounded-xl shadow p-5 border-l-4 border-[#2E75B6] text-slate-800 dark:text-slate-200">
              {/* Header OT */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono font-bold text-[#1F3864] text-lg">{ot.ot_numero}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    ot.estado === 'Ingresado' ? 'bg-yellow-100 text-yellow-800' :
                    ot.estado === 'En proceso' ? 'bg-blue-100 text-blue-800' :
                    ot.estado === 'Finalizado' ? 'bg-green-100 text-green-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>{ot.estado}</span>
                  <span className="text-xs text-slate-400">{new Date(ot.created_at).toLocaleDateString('es-AR')}</span>
                  {ot.remito_numero && (
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full text-xs font-bold">
                      📄 Remito {ot.remito_numero}
                    </span>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 flex-wrap">
                  {editando !== ot.id && (
                    <button onClick={() => handleEditar(ot)} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200">
                      ✏️ Editar
                    </button>
                  )}
                  {(ot.estado === 'Finalizado' || ot.estado === 'Entregado') && (
                    <button onClick={() => setOtSeleccionada({
                      ...ot,
                      codigo: ot.vehiculos?.codigo,
                      modelo: `${ot.vehiculos?.modelo} ${ot.vehiculos?.tipo || ''}`,
                      cliente: ot.clientes?.nombre,
                      km: ot.km_ingreso,
                      proximo_km: ot.km_proximo,
                      items: [],
                      fecha: new Date(ot.created_at).toLocaleDateString('es-AR'),
                    })} className="bg-[#1F3864] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#2E75B6]">
                      🏷️ Etiqueta
                    </button>
                  )}
                  <button onClick={() => setConfirmEliminar(ot)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100">
                    🗑️ Eliminar
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="mb-3">
                <p className="font-bold">{ot.vehiculos?.codigo} — Mercedes-Benz {ot.vehiculos?.modelo} {ot.vehiculos?.tipo} {ot.patente ? <span className="ml-2 bg-[#D6E4F0] text-[#1F3864] px-2 py-0.5 rounded font-mono text-xs">{ot.patente}</span> : ''}</p>
                <p className="text-sm text-slate-500">{ot.clientes?.nombre} | {ot.servicio_nombre}{ot.chofer ? ` | Chofer: ${ot.chofer}` : ''}</p>
              </div>

              {/* Modo edición */}
              {editando === ot.id ? (
                <div className="bg-[#D6E4F0] rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">KM Ingreso</label>
                      <input type="number" value={editForm.km_ingreso} onChange={e => setEditForm({ ...editForm, km_ingreso: parseInt(e.target.value) || 0 })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">KM Próximo Service</label>
                      <input type="number" value={editForm.km_proximo} onChange={e => setEditForm({ ...editForm, km_proximo: parseInt(e.target.value) || 0 })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Patente</label>
                      <input type="text" value={editForm.patente} onChange={e => setEditForm({ ...editForm, patente: e.target.value.toUpperCase() })} placeholder="AB 123 CD" className="w-full border rounded-lg px-3 py-2 text-sm font-mono uppercase" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Chofer</label>
                      <input type="text" value={editForm.chofer} onChange={e => setEditForm({ ...editForm, chofer: e.target.value })} placeholder="Nombre del chofer" className="w-full border rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Mecánico</label>
                    <input type="text" value={editForm.mecanico} onChange={e => setEditForm({ ...editForm, mecanico: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Observaciones</label>
                    <textarea value={editForm.observaciones} onChange={e => setEditForm({ ...editForm, observaciones: e.target.value })} rows="2" className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleGuardarEdicion(ot.id)} disabled={loading} className="bg-[#1F3864] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#2E75B6] disabled:opacity-50">
                      {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button onClick={() => setEditando(null)} className="bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* Datos en modo lectura */
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-xs text-slate-400">KM Ingreso</p>
                    <p className="font-bold font-mono">{ot.km_ingreso?.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-xs text-slate-400">Próximo Service</p>
                    <p className="font-bold font-mono text-[#2E75B6]">{ot.km_proximo?.toLocaleString()} km</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-xs text-slate-400">Mecánico</p>
                    <p className="font-bold">{ot.mecanico}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-xs text-slate-400">Estado</p>
                    <select value={ot.estado} onChange={(e) => handleCambiarEstado(ot, e.target.value)} disabled={loading || ot.estado === 'Entregado'} className="w-full bg-white border rounded px-2 py-1 text-sm font-bold focus:border-[#2E75B6] focus:outline-none disabled:opacity-50">
                      {ESTADOS_OT.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {ot.observaciones && editando !== ot.id && (
                <p className="mt-2 text-xs text-slate-400 italic">📝 {ot.observaciones}</p>
              )}

              {/* Remito — editable */}
              {editando !== ot.id && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">📄 Remito:</span>
                  <input
                    type="text"
                    defaultValue={ot.remito_numero || ''}
                    placeholder="N° remito (ej: 0001-00000123)"
                    onBlur={async (e) => {
                      const val = e.target.value.trim()
                      if (val === (ot.remito_numero || '')) return
                      try {
                        await actualizarRemitoOT(ot.id, val, val ? new Date().toISOString().slice(0, 10) : null)
                        if (onRefresh) await onRefresh()
                      } catch (err) { alert('Error guardando remito: ' + err.message) }
                    }}
                    className="border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded px-2 py-1 text-xs w-48 focus:border-[#2E75B6] focus:outline-none"
                  />
                  {ot.remito_fecha && (
                    <span className="text-xs text-slate-400">
                      {new Date(ot.remito_fecha).toLocaleDateString('es-AR')}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
