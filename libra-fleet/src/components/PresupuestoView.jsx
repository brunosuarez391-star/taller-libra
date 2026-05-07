import { useState } from 'react'
import { EMPRESA } from '../lib/data'
import { exportarPresupuestoPDF } from '../lib/presupuestoPDF'

export default function PresupuestoView({ presupuesto, onReset, onGuardar }) {
  const [guardando, setGuardando] = useState(false)
  const [guardadoExito, setGuardadoExito] = useState(false)

  const formatARS = (n) => '$' + (n || 0).toLocaleString('es-AR')

  const handleGuardar = async () => {
    if (!onGuardar || guardando || presupuesto.guardado) return
    setGuardando(true)
    try {
      await onGuardar()
      setGuardadoExito(true)
    } catch {
      // error ya mostrado por el parent
    } finally {
      setGuardando(false)
    }
  }

  const enModoEdicion = !!presupuesto.modoEdicion
  // En modo edición, "yaGuardado" sólo aplica DESPUÉS de aplicar los cambios.
  // Antes de hacerlo, mostramos "Actualizar cambios" aunque exista en DB.
  const yaGuardado = enModoEdicion ? guardadoExito : (presupuesto.guardado || guardadoExito)

  const exportarPDF = () => exportarPresupuestoPDF(presupuesto)

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-[#1F3864] dark:text-blue-300">Presupuesto {presupuesto.numero}</h2>
        <div className="flex gap-2 flex-wrap">
          {onGuardar && (
            <button
              onClick={handleGuardar}
              disabled={guardando || yaGuardado}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                yaGuardado
                  ? 'bg-green-600 text-white cursor-default'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              } disabled:opacity-70`}
            >
              {guardando
                ? (enModoEdicion ? '⏳ Actualizando...' : '⏳ Guardando...')
                : yaGuardado
                ? (enModoEdicion ? '✓ Cambios aplicados' : '✓ Guardado en el sistema')
                : (enModoEdicion ? '💾 Aplicar cambios' : '💾 Guardar en el sistema')}
            </button>
          )}
          <button onClick={exportarPDF} className="bg-[#1F3864] hover:bg-[#2E75B6] text-white px-4 py-2 rounded-lg font-bold text-sm">
            📄 Descargar PDF
          </button>
          <button onClick={() => window.print()} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-bold text-sm">
            🖨️ Imprimir
          </button>
          {presupuesto.clienteTel && (
            <a
              href={`https://wa.me/${presupuesto.clienteTel.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `*${EMPRESA.nombre}*\n` +
                `Presupuesto: ${presupuesto.numero}\n` +
                `Fecha: ${presupuesto.fecha}\n` +
                (presupuesto.vehiculo ? `Vehículo: ${presupuesto.vehiculo}\n` : '') +
                `\n*Detalle:*\n` +
                presupuesto.items.map(it => `• ${it.descripcion} x${it.cantidad} — ${formatARS(it.cantidad * it.precio)}`).join('\n') +
                `\n\nSubtotal: ${formatARS(presupuesto.subtotal)}\nIVA 21%: ${formatARS(presupuesto.iva)}\n*Total: ${formatARS(presupuesto.total)}*` +
                `\n\n📍 ${EMPRESA.direccion}, ${EMPRESA.ciudad}\n📞 ${EMPRESA.tel}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm"
            >
              📲 WhatsApp
            </a>
          )}
          <button onClick={onReset} className="bg-[#2E75B6] hover:bg-[#1F3864] text-white px-4 py-2 rounded-lg font-bold text-sm">
            ➕ Nuevo
          </button>
        </div>
      </div>

      {yaGuardado && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm">
          ✓ Presupuesto guardado correctamente. Ya aparece en el listado y se
          contabilizará a fin de mes en Facturación cuando lo marques como
          <strong> aprobado</strong>.
        </div>
      )}

      {/* Header del presupuesto */}
      <div className="bg-[#1F3864] text-white rounded-t-xl p-5">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div>
            <h3 className="text-xl font-bold">{EMPRESA.nombre.toUpperCase()}</h3>
            <p className="text-blue-200 text-sm">{EMPRESA.direccion}</p>
            <p className="text-blue-200 text-sm">{EMPRESA.ciudad}</p>
            <p className="text-blue-200 text-sm">CUIT: {EMPRESA.cuit} · Tel: {EMPRESA.tel}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">PRESUPUESTO</p>
            <p className="text-blue-200">{presupuesto.numero}</p>
            <p className="text-blue-200 text-sm">{presupuesto.fecha}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#2E75B6] text-white px-5 py-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
        <div><strong>Cliente:</strong> {presupuesto.cliente}</div>
        <div><strong>Tipo:</strong> {presupuesto.tipoLabel}</div>
        {presupuesto.vehiculo && <div><strong>Vehículo:</strong> {presupuesto.vehiculo}</div>}
      </div>

      {/* Tabla items */}
      <div className="bg-white dark:bg-slate-800 shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#D6E4F0] dark:bg-slate-700 text-[#1F3864] dark:text-blue-200">
              <th className="px-4 py-3 text-left">Descripción</th>
              <th className="px-4 py-3 text-center w-20">Cant.</th>
              <th className="px-4 py-3 text-right w-32">Precio unit.</th>
              <th className="px-4 py-3 text-right w-32">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {presupuesto.items.map((it, i) => (
              <tr key={i} className="border-b border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                <td className="px-4 py-2">{it.descripcion}</td>
                <td className="px-4 py-2 text-center">{it.cantidad}</td>
                <td className="px-4 py-2 text-right font-mono">{formatARS(it.precio)}</td>
                <td className="px-4 py-2 text-right font-mono font-bold">{formatARS(it.cantidad * it.precio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totales */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-b-xl p-5">
        <div className="flex justify-end">
          <div className="w-72">
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Subtotal s/IVA:</span>
              <span className="font-mono">{formatARS(presupuesto.subtotal)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">IVA 21%:</span>
              <span className="font-mono">{formatARS(presupuesto.iva)}</span>
            </div>
            <div className="flex justify-between py-2 text-xl font-bold text-[#1F3864] dark:text-blue-300">
              <span>TOTAL c/IVA:</span>
              <span className="font-mono">{formatARS(presupuesto.total)}</span>
            </div>
          </div>
        </div>

        {presupuesto.observaciones && (
          <div className="mt-4 bg-[#D6E4F0] dark:bg-slate-900 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300">
            <p className="font-bold mb-1">Observaciones:</p>
            <p className="whitespace-pre-line">{presupuesto.observaciones}</p>
          </div>
        )}

        <div className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          <p>Condición de pago: 30 días · Validez: 15 días desde la fecha de emisión</p>
        </div>
      </div>
    </div>
  )
}
