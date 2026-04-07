import React, { useState } from 'react'
import EtiquetaService from './EtiquetaService'
import OTForm from './OTForm'

const ESTADOS_OT = {
  ingresado: { label: 'Ingresado', bg: 'bg-blue-100', text: 'text-blue-700' },
  en_proceso: { label: 'En proceso', bg: 'bg-amber-100', text: 'text-amber-700' },
  finalizado: { label: 'Finalizado', bg: 'bg-green-100', text: 'text-green-700' },
  entregado: { label: 'Entregado', bg: 'bg-gray-100', text: 'text-gray-500' },
}

const FLUJO_ESTADOS = ['ingresado', 'en_proceso', 'finalizado', 'entregado']

export default function OrdenTrabajo({ ordenes, setOrdenes, vehiculos }) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [etiquetaOT, setEtiquetaOT] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('Todos')

  function getVehiculo(vehiculoId) {
    return vehiculos.find(v => v.id === vehiculoId) || vehiculos.find(v => v.codigo === vehiculoId)
  }

  function avanzarEstado(ot) {
    const idx = FLUJO_ESTADOS.indexOf(ot.estado)
    if (idx < FLUJO_ESTADOS.length - 1) {
      const nuevoEstado = FLUJO_ESTADOS[idx + 1]
      setOrdenes(prev => prev.map(o => o.id === ot.id ? { ...o, estado: nuevoEstado } : o))
    }
  }

  function handleNuevaOT(ot) {
    setOrdenes(prev => [...prev, ot])
    setMostrarForm(false)
  }

  const filtradas = ordenes.filter(o => filtroEstado === 'Todos' || o.estado === filtroEstado)

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(ESTADOS_OT).map(([key, val]) => {
          const count = ordenes.filter(o => o.estado === key).length
          return (
            <div key={key} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-libra-dark">{count}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">{val.label}</div>
            </div>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-2 overflow-x-auto flex-1">
          {['Todos', ...Object.keys(ESTADOS_OT)].map(key => {
            const label = key === 'Todos' ? 'Todas' : ESTADOS_OT[key].label
            return (
              <button
                key={key}
                onClick={() => setFiltroEstado(key)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filtroEstado === key
                    ? 'bg-libra-dark text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          className="bg-libra-mid text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-libra-dark transition-colors whitespace-nowrap"
        >
          + Nueva OT
        </button>
      </div>

      {/* Lista de OTs */}
      <div className="space-y-3">
        {filtradas.map(ot => {
          const vehiculo = getVehiculo(ot.vehiculo_id)
          const est = ESTADOS_OT[ot.estado] || ESTADOS_OT.ingresado
          const puedAvanzar = FLUJO_ESTADOS.indexOf(ot.estado) < FLUJO_ESTADOS.length - 1
          const puedeImprimir = ot.estado === 'finalizado' || ot.estado === 'entregado'

          return (
            <div key={ot.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-libra-dark text-sm">{ot.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${est.bg} ${est.text}`}>
                      {est.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {vehiculo ? `M.B. ${vehiculo.modelo} – ${vehiculo.codigo}` : ot.vehiculo_id}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">
                    {new Date(ot.fecha).toLocaleDateString('es-AR')}
                  </div>
                  <div className="text-xs font-semibold text-libra-mid mt-0.5">
                    {ot.km_ingreso.toLocaleString('es-AR')} km
                  </div>
                </div>
              </div>

              {/* Servicios */}
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-1">Servicios:</div>
                <div className="flex flex-wrap gap-1">
                  {ot.servicios.slice(0, 3).map((s, i) => (
                    <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {s.length > 35 ? s.slice(0, 35) + '...' : s}
                    </span>
                  ))}
                  {ot.servicios.length > 3 && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      +{ot.servicios.length - 3} más
                    </span>
                  )}
                </div>
              </div>

              {/* Mecánico y observaciones */}
              <div className="text-xs text-gray-500 mb-3">
                <span className="font-medium">Mecánico:</span> {ot.mecanico}
                {ot.observaciones && (
                  <span className="ml-2">· {ot.observaciones.slice(0, 60)}{ot.observaciones.length > 60 ? '...' : ''}</span>
                )}
              </div>

              {/* Acciones */}
              <div className="flex gap-2 justify-end">
                {puedeImprimir && vehiculo && (
                  <button
                    onClick={() => setEtiquetaOT(ot)}
                    className="bg-libra-dark text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-libra-mid transition-colors"
                  >
                    Etiqueta Service
                  </button>
                )}
                {puedAvanzar && (
                  <button
                    onClick={() => avanzarEstado(ot)}
                    className="bg-libra-mid text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-libra-dark transition-colors"
                  >
                    Avanzar a {ESTADOS_OT[FLUJO_ESTADOS[FLUJO_ESTADOS.indexOf(ot.estado) + 1]]?.label}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filtradas.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No hay órdenes de trabajo {filtroEstado !== 'Todos' ? `en estado "${ESTADOS_OT[filtroEstado]?.label}"` : ''}.
        </div>
      )}

      {/* Modal nueva OT */}
      {mostrarForm && (
        <OTForm
          vehiculos={vehiculos}
          onGuardar={handleNuevaOT}
          onCerrar={() => setMostrarForm(false)}
        />
      )}

      {/* Modal etiqueta */}
      {etiquetaOT && (
        <EtiquetaService
          orden={etiquetaOT}
          vehiculo={getVehiculo(etiquetaOT.vehiculo_id)}
          onClose={() => setEtiquetaOT(null)}
        />
      )}
    </div>
  )
}
