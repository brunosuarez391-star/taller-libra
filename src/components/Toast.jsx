import React, { useEffect } from 'react'

const TIPOS = {
  exito: { bg: 'bg-green-500/10 border-green-500/20', text: 'text-green-400' },
  error: { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400' },
  info: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400' },
  aviso: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400' },
}

function ToastItem({ toast, onRemove }) {
  const estilo = TIPOS[toast.tipo] || TIPOS.info
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duracion || 3000)
    return () => clearTimeout(timer)
  }, [toast.id])

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${estilo.bg} animate-slide-in`}>
      <span className={`text-sm font-medium ${estilo.text}`}>{toast.mensaje}</span>
      <button onClick={() => onRemove(toast.id)} className="ml-auto text-muted hover:text-text text-xs">×</button>
    </div>
  )
}

export default function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
      {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={onRemove} />)}
    </div>
  )
}

let toastId = 0
export function crearToast(mensaje, tipo = 'info', duracion = 3000) {
  return { id: ++toastId, mensaje, tipo, duracion }
}
