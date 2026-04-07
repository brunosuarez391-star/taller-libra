import React, { useRef, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useReactToPrint } from 'react-to-print'

const LIBRA_DARK = '#1F3864'
const LIBRA_MID = '#2E75B6'

function LogoLibra({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="16" fill={LIBRA_DARK} />
      <path d="M25 75V25h10v40h30v10H25z" fill="white" />
      <path d="M50 25h25v10H60v10h12v10H60v10h15v10H50V25z" fill={LIBRA_MID} />
    </svg>
  )
}

export default function EtiquetaService({ orden, vehiculo, onClose }) {
  const etiquetaRef = useRef(null)
  const [qrDataUrl, setQrDataUrl] = useState('')

  const qrUrl = `https://librapatagonia.com/flota/${vehiculo.codigo}`

  useEffect(() => {
    QRCode.toDataURL(qrUrl, {
      width: 120,
      margin: 1,
      color: { dark: LIBRA_DARK, light: '#FFFFFF' },
    }).then(setQrDataUrl)
  }, [qrUrl])

  const handlePrint = useReactToPrint({
    contentRef: etiquetaRef,
    documentTitle: `Etiqueta-${vehiculo.codigo}-${orden.id}`,
  })

  const fechaFormateada = new Date(orden.fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-y-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-libra-dark">Etiqueta de Service</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="bg-libra-mid text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-libra-dark transition-colors"
            >
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 px-3 py-2 text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Etiqueta - 62mm x 100mm aprox ratio */}
        <div className="p-4">
          <div
            ref={etiquetaRef}
            className="etiqueta-print bg-white border-2 border-libra-dark rounded-lg mx-auto"
            style={{ width: '234px', minHeight: '378px', padding: '12px' }}
          >
            {/* Header con logo */}
            <div className="flex items-center gap-2 mb-2">
              <LogoLibra size={36} />
              <div>
                <div className="text-xs font-bold" style={{ color: LIBRA_DARK }}>
                  LIBRA SERVICIOS
                </div>
                <div className="text-[8px] text-gray-500">INDUSTRIALES</div>
              </div>
            </div>

            <div className="w-full h-px bg-libra-dark mb-2" />

            {/* Datos del vehículo */}
            <div className="space-y-1 mb-2">
              <div className="flex justify-between">
                <span className="text-[9px] text-gray-500 uppercase">Vehículo</span>
                <span className="text-[10px] font-bold" style={{ color: LIBRA_DARK }}>
                  M.B. {vehiculo.modelo} – {vehiculo.codigo}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[9px] text-gray-500 uppercase">Fecha</span>
                <span className="text-[10px] font-semibold">{fechaFormateada}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[9px] text-gray-500 uppercase">Km Actuales</span>
                <span className="text-[10px] font-bold" style={{ color: LIBRA_MID }}>
                  {orden.km_ingreso.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[9px] text-gray-500 uppercase">Próximo Service</span>
                <span className="text-[10px] font-bold" style={{ color: '#16a34a' }}>
                  {orden.km_proximo_service.toLocaleString('es-AR')} km
                </span>
              </div>
            </div>

            <div className="w-full h-px bg-gray-300 mb-2" />

            {/* Servicios realizados */}
            <div className="mb-2">
              <div className="text-[9px] font-bold uppercase mb-1" style={{ color: LIBRA_DARK }}>
                Servicios Realizados
              </div>
              <ul className="space-y-0.5">
                {orden.servicios.map((s, i) => (
                  <li key={i} className="text-[8px] text-gray-700 flex items-start gap-1">
                    <span style={{ color: '#16a34a' }}>✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full h-px bg-gray-300 mb-2" />

            {/* Mecánico y OT */}
            <div className="flex justify-between mb-2">
              <div>
                <div className="text-[9px] text-gray-500 uppercase">Mecánico</div>
                <div className="text-[10px] font-semibold">{orden.mecanico}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-gray-500 uppercase">OT N°</div>
                <div className="text-[10px] font-semibold" style={{ color: LIBRA_MID }}>
                  {orden.id}
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center">
              {qrDataUrl && (
                <img src={qrDataUrl} alt="QR Historial" className="w-24 h-24" />
              )}
              <div className="text-[7px] text-gray-400 mt-1">
                librapatagonia.com/flota/{vehiculo.codigo}
              </div>
            </div>
          </div>
        </div>

        {/* Info formato */}
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-400 text-center">
            Formato: 62mm × 100mm · Compatible con impresora térmica
          </p>
        </div>
      </div>
    </div>
  )
}
