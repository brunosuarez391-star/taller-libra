// ============================================================
// Generador de PDF para Órdenes de Trabajo (OT)
// Acepta el shape que viene de getOrdenes() (con vehiculos, clientes, insumos_ot)
// o el shape "extendido" usado en NuevaOT.jsx (otCompleta).
// ============================================================
import { jsPDF } from 'jspdf'
import { EMPRESA, obtenerPrecio } from './data'

const formatARS = (n) => '$' + Number(n || 0).toLocaleString('es-AR')

function normalizar(ot) {
  // Datos cabecera
  const numero = ot.ot_numero || ot.numero || ''
  const fecha = ot.created_at
    ? new Date(ot.created_at).toLocaleDateString('es-AR')
    : (ot.fecha || new Date().toLocaleDateString('es-AR'))
  const cliente = ot.clientes?.nombre || ot.cliente || ot.cliente_nombre || '—'
  const clienteTel = ot.clientes?.telefono || ot.clienteTel || ot.cliente_telefono || ''

  // Vehículo
  const v = ot.vehiculos || {}
  const codigo = v.codigo || ot.codigo || ''
  const marca = v.marca || ''
  const modelo = v.modelo || ''
  const tipoCar = v.tipo || ''
  const categoria = v.categoria || ''
  const vehiculoLabel = `${codigo}${codigo ? ' — ' : ''}${marca} ${modelo} ${tipoCar}`.trim()
  const patente = ot.patente || v.patente || ''
  const chofer = ot.chofer || v.chofer || ''

  // Servicio
  const servicioNombre = ot.servicio_nombre || ot.servicio || 'Service'
  const tipoServicio = ot.tipo_servicio || (ot.esReparacion ? 'reparacion' : 'service')
  const esReparacion = tipoServicio === 'reparacion' || ot.esReparacion === true

  const km = Number(ot.km_ingreso ?? ot.km ?? 0)
  const kmProximo = Number(ot.km_proximo ?? (km + 20000))
  const mecanico = ot.mecanico || 'Bruno Suarez'
  const observaciones = ot.observaciones || ''
  const estado = ot.estado || 'Ingresado'
  const remito_numero = ot.remito_numero || ''
  const remito_fecha = ot.remito_fecha || ''

  // Items: si hay insumos_ot reales, los usamos. Si no, hacemos MO + insumos
  let items = []
  let subtotal = 0
  if (Array.isArray(ot.insumos_ot) && ot.insumos_ot.length > 0) {
    items = ot.insumos_ot.map(it => {
      const cant = Number(it.cantidad) || 1
      const precio = Number(it.precio_unit) || 0
      return {
        descripcion: it.descripcion || '',
        cantidad: cant,
        precio,
        total: cant * precio,
      }
    })
    subtotal = items.reduce((s, it) => s + it.total, 0)
  } else if (Array.isArray(ot.itemsDetalle) && ot.itemsDetalle.length > 0) {
    // Shape de NuevaOT.jsx
    items = ot.itemsDetalle.map(it => ({
      descripcion: it.descripcion || '',
      cantidad: Number(it.cantidad) || 1,
      precio: Number(it.precio_unit) || 0,
      total: (Number(it.cantidad) || 1) * (Number(it.precio_unit) || 0),
    }))
    subtotal = items.reduce((s, it) => s + it.total, 0)
  } else {
    // Service preventivo: derivamos MO + insumos del precio del modelo
    const precio = obtenerPrecio(v.id ? v : { categoria, modelo, marca })
    items = [
      {
        descripcion: `Mano de obra — ${servicioNombre}`,
        cantidad: 1,
        precio: precio.mo,
        total: precio.mo,
      },
      {
        descripcion: 'Insumos y filtros',
        cantidad: 1,
        precio: precio.insumos,
        total: precio.insumos,
      },
    ]
    subtotal = precio.total
  }

  const iva = Math.round(subtotal * 0.21)
  const total = subtotal + iva

  return {
    numero, fecha, cliente, clienteTel,
    vehiculoLabel, codigo, marca, modelo, tipoCar, categoria, patente, chofer,
    servicioNombre, esReparacion, km, kmProximo, mecanico,
    observaciones, estado, remito_numero, remito_fecha,
    items, subtotal, iva, total,
  }
}

/**
 * Descarga el PDF de la OT.
 */
export function exportarOTPDF(ot) {
  const o = normalizar(ot)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  let y = 15
  const ensureSpace = (needed) => { if (y + needed > 280) { doc.addPage(); y = 15 } }

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
  doc.text('ORDEN DE TRABAJO', W - 10, 12, { align: 'right' })
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(o.numero, W - 10, 18, { align: 'right' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fecha: ${o.fecha}`, W - 10, 23, { align: 'right' })
  doc.text(`Estado: ${String(o.estado).toUpperCase()}`, W - 10, 27, { align: 'right' })

  y = 36
  doc.setTextColor(0, 0, 0)

  // Bloque cliente + vehículo
  const altoBox = 30
  doc.setFillColor(214, 228, 240)
  doc.rect(10, y, W - 20, altoBox, 'F')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 56, 100)
  doc.text('CLIENTE:', 12, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(String(o.cliente).substring(0, 60), 32, y + 6)
  if (o.clienteTel) {
    doc.text(`Tel: ${o.clienteTel}`, 130, y + 6)
  }

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 56, 100)
  doc.text('UNIDAD:', 12, y + 12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(String(o.vehiculoLabel || '—').substring(0, 60), 32, y + 12)

  if (o.patente) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(31, 56, 100)
    doc.text('PATENTE:', 130, y + 12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(o.patente.toUpperCase(), 152, y + 12)
  }

  if (o.chofer) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(31, 56, 100)
    doc.text('CHOFER:', 12, y + 18)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(String(o.chofer).substring(0, 40), 32, y + 18)
  }

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 56, 100)
  doc.text('MECÁNICO:', 130, y + 18)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(o.mecanico, 154, y + 18)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 56, 100)
  doc.text('SERVICIO:', 12, y + 24)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  doc.text(`${o.servicioNombre}${o.esReparacion ? ' (Reparación)' : ''}`.substring(0, 60), 32, y + 24)

  if (o.km > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(31, 56, 100)
    doc.text('KM:', 130, y + 24)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`${o.km.toLocaleString('es-AR')}${!o.esReparacion ? ` · próx. ${o.kmProximo.toLocaleString('es-AR')}` : ''}`, 142, y + 24)
  }

  y += altoBox + 6

  if (o.remito_numero) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(122, 25, 178)
    doc.text(`📄 Remito: ${o.remito_numero}${o.remito_fecha ? ' · ' + new Date(o.remito_fecha).toLocaleDateString('es-AR') : ''}`, 12, y)
    y += 6
    doc.setTextColor(0, 0, 0)
  }

  // Tabla items
  ensureSpace(15)
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

  o.items.forEach((it, i) => {
    ensureSpace(7)
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

  y += 4

  // Totales
  ensureSpace(35)
  doc.setDrawColor(31, 56, 100)
  doc.setLineWidth(0.4)
  doc.line(120, y, W - 10, y)
  y += 5
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Subtotal s/IVA:', 130, y)
  doc.text(formatARS(o.subtotal), W - 10, y, { align: 'right' })
  y += 5
  doc.text('IVA 21%:', 130, y)
  doc.text(formatARS(o.iva), W - 10, y, { align: 'right' })
  y += 4
  doc.line(120, y, W - 10, y)
  y += 6
  doc.setFillColor(31, 56, 100)
  doc.rect(120, y - 5, W - 130, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL c/IVA:', 125, y + 2)
  doc.text(formatARS(o.total), W - 12, y + 2, { align: 'right' })
  y += 14

  // Observaciones
  if (o.observaciones) {
    ensureSpace(20)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Observaciones:', 12, y)
    y += 4
    doc.setFont('helvetica', 'normal')
    const lineas = doc.splitTextToSize(o.observaciones, W - 25)
    lineas.forEach(l => {
      ensureSpace(5)
      doc.text(l, 12, y)
      y += 4
    })
    y += 3
  }

  // Espacio para firmas
  ensureSpace(28)
  y += 8
  doc.setDrawColor(150, 150, 150)
  doc.setLineWidth(0.2)
  doc.line(20, y + 12, 90, y + 12)
  doc.line(120, y + 12, 190, y + 12)
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text('Firma cliente', 55, y + 16, { align: 'center' })
  doc.text('Firma taller', 155, y + 16, { align: 'center' })

  // Footer
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setTextColor(120, 120, 120)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'italic')
    doc.text(`${EMPRESA.nombre} · ${EMPRESA.web} · Página ${i}/${pages}`, W / 2, 290, { align: 'center' })
  }

  doc.save(`OT-${o.numero || 'sin-numero'}.pdf`)
}

/**
 * Texto WhatsApp para una OT.
 */
export function whatsappTextoOT(ot, telefono) {
  const o = normalizar(ot)
  const detalle = o.items.map(it => `• ${it.descripcion} — ${it.cantidad} × ${formatARS(it.precio)} = ${formatARS(it.total)}`).join('\n')
  const texto =
    `*${EMPRESA.nombre}*\n` +
    `OT ${o.numero}\n` +
    `Fecha: ${o.fecha}\n` +
    `Cliente: ${o.cliente}\n` +
    `Vehículo: ${o.vehiculoLabel}${o.patente ? ' · Pat. ' + o.patente : ''}\n` +
    `Servicio: ${o.servicioNombre}\n` +
    (o.km > 0 ? `KM: ${o.km.toLocaleString('es-AR')}${!o.esReparacion ? ` (próx ${o.kmProximo.toLocaleString('es-AR')})` : ''}\n` : '') +
    `\n*Detalle:*\n${detalle}\n` +
    `\nSubtotal s/IVA: ${formatARS(o.subtotal)}\n` +
    `IVA 21%: ${formatARS(o.iva)}\n` +
    `*Total c/IVA: ${formatARS(o.total)}*\n` +
    `\n📞 ${EMPRESA.tel}`
  const num = String(telefono || '').replace(/[^0-9]/g, '')
  return num
    ? `https://wa.me/${num}?text=${encodeURIComponent(texto)}`
    : null
}
