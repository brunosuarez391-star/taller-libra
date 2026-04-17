import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { actualizarKm } from '../lib/api'

/**
 * Página interna de detalle de un vehículo con timeline de OTs,
 * gráfico de km, estado de service y acciones rápidas.
 */
export default function VehiculoDetalle({ vehiculos, ordenes, onRefresh }) {
  const { codigo } = useParams()
  const navigate = useNavigate()
  const [editKm, setEditKm] = useState(false)
  const [kmValue, setKmValue] = useState(0)
  const [loading, setLoading] = useState(false)

  const vehiculo = useMemo(
    () => vehiculos.find(v => v.codigo === codigo),
    [vehiculos, codigo]
  )

  const otsVehiculo = useMemo(() => {
    if (!vehiculo) return []
    return ordenes
      .filter(o => o.vehiculo_id === vehiculo.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [ordenes, vehiculo])

  if (!vehiculo) {
    return (
      <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl shadow p-8 text-center">
        <p className="text-slate-500 mb-4">Vehículo <strong>{codigo}</strong> no encontrado</p>
        <Link to="/vehiculos" className="text-[#2E75B6] hover:underline">← Volver a la flota</Link>
      </div>
    )
  }

  // Calcular estado del service
  const ultimaOT = otsVehiculo.find(o => o.estado === 'Finalizado' || o.estado === 'Entregado')
  const kmActuales = vehiculo.km_actuales || 0
  const kmProximo = ultimaOT?.km_proximo || (kmActuales + 20000)
  const restante = kmProximo - kmActuales
  const porcentaje = Math.max(0, Math.min(100, ((20000 - restante) / 20000) * 100))

  let estadoService = 'Al día'
  let colorEstado = 'bg-green-500'
  let textoEstado = 'text-green-700'
  let bgEstado = 'bg-green-50'
  let bordeEstado = 'border-green-200'

  if (!ultimaOT) {
    estadoService = 'Sin service registrado'
    colorEstado = 'bg-slate-400'
    textoEstado = 'text-slate-700'
    bgEstado = 'bg-slate-50'
    bordeEstado = 'border-slate-200'
  } else if (restante <= 0) {
    estadoService = 'VENCIDO'
    colorEstado = 'bg-red-500'
    textoEstado = 'text-red-700'
    bgEstado = 'bg-red-50'
    bordeEstado = 'border-red-200'
  } else if (restante <= 2000) {
    estadoService = 'PRÓXIMO'
    colorEstado = 'bg-amber-500'
    textoEstado = 'text-amber-700'
    bgEstado = 'bg-amber-50'
    bordeEstado = 'border-amber-200'
  }

  // Stats
  const totalOTs = otsVehiculo.length
  const otsActivas = otsVehiculo.filter(o => o.estado !== 'Entregado').length
  const otsTerminadas = otsVehiculo.filter(o => o.estado === 'Finalizado' || o.estado === 'Entregado').length

  // Datos para el "gráfico" de km a lo largo del tiempo
  const historicoKm = otsVehiculo
    .slice()
    .reverse()
    .map(ot => ({
      fecha: new Date(ot.created_at).toLocaleDateString('es-AR'),
      km: ot.km_ingreso || 0,
      ot: ot.ot_numero,
    }))
    .filter(h => h.km > 0)

  const kmMin = historicoKm.length > 0 ? Math.min(...historicoKm.map(h => h.km)) : 0
  const kmMax = historicoKm.length > 0 ? Math.max(...historicoKm.map(h => h.km), kmActuales) : kmActuales

  const iniciarEdicion = () => {
    setKmValue(kmActuales)
    setEditKm(true)
  }

  const guardarKm = async () => {
    setLoading(true)
    try {
      await actualizarKm(vehiculo.id, parseInt(kmValue) || 0)
      await onRefresh()
      setEditKm(false)
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <Link to="/vehiculos" className="text-slate-500 hover:text-[#1F3864]">🚛 Flota</Link>
        <span className="text-slate-300">›</span>
        <span className="text-[#1F3864] font-bold">{vehiculo.codigo}</span>
      </div>

      {/* Header con datos del vehículo */}
      <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-[#1F3864] dark:text-blue-300">{vehiculo.codigo}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${bgEstado} ${textoEstado} border ${bordeEstado}`}>
                {estadoService}
              </span>
            </div>
            <p className="text-lg text-slate-700 font-semibold">
              {vehiculo.marca} {vehiculo.modelo}
              {vehiculo.tipo && <span className="text-slate-500 font-normal"> · {vehiculo.tipo}</span>}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {vehiculo.categoria} · Cliente: <strong>{vehiculo.clientes?.nombre || 'Sin asignar'}</strong>
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto">
            <Link
              to="/nueva-ot"
              className="bg-[#1F3864] text-white px-4 py-2 rounded-lg font-bold text-sm text-center hover:bg-[#2E75B6] transition"
            >
              ➕ Nueva OT
            </Link>
            <button
              onClick={iniciarEdicion}
              className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-200 transition"
            >
              ✏️ Editar KM
            </button>
          </div>
        </div>

        {/* Progreso hacia próximo service */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>KM Actuales: <strong className="text-[#1F3864]">{kmActuales.toLocaleString('es-AR')} km</strong></span>
            <span>Próximo service: <strong className="text-[#1F3864]">{kmProximo.toLocaleString('es-AR')} km</strong></span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full ${colorEstado} transition-all`}
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <p className="text-center text-xs text-slate-500 mt-1">
            {restante > 0
              ? <>Faltan <strong className={textoEstado}>{restante.toLocaleString('es-AR')} km</strong> para el próximo service</>
              : <>Excedido por <strong className="text-red-600">{Math.abs(restante).toLocaleString('es-AR')} km</strong></>
            }
          </p>
        </div>

        {/* Modal editar km */}
        {editKm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditKm(false)}>
            <div className="bg-white rounded-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-[#1F3864] dark:text-blue-300 mb-4">Actualizar KM de {vehiculo.codigo}</h3>
              <input
                type="number"
                value={kmValue}
                onChange={e => setKmValue(e.target.value)}
                className="w-full border-2 border-slate-300 rounded-lg px-4 py-3 text-lg font-mono focus:border-[#2E75B6] focus:outline-none"
                placeholder="145000"
                autoFocus
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={guardarKm}
                  disabled={loading}
                  className="flex-1 bg-[#1F3864] text-white py-2.5 rounded-lg font-bold hover:bg-[#2E75B6] disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={() => setEditKm(false)}
                  className="flex-1 bg-slate-200 text-slate-700 py-2.5 rounded-lg font-bold hover:bg-slate-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-[#1F3864] dark:text-blue-300">{totalOTs}</p>
          <p className="text-xs text-slate-500">OTs totales</p>
        </div>
        <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-[#2E75B6]">{otsActivas}</p>
          <p className="text-xs text-slate-500">En curso</p>
        </div>
        <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl shadow p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{otsTerminadas}</p>
          <p className="text-xs text-slate-500">Terminadas</p>
        </div>
      </div>

      {/* Gráfico de km (barras simples) */}
      {historicoKm.length > 0 && (
        <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl shadow p-5 mb-6">
          <h3 className="text-lg font-bold text-[#1F3864] dark:text-blue-300 mb-4">📈 Evolución de kilometraje</h3>
          <div className="flex items-end gap-2 h-40 overflow-x-auto">
            {historicoKm.map((h, i) => {
              const altura = kmMax > kmMin
                ? ((h.km - kmMin) / (kmMax - kmMin)) * 100
                : 50
              return (
                <div key={i} className="flex-1 min-w-[40px] flex flex-col items-center gap-1">
                  <div className="text-[10px] font-mono text-[#1F3864] font-bold">
                    {(h.km / 1000).toFixed(0)}k
                  </div>
                  <div className="w-full bg-slate-100 rounded-t overflow-hidden flex-1 flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-[#1F3864] to-[#2E75B6] rounded-t transition-all"
                      style={{ height: `${Math.max(5, altura)}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-slate-400 whitespace-nowrap">{h.fecha}</div>
                </div>
              )
            })}
            {/* KM actual */}
            <div className="flex-1 min-w-[40px] flex flex-col items-center gap-1 border-l-2 border-dashed border-[#2E75B6] pl-2">
              <div className="text-[10px] font-mono text-[#2E75B6] font-bold">
                {(kmActuales / 1000).toFixed(0)}k
              </div>
              <div className="w-full bg-slate-100 rounded-t overflow-hidden flex-1 flex items-end">
                <div
                  className="w-full bg-[#2E75B6] rounded-t animate-pulse"
                  style={{ height: `${Math.max(5, ((kmActuales - kmMin) / Math.max(1, kmMax - kmMin)) * 100)}%` }}
                />
              </div>
              <div className="text-[9px] text-[#2E75B6] font-bold">AHORA</div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline de OTs */}
      <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl shadow p-5">
        <h3 className="text-lg font-bold text-[#1F3864] dark:text-blue-300 mb-4">📋 Historial de Órdenes de Trabajo</h3>
        {otsVehiculo.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="mb-2">Este vehículo no tiene OTs registradas todavía</p>
            <Link
              to="/nueva-ot"
              className="inline-block mt-2 bg-[#1F3864] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#2E75B6]"
            >
              ➕ Crear la primera OT
            </Link>
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-[#D6E4F0]">
            {otsVehiculo.map((ot, i) => (
              <div key={ot.id} className="relative mb-6 last:mb-0">
                {/* Punto del timeline */}
                <div className={`absolute -left-[29px] w-5 h-5 rounded-full border-4 border-white shadow ${
                  ot.estado === 'Finalizado' || ot.estado === 'Entregado' ? 'bg-green-500' :
                  ot.estado === 'En proceso' ? 'bg-blue-500' :
                  'bg-yellow-500'
                }`} />

                <div className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#1F3864]">{ot.ot_numero}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ot.estado === 'Ingresado' ? 'bg-yellow-100 text-yellow-800' :
                          ot.estado === 'En proceso' ? 'bg-blue-100 text-blue-800' :
                          ot.estado === 'Finalizado' ? 'bg-green-100 text-green-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>{ot.estado}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{ot.servicio_nombre || 'Sin servicio'}</p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                      {new Date(ot.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit', month: '2-digit', year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>📏 KM: <strong>{ot.km_ingreso?.toLocaleString('es-AR')}</strong></span>
                    <span>🔜 Próximo: <strong>{ot.km_proximo?.toLocaleString('es-AR')} km</strong></span>
                    {ot.mecanico && <span>🔧 {ot.mecanico}</span>}
                  </div>
                  {ot.observaciones && (
                    <p className="mt-2 text-xs text-slate-500 italic border-t border-slate-200 pt-2">
                      📝 {ot.observaciones}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
