import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PRECIOS } from '../lib/data'

/**
 * Página de Cobranzas: detecta OTs finalizadas hace más de N días
 * que todavía no están marcadas como "Entregado", y muestra el monto
 * estimado a cobrar.
 */
export default function Cobranzas({ ordenes, clientes }) {
  const [diasVencimiento, setDiasVencimiento] = useState(30)
  const [filtroCliente, setFiltroCliente] = useState('todos')

  const ahora = new Date()
  const msDia = 1000 * 60 * 60 * 24

  // OTs "cobrables": Finalizado o Entregado
  const otsCobrables = useMemo(() => {
    return ordenes
      .filter(ot => ot.estado === 'Finalizado' || ot.estado === 'Entregado')
      .map(ot => {
        const fecha = new Date(ot.updated_at || ot.created_at)
        const diasDesde = Math.floor((ahora - fecha) / msDia)
        const modelo = ot.vehiculos?.modelo || '1634'
        const precio = PRECIOS[`M.B. ${modelo}`] || PRECIOS['M.B. 1634']
        const totalNeto = precio.total
        const iva = Math.round(totalNeto * 0.21)
        const totalCobrar = totalNeto + iva
        return {
          ...ot,
          fecha,
          diasDesde,
          totalNeto,
          iva,
          totalCobrar,
          vencida: ot.estado === 'Finalizado' && diasDesde >= diasVencimiento,
        }
      })
      .sort((a, b) => b.diasDesde - a.diasDesde)
  }, [ordenes, diasVencimiento])

  const otsFiltradas = filtroCliente === 'todos'
    ? otsCobrables
    : otsCobrables.filter(ot => ot.cliente_id === filtroCliente)

  const vencidas = otsFiltradas.filter(ot => ot.vencida)
  const porCobrar = otsFiltradas.filter(ot => ot.estado === 'Finalizado')
  const cobradas = otsFiltradas.filter(ot => ot.estado === 'Entregado')

  const totalVencido = vencidas.reduce((s, ot) => s + ot.totalCobrar, 0)
  const totalPorCobrar = porCobrar.reduce((s, ot) => s + ot.totalCobrar, 0)
  const totalCobrado = cobradas.reduce((s, ot) => s + ot.totalCobrar, 0)

  const formatARS = (n) => '$' + (n || 0).toLocaleString('es-AR')

  // Agrupar vencidas por cliente
  const vencidasPorCliente = useMemo(() => {
    const grupos = {}
    vencidas.forEach(ot => {
      const nombre = ot.clientes?.nombre || 'Sin cliente'
      if (!grupos[nombre]) grupos[nombre] = { cliente: nombre, telefono: ot.clientes?.telefono || '', ots: [], total: 0 }
      grupos[nombre].ots.push(ot)
      grupos[nombre].total += ot.totalCobrar
    })
    return Object.values(grupos).sort((a, b) => b.total - a.total)
  }, [vencidas])

  const generarMensajeWhatsApp = (grupo) => {
    const otList = grupo.ots.map(ot =>
      `• ${ot.ot_numero} — ${ot.vehiculos?.codigo || ''} — ${ot.fecha.toLocaleDateString('es-AR')} — ${formatARS(ot.totalCobrar)}`
    ).join('%0A')
    const mensaje = `Hola ${grupo.cliente}! Te recordamos las siguientes OTs pendientes de pago:%0A%0A${otList}%0A%0ATotal: ${formatARS(grupo.total)}%0A%0ALibra Fleet · Taller Libra`
    const telefono = (grupo.telefono || '').replace(/\D/g, '')
    const tel = telefono.startsWith('54') ? telefono : '54' + telefono
    return `https://wa.me/${tel || ''}?text=${mensaje}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1F3864] dark:text-blue-300">💰 Cobranzas</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">OTs finalizadas pendientes de pago</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Vence a los</label>
          <select
            value={diasVencimiento}
            onChange={e => setDiasVencimiento(parseInt(e.target.value))}
            className="border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value={15}>15 días</option>
            <option value={30}>30 días</option>
            <option value={45}>45 días</option>
            <option value={60}>60 días</option>
            <option value={90}>90 días</option>
          </select>
          <select
            value={filtroCliente}
            onChange={e => setFiltroCliente(e.target.value)}
            className="border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="todos">Todos los clientes</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-500 text-white rounded-xl p-5 shadow-lg">
          <p className="text-xs opacity-80 uppercase tracking-wider">🔴 Vencido (+{diasVencimiento}d)</p>
          <p className="text-2xl font-bold mt-1">{formatARS(totalVencido)}</p>
          <p className="text-xs opacity-80 mt-1">{vencidas.length} OT{vencidas.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-[#2E75B6] text-white rounded-xl p-5 shadow-lg">
          <p className="text-xs opacity-80 uppercase tracking-wider">🔵 Por cobrar</p>
          <p className="text-2xl font-bold mt-1">{formatARS(totalPorCobrar)}</p>
          <p className="text-xs opacity-80 mt-1">{porCobrar.length} OT{porCobrar.length !== 1 ? 's' : ''} finalizada{porCobrar.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-green-600 text-white rounded-xl p-5 shadow-lg">
          <p className="text-xs opacity-80 uppercase tracking-wider">✅ Cobrado</p>
          <p className="text-2xl font-bold mt-1">{formatARS(totalCobrado)}</p>
          <p className="text-xs opacity-80 mt-1">{cobradas.length} OT{cobradas.length !== 1 ? 's' : ''} entregada{cobradas.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Vencidas por cliente */}
      {vencidasPorCliente.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-5 mb-6 border-l-4 border-red-500">
          <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4">
            🚨 Acción requerida — {vencidasPorCliente.length} cliente{vencidasPorCliente.length !== 1 ? 's' : ''} con pagos vencidos
          </h3>
          <div className="space-y-3">
            {vencidasPorCliente.map(grupo => (
              <div key={grupo.cliente} className="flex items-center justify-between gap-3 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-red-800 dark:text-red-300">{grupo.cliente}</p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {grupo.ots.length} OT{grupo.ots.length !== 1 ? 's' : ''} · {formatARS(grupo.total)}
                  </p>
                </div>
                {grupo.telefono && (
                  <a
                    href={generarMensajeWhatsApp(grupo)}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow"
                  >
                    💬 WhatsApp
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla detallada */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden text-slate-800 dark:text-slate-200">
        <div className="bg-slate-50 dark:bg-slate-900 px-5 py-3 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-[#1F3864] dark:text-blue-300">Todas las OTs cobrables ({otsFiltradas.length})</h3>
        </div>
        {otsFiltradas.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500">
            No hay OTs finalizadas todavía
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#D6E4F0] dark:bg-slate-700 text-[#1F3864] dark:text-blue-200 text-left">
                  <th className="px-3 py-2">OT</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Días</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Unidad</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2 text-right">Total c/IVA</th>
                </tr>
              </thead>
              <tbody>
                {otsFiltradas.map(ot => (
                  <tr key={ot.id} className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${ot.vencida ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                    <td className="px-3 py-2 font-mono font-bold">
                      <Link to="/ordenes" className="text-[#1F3864] dark:text-blue-300 hover:underline">{ot.ot_numero}</Link>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                      {ot.fecha.toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span className={`font-bold ${ot.vencida ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {ot.diasDesde}d
                      </span>
                    </td>
                    <td className="px-3 py-2">{ot.clientes?.nombre || '-'}</td>
                    <td className="px-3 py-2 font-mono text-xs">{ot.vehiculos?.codigo || '-'}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ot.vencida ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                        ot.estado === 'Finalizado' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' :
                        'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                      }`}>
                        {ot.vencida ? 'VENCIDO' : ot.estado === 'Finalizado' ? 'Por cobrar' : 'Cobrado'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold">
                      {formatARS(ot.totalCobrar)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
