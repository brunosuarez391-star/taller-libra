import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getVencimientosProximos } from '../lib/api'

export default function PanelVencimientos() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelado = false
    getVencimientosProximos()
      .then(rows => { if (!cancelado) setItems(rows) })
      .finally(() => { if (!cancelado) setLoading(false) })
    return () => { cancelado = true }
  }, [])

  if (loading) return null
  if (items.length === 0) return null

  const vencidos = items.filter(i => i.severidad === 'vencido')
  const criticos = items.filter(i => i.severidad === 'critico')
  const proximos = items.filter(i => i.severidad === 'proximo')

  const colorPorSeveridad = (sev) => {
    if (sev === 'vencido') return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-300'
    if (sev === 'critico') return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300'
    return 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200'
  }

  const labelDias = (d) => {
    if (d < 0) return `Vencida hace ${Math.abs(d)} días`
    if (d === 0) return 'Vence hoy'
    if (d === 1) return 'Vence mañana'
    return `Vence en ${d} días`
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-5 mb-6 border border-transparent dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-[#1F3864] dark:text-blue-300">⚠️ Vencimientos próximos</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            VTV / Seguro / RUTA / RTO en los próximos 60 días
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          {vencidos.length > 0 && (
            <span className="bg-red-600 text-white px-2 py-1 rounded-full font-bold">
              {vencidos.length} vencidas
            </span>
          )}
          {criticos.length > 0 && (
            <span className="bg-orange-500 text-white px-2 py-1 rounded-full font-bold">
              {criticos.length} en 7 días
            </span>
          )}
          {proximos.length > 0 && (
            <span className="bg-yellow-500 text-white px-2 py-1 rounded-full font-bold">
              {proximos.length} en 30 días
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto">
        {items.slice(0, 20).map((v, i) => (
          <Link
            key={`${v.id}-${v.tipo}-${i}`}
            to={`/vehiculo/${v.codigo}`}
            className={`flex items-center justify-between border-l-4 rounded-lg px-3 py-2 text-sm hover:opacity-80 transition-opacity ${colorPorSeveridad(v.severidad)}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-bold font-mono shrink-0">{v.codigo}</span>
              {v.patente && <span className="bg-white/60 dark:bg-slate-900/40 px-2 py-0.5 rounded text-xs font-mono">{v.patente}</span>}
              <span className="truncate text-xs">{v.marca} {v.modelo}</span>
              <span className="font-bold shrink-0">{v.tipo}</span>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold">{labelDias(v.dias_restantes)}</p>
              <p className="text-xs opacity-70">
                {new Date(v.fecha_vencimiento + 'T12:00:00').toLocaleDateString('es-AR')}
              </p>
            </div>
          </Link>
        ))}
        {items.length > 20 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center pt-2">
            + {items.length - 20} más en /vehiculos
          </p>
        )}
      </div>
    </div>
  )
}
