import React, { useEffect } from 'react'

const TIPOS = {
  exito: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon: '✅' },
  error: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: '❌' },
  info: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: 'ℹ️' },
  aviso: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: '⚠️' },
}

function ToastItem({ toast, onRemove }) {
  const estilo = TIPOS[toast.tipo] || TIPOS.info

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duracion || 3000)
    return () => clearTimeout(timer)
  }, [toast.id])

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${estilo.bg} animate-slide-in`}>
      <span className="text-lg">{estilo.icon}</span>
      <span className={`text-sm font-medium ${estilo.text}`}>{toast.mensaje}</span>
      <button onClick={() => onRemove(toast.id)} className="ml-auto text-gray-400 hover:text-gray-600">✕</button>
    </div>
  )
}

export default function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  )
}

// Helper para crear toasts
let toastId = 0
export function crearToast(mensaje, tipo = 'info', duracion = 3000) {
  return { id: ++toastId, mensaje, tipo, duracion }
}
