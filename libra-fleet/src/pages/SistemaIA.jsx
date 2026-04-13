import { useState, useEffect } from 'react'

// Lista de los 23 agentes del sistema (hardcodeada porque n8n no expone API pública)
const AGENTES = [
  // Agentes principales de taller
  { id: 'TLTWJCVXjfTD4zDx', nombre: 'Agente 1 — Redes + Canva + Sheets + Gmail', categoria: 'Marketing', trigger: 'Lunes 7 AM', estado: 'active' },
  { id: 'ewQAaCHMUJNSnuzV', nombre: 'Agente 2 — Presupuestos + Sheets + WhatsApp', categoria: 'Ventas', trigger: 'Webhook', estado: 'active' },
  { id: '0XUXKBPpjRRpauYO', nombre: 'Agente 3 — Stock + Sheets real', categoria: 'Stock', trigger: 'Webhook', estado: 'active' },
  { id: 'n0ly83WBpvkSe1Zb', nombre: 'Agente 4 — WhatsApp Cloud API + Claude', categoria: 'Atención', trigger: 'Webhook', estado: 'active' },
  { id: 'wVUzZxAgqBb2SUhI', nombre: 'Agente 5 — Dashboard Ejecutivo + Gmail', categoria: 'Reportes', trigger: 'Lunes 8 AM', estado: 'active' },
  { id: 'iPVz4rrAWTxSLfEb', nombre: 'Agente 6 — Gestión + Sheets + Calendar', categoria: 'Operaciones', trigger: 'Webhook', estado: 'active' },
  { id: 'jTYXki5PeJ1SnOXC', nombre: 'Agente 7 — RRHH', categoria: 'RRHH', trigger: 'Viernes 5 PM', estado: 'active' },
  { id: 'RpwTodX8OeGKe5Cg', nombre: 'Agente 8 — Marketing + Canva + Sheets', categoria: 'Marketing', trigger: 'Lunes 9 AM', estado: 'active' },
  { id: '1H8iWLRlW3uhEO7W', nombre: 'Agente 9 — CPN Contable & Fiscal', categoria: 'Contable', trigger: 'Lunes 8:15 AM', estado: 'active' },
  { id: 'S96FE8cqiysrIbdK', nombre: 'Agente 10 — Instagram + Facebook', categoria: 'Marketing', trigger: 'Lunes 7:15 AM', estado: 'active' },
  // Agentes de flota pesada
  { id: 'qayz6TnguAvNBoHO', nombre: 'F1 — Recepción Flota Pesada', categoria: 'Flota', trigger: 'Webhook', estado: 'active' },
  { id: 'GQLdqyXVswzquwoA', nombre: 'F2 — Presupuestos Flota Pesada', categoria: 'Flota', trigger: 'Webhook', estado: 'active' },
  { id: 'jrgTi4Qu93t7JOi8', nombre: 'F3 — Alertas Service Flota', categoria: 'Flota', trigger: 'Diario 7 AM', estado: 'active' },
  { id: 'WxIv81YC8exjOniG', nombre: 'F4 — Reportes Flota Empresa', categoria: 'Flota', trigger: 'Viernes 6 PM', estado: 'active' },
  // Infraestructura
  { id: '0YG28TxT49BRfDP7', nombre: 'Bus de Eventos — Coordinador', categoria: 'Core', trigger: 'Webhook', estado: 'active' },
  { id: 'r5ZbjdVfgfyO3KEC', nombre: 'Monitor de Errores', categoria: 'Core', trigger: 'Webhook', estado: 'active' },
  { id: 'EUOnmM8k16jor0nc', nombre: 'Monitor de Salud', categoria: 'Core', trigger: 'Diario 6 AM', estado: 'active' },
  { id: 'qJKk7s48DKGsDYEf', nombre: 'Seguimiento Post Servicio', categoria: 'Core', trigger: 'Viernes 4 PM', estado: 'active' },
  { id: 'r09EkPg4qEooROJu', nombre: 'Dashboard API — Lectura Sheets', categoria: 'Core', trigger: 'Webhook', estado: 'active' },
  // Nuevos (Fase 1 y 2)
  { id: 'Dp5YvKNw8eJPy2Qc', nombre: 'Sync Supabase → Sheets (Flota)', categoria: 'Integración', trigger: 'Cada hora', estado: 'active' },
  { id: 'CvCEQnei1QSjUhJo', nombre: 'Reporte Diario Unificado', categoria: 'Reportes', trigger: 'Diario 8 AM', estado: 'active' },
  { id: 'ERBuJioWy0MzcqA0', nombre: 'Notificación OT → WhatsApp', categoria: 'Atención', trigger: 'Webhook', estado: 'active' },
]

const CATEGORIA_COLORS = {
  'Marketing': { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
  'Ventas': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  'Stock': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  'Atención': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  'Reportes': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  'Operaciones': { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
  'RRHH': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Contable': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Flota': { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200' },
  'Core': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  'Integración': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
}

export default function SistemaIA({ vehiculos, ordenes, clientes }) {
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [ahora, setAhora] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setAhora(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Estadísticas generales
  const totalAgentes = AGENTES.length
  const agentesActivos = AGENTES.filter(a => a.estado === 'active').length
  const tasaExito = totalAgentes > 0 ? Math.round((agentesActivos / totalAgentes) * 100) : 0

  // KPIs de flota
  const flotaActiva = vehiculos.filter(v => v.activo !== false).length
  const otsActivas = ordenes.filter(o => o.estado !== 'Entregado').length
  const otsFinalizadas = ordenes.filter(o => o.estado === 'Finalizado' || o.estado === 'Entregado').length

  // Agrupar por categoría
  const categorias = ['Todas', ...new Set(AGENTES.map(a => a.categoria))]
  const agentesFiltrados = filtroCategoria === 'Todas'
    ? AGENTES
    : AGENTES.filter(a => a.categoria === filtroCategoria)

  // Próximas ejecuciones basadas en trigger
  const proximasEjecuciones = calcularProximasEjecuciones(ahora)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1F3864]">🤖 Sistema IA — Taller Libra</h2>
          <p className="text-sm text-slate-500 mt-1">
            {ahora.toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short' })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-700 font-semibold text-sm">Sistema operativo</span>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPI label="Agentes activos" value={agentesActivos} total={totalAgentes} color="bg-[#1F3864]" />
        <KPI label="Tasa de éxito" value={`${tasaExito}%`} color="bg-green-600" />
        <KPI label="Flota activa" value={flotaActiva} color="bg-[#2E75B6]" />
        <KPI label="OTs activas" value={otsActivas} color="bg-orange-600" />
      </div>

      {/* Próximas ejecuciones */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h3 className="text-lg font-bold text-[#1F3864] mb-3">⏰ Próximas ejecuciones automáticas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {proximasEjecuciones.slice(0, 6).map((p, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-2xl">{p.icono}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">{p.cuando}</p>
                <p className="text-sm font-semibold text-slate-700 truncate">{p.nombre}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtro por categoría */}
      <div className="bg-white rounded-xl shadow p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-[#1F3864]">Agentes del sistema ({agentesFiltrados.length})</h3>
        </div>
        <div className="flex gap-2 flex-wrap">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filtroCategoria === cat
                  ? 'bg-[#1F3864] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de agentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {agentesFiltrados.map(a => {
          const colors = CATEGORIA_COLORS[a.categoria] || CATEGORIA_COLORS['Core']
          return (
            <div
              key={a.id}
              className={`rounded-xl p-4 border-2 ${colors.border} bg-white shadow hover:shadow-md transition`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                    {a.categoria}
                  </span>
                </div>
                <a
                  href={`https://brunosuerez.app.n8n.cloud/workflow/${a.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                  title="Abrir en n8n"
                >
                  ↗
                </a>
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1 line-clamp-2">{a.nombre}</h4>
              <p className="text-xs text-slate-500">
                <span className="font-semibold">Trigger:</span> {a.trigger}
              </p>
            </div>
          )
        })}
      </div>

      {/* Diagrama del circuito */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h3 className="text-lg font-bold text-[#1F3864] mb-4">🔄 Circuito Integrado App ↔ Agentes</h3>
        <div className="bg-gradient-to-r from-[#1F3864] to-[#2E75B6] rounded-lg p-6 text-white">
          <div className="space-y-3">
            <FlowStep icon="1️⃣" text="Bruno marca una OT como Finalizado en Libra Fleet" />
            <FlowArrow />
            <FlowStep icon="2️⃣" text="app dispara webhook /ot-finalizada en n8n" />
            <FlowArrow />
            <FlowStep icon="3️⃣" text="Claude Sonnet genera mensaje personalizado" />
            <FlowArrow />
            <FlowStep icon="4️⃣" text="WhatsApp Cloud API envía al cliente" />
            <FlowArrow />
            <FlowStep icon="5️⃣" text="Google Sheets registra la notificación" />
          </div>
        </div>
      </div>

      {/* Info de conexión */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
        <p className="font-semibold mb-1">💡 Infraestructura del sistema</p>
        <p>
          <span className="font-semibold">n8n Cloud:</span> brunosuerez.app.n8n.cloud · {' '}
          <span className="font-semibold">Base de datos:</span> Supabase (flota libra) · {' '}
          <span className="font-semibold">Modelos:</span> Claude Opus 4.6 + Sonnet 4
        </p>
        <p className="mt-1 text-xs text-blue-700">
          {clientes.length} clientes · {vehiculos.length} vehículos · {ordenes.length} OTs · {otsFinalizadas} finalizadas
        </p>
      </div>
    </div>
  )
}

function KPI({ label, value, total, color }) {
  return (
    <div className={`${color} text-white rounded-xl p-5 shadow-lg`}>
      <p className="text-3xl font-bold">
        {value}
        {total !== undefined && <span className="text-lg opacity-60">/{total}</span>}
      </p>
      <p className="text-sm opacity-80">{label}</p>
    </div>
  )
}

function FlowStep({ icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xl">{icon}</span>
      <span className="text-sm">{text}</span>
    </div>
  )
}

function FlowArrow() {
  return <div className="ml-4 text-white/50 text-lg leading-none">↓</div>
}

// Calcula próximas ejecuciones basadas en los schedules conocidos
function calcularProximasEjecuciones(ahora) {
  const eventos = []
  const hoy = ahora.getDay() // 0 domingo, 1 lunes, ..., 6 sábado
  const hora = ahora.getHours()
  const minuto = ahora.getMinutes()

  // Cada hora: Sync Supabase
  const proximaHora = new Date(ahora)
  proximaHora.setHours(hora + 1, 0, 0, 0)
  eventos.push({
    cuando: formatearRelativo(ahora, proximaHora),
    nombre: 'Sync Supabase → Sheets (Flota)',
    icono: '🔄'
  })

  // Diario 6 AM: Monitor de Salud
  const prox6am = new Date(ahora)
  prox6am.setHours(6, 0, 0, 0)
  if (hora >= 6) prox6am.setDate(prox6am.getDate() + 1)
  eventos.push({
    cuando: formatearRelativo(ahora, prox6am),
    nombre: 'Monitor de Salud (Sheets + Claude)',
    icono: '💚'
  })

  // Diario 7 AM: F3 Alertas Service
  const prox7am = new Date(ahora)
  prox7am.setHours(7, 0, 0, 0)
  if (hora >= 7) prox7am.setDate(prox7am.getDate() + 1)
  eventos.push({
    cuando: formatearRelativo(ahora, prox7am),
    nombre: 'F3 — Alertas Service Flota',
    icono: '🚨'
  })

  // Diario 8 AM: Reporte Diario
  const prox8am = new Date(ahora)
  prox8am.setHours(8, 0, 0, 0)
  if (hora >= 8) prox8am.setDate(prox8am.getDate() + 1)
  eventos.push({
    cuando: formatearRelativo(ahora, prox8am),
    nombre: 'Reporte Diario Unificado',
    icono: '📊'
  })

  // Lunes 7 AM: Agente 1 + Agente 10
  const proxLunes7 = proximoDiaSemana(ahora, 1, 7)
  eventos.push({
    cuando: formatearRelativo(ahora, proxLunes7),
    nombre: 'Agente 1 — Calendario IG semanal',
    icono: '📅'
  })

  // Viernes 4 PM: Seguimiento
  const proxViernes16 = proximoDiaSemana(ahora, 5, 16)
  eventos.push({
    cuando: formatearRelativo(ahora, proxViernes16),
    nombre: 'Seguimiento Post Servicio',
    icono: '🤝'
  })

  return eventos.sort((a, b) => new Date(a._ts || 0) - new Date(b._ts || 0))
}

function proximoDiaSemana(ahora, diaObjetivo, horaObjetivo) {
  const result = new Date(ahora)
  const diaActual = result.getDay()
  let dias = (diaObjetivo - diaActual + 7) % 7
  if (dias === 0 && result.getHours() >= horaObjetivo) dias = 7
  result.setDate(result.getDate() + dias)
  result.setHours(horaObjetivo, 0, 0, 0)
  return result
}

function formatearRelativo(ahora, destino) {
  const diff = destino - ahora
  const horas = Math.floor(diff / 3600000)
  const minutos = Math.floor((diff % 3600000) / 60000)
  if (diff < 0) return 'Ya ejecutado'
  if (horas === 0) return `En ${minutos} min`
  if (horas < 24) return `En ${horas}h ${minutos}m`
  const dias = Math.floor(horas / 24)
  return dias === 1 ? 'Mañana' : `En ${dias} días`
}
