import { useState } from 'react'
import { ESTADOS_OT } from '../lib/data'
import { actualizarEstadoOT, actualizarOT, eliminarOT } from '../lib/api'
import EtiquetaService from '../components/EtiquetaService'

export default function Ordenes({ ordenes, onRefresh }) {
  const [filtro, setFiltro] = useState('todos')
  const [otSeleccionada, setOtSeleccionada] = useState(null)
  const [editando, setEditando] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [confirmEliminar, setConfirmEliminar] = useState(null)
  const [loading, setLoading] = useState(false)

  const filtradas = filtro === 'todos'
    ? ordenes
    : ordenes.filter(o => o.estado === filtro)

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
    setEditForm({
      km_ingreso: ot.km_ingreso,
      km_proximo: ot.km_proximo,
      mecanico: ot.mecanico,
      observaciones: ot.observaciones || '',
      servicio_nombre: ot.servicio_nombre,
    })
  }

  const handleGuardarEdicion = async (otId) => {
    setLoading(true)
    try {
      await actualizarOT(otId, editForm)
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
      <h2 className="text-2xl font-bold text-[#1F3864] mb-6">Ordenes de Trabajo</h2>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFiltro('todos')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filtro === 'todos' ? 'bg-[#1F3864] text-white' : 'bg-slate-200 text-slate-600'}`}>
          Todos ({ordenes.length})
        </button>
        {ESTADOS_OT.map(estado => {
          const count = ordenes.filter(o => o.estado === estado).length
          return (
            <button key={estado} onClick={() => setFiltro(estado)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filtro === estado ? 'bg-[#2E75B6] text-white' : 'bg-slate-200 text-slate-600'}`}>
              {estado} ({count})
            </button>
          )
        })}
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
        <div className="bg-white rounded-xl shadow p-8 text-center text-slate-400">
          No hay OTs {filtro !== 'todos' ? `en estado "${filtro}"` : 'todavía'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtradas.map((ot) => (
            <div key={ot.id} className="bg-white rounded-xl shadow p-5 border-l-4 border-[#2E75B6]">
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
                <p className="font-bold">{ot.vehiculos?.codigo} — Mercedes-Benz {ot.vehiculos?.modelo} {ot.vehiculos?.tipo}</p>
                <p className="text-sm text-slate-500">{ot.clientes?.nombre} | {ot.servicio_nombre}</p>
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
