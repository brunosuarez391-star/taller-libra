import { useMemo, useState } from 'react'
import { registrarGasto, eliminarGasto } from '../lib/api'
import { PRECIOS } from '../lib/data'

const CATEGORIAS = ['Insumos', 'Repuestos', 'Combustible', 'Servicios', 'Sueldos', 'Impuestos', 'Alquiler', 'Otros']
const METODOS = ['Efectivo', 'Transferencia', 'Cheque', 'Tarjeta', 'MercadoPago']

function formatARS(n) { return '$' + (n || 0).toLocaleString('es-AR') }

export default function Finanzas({ ordenes, gastos = [], onRefresh }) {
  const [mes, setMes] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [nuevoGasto, setNuevoGasto] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    categoria: 'Insumos',
    proveedor: 'Jones SRL',
    concepto: '',
    monto: '',
    metodo_pago: 'Transferencia',
  })
  const [guardando, setGuardando] = useState(false)

  const guardar = async (e) => {
    e.preventDefault()
    if (!nuevoGasto.concepto || !nuevoGasto.monto) { alert('Concepto y monto son obligatorios'); return }
    setGuardando(true)
    try {
      await registrarGasto(nuevoGasto)
      setNuevoGasto({ ...nuevoGasto, concepto: '', monto: '' })
      onRefresh?.()
    } catch (err) {
      alert('Error al guardar: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async (id) => {
    if (!confirm('¿Eliminar gasto?')) return
    try {
      await eliminarGasto(id)
      onRefresh?.()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  // Ingresos del mes derivados de OTs
  const ingresos = useMemo(() => {
    const items = ordenes
      .filter(ot => (ot.created_at || '').slice(0, 7) === mes)
      .map(ot => {
        const modelo = ot.vehiculos?.modelo || '1634'
        const p = PRECIOS[`M.B. ${modelo}`] || PRECIOS['M.B. 1634']
        return { ...ot, mo: p.mo, insumos: p.insumos, total: p.total }
      })
    return items
  }, [ordenes, mes])

  const gastosMes = useMemo(
    () => gastos.filter(g => (g.fecha || '').slice(0, 7) === mes),
    [gastos, mes]
  )

  const totalIngresos = ingresos.reduce((s, o) => s + o.total, 0)
  const totalIVA = Math.round(totalIngresos * 0.21)
  const totalGastos = gastosMes.reduce((s, g) => s + g.monto, 0)
  const neto = totalIngresos - totalGastos

  const gastosPorCategoria = useMemo(() => {
    const map = {}
    for (const g of gastosMes) {
      map[g.categoria] = (map[g.categoria] || 0) + g.monto
    }
    return Object.entries(map)
      .map(([cat, monto]) => ({ cat, monto }))
      .sort((a, b) => b.monto - a.monto)
  }, [gastosMes])

  // Evolución últimos 6 meses
  const evolucion = useMemo(() => {
    const meses = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('es-AR', { month: 'short' })
      const ing = ordenes.filter(ot => (ot.created_at || '').slice(0, 7) === k).reduce((s, ot) => {
        const p = PRECIOS[`M.B. ${ot.vehiculos?.modelo || '1634'}`] || PRECIOS['M.B. 1634']
        return s + p.total
      }, 0)
      const gst = gastos.filter(g => (g.fecha || '').slice(0, 7) === k).reduce((s, g) => s + g.monto, 0)
      meses.push({ mes: k, label, ingresos: ing, gastos: gst, neto: ing - gst })
    }
    return meses
  }, [ordenes, gastos])

  const maxEvo = Math.max(1, ...evolucion.map(m => Math.max(m.ingresos, m.gastos)))

  const mesesDisponibles = useMemo(() => {
    const s = new Set()
    ordenes.forEach(ot => s.add((ot.created_at || '').slice(0, 7)))
    gastos.forEach(g => s.add((g.fecha || '').slice(0, 7)))
    const now = new Date()
    s.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
    return [...s].filter(Boolean).sort().reverse()
  }, [ordenes, gastos])

  const mesLabel = new Date(mes + '-15').toLocaleString('es-AR', { month: 'long', year: 'numeric' })

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1F3864] mb-2">📊 Finanzas</h2>
      <p className="text-sm text-slate-500 mb-6">Ingresos derivados de OTs, gastos operativos y flujo neto mensual.</p>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Mes</label>
          <select value={mes} onChange={e => setMes(e.target.value)} className="border border-slate-300 rounded-lg px-4 py-2">
            {mesesDisponibles.map(m => (
              <option key={m} value={m}>{new Date(m + '-15').toLocaleString('es-AR', { month: 'long', year: 'numeric' })}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-600 text-white rounded-xl p-4 shadow">
          <p className="text-xs text-green-200">Ingresos s/IVA</p>
          <p className="text-lg font-bold">{formatARS(totalIngresos)}</p>
          <p className="text-xs text-green-200 mt-1">{ingresos.length} OTs</p>
        </div>
        <div className="bg-[#2E75B6] text-white rounded-xl p-4 shadow">
          <p className="text-xs text-blue-200">IVA débito fiscal</p>
          <p className="text-lg font-bold">{formatARS(totalIVA)}</p>
          <p className="text-xs text-blue-200 mt-1">21% s/ingresos</p>
        </div>
        <div className="bg-red-600 text-white rounded-xl p-4 shadow">
          <p className="text-xs text-red-200">Gastos</p>
          <p className="text-lg font-bold">{formatARS(totalGastos)}</p>
          <p className="text-xs text-red-200 mt-1">{gastosMes.length} ítems</p>
        </div>
        <div className={`${neto >= 0 ? 'bg-emerald-700' : 'bg-slate-700'} text-white rounded-xl p-4 shadow`}>
          <p className="text-xs opacity-80">Resultado neto</p>
          <p className="text-lg font-bold">{formatARS(neto)}</p>
          <p className="text-xs opacity-80 mt-1">{mesLabel}</p>
        </div>
      </div>

      {/* Evolución 6 meses */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h3 className="text-lg font-bold text-[#1F3864] mb-4">Evolución últimos 6 meses</h3>
        <div className="grid grid-cols-6 gap-2 items-end" style={{ minHeight: '160px' }}>
          {evolucion.map(m => (
            <div key={m.mes} className="flex flex-col items-center gap-1">
              <div className="flex gap-1 items-end h-32">
                <div className="w-4 bg-green-500 rounded-t" style={{ height: `${(m.ingresos / maxEvo) * 100}%` }} title={`Ingresos ${formatARS(m.ingresos)}`}></div>
                <div className="w-4 bg-red-500 rounded-t" style={{ height: `${(m.gastos / maxEvo) * 100}%` }} title={`Gastos ${formatARS(m.gastos)}`}></div>
              </div>
              <p className="text-[10px] text-slate-500 uppercase">{m.label}</p>
              <p className={`text-[10px] font-bold ${m.neto >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatARS(m.neto)}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 inline-block rounded"></span> Ingresos</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 inline-block rounded"></span> Gastos</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cargar gasto */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-lg font-bold text-[#1F3864] mb-3">Registrar gasto</h3>
          <form onSubmit={guardar} className="space-y-2 text-sm">
            <input type="date" value={nuevoGasto.fecha} onChange={e => setNuevoGasto({ ...nuevoGasto, fecha: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
            <select value={nuevoGasto.categoria} onChange={e => setNuevoGasto({ ...nuevoGasto, categoria: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2">
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
            <input value={nuevoGasto.proveedor} onChange={e => setNuevoGasto({ ...nuevoGasto, proveedor: e.target.value })} placeholder="Proveedor" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
            <input value={nuevoGasto.concepto} onChange={e => setNuevoGasto({ ...nuevoGasto, concepto: e.target.value })} placeholder="Concepto *" className="w-full border border-slate-300 rounded-lg px-3 py-2" required />
            <input type="number" value={nuevoGasto.monto} onChange={e => setNuevoGasto({ ...nuevoGasto, monto: e.target.value })} placeholder="Monto $ *" className="w-full border border-slate-300 rounded-lg px-3 py-2" required />
            <select value={nuevoGasto.metodo_pago} onChange={e => setNuevoGasto({ ...nuevoGasto, metodo_pago: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2">
              {METODOS.map(m => <option key={m}>{m}</option>)}
            </select>
            <button type="submit" disabled={guardando} className="w-full bg-[#1F3864] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#2E75B6] disabled:opacity-50">{guardando ? 'Guardando...' : 'Guardar gasto'}</button>
          </form>
        </div>

        {/* Gastos por categoría */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-lg font-bold text-[#1F3864] mb-3">Gastos por categoría — {mesLabel}</h3>
          {gastosPorCategoria.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Sin gastos este mes.</p>
          ) : (
            <div className="space-y-2">
              {gastosPorCategoria.map(({ cat, monto }) => {
                const pct = (monto / totalGastos) * 100
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-slate-700">{cat}</span>
                      <span className="font-mono text-[#1F3864]">{formatARS(monto)} · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded overflow-hidden">
                      <div className="h-full bg-[#2E75B6]" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Lista gastos */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-lg font-bold text-[#1F3864] mb-3">Últimos gastos</h3>
          {gastosMes.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Sin gastos en {mesLabel}.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto text-sm">
              {gastosMes.map(g => (
                <div key={g.id} className="flex items-start justify-between border-b border-slate-100 pb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#1F3864] truncate">{g.concepto}</p>
                    <p className="text-xs text-slate-500">{g.fecha} · {g.categoria} · {g.proveedor || '-'}</p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-mono font-bold text-red-600">{formatARS(g.monto)}</p>
                    <button onClick={() => borrar(g.id)} className="text-[10px] text-red-500 hover:underline">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabla ingresos detalle */}
      <div className="bg-white rounded-xl shadow p-5 mt-6">
        <h3 className="text-lg font-bold text-[#1F3864] mb-3">Ingresos del mes</h3>
        {ingresos.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">Sin OTs este mes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#D6E4F0] text-[#1F3864]">
                  <th className="px-3 py-2 text-left">OT</th>
                  <th className="px-3 py-2 text-left">Fecha</th>
                  <th className="px-3 py-2 text-left">Cliente</th>
                  <th className="px-3 py-2 text-left">Unidad</th>
                  <th className="px-3 py-2 text-right">M.O.</th>
                  <th className="px-3 py-2 text-right">Insumos</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {ingresos.map(ot => (
                  <tr key={ot.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-mono">{ot.ot_numero}</td>
                    <td className="px-3 py-2">{new Date(ot.created_at).toLocaleDateString('es-AR')}</td>
                    <td className="px-3 py-2">{ot.clientes?.nombre}</td>
                    <td className="px-3 py-2">{ot.vehiculos?.codigo} {ot.vehiculos?.modelo}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatARS(ot.mo)}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatARS(ot.insumos)}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold">{formatARS(ot.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
