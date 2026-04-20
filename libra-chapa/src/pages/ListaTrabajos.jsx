import { useState, useMemo } from 'react'
import { TIPOS_TRABAJO, COMPLEJIDAD, ESTADOS, EMPRESA } from '../lib/data'
import { actualizarEstadoChapa, actualizarRemitoChapa, eliminarPresupuestoChapa } from '../lib/api'

export default function ListaTrabajos({ presupuestos, onRefresh }) {
  const [filtro, setFiltro] = useState('todos')
  const [loading, setLoading] = useState(null)

  const formatARS = (n) => '$' + (n || 0).toLocaleString('es-AR')

  const filtrados = useMemo(() => {
    if (filtro === 'todos') return presupuestos
    return presupuestos.filter(p => p.estado === filtro)
  }, [presupuestos, filtro])

  const kpis = useMemo(() => {
    return presupuestos.reduce((acc, p) => {
      acc.total += parseFloat(p.total_civa || 0)
      if (p.estado === 'Aprobado' || p.estado === 'En trabajo') acc.aprobados += parseFloat(p.total_civa || 0)
      if (p.estado === 'Terminado' || p.estado === 'Entregado') acc.terminados += parseFloat(p.total_civa || 0)
      return acc
    }, { total: 0, aprobados: 0, terminados: 0 })
  }, [presupuestos])

  const cambiarEstado = async (id, estado) => {
    setLoading(id)
    try {
      await actualizarEstadoChapa(id, estado)
      if (onRefresh) await onRefresh()
    } catch (err) { alert('Error: ' + err.message) }
    setLoading(null)
  }

  const borrar = async (id) => {
    if (!confirm('¿Eliminar este presupuesto?')) return
    setLoading(id)
    try {
      await eliminarPresupuestoChapa(id)
      if (onRefresh) await onRefresh()
    } catch (err) { alert('Error: ' + err.message) }
    setLoading(null)
  }

  const generarWhatsApp = (p) => {
    const paneles = p.paneles_detalle || []
    const text = encodeURIComponent(
      `*${EMPRESA.nombre}*\n` +
      `Presupuesto: ${p.numero}\n` +
      (p.vehiculo ? `Vehículo: ${p.vehiculo}\n` : '') +
      `\n*Paneles:*\n` +
      paneles.map(dp => `• ${dp.nombre}`).join('\n') +
      `\n\n*Total: ${formatARS(p.total_civa)} c/IVA*\n` +
      `Materiales y M.O. incluidos.\n` +
      `\n📍 ${EMPRESA.direccion}\n📞 ${EMPRESA.tel}`
    )
    const tel = (p.clientes?.telefono || '').replace(/[^0-9]/g, '')
    return `https://wa.me/${tel.startsWith('54') ? tel : '54' + tel}?text=${text}`
  }

  const colorEstado = (estado) => ({
    Cotizado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    Aprobado: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    'En trabajo': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    Terminado: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    Entregado: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  })[estado] || 'bg-slate-100 text-slate-700'

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-orange-300">📋 Trabajos</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{presupuestos.length} presupuestos</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-slate-900 text-white rounded-xl p-4">
          <p className="text-xl font-bold font-mono">{formatARS(kpis.total)}</p>
          <p className="text-xs text-slate-400">Total cotizado</p>
        </div>
        <div className="bg-orange-500 text-white rounded-xl p-4">
          <p className="text-xl font-bold font-mono">{formatARS(kpis.aprobados)}</p>
          <p className="text-xs opacity-80">Aprobados / en trabajo</p>
        </div>
        <div className="bg-green-600 text-white rounded-xl p-4">
          <p className="text-xl font-bold font-mono">{formatARS(kpis.terminados)}</p>
          <p className="text-xs opacity-80">Terminados / entregados</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['todos', ...ESTADOS].map(e => (
          <button key={e} onClick={() => setFiltro(e)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filtro === e ? 'bg-orange-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
            {e === 'todos' ? 'Todos' : e} {e !== 'todos' && <span className="opacity-70">({presupuestos.filter(p => p.estado === e).length})</span>}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-8 text-center text-slate-400">
          No hay presupuestos {filtro !== 'todos' ? `con estado "${filtro}"` : ''}
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(p => {
            const fecha = new Date(p.created_at).toLocaleDateString('es-AR')
            const tipo = TIPOS_TRABAJO.find(t => t.id === p.tipo_trabajo)
            const paneles = p.paneles_detalle || []

            return (
              <div key={p.id} className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 border-l-4 border-orange-500">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono font-bold text-orange-500 text-lg">{p.numero}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colorEstado(p.estado)}`}>{p.estado}</span>
                      <span className="text-xs text-slate-400">{fecha}</span>
                      {p.remito_numero && (
                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full text-xs font-bold">
                          📄 {p.remito_numero}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{p.clientes?.nombre || 'Sin cliente'}</p>
                    <p className="text-xs text-slate-500">{tipo?.icon} {tipo?.nombre} · {p.vehiculo || 'Sin vehículo'} · {p.total_paneles} paneles · <strong>{formatARS(p.total_civa)}</strong></p>
                    {paneles.length > 0 && (
                      <p className="text-xs text-slate-400 mt-1">{paneles.map(dp => dp.nombre).join(', ')}</p>
                    )}
                  </div>

                  <div className="flex gap-1 flex-wrap items-center">
                    {p.estado === 'Cotizado' && (
                      <button onClick={() => cambiarEstado(p.id, 'Aprobado')} disabled={loading === p.id}
                        className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-200 disabled:opacity-50">✓ Aprobar</button>
                    )}
                    {p.estado === 'Aprobado' && (
                      <button onClick={() => cambiarEstado(p.id, 'En trabajo')} disabled={loading === p.id}
                        className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-amber-200 disabled:opacity-50">🔨 Iniciar</button>
                    )}
                    {p.estado === 'En trabajo' && (
                      <button onClick={() => cambiarEstado(p.id, 'Terminado')} disabled={loading === p.id}
                        className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-purple-200 disabled:opacity-50">✓ Terminar</button>
                    )}
                    {p.estado === 'Terminado' && (
                      <button onClick={() => cambiarEstado(p.id, 'Entregado')} disabled={loading === p.id}
                        className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-slate-200 disabled:opacity-50">🚗 Entregar</button>
                    )}
                    {p.clientes?.telefono && (
                      <a href={generarWhatsApp(p)} target="_blank" rel="noreferrer"
                        className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-700">📲 WA</a>
                    )}
                    <button onClick={() => borrar(p.id)} disabled={loading === p.id}
                      className="bg-slate-100 dark:bg-slate-700 text-slate-500 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-100 disabled:opacity-50">🗑️</button>
                  </div>
                </div>

                {/* Remito */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500">📄 Remito:</span>
                  <input type="text" defaultValue={p.remito_numero || ''} placeholder="N° remito"
                    onBlur={async (e) => {
                      const val = e.target.value.trim()
                      if (val === (p.remito_numero || '')) return
                      try {
                        await actualizarRemitoChapa(p.id, val || null, val ? new Date().toISOString().slice(0, 10) : null)
                        if (onRefresh) await onRefresh()
                      } catch (err) { alert('Error: ' + err.message) }
                    }}
                    className="border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded px-2 py-1 text-xs w-44" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
