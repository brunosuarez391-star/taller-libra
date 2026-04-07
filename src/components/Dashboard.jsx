import React from 'react'

const ALERTAS_KM = 5000 // km restantes para alertar

export default function Dashboard({ vehiculos, ordenes }) {
  const activos = vehiculos.filter(v => v.estado === 'activo').length
  const enMantenimiento = vehiculos.filter(v => v.estado === 'mantenimiento').length
  const otAbiertas = ordenes.filter(o => o.estado === 'ingresado' || o.estado === 'en_proceso').length
  const otFinalizadas = ordenes.filter(o => o.estado === 'finalizado' || o.estado === 'entregado').length
  const kmTotal = vehiculos.reduce((s, v) => s + v.km_actuales, 0)

  // Alertas de service vencido o próximo
  const alertas = vehiculos.map(v => {
    const ultimaOT = ordenes
      .filter(o => (o.vehiculo_id === v.id || o.vehiculo_id === v.codigo) && (o.estado === 'finalizado' || o.estado === 'entregado'))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0]

    if (!ultimaOT) return { vehiculo: v, tipo: 'sin_service', restante: null }

    const restante = ultimaOT.km_proximo_service - v.km_actuales
    if (restante <= 0) return { vehiculo: v, tipo: 'vencido', restante }
    if (restante <= ALERTAS_KM) return { vehiculo: v, tipo: 'proximo', restante }
    return null
  }).filter(Boolean)

  const alertasVencidas = alertas.filter(a => a.tipo === 'vencido')
  const alertasProximas = alertas.filter(a => a.tipo === 'proximo')
  const alertasSinService = alertas.filter(a => a.tipo === 'sin_service')

  // OTs recientes
  const otRecientes = [...ordenes].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 5)

  function getVehiculo(id) {
    return vehiculos.find(v => v.id === id || v.codigo === id)
  }

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div>
        <h2 className="text-xl font-bold text-libra-dark">Dashboard</h2>
        <p className="text-sm text-gray-500">Resumen general de la flota</p>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-libra-dark/10 flex items-center justify-center text-lg">
              🚛
            </div>
            <div>
              <div className="text-2xl font-bold text-libra-dark">{vehiculos.length}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Vehículos</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-lg">
              ✅
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{activos}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Activos</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg">
              🔧
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{enMantenimiento}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">En Taller</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg">
              📋
            </div>
            <div>
              <div className="text-2xl font-bold text-libra-mid">{otAbiertas}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">OT Abiertas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de km totales */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Kilómetros totales de la flota</span>
          <span className="text-xs font-semibold text-libra-mid">{otFinalizadas} services realizados</span>
        </div>
        <div className="text-3xl font-bold text-libra-dark">
          {kmTotal.toLocaleString('es-AR')}
          <span className="text-sm font-normal text-gray-400 ml-1">km</span>
        </div>
      </div>

      {/* Alertas de service */}
      {alertas.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-libra-dark flex items-center gap-2">
            <span>⚠️</span> Alertas de Service
            <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {alertas.length}
            </span>
          </h3>

          {alertasVencidas.map(a => (
            <div key={a.vehiculo.id} className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-xs font-bold text-red-600">
                  {a.vehiculo.codigo}
                </div>
                <div>
                  <div className="text-xs font-semibold text-red-700">SERVICE VENCIDO</div>
                  <div className="text-[10px] text-red-500">
                    M.B. {a.vehiculo.modelo} · Excedido por {Math.abs(a.restante).toLocaleString('es-AR')} km
                  </div>
                </div>
              </div>
              <span className="text-red-400 text-lg">🔴</span>
            </div>
          ))}

          {alertasProximas.map(a => (
            <div key={a.vehiculo.id} className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-xs font-bold text-amber-600">
                  {a.vehiculo.codigo}
                </div>
                <div>
                  <div className="text-xs font-semibold text-amber-700">PRÓXIMO SERVICE</div>
                  <div className="text-[10px] text-amber-500">
                    M.B. {a.vehiculo.modelo} · Faltan {a.restante.toLocaleString('es-AR')} km
                  </div>
                </div>
              </div>
              <span className="text-amber-400 text-lg">🟡</span>
            </div>
          ))}

          {alertasSinService.map(a => (
            <div key={a.vehiculo.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500">
                  {a.vehiculo.codigo}
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-600">SIN SERVICE REGISTRADO</div>
                  <div className="text-[10px] text-gray-400">
                    M.B. {a.vehiculo.modelo} · {a.vehiculo.km_actuales.toLocaleString('es-AR')} km
                  </div>
                </div>
              </div>
              <span className="text-gray-300 text-lg">⚪</span>
            </div>
          ))}
        </div>
      )}

      {/* OTs recientes */}
      <div>
        <h3 className="text-sm font-bold text-libra-dark mb-3">Últimas Órdenes de Trabajo</h3>
        <div className="space-y-2">
          {otRecientes.map(ot => {
            const v = getVehiculo(ot.vehiculo_id)
            const estadoMap = {
              ingresado: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Ingresado' },
              en_proceso: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En proceso' },
              finalizado: { bg: 'bg-green-100', text: 'text-green-700', label: 'Finalizado' },
              entregado: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Entregado' },
            }
            const est = estadoMap[ot.estado] || estadoMap.ingresado
            return (
              <div key={ot.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-libra-dark/10 rounded-lg flex items-center justify-center">
                    <span className="text-[10px] font-bold text-libra-dark">{v?.codigo || '?'}</span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-libra-dark">{ot.id}</div>
                    <div className="text-[10px] text-gray-400">
                      {new Date(ot.fecha).toLocaleDateString('es-AR')} · {ot.servicios.length} servicios
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${est.bg} ${est.text}`}>
                  {est.label}
                </span>
              </div>
            )
          })}
          {otRecientes.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No hay órdenes de trabajo todavía.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
