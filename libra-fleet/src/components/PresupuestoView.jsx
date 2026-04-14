import { useState } from 'react'
import { jsPDF } from 'jspdf'
import { EMPRESA } from '../lib/data'

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

  const yaGuardado = presupuesto.guardado || guardadoExito

  const exportarPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const W = 210
    let y = 15

    // Header
    doc.setFillColor(31, 56, 100)
    doc.rect(0, 0, W, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('LIBRA SERVICIOS INDUSTRIALES', 10, 12)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(EMPRESA.direccion, 10, 18)
    doc.text(`${EMPRESA.ciudad} · CUIT: ${EMPRESA.cuit}`, 10, 22)
    doc.text(`Tel: ${EMPRESA.tel} · ${EMPRESA.email}`, 10, 26)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('PRESUPUESTO', W - 10, 12, { align: 'right' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(presupuesto.numero, W - 10, 18, { align: 'right' })
    doc.text(presupuesto.fecha, W - 10, 23, { align: 'right' })

    y = 38
    doc.setTextColor(0, 0, 0)

    // Cliente + Vehículo
    doc.setFillColor(214, 228, 240)
    doc.rect(10, y, W - 20, 18, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(31, 56, 100)
    doc.text('CLIENTE:', 12, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(presupuesto.cliente || '-', 32, y + 6)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(31, 56, 100)
    doc.text('TIPO:', 12, y + 12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(presupuesto.tipoLabel, 32, y + 12)

    if (presupuesto.vehiculo) {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(31, 56, 100)
      doc.text('VEHÍCULO:', 110, y + 6)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text(presupuesto.vehiculo.substring(0, 50), 132, y + 6)
    }
    y += 24

    // Tabla items
    doc.setFillColor(31, 56, 100)
    doc.rect(10, y, W - 20, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('DESCRIPCIÓN', 12, y + 5.5)
    doc.text('CANT.', 130, y + 5.5, { align: 'center' })
    doc.text('PRECIO U.', 165, y + 5.5, { align: 'right' })
    doc.text('SUBTOTAL', 198, y + 5.5, { align: 'right' })
    y += 9

    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)

    presupuesto.items.forEach((it, i) => {
      if (y > 245) { doc.addPage(); y = 15 }
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252)
        doc.rect(10, y - 2, W - 20, 7, 'F')
      }
      const desc = it.descripcion.length > 65 ? it.descripcion.substring(0, 62) + '...' : it.descripcion
      doc.text(desc, 12, y + 3)
      doc.text(String(it.cantidad), 130, y + 3, { align: 'center' })
      doc.text(formatARS(it.precio), 165, y + 3, { align: 'right' })
      doc.text(formatARS(it.cantidad * it.precio), 198, y + 3, { align: 'right' })
      y += 7
    })

    y += 5

    // Totales
    doc.setDrawColor(31, 56, 100)
    doc.setLineWidth(0.4)
    doc.line(120, y, W - 10, y)
    y += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Subtotal s/IVA:', 130, y)
    doc.text(formatARS(presupuesto.subtotal), W - 10, y, { align: 'right' })
    y += 5
    doc.text('IVA 21%:', 130, y)
    doc.text(formatARS(presupuesto.iva), W - 10, y, { align: 'right' })
    y += 4
    doc.line(120, y, W - 10, y)
    y += 6
    doc.setFillColor(31, 56, 100)
    doc.rect(120, y - 5, W - 130, 10, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL c/IVA:', 125, y + 2)
    doc.text(formatARS(presupuesto.total), W - 12, y + 2, { align: 'right' })
    y += 14

    // Observaciones
    if (presupuesto.observaciones) {
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text('Observaciones:', 12, y)
      y += 4
      doc.setFont('helvetica', 'normal')
      const lineas = doc.splitTextToSize(presupuesto.observaciones, W - 25)
      lineas.forEach(l => {
        if (y > 280) { doc.addPage(); y = 15 }
        doc.text(l, 12, y)
        y += 4
      })
      y += 3
    }

    // Footer condiciones
    doc.setTextColor(120, 120, 120)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'italic')
    doc.text('Condición de pago: 30 días · Validez del presupuesto: 15 días', 10, 285)
    doc.text(`${EMPRESA.nombre} · ${EMPRESA.web}`, W / 2, 290, { align: 'center' })

    doc.save(`presupuesto-${presupuesto.numero}.pdf`)
  }

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
                ? '⏳ Guardando...'
                : yaGuardado
                ? '✓ Guardado en el sistema'
                : '💾 Guardar en el sistema'}
            </button>
          )}
          <button onClick={exportarPDF} className="bg-[#1F3864] hover:bg-[#2E75B6] text-white px-4 py-2 rounded-lg font-bold text-sm">
            📄 Descargar PDF
          </button>
          <button onClick={() => window.print()} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-bold text-sm">
            🖨️ Imprimir
          </button>
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
