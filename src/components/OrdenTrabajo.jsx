import React, { useState } from 'react'
import EtiquetaService from './EtiquetaService'
import EtiquetasLote from './EtiquetasLote'
import OTForm from './OTForm'
import FirmaDigital from './FirmaDigital'

const ESTADOS_OT = {
  ingresado: { label: 'Ingresado', bg: 'bg-blue-100', text: 'text-blue-700' },
  en_proceso: { label: 'En proceso', bg: 'bg-amber-100', text: 'text-amber-700' },
  finalizado: { label: 'Finalizado', bg: 'bg-green-100', text: 'text-green-700' },
  entregado: { label: 'Entregado', bg: 'bg-gray-100', text: 'text-gray-500' },
}

const FLUJO_ESTADOS = ['ingresado', 'en_proceso', 'finalizado', 'entregado']

export default function OrdenTrabajo({ ordenes, setOrdenes, vehiculos, onToast }) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [mostrarLote, setMostrarLote] = useState(false)
  const [etiquetaOT, setEtiquetaOT] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [expandida, setExpandida] = useState(null)
  const [firmaOT, setFirmaOT] = useState(null)

  function getVehiculo(vehiculoId) {
    return vehiculos.find(v => v.id === vehiculoId) || vehiculos.find(v => v.codigo === vehiculoId)
  }

  function avanzarEstado(ot) {
    const idx = FLUJO_ESTADOS.indexOf(ot.estado)
    if (idx < FLUJO_ESTADOS.length - 1) {
      // Si va a "entregado", pedir firma primero
      if (FLUJO_ESTADOS[idx + 1] === 'entregado') {
        setFirmaOT(ot)
        return
      }
      const nuevoEstado = FLUJO_ESTADOS[idx + 1]
      setOrdenes(prev => prev.map(o => o.id === ot.id ? { ...o, estado: nuevoEstado } : o))
      onToast?.(`${ot.id} avanzó a "${ESTADOS_OT[nuevoEstado].label}"`, 'exito')
    }
  }

  function handleFirmaConfirmada(firmaBase64) {
    if (!firmaOT) return
    setOrdenes(prev => prev.map(o =>
      o.id === firmaOT.id
        ? { ...o, estado: 'entregado', firma_cliente: firmaBase64 }
        : o
    ))
    onToast?.(`${firmaOT.id} entregado con firma del cliente`, 'exito')
    setFirmaOT(null)
  }

  function handleNuevaOT(ot) {
    setOrdenes(prev => [...prev, ot])
    setMostrarForm(false)
    onToast?.(`Orden ${ot.id} creada correctamente`, 'exito')
  }

  function handleEliminarOT(id) {
    if (confirm('¿Estás seguro de eliminar esta OT?')) {
      setOrdenes(prev => prev.filter(o => o.id !== id))
      onToast?.(`Orden ${id} eliminada`, 'info')
    }
  }

  const filtradas = ordenes
    .filter(o => filtroEstado === 'Todos' || o.estado === filtroEstado)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

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
        <div className="flex gap-2">
          <button
            onClick={() => setMostrarLote(true)}
            className="bg-libra-dark text-white px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-libra-mid transition-colors whitespace-nowrap"
          >
            Etiquetas Lote
          </button>
          <button
            onClick={() => setMostrarForm(true)}
            className="bg-libra-mid text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-libra-dark transition-colors whitespace-nowrap"
          >
            + Nueva OT
          </button>
        </div>
      </div>

      {/* Lista de OTs */}
      <div className="space-y-3">
        {filtradas.map(ot => {
          const vehiculo = getVehiculo(ot.vehiculo_id)
          const est = ESTADOS_OT[ot.estado] || ESTADOS_OT.ingresado
          const puedAvanzar = FLUJO_ESTADOS.indexOf(ot.estado) < FLUJO_ESTADOS.length - 1
          const puedeImprimir = ot.estado === 'finalizado' || ot.estado === 'entregado'
          const isExpanded = expandida === ot.id

          return (
            <div key={ot.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header clickeable */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandida(isExpanded ? null : ot.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-libra-dark text-sm">{ot.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${est.bg} ${est.text}`}>
                        {est.label}
                      </span>
                      {ot.firma_cliente && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">
                          Firmado
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {vehiculo ? `M.B. ${vehiculo.modelo} – ${vehiculo.codigo}` : ot.vehiculo_id}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <div className="text-xs text-gray-400">
                        {new Date(ot.fecha).toLocaleDateString('es-AR')}
                      </div>
                      <div className="text-xs font-semibold text-libra-mid mt-0.5">
                        {ot.km_ingreso.toLocaleString('es-AR')} km
                      </div>
                    </div>
                    <span className={`text-gray-400 text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Tags de servicios */}
                <div className="flex flex-wrap gap-1">
                  {ot.servicios.slice(0, 3).map((s, i) => (
                    <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {s.length > 30 ? s.slice(0, 30) + '...' : s}
                    </span>
                  ))}
                  {ot.servicios.length > 3 && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      +{ot.servicios.length - 3} más
                    </span>
                  )}
                </div>
              </div>

              {/* Detalle expandible */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                  {/* Servicios completos */}
                  <div>
                    <div className="text-xs font-semibold text-libra-dark mb-2">Servicios realizados:</div>
                    <div className="space-y-1">
                      {ot.servicios.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span className="text-gray-700">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Info adicional */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase">Mecánico</div>
                      <div className="text-xs font-semibold text-gray-700">{ot.mecanico}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase">Próximo Service</div>
                      <div className="text-xs font-semibold text-green-600">
                        {ot.km_proximo_service?.toLocaleString('es-AR')} km
                      </div>
                    </div>
                  </div>

                  {/* Observaciones */}
                  {ot.observaciones && (
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase">Observaciones</div>
                      <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 mt-1">
                        {ot.observaciones}
                      </div>
                    </div>
                  )}

                  {/* Firma del cliente */}
                  {ot.firma_cliente && (
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase mb-1">Firma del cliente</div>
                      <img
                        src={ot.firma_cliente}
                        alt="Firma"
                        className="h-16 border border-gray-200 rounded-lg bg-white p-1"
                      />
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
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
                        {FLUJO_ESTADOS[FLUJO_ESTADOS.indexOf(ot.estado) + 1] === 'entregado'
                          ? 'Entregar (Firma)'
                          : `Avanzar a ${ESTADOS_OT[FLUJO_ESTADOS[FLUJO_ESTADOS.indexOf(ot.estado) + 1]]?.label}`
                        }
                      </button>
                    )}
                    <button
                      onClick={() => handleEliminarOT(ot.id)}
                      className="text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 hover:bg-red-50 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtradas.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No hay órdenes de trabajo {filtroEstado !== 'Todos' ? `en estado "${ESTADOS_OT[filtroEstado]?.label}"` : ''}.
        </div>
      )}

      {/* Modales */}
      {mostrarForm && (
        <OTForm
          vehiculos={vehiculos}
          onGuardar={handleNuevaOT}
          onCerrar={() => setMostrarForm(false)}
        />
      )}

      {mostrarLote && (
        <EtiquetasLote
          ordenes={ordenes}
          vehiculos={vehiculos}
          onCerrar={() => setMostrarLote(false)}
        />
      )}

      {etiquetaOT && (
        <EtiquetaService
          orden={etiquetaOT}
          vehiculo={getVehiculo(etiquetaOT.vehiculo_id)}
          onClose={() => setEtiquetaOT(null)}
        />
      )}

      {firmaOT && (
        <FirmaDigital
          onConfirmar={handleFirmaConfirmada}
          onCancelar={() => setFirmaOT(null)}
        />
      )}
    </div>
  )
}
