import React, { useRef, useEffect, useState } from 'react'

export default function FirmaDigital({ onConfirmar, onCancelar }) {
  const canvasRef = useRef(null)
  const [dibujando, setDibujando] = useState(false)
  const [hayFirma, setHayFirma] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    ctx.strokeStyle = '#E2E8F0'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const touch = e.touches ? e.touches[0] : e
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
  }

  function iniciar(e) { e.preventDefault(); setDibujando(true); const ctx = canvasRef.current.getContext('2d'); const pos = getPos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y) }
  function dibujar(e) { if (!dibujando) return; e.preventDefault(); const ctx = canvasRef.current.getContext('2d'); const pos = getPos(e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); setHayFirma(true) }
  function finalizar() { setDibujando(false) }
  function limpiar() { const canvas = canvasRef.current; canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height); setHayFirma(false) }
  function confirmar() { if (hayFirma) onConfirmar(canvasRef.current.toDataURL('image/png')) }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text">Firma del Cliente</h2>
          <button onClick={onCancelar} className="text-muted hover:text-text text-lg">×</button>
        </div>
        <div className="p-5">
          <p className="text-xs text-muted mb-3">Firmá para confirmar la recepción del vehículo.</p>
          <div className="border border-border rounded-lg overflow-hidden bg-bg">
            <canvas ref={canvasRef} className="w-full touch-none cursor-crosshair" style={{ height: '180px' }}
              onMouseDown={iniciar} onMouseMove={dibujar} onMouseUp={finalizar} onMouseLeave={finalizar}
              onTouchStart={iniciar} onTouchMove={dibujar} onTouchEnd={finalizar} />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={limpiar} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm text-muted hover:text-text transition-colors">Limpiar</button>
            <button onClick={onCancelar} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm text-muted hover:text-text transition-colors">Cancelar</button>
            <button onClick={confirmar} disabled={!hayFirma}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${hayFirma ? 'bg-libra-mid text-white hover:bg-libra-dark' : 'bg-muted/20 text-muted/50 cursor-not-allowed'}`}>
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
