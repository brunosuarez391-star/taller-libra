import { useState, useMemo } from 'react'
import { EMPRESA } from '../lib/data'

export default function Facturacion({ presupuestos }) {
  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const formatARS = (n) => '$' + (n || 0).toLocaleString('es-AR')

  const trabajosMes = useMemo(() => {
    return presupuestos.filter(p => {
      if (!['Terminado', 'Entregado', 'Aprobado'].includes(p.estado)) return false
      const fecha = new Date(p.created_at)
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      return mes === mesSeleccionado
    })
  }, [presupuestos, mesSeleccionado])

  const porCliente = useMemo(() => {
    const grupos = {}
    trabajosMes.forEach(p => {
      const nombre = p.clientes?.nombre || 'Sin cliente'
      if (!grupos[nombre]) grupos[nombre] = { cliente: nombre, trabajos: [], total: 0 }
      grupos[nombre].trabajos.push(p)
      grupos[nombre].total += parseFloat(p.subtotal_siva || 0)
    })
    return Object.values(grupos).sort((a, b) => b.total - a.total)
  }, [trabajosMes])

  const totalNeto = porCliente.reduce((s, g) => s + g.total, 0)
  const ivaTotal = Math.round(totalNeto * 0.21)
  const totalConIva = totalNeto + ivaTotal

  const meses = useMemo(() => {
    const set = new Set()
    presupuestos.forEach(p => {
      const f = new Date(p.created_at)
      set.add(`${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`)
    })
    return [...set].sort().reverse()
  }, [presupuestos])

  const mesNombre = new Date(mesSeleccionado + '-15').toLocaleString('es-AR', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-orange-300">💰 Facturación Chapa y Pintura</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm capitalize">{mesNombre}</p>
        </div>
        <select value={mesSeleccionado} onChange={e => setMesSeleccionado(e.target.value)}
          className="border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm">
          {meses.map(m => (
            <option key={m} value={m}>
              {new Date(m + '-15').toLocaleString('es-AR', { month: 'long', year: 'numeric' })}
            </option>
          ))}
          {meses.length === 0 && <option value={mesSeleccionado}>{mesNombre}</option>}
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 text-white rounded-xl p-5">
          <p className="text-xs text-slate-400 uppercase">Trabajos del mes</p>
          <p className="text-2xl font-bold mt-1">{trabajosMes.length}</p>
        </div>
        <div className="bg-orange-500 text-white rounded-xl p-5">
          <p className="text-xs opacity-80 uppercase">Subtotal s/IVA</p>
          <p className="text-2xl font-bold font-mono mt-1">{formatARS(totalNeto)}</p>
        </div>
        <div className="bg-green-600 text-white rounded-xl p-5">
          <p className="text-xs opacity-80 uppercase">Total c/IVA</p>
          <p className="text-2xl font-bold font-mono mt-1">{formatARS(totalConIva)}</p>
        </div>
      </div>

      {/* Detalle por cliente */}
      {porCliente.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-8 text-center text-slate-400">
          No hay trabajos facturables en {mesNombre}
        </div>
      ) : (
        <div className="space-y-4">
          {porCliente.map(grupo => (
            <div key={grupo.cliente} className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
                <span className="font-bold">{grupo.cliente}</span>
                <span className="font-mono font-bold text-orange-400">{formatARS(grupo.total)} s/IVA</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300">
                    <th className="px-4 py-2 text-left">N°</th>
                    <th className="px-4 py-2 text-left">Remito</th>
                    <th className="px-4 py-2 text-left">Vehículo</th>
                    <th className="px-4 py-2 text-center">Paneles</th>
                    <th className="px-4 py-2 text-left">Estado</th>
                    <th className="px-4 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {grupo.trabajos.map(p => (
                    <tr key={p.id} className="border-b border-slate-100 dark:border-slate-700">
                      <td className="px-4 py-2 font-mono font-bold text-orange-500">{p.numero}</td>
                      <td className="px-4 py-2 text-xs">{p.remito_numero ? <span className="text-purple-600 font-bold">📄 {p.remito_numero}</span> : '—'}</td>
                      <td className="px-4 py-2 text-xs">{p.vehiculo || '-'}</td>
                      <td className="px-4 py-2 text-center">{p.total_paneles}</td>
                      <td className="px-4 py-2 text-xs">{p.estado}</td>
                      <td className="px-4 py-2 text-right font-mono font-bold">{formatARS(p.subtotal_siva)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* Totales */}
          <div className="bg-slate-900 text-white rounded-xl p-5 text-right">
            <p className="text-sm">Subtotal s/IVA: <strong className="font-mono text-lg">{formatARS(totalNeto)}</strong></p>
            <p className="text-sm">IVA 21%: <strong className="font-mono text-lg">{formatARS(ivaTotal)}</strong></p>
            <p className="text-2xl font-bold text-orange-400 mt-2">TOTAL c/IVA: <span className="font-mono">{formatARS(totalConIva)}</span></p>
          </div>
        </div>
      )}
    </div>
  )
}
