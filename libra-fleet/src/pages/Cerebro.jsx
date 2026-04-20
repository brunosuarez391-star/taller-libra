import { useEffect, useMemo, useState } from 'react'
import { BUS_URL, getBusLog, limpiarBusLog, pingBus, getGastos } from '../lib/api'
import { PRECIOS } from '../lib/data'

const AGENTES = [
  { id: 'recepcion_pesada', nombre: 'Agente Recepción Pesada', evento: 'flota_recepcion', icono: '🚛', descripcion: 'Registra OTs de camiones pesados y tractores. Notifica al cliente.' },
  { id: 'recepcion_liviana', nombre: 'Agente Recepción Liviana', evento: 'flota_liviana_recepcion', icono: '🚐', descripcion: 'Registra OTs de utilitarios y vehículos livianos.' },
  { id: 'finalizacion', nombre: 'Agente Finalización', evento: 'ot_finalizada', icono: '✅', descripcion: 'Envía WhatsApp al cliente cuando la OT se finaliza.' },
  { id: 'crm', nombre: 'Agente CRM', evento: 'cliente_creado', icono: '👥', descripcion: 'Da de alta clientes en sistemas externos y listas de contacto.' },
  { id: 'ventas', nombre: 'Agente Ventas', evento: 'presupuesto_creado', icono: '💰', descripcion: 'Envía presupuestos al cliente y hace seguimiento.' },
  { id: 'marketing', nombre: 'Agente Marketing', evento: 'marketing_publicar', icono: '📣', descripcion: 'Publica en Facebook e Instagram. Captura leads de redes.' },
  { id: 'leads', nombre: 'Agente Leads', evento: 'lead_captado', icono: '🎯', descripcion: 'Recibe consultas de redes y las dirige al equipo de ventas.' },
  { id: 'finanzas', nombre: 'Agente Finanzas', evento: 'gasto_registrado', icono: '📊', descripcion: 'Consolida ingresos y gastos, genera reportes mensuales.' },
]

export default function Cerebro({ ordenes, vehiculos, clientes }) {
  const [log, setLog] = useState(() => getBusLog())
  const [estadoBus, setEstadoBus] = useState('desconocido')
  const [pingando, setPingando] = useState(false)
  const [filtro, setFiltro] = useState('todos')

  const refrescarLog = () => setLog(getBusLog())

  const hacerPing = async () => {
    setPingando(true)
    const r = await pingBus()
    setEstadoBus(r?.status === 'bus_offline' ? 'offline' : 'online')
    refrescarLog()
    setPingando(false)
  }

  useEffect(() => {
    const run = async () => {
      const r = await pingBus()
      setEstadoBus(r?.status === 'bus_offline' ? 'offline' : 'online')
      setLog(getBusLog())
    }
    const timer = setTimeout(run, 0)
    const iv = setInterval(() => setLog(getBusLog()), 5000)
    return () => { clearTimeout(timer); clearInterval(iv) }
  }, [])

  const logFiltrado = filtro === 'todos' ? log : log.filter(e => e.evento === filtro)

  const estadoAgentes = useMemo(() => {
    return AGENTES.map(a => {
      const eventos = log.filter(e => e.evento === a.evento)
      const ultimo = eventos[0]
      const ok = eventos.filter(e => e.status === 'ok').length
      const fail = eventos.filter(e => e.status !== 'ok').length
      return { ...a, ultimo, total: eventos.length, ok, fail }
    })
  }, [log])

  const kpis = useMemo(() => {
    const now = new Date()
    const mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const otsMes = ordenes.filter(ot => (ot.created_at || '').slice(0, 7) === mes)
    const otsActivas = ordenes.filter(o => o.estado !== 'Entregado' && o.estado !== 'Finalizado')
    const facturacionMes = otsMes.reduce((s, ot) => {
      const modelo = ot.vehiculos?.modelo || '1634'
      const p = PRECIOS[`M.B. ${modelo}`] || PRECIOS['M.B. 1634']
      return s + (p?.total || 0)
    }, 0)
    const gastosMes = getGastos().filter(g => (g.fecha || '').slice(0, 7) === mes).reduce((s, g) => s + g.monto, 0)
    return {
      otsMes: otsMes.length,
      otsActivas: otsActivas.length,
      clientes: clientes.length,
      flota: vehiculos.length,
      facturacionMes,
      gastosMes,
      neto: facturacionMes - gastosMes,
    }
  }, [ordenes, vehiculos, clientes])

  const formatARS = (n) => '$' + (n || 0).toLocaleString('es-AR')

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1F3864]">🧠 Cerebro — Centro de Control</h2>
          <p className="text-sm text-slate-500">Orquesta agentes, monitorea el bus de eventos y consolida KPIs.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
            estadoBus === 'online' ? 'bg-green-100 text-green-800' :
            estadoBus === 'offline' ? 'bg-red-100 text-red-800' :
            'bg-slate-100 text-slate-600'
          }`}>
            <span className={`w-2 h-2 rounded-full ${estadoBus === 'online' ? 'bg-green-500' : estadoBus === 'offline' ? 'bg-red-500' : 'bg-slate-400'}`}></span>
            Bus n8n {estadoBus}
          </span>
          <button onClick={hacerPing} disabled={pingando} className="bg-[#2E75B6] text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-[#1F3864] disabled:opacity-50">
            {pingando ? 'Ping...' : 'Ping bus'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1F3864] text-white rounded-xl p-4 shadow">
          <p className="text-2xl font-bold">{kpis.otsMes}</p>
          <p className="text-xs text-blue-200">OTs este mes</p>
        </div>
        <div className="bg-[#2E75B6] text-white rounded-xl p-4 shadow">
          <p className="text-2xl font-bold">{kpis.otsActivas}</p>
          <p className="text-xs text-blue-200">OTs activas</p>
        </div>
        <div className="bg-green-600 text-white rounded-xl p-4 shadow">
          <p className="text-lg font-bold">{formatARS(kpis.facturacionMes)}</p>
          <p className="text-xs text-green-200">Facturado (s/IVA)</p>
        </div>
        <div className={`${kpis.neto >= 0 ? 'bg-emerald-700' : 'bg-red-700'} text-white rounded-xl p-4 shadow`}>
          <p className="text-lg font-bold">{formatARS(kpis.neto)}</p>
          <p className="text-xs opacity-80">Neto mes (ing - gastos)</p>
        </div>
      </div>

      {/* Agentes */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h3 className="text-lg font-bold text-[#1F3864] mb-4">Agentes conectados al bus</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {estadoAgentes.map(a => {
            const activo = a.total > 0
            return (
              <div key={a.id} className={`border rounded-xl p-4 ${activo ? 'border-green-200 bg-green-50/40' : 'border-slate-200 bg-slate-50/40'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 items-start">
                    <div className="text-2xl">{a.icono}</div>
                    <div>
                      <p className="font-bold text-[#1F3864]">{a.nombre}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{a.descripcion}</p>
                      <p className="text-xs text-slate-400 mt-1 font-mono">evento: {a.evento}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${activo ? 'bg-green-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
                    {activo ? 'ACTIVO' : 'ESPERANDO'}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-white rounded p-2 border border-slate-200">
                    <p className="text-slate-500">Total</p>
                    <p className="font-bold text-[#1F3864]">{a.total}</p>
                  </div>
                  <div className="bg-white rounded p-2 border border-slate-200">
                    <p className="text-slate-500">OK</p>
                    <p className="font-bold text-green-700">{a.ok}</p>
                  </div>
                  <div className="bg-white rounded p-2 border border-slate-200">
                    <p className="text-slate-500">Fallas</p>
                    <p className="font-bold text-red-600">{a.fail}</p>
                  </div>
                </div>
                {a.ultimo && (
                  <p className="text-[11px] text-slate-500 mt-2">Último: {new Date(a.ultimo.ts).toLocaleString('es-AR')}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Bus log */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="text-lg font-bold text-[#1F3864]">Feed del Bus de Eventos</h3>
          <div className="flex gap-2 items-center">
            <select value={filtro} onChange={e => setFiltro(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm">
              <option value="todos">Todos los eventos</option>
              {AGENTES.map(a => <option key={a.evento} value={a.evento}>{a.evento}</option>)}
              <option value="cerebro.heartbeat">cerebro.heartbeat</option>
            </select>
            <button onClick={refrescarLog} className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-300">Refrescar</button>
            <button onClick={() => { if (confirm('¿Limpiar historial local?')) { limpiarBusLog(); refrescarLog() } }} className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-200">Limpiar</button>
          </div>
        </div>
        <p className="text-xs text-slate-400 mb-3 font-mono break-all">Bus: {BUS_URL}</p>
        {logFiltrado.length === 0 ? (
          <p className="text-slate-400 text-center py-8 text-sm">Sin eventos aún. Creá una OT, presupuesto o disparos desde Marketing para ver actividad.</p>
        ) : (
          <div className="space-y-2 max-h-[480px] overflow-y-auto">
            {logFiltrado.map((e, i) => (
              <div key={i} className="border-l-4 border-[#2E75B6] bg-slate-50 rounded-r px-3 py-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1F3864]">{e.evento}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    e.status === 'ok' ? 'bg-green-100 text-green-800' :
                    e.status === 'offline' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>{e.status}</span>
                </div>
                <div className="text-slate-500 mt-0.5">{new Date(e.ts).toLocaleString('es-AR')} · {e.origen}</div>
                <pre className="mt-1 text-[11px] text-slate-700 whitespace-pre-wrap break-all">{JSON.stringify(e.datos, null, 0)}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
