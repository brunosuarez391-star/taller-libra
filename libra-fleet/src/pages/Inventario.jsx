import { useMemo, useState } from 'react'
import {
  crearInsumo, actualizarInsumo, eliminarInsumo, ajustarStock,
} from '../lib/api'

const CATEGORIAS = ['Filtros', 'Aceites', 'Repuestos', 'Eléctrico', 'Neumáticos', 'Consumibles', 'Herramientas', 'Otros']
const UNIDADES = ['unidad', 'litro', 'kg', 'metro', 'caja', 'juego']

const formatARS = (n) => '$' + (n || 0).toLocaleString('es-AR')

export default function Inventario({ insumos = [], movimientos = [], onRefresh }) {
  const items = insumos
  const [editando, setEditando] = useState(null)
  const [filtroCat, setFiltroCat] = useState('todas')
  const [busqueda, setBusqueda] = useState('')
  const [verMovs, setVerMovs] = useState(false)
  const [ajuste, setAjuste] = useState(null)
  const [deltaInput, setDeltaInput] = useState('')
  const [motivoInput, setMotivoInput] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({
    codigo: '', descripcion: '', categoria: 'Repuestos', unidad: 'unidad',
    stock: '', stock_minimo: '', precio_unit: '', proveedor: '', ubicacion: '',
  })

  const guardar = async (e) => {
    e.preventDefault()
    if (!form.descripcion.trim()) { alert('Descripción es obligatoria'); return }
    setGuardando(true)
    try {
      if (editando) await actualizarInsumo(editando, form)
      else await crearInsumo(form)
      setForm({ codigo: '', descripcion: '', categoria: 'Repuestos', unidad: 'unidad', stock: '', stock_minimo: '', precio_unit: '', proveedor: '', ubicacion: '' })
      setEditando(null)
      onRefresh?.()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  const empezarEdicion = (item) => {
    setEditando(item.id)
    setForm({ ...item, stock: String(item.stock), stock_minimo: String(item.stock_minimo), precio_unit: String(item.precio_unit) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelar = () => {
    setEditando(null)
    setForm({ codigo: '', descripcion: '', categoria: 'Repuestos', unidad: 'unidad', stock: '', stock_minimo: '', precio_unit: '', proveedor: '', ubicacion: '' })
  }

  const borrar = async (item) => {
    if (!confirm(`¿Eliminar ${item.descripcion}?`)) return
    try {
      await eliminarInsumo(item.id)
      onRefresh?.()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const abrirAjuste = (item) => {
    setAjuste(item)
    setDeltaInput('')
    setMotivoInput('')
  }

  const confirmarAjuste = async () => {
    const delta = Number(deltaInput)
    if (!delta) { alert('Ingresá una cantidad'); return }
    try {
      await ajustarStock(ajuste.id, delta, motivoInput)
      setAjuste(null)
      onRefresh?.()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return items.filter(i => {
      if (filtroCat !== 'todas' && i.categoria !== filtroCat) return false
      if (!q) return true
      return (
        (i.codigo || '').toLowerCase().includes(q) ||
        (i.descripcion || '').toLowerCase().includes(q) ||
        (i.proveedor || '').toLowerCase().includes(q)
      )
    })
  }, [items, filtroCat, busqueda])

  const alertas = useMemo(
    () => items.filter(i => i.stock_minimo > 0 && i.stock <= i.stock_minimo),
    [items]
  )

  const kpis = useMemo(() => {
    const totalItems = items.length
    const valorStock = items.reduce((s, i) => s + (i.stock * i.precio_unit), 0)
    return { totalItems, valorStock, alertas: alertas.length }
  }, [items, alertas])

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1F3864] mb-2">📦 Inventario</h2>
      <p className="text-sm text-slate-500 mb-6">Control de stock de insumos y repuestos. Alertas automáticas cuando el stock cae al mínimo.</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1F3864] text-white rounded-xl p-4 shadow">
          <p className="text-2xl font-bold">{kpis.totalItems}</p>
          <p className="text-xs text-blue-200">Items en inventario</p>
        </div>
        <div className="bg-[#2E75B6] text-white rounded-xl p-4 shadow">
          <p className="text-lg font-bold">{formatARS(kpis.valorStock)}</p>
          <p className="text-xs text-blue-200">Valor total stock</p>
        </div>
        <div className={`${kpis.alertas > 0 ? 'bg-red-600' : 'bg-green-600'} text-white rounded-xl p-4 shadow`}>
          <p className="text-2xl font-bold">{kpis.alertas}</p>
          <p className="text-xs opacity-80">{kpis.alertas > 0 ? 'Alertas stock bajo' : 'Stock saludable'}</p>
        </div>
      </div>

      {alertas.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
          <h3 className="font-bold text-red-700 mb-2">⚠️ {alertas.length} ítem(s) bajo el mínimo</h3>
          <ul className="text-sm text-red-800 space-y-1">
            {alertas.slice(0, 5).map(a => (
              <li key={a.id}>
                <span className="font-mono font-bold">{a.codigo}</span> — {a.descripcion} (stock: {a.stock}/{a.stock_minimo})
              </li>
            ))}
            {alertas.length > 5 && <li className="italic">... y {alertas.length - 5} más</li>}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-lg font-bold text-[#1F3864] mb-3">{editando ? '✏️ Editar' : '➕ Nuevo'} insumo</h3>
          <form onSubmit={guardar} className="space-y-2 text-sm">
            <input value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} placeholder="Código (auto)" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
            <input value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción *" className="w-full border border-slate-300 rounded-lg px-3 py-2" required />
            <div className="grid grid-cols-2 gap-2">
              <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2">
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={form.unidad} onChange={e => setForm({ ...form, unidad: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2">
                {UNIDADES.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="Stock inicial" className="border border-slate-300 rounded-lg px-3 py-2" />
              <input type="number" value={form.stock_minimo} onChange={e => setForm({ ...form, stock_minimo: e.target.value })} placeholder="Stock mínimo" className="border border-slate-300 rounded-lg px-3 py-2" />
            </div>
            <input type="number" value={form.precio_unit} onChange={e => setForm({ ...form, precio_unit: e.target.value })} placeholder="Precio unitario $" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
            <input value={form.proveedor} onChange={e => setForm({ ...form, proveedor: e.target.value })} placeholder="Proveedor" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
            <input value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })} placeholder="Ubicación en taller" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={guardando} className="flex-1 bg-[#1F3864] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#2E75B6] disabled:opacity-50">
                {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Guardar'}
              </button>
              {editando && <button type="button" onClick={cancelar} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-300">Cancelar</button>}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-lg font-bold text-[#1F3864]">Stock ({filtrados.length}/{items.length})</h3>
            <div className="flex gap-2 flex-wrap">
              <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="todas">Todas categorías</option>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="🔍 Buscar..." className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-48" />
              <button onClick={() => setVerMovs(!verMovs)} className="bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-300">
                {verMovs ? 'Ver stock' : 'Ver movimientos'}
              </button>
            </div>
          </div>

          {verMovs ? (
            <div className="max-h-[500px] overflow-y-auto text-sm">
              {movimientos.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Sin movimientos registrados.</p>
              ) : movimientos.slice(0, 50).map(m => (
                <div key={m.id} className="flex items-center justify-between border-b border-slate-100 py-2">
                  <div>
                    <span className="font-mono font-bold text-[#1F3864]">{m.codigo}</span> — {m.descripcion}
                    <p className="text-xs text-slate-500">{new Date(m.ts).toLocaleString('es-AR')} · {m.motivo}</p>
                  </div>
                  <div className={`font-mono font-bold ${m.delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {m.delta > 0 ? '+' : ''}{m.delta}
                    <p className="text-xs text-slate-400 font-normal">→ {m.stock_nuevo}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : filtrados.length === 0 ? (
            <p className="text-slate-400 text-center py-8 text-sm">No hay ítems. Creá uno a la izquierda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#D6E4F0] text-[#1F3864]">
                    <th className="px-2 py-2 text-left">Cód.</th>
                    <th className="px-2 py-2 text-left">Descripción</th>
                    <th className="px-2 py-2 text-left">Cat.</th>
                    <th className="px-2 py-2 text-right">Stock</th>
                    <th className="px-2 py-2 text-right">Mín</th>
                    <th className="px-2 py-2 text-right">Precio</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(item => {
                    const bajo = item.stock_minimo > 0 && item.stock <= item.stock_minimo
                    return (
                      <tr key={item.id} className={`border-b border-slate-100 ${bajo ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
                        <td className="px-2 py-2 font-mono font-bold">{item.codigo}</td>
                        <td className="px-2 py-2">{item.descripcion}<p className="text-[10px] text-slate-400">{item.proveedor}{item.ubicacion && ` · 📍 ${item.ubicacion}`}</p></td>
                        <td className="px-2 py-2 text-xs">{item.categoria}</td>
                        <td className="px-2 py-2 text-right font-mono font-bold">{item.stock} {item.unidad}{bajo && ' ⚠️'}</td>
                        <td className="px-2 py-2 text-right text-xs">{item.stock_minimo}</td>
                        <td className="px-2 py-2 text-right font-mono">{formatARS(item.precio_unit)}</td>
                        <td className="px-2 py-2 text-right whitespace-nowrap">
                          <button onClick={() => abrirAjuste(item)} className="bg-[#2E75B6] text-white px-2 py-1 rounded text-xs font-bold hover:bg-[#1F3864] mr-1">±</button>
                          <button onClick={() => empezarEdicion(item)} className="bg-slate-200 px-2 py-1 rounded text-xs mr-1">✏️</button>
                          <button onClick={() => borrar(item)} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">🗑</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {ajuste && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setAjuste(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#1F3864] mb-3">Ajustar stock — {ajuste.descripcion}</h3>
            <p className="text-sm text-slate-500 mb-3">Stock actual: <span className="font-bold">{ajuste.stock} {ajuste.unidad}</span></p>
            <label className="text-xs font-bold text-slate-500">Cantidad (+ ingreso, − egreso)</label>
            <input type="number" value={deltaInput} onChange={e => setDeltaInput(e.target.value)} placeholder="Ej: 10 o -5" className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-3" autoFocus />
            <label className="text-xs font-bold text-slate-500">Motivo</label>
            <input value={motivoInput} onChange={e => setMotivoInput(e.target.value)} placeholder="Ej: Compra Jones SRL / Uso OT-123" className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4" />
            <div className="flex gap-2">
              <button onClick={confirmarAjuste} className="flex-1 bg-[#1F3864] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#2E75B6]">Confirmar</button>
              <button onClick={() => setAjuste(null)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-300">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
