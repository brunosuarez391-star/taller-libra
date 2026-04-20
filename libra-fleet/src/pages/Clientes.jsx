import { useMemo, useState } from 'react'
import { crearCliente, actualizarCliente, eliminarCliente } from '../lib/api'

const EMPTY = { nombre: '', cuit: '', telefono: '', contacto: '', direccion: '', email: '' }

export default function Clientes({ clientes, vehiculos, ordenes, onRefresh }) {
  const [form, setForm] = useState(EMPTY)
  const [editando, setEditando] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter(c =>
      (c.nombre || '').toLowerCase().includes(q) ||
      (c.cuit || '').toLowerCase().includes(q) ||
      (c.telefono || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    )
  }, [clientes, busqueda])

  const stats = useMemo(() => {
    const map = {}
    clientes.forEach(c => {
      map[c.id] = {
        vehiculos: vehiculos.filter(v => v.cliente_id === c.id).length,
        ots: ordenes.filter(o => o.cliente_id === c.id).length,
        otsActivas: ordenes.filter(o => o.cliente_id === c.id && o.estado !== 'Entregado').length,
      }
    })
    return map
  }, [clientes, vehiculos, ordenes])

  const guardar = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) { alert('Nombre es obligatorio'); return }
    setGuardando(true)
    try {
      if (editando) {
        await actualizarCliente(editando, form)
      } else {
        await crearCliente(form)
      }
      setForm(EMPTY)
      setEditando(null)
      onRefresh?.()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  const empezarEdicion = (c) => {
    setEditando(c.id)
    setForm({
      nombre: c.nombre || '',
      cuit: c.cuit || '',
      telefono: c.telefono || '',
      contacto: c.contacto || '',
      direccion: c.direccion || '',
      email: c.email || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelar = () => {
    setEditando(null)
    setForm(EMPTY)
  }

  const borrar = async (c) => {
    const tieneDatos = (stats[c.id]?.vehiculos || 0) + (stats[c.id]?.ots || 0) > 0
    const msg = tieneDatos
      ? `⚠️ ${c.nombre} tiene vehículos u OTs asociados. ¿Eliminar igual?`
      : `¿Eliminar a ${c.nombre}?`
    if (!confirm(msg)) return
    try {
      await eliminarCliente(c.id)
      onRefresh?.()
    } catch (err) {
      alert('Error: ' + err.message + '\nProbablemente hay vehículos u OTs que lo referencian.')
    }
  }

  const abrirWhatsApp = (telefono, nombre) => {
    if (!telefono) return
    const tel = telefono.replace(/[^0-9]/g, '')
    const msg = encodeURIComponent(`Hola ${nombre}, te escribo desde Libra Servicios Industriales.`)
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank')
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1F3864] mb-2">👥 Clientes — CRM</h2>
      <p className="text-sm text-slate-500 mb-6">Alta, edición y seguimiento de clientes. Cada alta dispara el Agente CRM.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-lg font-bold text-[#1F3864] mb-3">
            {editando ? '✏️ Editar cliente' : '➕ Nuevo cliente'}
          </h3>
          <form onSubmit={guardar} className="space-y-2 text-sm">
            <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Razón social / Nombre *" className="w-full border border-slate-300 rounded-lg px-3 py-2" required />
            <input value={form.cuit} onChange={e => setForm({ ...form, cuit: e.target.value })} placeholder="CUIT" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
            <input value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })} placeholder="Persona de contacto" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
            <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="Teléfono" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
            <input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Dirección" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={guardando} className="flex-1 bg-[#1F3864] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#2E75B6] disabled:opacity-50">
                {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Guardar'}
              </button>
              {editando && (
                <button type="button" onClick={cancelar} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-300">Cancelar</button>
              )}
            </div>
          </form>
        </div>

        {/* Listado */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-lg font-bold text-[#1F3864]">Cartera ({filtrados.length}/{clientes.length})</h3>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="🔍 Buscar nombre, CUIT, tel..." className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-64" />
          </div>
          {filtrados.length === 0 ? (
            <p className="text-slate-400 text-center py-8 text-sm">No hay clientes que coincidan.</p>
          ) : (
            <div className="space-y-2">
              {filtrados.map(c => {
                const s = stats[c.id] || { vehiculos: 0, ots: 0, otsActivas: 0 }
                const expanded = abierto === c.id
                return (
                  <div key={c.id} className="border border-slate-200 rounded-lg">
                    <div className="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50" onClick={() => setAbierto(expanded ? null : c.id)}>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1F3864]">{c.nombre}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {c.cuit && `CUIT ${c.cuit}`}
                          {c.telefono && ` · 📞 ${c.telefono}`}
                          {c.email && ` · ✉️ ${c.email}`}
                        </p>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="bg-[#D6E4F0] text-[#1F3864] px-2 py-1 rounded font-bold">🚛 {s.vehiculos}</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">📋 {s.ots}</span>
                        {s.otsActivas > 0 && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold">🔥 {s.otsActivas}</span>}
                      </div>
                    </div>
                    {expanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50 rounded-b-lg">
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div><span className="text-slate-500">Contacto:</span> <span className="font-bold">{c.contacto || '-'}</span></div>
                          <div><span className="text-slate-500">Dirección:</span> <span className="font-bold">{c.direccion || '-'}</span></div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => empezarEdicion(c)} className="bg-[#2E75B6] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-[#1F3864]">✏️ Editar</button>
                          {c.telefono && (
                            <button onClick={() => abrirWhatsApp(c.telefono, c.nombre)} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700">💬 WhatsApp</button>
                          )}
                          {c.email && (
                            <a href={`mailto:${c.email}`} className="bg-slate-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-700">✉️ Email</a>
                          )}
                          <button onClick={() => borrar(c)} className="bg-red-100 text-red-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-200 ml-auto">🗑 Eliminar</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
