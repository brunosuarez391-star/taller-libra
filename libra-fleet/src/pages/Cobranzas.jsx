import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { obtenerPrecio } from '../lib/data'

/**
 * Página de Cobranzas: detecta OTs finalizadas + presupuestos aprobados
 * pendientes de pago, y muestra el monto estimado a cobrar.
 */
export default function Cobranzas({ ordenes, clientes, presupuestos = [] }) {
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

        // Si tiene insumos_ot (reparación extra), usar precios reales
        const tieneInsumos = ot.insumos_ot && ot.insumos_ot.length > 0
        let totalNeto
        if (tieneInsumos) {
          totalNeto = ot.insumos_ot.reduce((s, it) => s + (it.cantidad || 1) * (it.precio_unit || 0), 0)
        } else {
          totalNeto = obtenerPrecio(ot.vehiculos).total
        }

        const iva = Math.round(totalNeto * 0.21)
        const totalCobrar = totalNeto + iva
        return {
          ...ot,
          tipo: 'ot',
          numero: ot.ot_numero,
          fecha,
          diasDesde,
          totalNeto,
          iva,
          totalCobrar,
          vehiculoCodigo: ot.vehiculos?.codigo || '-',
          clienteNombre: ot.clientes?.nombre || 'Sin cliente',
          clienteTel: ot.clientes?.telefono || '',
          vencida: ot.estado === 'Finalizado' && diasDesde >= diasVencimiento,
          cobrada: ot.estado === 'Entregado',
        }
      })
  }, [ordenes, diasVencimiento])

  // Presupuestos aprobados → cobrables
  const presupuestosCobrables = useMemo(() => {
    return presupuestos
      .filter(p => p.estado === 'aprobado')
      .map(p => {
        const fecha = new Date(p.created_at || p.fecha)
        const diasDesde = Math.floor((ahora - fecha) / msDia)
        const totalNeto = parseFloat(p.subtotal_siva || 0)
        const iva = parseFloat(p.iva || Math.round(totalNeto * 0.21))
        const totalCobrar = parseFloat(p.total_civa || totalNeto + iva)
        return {
          id: p.id,
          tipo: 'presupuesto',
          numero: p.numero || `PP-${p.id?.slice(0, 8)}`,
          estado: 'aprobado',
          cliente_id: p.cliente_id,
          fecha,
          diasDesde,
          totalNeto,
          iva,
          totalCobrar,
          vehiculoCodigo: '-',
          clienteNombre: p.clientes?.nombre || 'Sin cliente',
          clienteTel: p.clientes?.telefono || '',
          vencida: diasDesde >= diasVencimiento,
          cobrada: false,
        }
      })
  }, [presupuestos, diasVencimiento])

  // Combinar OTs + presupuestos
  const todosCobrables = useMemo(() => {
    return [...otsCobrables, ...presupuestosCobrables].sort((a, b) => b.diasDesde - a.diasDesde)
  }, [otsCobrables, presupuestosCobrables])

  const filtrados = filtroCliente === 'todos'
    ? todosCobrables
    : todosCobrables.filter(item => item.cliente_id === filtroCliente)

  const vencidas = filtrados.filter(item => item.vencida && !item.cobrada)
  const porCobrar = filtrados.filter(item => !item.cobrada)
  const cobradas = filtrados.filter(item => item.cobrada)

  const totalVencido = vencidas.reduce((s, item) => s + item.totalCobrar, 0)
  const totalPorCobrar = porCobrar.reduce((s, item) => s + item.totalCobrar, 0)
  const totalCobrado = cobradas.reduce((s, item) => s + item.totalCobrar, 0)

  const formatARS = (n) => '$' + (n || 0).toLocaleString('es-AR')

  // Agrupar vencidas por cliente
  const vencidasPorCliente = useMemo(() => {
    const grupos = {}
    vencidas.forEach(item => {
      const nombre = item.clienteNombre
      if (!grupos[nombre]) grupos[nombre] = { cliente: nombre, telefono: item.clienteTel, items: [], total: 0 }
      grupos[nombre].items.push(item)
      grupos[nombre].total += item.totalCobrar
    })
    return Object.values(grupos).sort((a, b) => b.total - a.total)
  }, [vencidas])

  const generarMensajeWhatsApp = (grupo) => {
    const lista = grupo.items.map(item =>
      `• ${item.numero} — ${item.tipo === 'ot' ? item.vehiculoCodigo : 'Presupuesto'} — ${item.fecha.toLocaleDateString('es-AR')} — ${formatARS(item.totalCobrar)}`
    ).join('%0A')
    const mensaje = `Hola ${grupo.cliente}! Te recordamos los siguientes trabajos pendientes de pago:%0A%0A${lista}%0A%0ATotal: ${formatARS(grupo.total)}%0A%0ALibra Fleet · Taller Libra`
    const telefono = (grupo.telefono || '').replace(/\D/g, '')
    const tel = telefono.startsWith('54') ? telefono : '54' + telefono
    return `https://wa.me/${tel || ''}?text=${mensaje}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1F3864] dark:text-blue-300">💰 Cobranzas</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">OTs finalizadas + presupuestos aprobados pendientes de pago</p>
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
          <p className="text-xs opacity-80 mt-1">{vencidas.length} item{vencidas.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-[#2E75B6] text-white rounded-xl p-5 shadow-lg">
          <p className="text-xs opacity-80 uppercase tracking-wider">🔵 Por cobrar</p>
          <p className="text-2xl font-bold mt-1">{formatARS(totalPorCobrar)}</p>
          <p className="text-xs opacity-80 mt-1">
            {otsCobrables.filter(o => !o.cobrada).length} OT{otsCobrables.filter(o => !o.cobrada).length !== 1 ? 's' : ''} + {presupuestosCobrables.length} presup.
          </p>
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
                    {grupo.items.length} item{grupo.items.length !== 1 ? 's' : ''} · {formatARS(grupo.total)}
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
          <h3 className="font-bold text-[#1F3864] dark:text-blue-300">Todos los cobrables ({filtrados.length})</h3>
        </div>
        {filtrados.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500">
            No hay OTs finalizadas ni presupuestos aprobados todavía
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#D6E4F0] dark:bg-slate-700 text-[#1F3864] dark:text-blue-200 text-left">
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Número</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Días</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Unidad</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2 text-right">Total c/IVA</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(item => (
                  <tr key={item.id} className={`border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${item.vencida && !item.cobrada ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.tipo === 'ot'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                      }`}>
                        {item.tipo === 'ot' ? 'OT' : 'PP'}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono font-bold">
                      <Link to={item.tipo === 'ot' ? '/ordenes' : '/presupuestos'} className="text-[#1F3864] dark:text-blue-300 hover:underline">
                        {item.numero}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                      {item.fecha.toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span className={`font-bold ${item.vencida && !item.cobrada ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {item.diasDesde}d
                      </span>
                    </td>
                    <td className="px-3 py-2">{item.clienteNombre}</td>
                    <td className="px-3 py-2 font-mono text-xs">{item.vehiculoCodigo}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.cobrada ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                        item.vencida ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' :
                        item.tipo === 'presupuesto' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                      }`}>
                        {item.cobrada ? 'Cobrado' : item.vencida ? 'VENCIDO' : item.tipo === 'presupuesto' ? 'Aprobado' : 'Por cobrar'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold">
                      {formatARS(item.totalCobrar)}
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
