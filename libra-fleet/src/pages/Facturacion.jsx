import { useState, useMemo } from 'react'
import { jsPDF } from 'jspdf'
import { obtenerPrecio, EMPRESA } from '../lib/data'

export default function Facturacion({ ordenes, vehiculos, clientes, presupuestos = [] }) {
  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [clienteId, setClienteId] = useState('todos')
  const [verDetalle, setVerDetalle] = useState(null)

  // Filtrar OTs del mes seleccionado
  const otsMes = useMemo(() => {
    return ordenes.filter(ot => {
      const fecha = new Date(ot.created_at)
      const mesOT = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      return mesOT === mesSeleccionado
    })
  }, [ordenes, mesSeleccionado])

  // Filtrar por cliente
  const otsFiltradas = clienteId === 'todos' ? otsMes : otsMes.filter(ot => ot.cliente_id === clienteId)

  // Presupuestos APROBADOS del mes (facturables)
  const presupuestosMes = useMemo(() => {
    return presupuestos.filter(p => {
      if (p.estado !== 'aprobado') return false
      const fecha = new Date(p.created_at || p.fecha)
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      return mes === mesSeleccionado
    })
  }, [presupuestos, mesSeleccionado])

  const presupuestosFiltrados = clienteId === 'todos'
    ? presupuestosMes
    : presupuestosMes.filter(p => p.cliente_id === clienteId)

  // Agrupar por cliente (OTs + presupuestos aprobados)
  const resumenPorCliente = useMemo(() => {
    const grupos = {}

    otsFiltradas.forEach(ot => {
      const clienteNombre = ot.clientes?.nombre || 'Sin cliente'
      if (!grupos[clienteNombre]) {
        grupos[clienteNombre] = { cliente: clienteNombre, ots: [], presupuestos: [], totalMO: 0, totalInsumos: 0, totalNeto: 0 }
      }
      const precio = obtenerPrecio(ot.vehiculos)
      grupos[clienteNombre].ots.push({
        ...ot,
        mo: precio.mo,
        insumos: precio.insumos,
        total: precio.total,
      })
      grupos[clienteNombre].totalMO += precio.mo
      grupos[clienteNombre].totalInsumos += precio.insumos
      grupos[clienteNombre].totalNeto += precio.total
    })

    // Sumar presupuestos aprobados
    presupuestosFiltrados.forEach(p => {
      const clienteNombre = p.clientes?.nombre || 'Sin cliente'
      if (!grupos[clienteNombre]) {
        grupos[clienteNombre] = { cliente: clienteNombre, ots: [], presupuestos: [], totalMO: 0, totalInsumos: 0, totalNeto: 0 }
      }
      grupos[clienteNombre].presupuestos.push(p)
      grupos[clienteNombre].totalNeto += parseFloat(p.subtotal_siva || 0)
    })

    return Object.values(grupos)
  }, [otsFiltradas, presupuestosFiltrados])

  const totalGeneral = resumenPorCliente.reduce((s, g) => s + g.totalNeto, 0)
  const ivaTotal = Math.round(totalGeneral * 0.21)
  const totalConIva = totalGeneral + ivaTotal

  const formatARS = (n) => '$' + n.toLocaleString('es-AR')
  const mesNombre = new Date(mesSeleccionado + '-15').toLocaleString('es-AR', { month: 'long', year: 'numeric' })

  const exportarPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const W = 210
    let y = 15

    // Header
    doc.setFillColor(31, 56, 100)
    doc.rect(0, 0, W, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('LIBRA FLEET', 10, 12)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(EMPRESA.nombre, 10, 18)
    doc.text(`CUIT: ${EMPRESA.cuit}`, 10, 23)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('FACTURACIÓN MENSUAL', W - 10, 12, { align: 'right' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(mesNombre.toUpperCase(), W - 10, 18, { align: 'right' })
    doc.text(`Emitido: ${new Date().toLocaleDateString('es-AR')}`, W - 10, 23, { align: 'right' })

    y = 38
    doc.setTextColor(0, 0, 0)

    // Info empresa
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`${EMPRESA.direccion} — ${EMPRESA.ciudad}`, 10, y)
    doc.text(`Tel: ${EMPRESA.tel} — ${EMPRESA.email}`, 10, y + 4)
    y += 12

    // KPIs en una fila
    doc.setFillColor(214, 228, 240)
    doc.rect(10, y, W - 20, 14, 'F')
    doc.setTextColor(31, 56, 100)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`${otsFiltradas.length}`, 25, y + 6, { align: 'center' })
    doc.text(formatARS(totalGeneral), 75, y + 6, { align: 'center' })
    doc.text(formatARS(ivaTotal), 125, y + 6, { align: 'center' })
    doc.text(formatARS(totalConIva), 175, y + 6, { align: 'center' })
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('OTs', 25, y + 11, { align: 'center' })
    doc.text('Neto s/IVA', 75, y + 11, { align: 'center' })
    doc.text('IVA 21%', 125, y + 11, { align: 'center' })
    doc.text('Total c/IVA', 175, y + 11, { align: 'center' })
    y += 20

    // Tabla por cliente
    doc.setTextColor(0, 0, 0)

    for (const grupo of resumenPorCliente) {
      if (y > 260) {
        doc.addPage()
        y = 15
      }

      // Header del cliente
      doc.setFillColor(31, 56, 100)
      doc.rect(10, y, W - 20, 8, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(grupo.cliente, 12, y + 5.5)
      doc.text(`${grupo.ots.length} OTs`, 100, y + 5.5)
      doc.text(`Subtotal: ${formatARS(grupo.totalNeto)}`, W - 12, y + 5.5, { align: 'right' })
      y += 10

      // Headers tabla
      doc.setFillColor(214, 228, 240)
      doc.rect(10, y, W - 20, 6, 'F')
      doc.setTextColor(31, 56, 100)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text('OT', 12, y + 4)
      doc.text('Fecha', 32, y + 4)
      doc.text('Unidad', 52, y + 4)
      doc.text('Patente', 80, y + 4)
      doc.text('Servicio', 102, y + 4)
      doc.text('M.O.', 150, y + 4, { align: 'right' })
      doc.text('Insumos', 170, y + 4, { align: 'right' })
      doc.text('Total', 198, y + 4, { align: 'right' })
      y += 7

      // Filas
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)

      for (const ot of grupo.ots) {
        if (y > 275) {
          doc.addPage()
          y = 15
        }

        const fecha = new Date(ot.created_at).toLocaleDateString('es-AR')
        const unidad = `${ot.vehiculos?.codigo || ''} ${ot.vehiculos?.modelo || ''}`.trim()
        const servicio = (ot.servicio_nombre || '').substring(0, 24)
        const patente = ot.patente || '-'

        doc.text(ot.ot_numero || '', 12, y + 4)
        doc.text(fecha, 32, y + 4)
        doc.text(unidad.substring(0, 15), 52, y + 4)
        doc.text(patente.substring(0, 10), 80, y + 4)
        doc.text(servicio, 102, y + 4)
        doc.text(formatARS(ot.mo), 150, y + 4, { align: 'right' })
        doc.text(formatARS(ot.insumos), 170, y + 4, { align: 'right' })
        doc.text(formatARS(ot.total), 198, y + 4, { align: 'right' })

        // Línea divisoria
        doc.setDrawColor(230, 230, 230)
        doc.line(10, y + 6, W - 10, y + 6)
        y += 6
      }

      // Subtotal
      doc.setFillColor(248, 250, 252)
      doc.rect(10, y, W - 20, 6, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(31, 56, 100)
      doc.text(`Subtotal ${grupo.cliente}`, 12, y + 4)
      doc.text(formatARS(grupo.totalMO), 150, y + 4, { align: 'right' })
      doc.text(formatARS(grupo.totalInsumos), 170, y + 4, { align: 'right' })
      doc.text(formatARS(grupo.totalNeto), 198, y + 4, { align: 'right' })
      y += 10
    }

    // Totales finales
    if (y > 240) {
      doc.addPage()
      y = 15
    }

    y += 5
    doc.setDrawColor(31, 56, 100)
    doc.setLineWidth(0.5)
    doc.line(120, y, W - 10, y)
    y += 5

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text('Total M.O.:', 130, y)
    doc.text(formatARS(resumenPorCliente.reduce((s, g) => s + g.totalMO, 0)), W - 10, y, { align: 'right' })
    y += 5
    doc.text('Total Insumos:', 130, y)
    doc.text(formatARS(resumenPorCliente.reduce((s, g) => s + g.totalInsumos, 0)), W - 10, y, { align: 'right' })
    y += 5
    doc.setFont('helvetica', 'bold')
    doc.text('Subtotal s/IVA:', 130, y)
    doc.text(formatARS(totalGeneral), W - 10, y, { align: 'right' })
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.text('IVA 21%:', 130, y)
    doc.text(formatARS(ivaTotal), W - 10, y, { align: 'right' })
    y += 5
    doc.line(120, y, W - 10, y)
    y += 6
    doc.setFillColor(31, 56, 100)
    doc.rect(120, y - 5, W - 130, 10, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL c/IVA:', 125, y + 2)
    doc.text(formatARS(totalConIva), W - 12, y + 2, { align: 'right' })

    // Footer
    doc.setTextColor(120, 120, 120)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'italic')
    const pages = doc.getNumberOfPages()
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i)
      doc.text(
        `${EMPRESA.nombre} · ${EMPRESA.ciudad} · ${EMPRESA.web} · Página ${i}/${pages}`,
        W / 2,
        290,
        { align: 'center' }
      )
    }

    doc.save(`facturacion-libra-${mesSeleccionado}.pdf`)
  }

  // Meses disponibles
  const mesesDisponibles = useMemo(() => {
    const meses = new Set()
    ordenes.forEach(ot => {
      const fecha = new Date(ot.created_at)
      meses.add(`${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`)
    })
    const now = new Date()
    meses.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
    return [...meses].sort().reverse()
  }, [ordenes])

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1F3864] dark:text-blue-300 mb-6">Facturación Mensual</h2>

      {/* Filtros */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Mes</label>
          <select value={mesSeleccionado} onChange={e => setMesSeleccionado(e.target.value)} className="border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2 focus:border-[#2E75B6] focus:outline-none">
            {mesesDisponibles.map(m => (
              <option key={m} value={m}>{new Date(m + '-15').toLocaleString('es-AR', { month: 'long', year: 'numeric' })}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Cliente</label>
          <select value={clienteId} onChange={e => setClienteId(e.target.value)} className="border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2 focus:border-[#2E75B6] focus:outline-none">
            <option value="todos">Todos los clientes</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* KPIs del mes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1F3864] text-white rounded-xl p-4 shadow">
          <p className="text-2xl font-bold">{otsFiltradas.length}</p>
          <p className="text-xs text-blue-200">OTs en {mesNombre}</p>
        </div>
        <div className="bg-[#2E75B6] text-white rounded-xl p-4 shadow">
          <p className="text-lg font-bold">{formatARS(totalGeneral)}</p>
          <p className="text-xs text-blue-200">Neto s/IVA</p>
        </div>
        <div className="bg-slate-600 text-white rounded-xl p-4 shadow">
          <p className="text-lg font-bold">{formatARS(ivaTotal)}</p>
          <p className="text-xs text-slate-300">IVA 21%</p>
        </div>
        <div className="bg-green-600 text-white rounded-xl p-4 shadow">
          <p className="text-lg font-bold">{formatARS(totalConIva)}</p>
          <p className="text-xs text-green-200">Total c/IVA</p>
        </div>
      </div>

      {otsFiltradas.length === 0 && presupuestosFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl shadow p-8 text-center text-slate-400 dark:text-slate-500">
          No hay OTs ni presupuestos aprobados en {mesNombre}
        </div>
      ) : (
        <>
          {/* Resumen por cliente */}
          {resumenPorCliente.map((grupo) => (
            <div key={grupo.cliente} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl shadow mb-4 overflow-hidden">
              <div className="bg-[#1F3864] text-white px-5 py-3 flex justify-between items-center cursor-pointer" onClick={() => setVerDetalle(verDetalle === grupo.cliente ? null : grupo.cliente)}>
                <div>
                  <h3 className="font-bold text-lg">{grupo.cliente}</h3>
                  <p className="text-blue-200 text-sm">
                    {grupo.ots.length} OTs{grupo.presupuestos.length > 0 ? ` + ${grupo.presupuestos.length} presupuesto${grupo.presupuestos.length !== 1 ? 's' : ''}` : ''} — {mesNombre}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatARS(grupo.totalNeto)}</p>
                  <p className="text-blue-200 text-xs">+ IVA: {formatARS(Math.round(grupo.totalNeto * 0.21))}</p>
                </div>
              </div>

              {verDetalle === grupo.cliente && (
                <div className="p-4 space-y-4">
                  {/* Presupuestos aprobados */}
                  {grupo.presupuestos.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-[#1F3864] dark:text-blue-300 mb-2">
                        📋 Presupuestos aprobados ({grupo.presupuestos.length})
                      </h4>
                      <table className="w-full text-sm mb-2">
                        <thead>
                          <tr className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300">
                            <th className="px-3 py-2 text-left">Presupuesto</th>
                            <th className="px-3 py-2 text-left">Fecha</th>
                            <th className="px-3 py-2 text-left">Items</th>
                            <th className="px-3 py-2 text-right">Subtotal s/IVA</th>
                            <th className="px-3 py-2 text-right">Total c/IVA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grupo.presupuestos.map(p => (
                            <tr key={p.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                              <td className="px-3 py-2 font-mono font-bold">{p.numero}</td>
                              <td className="px-3 py-2">{new Date(p.created_at || p.fecha).toLocaleDateString('es-AR')}</td>
                              <td className="px-3 py-2 text-xs">{p.items_presupuesto?.length || 0} items</td>
                              <td className="px-3 py-2 text-right font-mono">{formatARS(p.subtotal_siva)}</td>
                              <td className="px-3 py-2 text-right font-mono font-bold">{formatARS(p.total_civa)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Órdenes de trabajo */}
                  {grupo.ots.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-[#1F3864] dark:text-blue-300 mb-2">
                        🔧 Órdenes de trabajo ({grupo.ots.length})
                      </h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#D6E4F0] text-[#1F3864]">
                        <th className="px-3 py-2 text-left">OT</th>
                        <th className="px-3 py-2 text-left">Fecha</th>
                        <th className="px-3 py-2 text-left">Unidad</th>
                        <th className="px-3 py-2 text-left">Patente</th>
                        <th className="px-3 py-2 text-left">Servicio</th>
                        <th className="px-3 py-2 text-right">M.O.</th>
                        <th className="px-3 py-2 text-right">Insumos</th>
                        <th className="px-3 py-2 text-right">Total s/IVA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.ots.map((ot, i) => (
                        <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-3 py-2 font-mono font-bold">{ot.ot_numero}</td>
                          <td className="px-3 py-2">{new Date(ot.created_at).toLocaleDateString('es-AR')}</td>
                          <td className="px-3 py-2">{ot.vehiculos?.codigo} {ot.vehiculos?.modelo}</td>
                          <td className="px-3 py-2 font-mono">{ot.patente || '-'}</td>
                          <td className="px-3 py-2">{ot.servicio_nombre}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatARS(ot.mo)}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatARS(ot.insumos)}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold">{formatARS(ot.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 dark:bg-slate-900 font-bold">
                        <td colSpan="5" className="px-3 py-2 text-right">Subtotal OTs:</td>
                        <td className="px-3 py-2 text-right font-mono">{formatARS(grupo.totalMO)}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatARS(grupo.totalInsumos)}</td>
                        <td className="px-3 py-2 text-right font-mono text-[#1F3864] dark:text-blue-300">
                          {formatARS(grupo.totalMO + grupo.totalInsumos)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                    </div>
                  )}

                  {/* Subtotal global del cliente */}
                  <div className="bg-[#D6E4F0] dark:bg-slate-900 rounded-lg p-3 text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Subtotal {grupo.cliente}</p>
                    <p className="text-xl font-bold font-mono text-[#1F3864] dark:text-blue-300">
                      {formatARS(grupo.totalNeto)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      + IVA 21%: {formatARS(Math.round(grupo.totalNeto * 0.21))}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Total general */}
          <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl shadow p-5 mt-4">
            <div className="flex justify-end">
              <div className="w-80">
                <div className="flex justify-between py-2 border-b"><span>Total M.O.:</span><span className="font-mono">{formatARS(resumenPorCliente.reduce((s, g) => s + g.totalMO, 0))}</span></div>
                <div className="flex justify-between py-2 border-b"><span>Total Insumos:</span><span className="font-mono">{formatARS(resumenPorCliente.reduce((s, g) => s + g.totalInsumos, 0))}</span></div>
                <div className="flex justify-between py-2 border-b"><span>Subtotal s/IVA:</span><span className="font-mono font-bold">{formatARS(totalGeneral)}</span></div>
                <div className="flex justify-between py-2 border-b"><span>IVA 21%:</span><span className="font-mono">{formatARS(ivaTotal)}</span></div>
                <div className="flex justify-between py-3 text-xl font-bold text-[#1F3864]"><span>TOTAL c/IVA:</span><span className="font-mono">{formatARS(totalConIva)}</span></div>
              </div>
            </div>
            <div className="flex gap-3 mt-4 flex-wrap">
              <button
                onClick={exportarPDF}
                className="bg-[#1F3864] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#2E75B6] flex items-center gap-2 shadow"
              >
                📄 Descargar PDF
              </button>
              <button
                onClick={() => window.print()}
                className="bg-slate-200 text-slate-700 px-6 py-3 rounded-lg font-bold hover:bg-slate-300 flex items-center gap-2"
              >
                🖨️ Imprimir
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-3">Precios según cotización Jones SRL N°33036. M.O. $100.000/hora × 6hs. IVA 21%. CUIT: {EMPRESA.cuit}</p>
          </div>
        </>
      )}
    </div>
  )
}
