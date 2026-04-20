import { useEffect, useMemo, useState } from 'react'
import {
  BUS_URL, getBusLog, limpiarBusLog, pingBus, dispararEvento,
  tieneDatosLocalesParaMigrar, migrarLocalStorageASupabase,
} from '../lib/api'
import { PRECIOS } from '../lib/data'

const AGENTES = [
  {
    id: 'recepcion_pesada', nombre: 'Agente Recepción Pesada', evento: 'flota_recepcion', icono: '🚛',
    descripcion: 'Registra OTs de camiones pesados y tractores. Notifica al cliente.',
    testPayload: { ot_numero: 'TEST-OT-001', cliente: 'Cliente Test', telefono: '5492974773784', codigo: 'U05', modelo: 'M.B. 1634', categoria: 'Tractor', km: 182400, proximo_km: 202400, servicio: 'Service 20.000 km', mecanico: 'Bruno Suarez' },
  },
  {
    id: 'recepcion_liviana', nombre: 'Agente Recepción Liviana', evento: 'flota_liviana_recepcion', icono: '🚐',
    descripcion: 'Registra OTs de utilitarios y vehículos livianos.',
    testPayload: { ot_numero: 'TEST-OT-002', cliente: 'Cliente Test', telefono: '5492974773784', codigo: 'U20', modelo: 'Utilitario', categoria: 'Utilitario', km: 50000 },
  },
  {
    id: 'finalizacion', nombre: 'Agente Finalización', evento: 'ot_finalizada', icono: '✅',
    descripcion: 'Envía WhatsApp al cliente cuando la OT se finaliza.',
    testPayload: { ot_numero: 'TEST-OT-001', cliente: 'Cliente Test', telefono: '5492974773784', vehiculo: 'U05 M.B. 1634 Tractor', km: 182400, proximo_km: 202400, servicio: 'Service 20.000 km' },
  },
  {
    id: 'crm', nombre: 'Agente CRM', evento: 'cliente_creado', icono: '👥',
    descripcion: 'Da de alta clientes en sistemas externos y listas de contacto.',
    testPayload: { cliente_id: 'test-uuid', nombre: 'Cliente Test SA', telefono: '5492974773784', email: 'test@ejemplo.com', cuit: '30-12345678-9' },
  },
  {
    id: 'ventas', nombre: 'Agente Ventas', evento: 'presupuesto_creado', icono: '💰',
    descripcion: 'Envía presupuestos al cliente y hace seguimiento.',
    testPayload: { numero: 'TEST-PRES-001', cliente: 'Cliente Test', telefono: '5492974773784', email: 'test@ejemplo.com', total: 1239425, validez_dias: 15 },
  },
  {
    id: 'marketing', nombre: 'Agente Marketing', evento: 'marketing_publicar', icono: '📣',
    descripcion: 'Publica en Facebook e Instagram. Captura leads de redes.',
    testPayload: { plataformas: ['facebook', 'instagram'], titulo: 'TEST — Service 20k MB', texto: 'Post de prueba desde el panel Cerebro. Ignorar.', hashtags: '#Test #Libra', fotos: ['https://zcballhidbpsatqjnbuw.supabase.co/storage/v1/object/public/fotos/test.jpg'] },
  },
  {
    id: 'leads', nombre: 'Agente Leads', evento: 'lead_captado', icono: '🎯',
    descripcion: 'Recibe consultas de redes y las dirige al equipo de ventas.',
    testPayload: { nombre: 'Lead Test', telefono: '5492974773784', fuente: 'Instagram', mensaje: 'Mensaje de prueba. Ignorar.' },
  },
  {
    id: 'finanzas', nombre: 'Agente Finanzas', evento: 'gasto_registrado', icono: '📊',
    descripcion: 'Consolida ingresos y gastos, genera reportes mensuales.',
    testPayload: { id: 'test-gasto', fecha: new Date().toISOString().slice(0, 10), categoria: 'Insumos', proveedor: 'Jones SRL', concepto: 'TEST — ignorar', monto: 1000, metodo_pago: 'Efectivo' },
  },
  {
    id: 'inventario', nombre: 'Agente Inventario', evento: 'stock_bajo', icono: '📦',
    descripcion: 'Alerta cuando un insumo cae al stock mínimo y sugiere reposición.',
    testPayload: { codigo: 'INV-TEST', descripcion: 'Item de prueba', stock_actual: 2, stock_minimo: 5, proveedor: 'Jones SRL' },
  },
  {
    id: 'equipo', nombre: 'Agente Equipo', evento: 'mecanico_creado', icono: '👷',
    descripcion: 'Onboarding de mecánicos: alta en nómina, listas de contacto.',
    testPayload: { nombre: 'Mecánico Test', rol: 'Mecánico', telefono: '5492974773784' },
  },
  {
    id: 'agenda', nombre: 'Agente Agenda', evento: 'turno_creado', icono: '📅',
    descripcion: 'Confirma turnos programados por WhatsApp y envía recordatorios.',
    testPayload: { fecha: new Date().toISOString().slice(0, 10), hora: '10:00', cliente: 'Cliente Test', telefono: '5492974773784', vehiculo: 'U05 MB 1634', servicio: 'Service 20.000 km', mecanico: 'Bruno Suarez' },
  },
]

export default function Cerebro({ ordenes, vehiculos, clientes, gastos = [], onRefresh }) {
  const [log, setLog] = useState(() => getBusLog())
  const [estadoBus, setEstadoBus] = useState('desconocido')
  const [pingando, setPingando] = useState(false)
  const [filtro, setFiltro] = useState('todos')
  const [testing, setTesting] = useState(null)
  const [testResults, setTestResults] = useState({})
  const [tieneLocales, setTieneLocales] = useState(() => tieneDatosLocalesParaMigrar())
  const [migrando, setMigrando] = useState(false)
  const [reporteMigracion, setReporteMigracion] = useState(null)

  const ejecutarMigracion = async () => {
    if (!confirm('Esto va a subir los datos locales (gastos, inventario, equipo, agenda) a Supabase. Confirmá que ya corriste supabase-schema-v2.sql en el SQL Editor del dashboard. ¿Seguimos?')) return
    setMigrando(true)
    setReporteMigracion(null)
    try {
      const r = await migrarLocalStorageASupabase()
      setReporteMigracion(r)
      setTieneLocales(tieneDatosLocalesParaMigrar())
      if (r.errores.length === 0) {
        onRefresh?.()
      }
    } catch (err) {
      setReporteMigracion({ errores: [{ tabla: 'general', error: err.message }] })
    } finally {
      setMigrando(false)
    }
  }

  const refrescarLog = () => setLog(getBusLog())

  const testearAgente = async (agente) => {
    setTesting(agente.id)
    const r = await dispararEvento(agente.evento, agente.testPayload, 'test_cerebro')
    const ok = r?.status !== 'bus_offline' && r?.status !== 'error'
    setTestResults(prev => ({ ...prev, [agente.id]: { ok, respuesta: r, ts: Date.now() } }))
    refrescarLog()
    setTesting(null)
    setTimeout(() => {
      setTestResults(prev => {
        const n = { ...prev }
        if (n[agente.id]?.ts === (prev[agente.id]?.ts)) delete n[agente.id]
        return n
      })
    }, 8000)
  }

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
    const gastosMes = gastos.filter(g => (g.fecha || '').slice(0, 7) === mes).reduce((s, g) => s + Number(g.monto || 0), 0)
    return {
      otsMes: otsMes.length,
      otsActivas: otsActivas.length,
      clientes: clientes.length,
      flota: vehiculos.length,
      facturacionMes,
      gastosMes,
      neto: facturacionMes - gastosMes,
    }
  }, [ordenes, vehiculos, clientes, gastos])

  const formatARS = (n) => '$' + (n || 0).toLocaleString('es-AR')

  return (
    <div>
      {tieneLocales && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-amber-800">⚡ Migración pendiente: localStorage → Supabase</h3>
              <p className="text-xs text-amber-700 mt-1">
                Detectamos datos de gastos, inventario, equipo o agenda guardados localmente en este navegador.
                Para habilitar uso multi-usuario, subilos a Supabase ahora.
              </p>
              <p className="text-xs text-amber-700 mt-1">
                <strong>Paso previo:</strong> correr <code className="bg-amber-100 px-1 rounded">libra-fleet/supabase-schema-v2.sql</code> en el SQL Editor de Supabase.
              </p>
            </div>
            <button onClick={ejecutarMigracion} disabled={migrando} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 disabled:opacity-50 whitespace-nowrap">
              {migrando ? 'Migrando...' : '🚀 Migrar ahora'}
            </button>
          </div>
          {reporteMigracion && (
            <div className="mt-3 text-xs bg-white rounded p-3 border border-amber-200">
              <p className="font-bold text-[#1F3864] mb-1">Reporte:</p>
              <ul className="space-y-0.5 text-slate-700">
                <li>• Gastos migrados: {reporteMigracion.gastos}</li>
                <li>• Insumos migrados: {reporteMigracion.insumos}</li>
                <li>• Movimientos migrados: {reporteMigracion.movimientos}</li>
                <li>• Mecánicos migrados: {reporteMigracion.mecanicos}</li>
                <li>• Turnos migrados: {reporteMigracion.turnos}</li>
              </ul>
              {reporteMigracion.errores && reporteMigracion.errores.length > 0 ? (
                <div className="mt-2 text-red-700">
                  <p className="font-bold">❌ Errores:</p>
                  <ul className="space-y-0.5">
                    {reporteMigracion.errores.map((e, i) => (
                      <li key={i}>• {e.tabla}: {e.error}</li>
                    ))}
                  </ul>
                  <p className="text-[10px] mt-1 italic">Los datos locales NO se borraron. Podés reintentar.</p>
                </div>
              ) : (
                <p className="mt-2 text-green-700 font-bold">✅ Migración exitosa. Datos locales limpiados.</p>
              )}
            </div>
          )}
        </div>
      )}

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
            const result = testResults[a.id]
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
                <div className="flex items-center justify-between mt-3 gap-2">
                  {a.ultimo ? (
                    <p className="text-[11px] text-slate-500 truncate">Último: {new Date(a.ultimo.ts).toLocaleString('es-AR')}</p>
                  ) : <span className="text-[11px] text-slate-400 italic">Sin triggers aún</span>}
                  <button
                    onClick={() => testearAgente(a)}
                    disabled={testing === a.id}
                    className="bg-[#2E75B6] text-white px-2 py-1 rounded text-[11px] font-bold hover:bg-[#1F3864] disabled:opacity-50 whitespace-nowrap"
                  >
                    {testing === a.id ? '⏳ Test...' : '🧪 Test'}
                  </button>
                </div>
                {result && (
                  <div className={`mt-2 text-[11px] p-2 rounded ${result.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {result.ok ? '✅ Bus respondió OK' : '❌ ' + (result.respuesta?.status === 'bus_offline' ? 'Bus offline' : 'Error')}
                    {result.respuesta?.mensaje && <p className="mt-0.5 truncate">{result.respuesta.mensaje}</p>}
                  </div>
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
