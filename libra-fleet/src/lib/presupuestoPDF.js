// ============================================================
// Generador de PDF de presupuesto — usado tanto desde la creación
// (PresupuestoView) como desde la lista de presupuestos guardados
// (Presupuestos.jsx). Acepta el shape de la DB (con items_presupuesto)
// o el shape de borrador (con items[]).
// ============================================================
import { jsPDF } from 'jspdf'
import { EMPRESA } from './data'

const formatARS = (n) => '$' + Number(n || 0).toLocaleString('es-AR')

/**
 * Normaliza un presupuesto a un shape consistente para imprimir.
 *
 * @param {object} p — puede ser:
 *   - Borrador: { numero, cliente, vehiculo, tipoLabel, items[], subtotal, iva, total, observaciones, fecha }
 *   - DB:      { numero, clientes:{nombre}, items_presupuesto[], subtotal_siva, iva, total_civa, fecha, created_at, observaciones, vehiculo_label? }
 */
function normalizar(p) {
  // Detectar shape DB vs borrador
  const esDB = !!p.items_presupuesto || p.subtotal_siva != null

  const items = esDB
    ? (p.items_presupuesto || []).map(it => ({
        descripcion: it.descripcion,
        cantidad: it.cantidad ?? 1,
        precio: Number(it.precio_unit ?? it.precio ?? (it.total / (it.cantidad || 1)) ?? 0),
        total: Number(it.total ?? (it.cantidad || 1) * (it.precio_unit || 0)),
      }))
    : (p.items || []).map(it => ({
        descripcion: it.descripcion,
        cantidad: it.cantidad ?? 1,
        precio: Number(it.precio || 0),
        total: Number(it.cantidad || 1) * Number(it.precio || 0),
      }))

  const subtotal = esDB ? Number(p.subtotal_siva || 0) : Number(p.subtotal || 0)
  const iva = Number(p.iva || 0)
  const total = esDB ? Number(p.total_civa || 0) : Number(p.total || 0)
  const fecha = esDB
    ? new Date(p.fecha || p.created_at || Date.now()).toLocaleDateString('es-AR')
    : (p.fecha || new Date().toLocaleDateString('es-AR'))

  return {
    numero: p.numero || '',
    cliente: p.clientes?.nombre || p.cliente || '—',
    cliente_cuit: p.clientes?.cuit || p.cliente_obj?.cuit || '',
    vehiculo: p.vehiculo_label || p.vehiculo || '',
    tipoLabel: p.tipoLabel || (p.tipo === 'reparacion' ? 'Reparación / Trabajo personalizado' : 'Service preventivo'),
    items,
    subtotal,
    iva,
    total,
    observaciones: p.observaciones || '',
    fecha,
    remito_numero: p.remito_numero || '',
    remito_fecha: p.remito_fecha || '',
    estado: p.estado || '',
  }
}

/**
 * Descarga el PDF del presupuesto.
 */
export function exportarPresupuestoPDF(presupuesto) {
  const p = normalizar(presupuesto)
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
  doc.text(p.numero, W - 10, 18, { align: 'right' })
  doc.text(p.fecha, W - 10, 23, { align: 'right' })
  if (p.estado) {
    doc.setFontSize(8)
    doc.text(`Estado: ${p.estado.toUpperCase()}`, W - 10, 27, { align: 'right' })
  }

  y = 38
  doc.setTextColor(0, 0, 0)

  // Cliente + Vehículo + Remito
  const altoBox = (p.vehiculo ? 18 : 12) + (p.remito_numero ? 6 : 0)
  doc.setFillColor(214, 228, 240)
  doc.rect(10, y, W - 20, altoBox, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 56, 100)
  doc.text('CLIENTE:', 12, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(p.cliente.substring(0, 50), 32, y + 6)
  if (p.cliente_cuit) {
    doc.setFontSize(7)
    doc.text(`CUIT: ${p.cliente_cuit}`, 90, y + 6)
    doc.setFontSize(9)
  }

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 56, 100)
  doc.text('TIPO:', 12, y + 12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(p.tipoLabel, 32, y + 12)

  if (p.vehiculo) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(31, 56, 100)
    doc.text('VEHÍCULO:', 110, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(String(p.vehiculo).substring(0, 50), 132, y + 6)
  }
  if (p.remito_numero) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(31, 56, 100)
    doc.text('REMITO:', 12, y + 18)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`${p.remito_numero}${p.remito_fecha ? ' · ' + new Date(p.remito_fecha).toLocaleDateString('es-AR') : ''}`, 32, y + 18)
  }
  y += altoBox + 6

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

  p.items.forEach((it, i) => {
    if (y > 245) { doc.addPage(); y = 15 }
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(10, y - 2, W - 20, 7, 'F')
    }
    const desc = it.descripcion?.length > 65 ? it.descripcion.substring(0, 62) + '...' : (it.descripcion || '')
    doc.text(desc, 12, y + 3)
    doc.text(String(it.cantidad), 130, y + 3, { align: 'center' })
    doc.text(formatARS(it.precio), 165, y + 3, { align: 'right' })
    doc.text(formatARS(it.total), 198, y + 3, { align: 'right' })
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
  doc.text(formatARS(p.subtotal), W - 10, y, { align: 'right' })
  y += 5
  doc.text('IVA 21%:', 130, y)
  doc.text(formatARS(p.iva), W - 10, y, { align: 'right' })
  y += 4
  doc.line(120, y, W - 10, y)
  y += 6
  doc.setFillColor(31, 56, 100)
  doc.rect(120, y - 5, W - 130, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL c/IVA:', 125, y + 2)
  doc.text(formatARS(p.total), W - 12, y + 2, { align: 'right' })
  y += 14

  // Observaciones
  if (p.observaciones) {
    if (y > 250) { doc.addPage(); y = 15 }
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Observaciones:', 12, y)
    y += 4
    doc.setFont('helvetica', 'normal')
    const lineas = doc.splitTextToSize(p.observaciones, W - 25)
    lineas.forEach(l => {
      if (y > 280) { doc.addPage(); y = 15 }
      doc.text(l, 12, y)
      y += 4
    })
    y += 3
  }

  // Footer condiciones
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setTextColor(120, 120, 120)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'italic')
    doc.text('Condición de pago: 30 días · Validez del presupuesto: 15 días', 10, 285)
    doc.text(`${EMPRESA.nombre} · ${EMPRESA.web} · Página ${i}/${pages}`, W / 2, 290, { align: 'center' })
  }

  doc.save(`presupuesto-${p.numero || 'sin-numero'}.pdf`)
}

/**
 * Construye el texto de WhatsApp para un presupuesto.
 */
export function whatsappTextoPresupuesto(presupuesto, telefono) {
  const p = normalizar(presupuesto)
  const detalle = p.items.map(it => `• ${it.descripcion} — ${it.cantidad} × ${formatARS(it.precio)} = ${formatARS(it.total)}`).join('\n')
  const texto =
    `*${EMPRESA.nombre}*\n` +
    `Presupuesto ${p.numero}\n` +
    `Fecha: ${p.fecha}\n` +
    `Cliente: ${p.cliente}\n` +
    (p.vehiculo ? `Vehículo: ${p.vehiculo}\n` : '') +
    `\n*Detalle:*\n${detalle}\n` +
    `\nSubtotal s/IVA: ${formatARS(p.subtotal)}\n` +
    `IVA 21%: ${formatARS(p.iva)}\n` +
    `*Total c/IVA: ${formatARS(p.total)}*\n` +
    `\nValidez: 15 días · Pago: 30 días\n` +
    `📞 ${EMPRESA.tel}`
  const num = String(telefono || '').replace(/[^0-9]/g, '')
  return num
    ? `https://wa.me/${num}?text=${encodeURIComponent(texto)}`
    : null
}
