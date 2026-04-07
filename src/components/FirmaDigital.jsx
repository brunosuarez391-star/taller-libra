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
    ctx.strokeStyle = '#1F3864'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  function getPos(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches ? e.touches[0] : e
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    }
  }

  function iniciar(e) {
    e.preventDefault()
    setDibujando(true)
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  function dibujar(e) {
    if (!dibujando) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHayFirma(true)
  }

  function finalizar() {
    setDibujando(false)
  }

  function limpiar() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHayFirma(false)
  }

  function confirmar() {
    if (!hayFirma) return
    const dataUrl = canvasRef.current.toDataURL('image/png')
    onConfirmar(dataUrl)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-libra-dark">Firma del Cliente</h2>
          <button onClick={onCancelar} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <div className="p-4">
          <p className="text-xs text-gray-500 mb-3">
            Firmá con el dedo o mouse en el recuadro de abajo para confirmar la recepción del vehículo.
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50">
            <canvas
              ref={canvasRef}
              className="w-full touch-none cursor-crosshair"
              style={{ height: '200px' }}
              onMouseDown={iniciar}
              onMouseMove={dibujar}
              onMouseUp={finalizar}
              onMouseLeave={finalizar}
              onTouchStart={iniciar}
              onTouchMove={dibujar}
              onTouchEnd={finalizar}
            />
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={limpiar}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={onCancelar}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmar}
              disabled={!hayFirma}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                hayFirma
                  ? 'bg-libra-mid text-white hover:bg-libra-dark'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
