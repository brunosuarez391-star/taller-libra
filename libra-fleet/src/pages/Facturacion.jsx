import { useState, useMemo } from 'react'
import { PRECIOS } from '../lib/data'
import { EMPRESA } from '../lib/data'
import { actualizarCobradaOT } from '../lib/api'

export default function Facturacion({ ordenes, vehiculos, clientes, onRefresh }) {
  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [clienteId, setClienteId] = useState('todos')
  const [verDetalle, setVerDetalle] = useState(null)
  const [loadingCobro, setLoadingCobro] = useState(null)

  const handleToggleCobrada = async (ot) => {
    const nuevoValor = !ot.cobrada
    if (ot.cobrada && !window.confirm(`¿Desmarcar como cobrada la OT ${ot.ot_numero}?`)) return
    setLoadingCobro(ot.id)
    try {
      await actualizarCobradaOT(ot.id, nuevoValor)
      if (onRefresh) await onRefresh()
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setLoadingCobro(null)
  }

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

  // Agrupar por cliente
  const resumenPorCliente = useMemo(() => {
    const grupos = {}
    otsFiltradas.forEach(ot => {
      const clienteNombre = ot.clientes?.nombre || 'Sin cliente'
      if (!grupos[clienteNombre]) {
        grupos[clienteNombre] = { cliente: clienteNombre, ots: [], totalMO: 0, totalInsumos: 0, totalNeto: 0 }
      }
      const modelo = ot.vehiculos?.modelo || '1634'
      const precio = PRECIOS[`M.B. ${modelo}`] || PRECIOS['M.B. 1634']
      grupos[clienteNombre].ots.push({
        ...ot,
        mo: precio.mo,
        insumos: precio.insumos,
        total: precio.total,
      })
      grupos[clienteNombre].totalMO += precio.mo
      grupos[clienteNombre].totalInsumos += precio.insumos
      grupos[clienteNombre].totalNeto += precio.total
      if (!grupos[clienteNombre].totalCobrado) grupos[clienteNombre].totalCobrado = 0
      if (!grupos[clienteNombre].totalPendiente) grupos[clienteNombre].totalPendiente = 0
      if (ot.cobrada) grupos[clienteNombre].totalCobrado += precio.total
      else grupos[clienteNombre].totalPendiente += precio.total
    })
    return Object.values(grupos)
  }, [otsFiltradas])

  const totalGeneral = resumenPorCliente.reduce((s, g) => s + g.totalNeto, 0)
  const ivaTotal = Math.round(totalGeneral * 0.21)
  const totalConIva = totalGeneral + ivaTotal
  const totalCobradoNeto = resumenPorCliente.reduce((s, g) => s + (g.totalCobrado || 0), 0)
  const totalPendienteNeto = resumenPorCliente.reduce((s, g) => s + (g.totalPendiente || 0), 0)

  const formatARS = (n) => '$' + n.toLocaleString('es-AR')
  const mesNombre = new Date(mesSeleccionado + '-15').toLocaleString('es-AR', { month: 'long', year: 'numeric' })

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
      <h2 className="text-2xl font-bold text-[#1F3864] mb-6">Facturación Mensual</h2>

      {/* Filtros */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Mes</label>
          <select value={mesSeleccionado} onChange={e => setMesSeleccionado(e.target.value)} className="border border-slate-300 rounded-lg px-4 py-2 focus:border-[#2E75B6] focus:outline-none">
            {mesesDisponibles.map(m => (
              <option key={m} value={m}>{new Date(m + '-15').toLocaleString('es-AR', { month: 'long', year: 'numeric' })}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Cliente</label>
          <select value={clienteId} onChange={e => setClienteId(e.target.value)} className="border border-slate-300 rounded-lg px-4 py-2 focus:border-[#2E75B6] focus:outline-none">
            <option value="todos">Todos los clientes</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* KPIs del mes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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

      {/* KPIs de cobranza */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-600 text-white rounded-xl p-4 shadow">
          <p className="text-lg font-bold">{formatARS(totalCobradoNeto)}</p>
          <p className="text-xs text-emerald-100">Cobrado s/IVA ({otsFiltradas.filter(o => o.cobrada).length} OTs)</p>
        </div>
        <div className="bg-amber-600 text-white rounded-xl p-4 shadow">
          <p className="text-lg font-bold">{formatARS(totalPendienteNeto)}</p>
          <p className="text-xs text-amber-100">Pendiente de cobro ({otsFiltradas.filter(o => !o.cobrada).length} OTs)</p>
        </div>
        <div className="bg-slate-100 text-slate-700 rounded-xl p-4 shadow border border-slate-200">
          <p className="text-lg font-bold">{totalGeneral > 0 ? Math.round((totalCobradoNeto / totalGeneral) * 100) : 0}%</p>
          <p className="text-xs text-slate-500">% cobrado del mes</p>
        </div>
      </div>

      {otsFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-slate-400">
          No hay OTs en {mesNombre}
        </div>
      ) : (
        <>
          {/* Resumen por cliente */}
          {resumenPorCliente.map((grupo) => (
            <div key={grupo.cliente} className="bg-white rounded-xl shadow mb-4 overflow-hidden">
              <div className="bg-[#1F3864] text-white px-5 py-3 flex justify-between items-center cursor-pointer" onClick={() => setVerDetalle(verDetalle === grupo.cliente ? null : grupo.cliente)}>
                <div>
                  <h3 className="font-bold text-lg">{grupo.cliente}</h3>
                  <p className="text-blue-200 text-sm">{grupo.ots.length} OTs — {mesNombre}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatARS(grupo.totalNeto)}</p>
                  <p className="text-blue-200 text-xs">+ IVA: {formatARS(Math.round(grupo.totalNeto * 0.21))}</p>
                  <p className="text-emerald-300 text-xs mt-1">
                    ✓ Cobrado: {formatARS(grupo.totalCobrado || 0)} · ⏳ Pendiente: {formatARS(grupo.totalPendiente || 0)}
                  </p>
                </div>
              </div>

              {verDetalle === grupo.cliente && (
                <div className="p-4">
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
                        <th className="px-3 py-2 text-center">Cobrada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.ots.map((ot, i) => (
                        <tr key={i} className={`border-b border-slate-100 hover:bg-slate-50 ${ot.cobrada ? 'bg-emerald-50/50' : ''}`}>
                          <td className="px-3 py-2 font-mono font-bold">{ot.ot_numero}</td>
                          <td className="px-3 py-2">{new Date(ot.created_at).toLocaleDateString('es-AR')}</td>
                          <td className="px-3 py-2">{ot.vehiculos?.codigo} {ot.vehiculos?.modelo}</td>
                          <td className="px-3 py-2 font-mono">{ot.patente || '-'}</td>
                          <td className="px-3 py-2">{ot.servicio_nombre}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatARS(ot.mo)}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatARS(ot.insumos)}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold">{formatARS(ot.total)}</td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => handleToggleCobrada(ot)}
                              disabled={loadingCobro === ot.id}
                              className={`px-2 py-1 rounded-md text-xs font-bold disabled:opacity-50 ${
                                ot.cobrada
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                              }`}
                              title={ot.cobrada ? 'Desmarcar como cobrada' : 'Marcar como cobrada'}
                            >
                              {loadingCobro === ot.id ? '...' : ot.cobrada ? '✓ Cobrada' : 'Marcar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold">
                        <td colSpan="5" className="px-3 py-2 text-right">Subtotal {grupo.cliente}:</td>
                        <td className="px-3 py-2 text-right font-mono">{formatARS(grupo.totalMO)}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatARS(grupo.totalInsumos)}</td>
                        <td className="px-3 py-2 text-right font-mono text-[#1F3864]">{formatARS(grupo.totalNeto)}</td>
                        <td className="px-3 py-2 text-center text-xs text-slate-500">
                          {grupo.ots.filter(o => o.cobrada).length}/{grupo.ots.length}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          ))}

          {/* Total general */}
          <div className="bg-white rounded-xl shadow p-5 mt-4">
            <div className="flex justify-end">
              <div className="w-80">
                <div className="flex justify-between py-2 border-b"><span>Total M.O.:</span><span className="font-mono">{formatARS(resumenPorCliente.reduce((s, g) => s + g.totalMO, 0))}</span></div>
                <div className="flex justify-between py-2 border-b"><span>Total Insumos:</span><span className="font-mono">{formatARS(resumenPorCliente.reduce((s, g) => s + g.totalInsumos, 0))}</span></div>
                <div className="flex justify-between py-2 border-b"><span>Subtotal s/IVA:</span><span className="font-mono font-bold">{formatARS(totalGeneral)}</span></div>
                <div className="flex justify-between py-2 border-b"><span>IVA 21%:</span><span className="font-mono">{formatARS(ivaTotal)}</span></div>
                <div className="flex justify-between py-3 text-xl font-bold text-[#1F3864]"><span>TOTAL c/IVA:</span><span className="font-mono">{formatARS(totalConIva)}</span></div>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <button onClick={() => window.print()} className="bg-[#1F3864] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#2E75B6]">
                Imprimir / PDF
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-3">Precios según cotización Jones SRL N°33036. M.O. $100.000/hora × 6hs. IVA 21%. CUIT: {EMPRESA.cuit}</p>
          </div>
        </>
      )}
    </div>
  )
}
