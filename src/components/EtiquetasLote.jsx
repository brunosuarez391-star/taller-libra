import React, { useRef, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useReactToPrint } from 'react-to-print'

const LIBRA_DARK = '#1F3864'
const LIBRA_MID = '#2E75B6'

function EtiquetaMini({ orden, vehiculo, qrDataUrl }) {
  const fechaFormateada = new Date(orden.fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <div
      className="bg-white border-2 border-libra-dark rounded-lg"
      style={{ width: '234px', minHeight: '378px', padding: '12px', pageBreakAfter: 'always' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
          <rect width="100" height="100" rx="16" fill={LIBRA_DARK} />
          <path d="M25 75V25h10v40h30v10H25z" fill="white" />
          <path d="M50 25h25v10H60v10h12v10H60v10h15v10H50V25z" fill={LIBRA_MID} />
        </svg>
        <div>
          <div className="text-[9px] font-bold" style={{ color: LIBRA_DARK }}>LIBRA SERVICIOS</div>
          <div className="text-[7px] text-gray-500">INDUSTRIALES</div>
        </div>
      </div>

      <div className="w-full h-px bg-libra-dark mb-2" />

      <div className="space-y-1 mb-2">
        <div className="flex justify-between">
          <span className="text-[8px] text-gray-500 uppercase">Vehículo</span>
          <span className="text-[9px] font-bold" style={{ color: LIBRA_DARK }}>
            M.B. {vehiculo.modelo} – {vehiculo.codigo}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[8px] text-gray-500 uppercase">Fecha</span>
          <span className="text-[9px] font-semibold">{fechaFormateada}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[8px] text-gray-500 uppercase">Km Actuales</span>
          <span className="text-[9px] font-bold" style={{ color: LIBRA_MID }}>
            {orden.km_ingreso.toLocaleString('es-AR')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[8px] text-gray-500 uppercase">Próximo Service</span>
          <span className="text-[9px] font-bold" style={{ color: '#16a34a' }}>
            {orden.km_proximo_service.toLocaleString('es-AR')} km
          </span>
        </div>
      </div>

      <div className="w-full h-px bg-gray-300 mb-2" />

      <div className="mb-2">
        <div className="text-[8px] font-bold uppercase mb-1" style={{ color: LIBRA_DARK }}>
          Servicios Realizados
        </div>
        <ul className="space-y-0.5">
          {orden.servicios.map((s, i) => (
            <li key={i} className="text-[7px] text-gray-700 flex items-start gap-1">
              <span style={{ color: '#16a34a' }}>✓</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="w-full h-px bg-gray-300 mb-2" />

      <div className="flex justify-between mb-2">
        <div>
          <div className="text-[8px] text-gray-500 uppercase">Mecánico</div>
          <div className="text-[9px] font-semibold">{orden.mecanico}</div>
        </div>
        <div className="text-right">
          <div className="text-[8px] text-gray-500 uppercase">OT N°</div>
          <div className="text-[9px] font-semibold" style={{ color: LIBRA_MID }}>{orden.id}</div>
        </div>
      </div>

      <div className="flex flex-col items-center">
        {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-20 h-20" />}
        <div className="text-[6px] text-gray-400 mt-1">
          librapatagonia.com/flota/{vehiculo.codigo}
        </div>
      </div>
    </div>
  )
}

export default function EtiquetasLote({ ordenes, vehiculos, onCerrar }) {
  const printRef = useRef(null)
  const [qrMap, setQrMap] = useState({})
  const [seleccionadas, setSeleccionadas] = useState(new Set(ordenes.map(o => o.id)))

  // OTs imprimibles (finalizadas/entregadas)
  const otImprimibles = ordenes.filter(
    o => o.estado === 'finalizado' || o.estado === 'entregado'
  )

  useEffect(() => {
    async function generarQRs() {
      const map = {}
      for (const ot of otImprimibles) {
        const v = vehiculos.find(v => v.id === ot.vehiculo_id || v.codigo === ot.vehiculo_id)
        if (v) {
          map[ot.id] = await QRCode.toDataURL(`https://librapatagonia.com/flota/${v.codigo}`, {
            width: 100,
            margin: 1,
            color: { dark: LIBRA_DARK, light: '#FFFFFF' },
          })
        }
      }
      setQrMap(map)
    }
    generarQRs()
  }, [otImprimibles.length])

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Etiquetas-Lote-${new Date().toISOString().split('T')[0]}`,
  })

  function toggleSeleccion(id) {
    setSeleccionadas(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleTodas() {
    if (seleccionadas.size === otImprimibles.length) {
      setSeleccionadas(new Set())
    } else {
      setSeleccionadas(new Set(otImprimibles.map(o => o.id)))
    }
  }

  const otParaImprimir = otImprimibles.filter(o => seleccionadas.has(o.id))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-libra-dark">Impresión en Lote</h2>
            <p className="text-xs text-gray-500">{otParaImprimir.length} etiquetas seleccionadas</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              disabled={otParaImprimir.length === 0}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                otParaImprimir.length > 0
                  ? 'bg-libra-mid text-white hover:bg-libra-dark'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Imprimir {otParaImprimir.length > 0 ? `(${otParaImprimir.length})` : ''}
            </button>
            <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 px-3 py-2 text-lg">✕</button>
          </div>
        </div>

        {/* Selección */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500">Seleccioná las OTs a imprimir:</span>
            <button onClick={toggleTodas} className="text-xs text-libra-mid font-semibold hover:text-libra-dark">
              {seleccionadas.size === otImprimibles.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {otImprimibles.map(ot => {
              const v = vehiculos.find(v => v.id === ot.vehiculo_id || v.codigo === ot.vehiculo_id)
              return (
                <label
                  key={ot.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    seleccionadas.has(ot.id)
                      ? 'border-libra-mid bg-libra-mid/5'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={seleccionadas.has(ot.id)}
                    onChange={() => toggleSeleccion(ot.id)}
                    className="accent-libra-mid"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-libra-dark">{ot.id}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {v ? `${v.codigo} – M.B. ${v.modelo}` : ot.vehiculo_id}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {new Date(ot.fecha).toLocaleDateString('es-AR')}
                  </span>
                </label>
              )
            })}
          </div>
          {otImprimibles.length === 0 && (
            <div className="text-center py-6 text-gray-400 text-sm">
              No hay OTs finalizadas para imprimir.
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="p-4">
          <div ref={printRef} className="etiqueta-print flex flex-wrap gap-4 justify-center">
            {otParaImprimir.map(ot => {
              const v = vehiculos.find(v => v.id === ot.vehiculo_id || v.codigo === ot.vehiculo_id)
              if (!v) return null
              return (
                <EtiquetaMini
                  key={ot.id}
                  orden={ot}
                  vehiculo={v}
                  qrDataUrl={qrMap[ot.id] || ''}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
