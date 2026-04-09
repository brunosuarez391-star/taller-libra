import { QRCodeSVG } from 'qrcode.react'
import { EMPRESA } from '../lib/data'

export default function EtiquetaService({ ot }) {
  const qrUrl = `https://${EMPRESA.web}/flota/${ot.codigo}`

  return (
    <div className="print-area w-[62mm] h-[100mm] bg-white border border-slate-300 p-3 text-[10px] font-mono flex flex-col" style={{ fontFamily: 'Courier New, monospace' }}>
      {/* Logo */}
      <div className="bg-[#1F3864] text-white text-center py-1.5 -mx-3 -mt-3 mb-2">
        <p className="font-bold text-[12px] tracking-wider">LIBRA SERVICIOS</p>
        <p className="text-[7px] text-blue-200">INDUSTRIALES</p>
      </div>

      {/* Datos vehículo */}
      <div className="border-b border-dashed border-slate-300 pb-1.5 mb-1.5">
        <p className="font-bold text-[11px]">{ot.modelo} — {ot.codigo}</p>
        {ot.patente && <p className="font-bold text-[11px] text-[#2E75B6]">PAT: {ot.patente}</p>}
        <p>CLIENTE: {ot.cliente}</p>
      </div>

      {/* Datos service */}
      <div className="border-b border-dashed border-slate-300 pb-1.5 mb-1.5">
        <div className="flex justify-between">
          <span>FECHA:</span>
          <span className="font-bold">{ot.fecha}</span>
        </div>
        <div className="flex justify-between">
          <span>KM:</span>
          <span className="font-bold">{ot.km?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-[#2E75B6] font-bold">
          <span>PROXIMO:</span>
          <span>{ot.proximo_km?.toLocaleString()} km</span>
        </div>
      </div>

      {/* Servicios */}
      <div className="border-b border-dashed border-slate-300 pb-1.5 mb-1.5 flex-1">
        <p className="font-bold mb-0.5">SERVICIOS:</p>
        {(ot.items || []).slice(0, 5).map((item, i) => (
          <p key={i} className="text-[8px]">✓ {item}</p>
        ))}
      </div>

      {/* Mecánico + OT */}
      <div className="border-b border-dashed border-slate-300 pb-1.5 mb-1.5">
        <div className="flex justify-between">
          <span>MECANICO:</span>
          <span className="font-bold">{ot.mecanico}</span>
        </div>
        <div className="flex justify-between">
          <span>OT N°:</span>
          <span className="font-bold">{ot.ot_numero}</span>
        </div>
      </div>

      {/* QR */}
      <div className="flex flex-col items-center mt-auto">
        <QRCodeSVG value={qrUrl} size={60} level="M" />
        <p className="text-[7px] text-slate-400 mt-0.5">{EMPRESA.web}/flota/{ot.codigo}</p>
      </div>
    </div>
  )
}
