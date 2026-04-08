import { useState } from 'react'
import { ESTADOS_OT } from '../lib/data'
import EtiquetaService from '../components/EtiquetaService'

export default function Ordenes({ ordenes, onActualizarEstado }) {
  const [filtro, setFiltro] = useState('todos')
  const [otSeleccionada, setOtSeleccionada] = useState(null)

  const filtradas = filtro === 'todos'
    ? ordenes
    : ordenes.filter(o => o.estado === filtro)

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1F3864] mb-6">Ordenes de Trabajo</h2>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFiltro('todos')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filtro === 'todos' ? 'bg-[#1F3864] text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
          Todos ({ordenes.length})
        </button>
        {ESTADOS_OT.map(estado => {
          const count = ordenes.filter(o => o.estado === estado).length
          return (
            <button key={estado} onClick={() => setFiltro(estado)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filtro === estado ? 'bg-[#2E75B6] text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
              {estado} ({count})
            </button>
          )
        })}
      </div>

      {/* Modal etiqueta */}
      {otSeleccionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm">
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

      {/* Lista de OTs */}
      {filtradas.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-slate-400">
          No hay OTs {filtro !== 'todos' ? `en estado "${filtro}"` : 'todavía'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtradas.slice().reverse().map((ot, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-5 border-l-4 border-[#2E75B6]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono font-bold text-[#1F3864]">{ot.ot_numero}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      ot.estado === 'Ingresado' ? 'bg-yellow-100 text-yellow-800' :
                      ot.estado === 'En proceso' ? 'bg-blue-100 text-blue-800' :
                      ot.estado === 'Finalizado' ? 'bg-green-100 text-green-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {ot.estado}
                    </span>
                  </div>
                  <p className="font-bold">{ot.codigo} — {ot.modelo}</p>
                  <p className="text-sm text-slate-500">{ot.cliente} | {ot.servicio_nombre} | KM: {ot.km?.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">{ot.fecha} | Mecánico: {ot.mecanico}</p>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 flex-wrap">
                  {/* Cambiar estado */}
                  {ot.estado !== 'Entregado' && (
                    <select
                      value={ot.estado}
                      onChange={(e) => onActualizarEstado(ot.ot_numero, e.target.value)}
                      className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:border-[#2E75B6] focus:outline-none"
                    >
                      {ESTADOS_OT.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  )}
                  {/* Etiqueta */}
                  {(ot.estado === 'Finalizado' || ot.estado === 'Entregado') && (
                    <button onClick={() => setOtSeleccionada(ot)} className="bg-[#1F3864] text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-[#2E75B6]">
                      🏷️ Etiqueta
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
