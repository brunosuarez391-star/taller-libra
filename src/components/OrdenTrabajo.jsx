import React, { useState } from 'react'
import EtiquetaService from './EtiquetaService'
import EtiquetasLote from './EtiquetasLote'
import OTForm from './OTForm'
import FirmaDigital from './FirmaDigital'

const ESTADOS_OT = {
  ingresado: { label: 'Ingresado', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  en_proceso: { label: 'En proceso', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  finalizado: { label: 'Finalizado', cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
  entregado: { label: 'Entregado', cls: 'bg-muted/10 text-muted border-border' },
}

const FLUJO_ESTADOS = ['ingresado', 'en_proceso', 'finalizado', 'entregado']

export default function OrdenTrabajo({ ordenes, setOrdenes, vehiculos, onToast }) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [mostrarLote, setMostrarLote] = useState(false)
  const [etiquetaOT, setEtiquetaOT] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [firmaOT, setFirmaOT] = useState(null)

  function getVehiculo(vehiculoId) {
    return vehiculos.find(v => v.id === vehiculoId) || vehiculos.find(v => v.codigo === vehiculoId)
  }

  function avanzarEstado(ot) {
    const idx = FLUJO_ESTADOS.indexOf(ot.estado)
    if (idx < FLUJO_ESTADOS.length - 1) {
      if (FLUJO_ESTADOS[idx + 1] === 'entregado') {
        setFirmaOT(ot)
        return
      }
      const nuevoEstado = FLUJO_ESTADOS[idx + 1]
      setOrdenes(prev => prev.map(o => o.id === ot.id ? { ...o, estado: nuevoEstado } : o))
      onToast?.(`${ot.id} → ${ESTADOS_OT[nuevoEstado].label}`, 'exito')
    }
  }

  function handleFirmaConfirmada(firmaBase64) {
    if (!firmaOT) return
    setOrdenes(prev => prev.map(o =>
      o.id === firmaOT.id ? { ...o, estado: 'entregado', firma_cliente: firmaBase64 } : o
    ))
    onToast?.(`${firmaOT.id} entregado con firma`, 'exito')
    setFirmaOT(null)
  }

  function handleNuevaOT(ot) {
    setOrdenes(prev => [...prev, ot])
    setMostrarForm(false)
    onToast?.(`Orden ${ot.id} creada`, 'exito')
  }

  function handleEliminarOT(id) {
    if (confirm('¿Eliminar esta orden de trabajo?')) {
      setOrdenes(prev => prev.filter(o => o.id !== id))
      onToast?.(`${id} eliminada`, 'info')
    }
  }

  const filtradas = ordenes
    .filter(o => filtroEstado === 'Todos' || o.estado === filtroEstado)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">Servicios</h1>
        <div className="flex gap-2">
          <button onClick={() => setMostrarLote(true)}
            className="border border-border text-muted px-4 py-2 rounded-lg text-sm font-medium hover:text-text hover:bg-card transition-colors">
            Etiquetas lote
          </button>
          <button onClick={() => setMostrarForm(true)}
            className="bg-libra-mid text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-libra-dark transition-colors">
            + Nueva OT
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Object.entries(ESTADOS_OT).map(([key, val]) => {
          const count = ordenes.filter(o => o.estado === key).length
          return (
            <div key={key} className="bg-card border border-border rounded-xl p-4">
              <div className="text-2xl font-bold text-text">{count}</div>
              <div className="text-xs text-muted">{val.label}</div>
            </div>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="flex gap-1 bg-card border border-border rounded-lg p-1 mb-5 w-fit">
        {['Todos', ...Object.keys(ESTADOS_OT)].map(key => {
          const label = key === 'Todos' ? 'Todas' : ESTADOS_OT[key].label
          return (
            <button
              key={key}
              onClick={() => setFiltroEstado(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filtroEstado === key ? 'bg-libra-dark text-white' : 'text-muted hover:text-text'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Tabla de OTs */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">OT N°</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Vehículo</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Fecha</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Km</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Mecánico</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Estado</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map(ot => {
              const vehiculo = getVehiculo(ot.vehiculo_id)
              const est = ESTADOS_OT[ot.estado] || ESTADOS_OT.ingresado
              const puedAvanzar = FLUJO_ESTADOS.indexOf(ot.estado) < FLUJO_ESTADOS.length - 1
              const puedeImprimir = ot.estado === 'finalizado' || ot.estado === 'entregado'

              return (
                <tr key={ot.id} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-semibold text-libra-light">{ot.id}</td>
                  <td className="px-5 py-3.5 text-sm text-text">
                    {vehiculo ? `${vehiculo.codigo} – ${vehiculo.modelo}` : ot.vehiculo_id}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted">
                    {new Date(ot.fecha).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted">
                    {ot.km_ingreso.toLocaleString('es-AR')}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted">{ot.mecanico}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold border ${est.cls}`}>
                      {est.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-2">
                    {puedeImprimir && vehiculo && (
                      <button onClick={() => setEtiquetaOT(ot)}
                        className="text-xs text-libra-mid hover:text-libra-light font-medium">
                        Etiqueta
                      </button>
                    )}
                    {puedAvanzar && (
                      <button onClick={() => avanzarEstado(ot)}
                        className="text-xs text-green-400 hover:text-green-300 font-medium">
                        {FLUJO_ESTADOS[FLUJO_ESTADOS.indexOf(ot.estado) + 1] === 'entregado' ? 'Entregar' : 'Avanzar'}
                      </button>
                    )}
                    <button onClick={() => handleEliminarOT(ot.id)}
                      className="text-xs text-red-400/60 hover:text-red-400 font-medium">
                      Eliminar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtradas.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">
            No hay órdenes de trabajo.
          </div>
        )}
      </div>

      {mostrarForm && <OTForm vehiculos={vehiculos} onGuardar={handleNuevaOT} onCerrar={() => setMostrarForm(false)} />}
      {mostrarLote && <EtiquetasLote ordenes={ordenes} vehiculos={vehiculos} onCerrar={() => setMostrarLote(false)} />}
      {etiquetaOT && <EtiquetaService orden={etiquetaOT} vehiculo={getVehiculo(etiquetaOT.vehiculo_id)} onClose={() => setEtiquetaOT(null)} />}
      {firmaOT && <FirmaDigital onConfirmar={handleFirmaConfirmada} onCancelar={() => setFirmaOT(null)} />}
    </div>
  )
}
