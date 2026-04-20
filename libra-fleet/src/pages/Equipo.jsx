import { useMemo, useState } from 'react'
import { getMecanicos, crearMecanico, actualizarMecanico, eliminarMecanico } from '../lib/api'

const ROLES = ['Jefe de Taller', 'Mecánico', 'Auxiliar', 'Electricista', 'Recepcionista', 'Administrativo']
const ESPECIALIDADES = ['Motor pesado MB', 'Caja y diferencial', 'Eléctrico/Electrónica', 'Frenos y suspensión', 'Neumática', 'Carrocería', 'General']

const formatARS = (n) => '$' + (n || 0).toLocaleString('es-AR')

const EMPTY = { nombre: '', rol: 'Mecánico', telefono: '', email: '', especialidad: 'General', tarifa_hora: '' }

export default function Equipo({ ordenes }) {
  const [mecanicos, setMecanicos] = useState(() => getMecanicos())
  const [form, setForm] = useState(EMPTY)
  const [editando, setEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const refrescar = () => setMecanicos(getMecanicos())

  const guardar = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) { alert('Nombre es obligatorio'); return }
    setGuardando(true)
    try {
      if (editando) await actualizarMecanico(editando, form)
      else await crearMecanico(form)
      setForm(EMPTY)
      setEditando(null)
      refrescar()
    } finally {
      setGuardando(false)
    }
  }

  const empezarEdicion = (m) => {
    setEditando(m.id)
    setForm({ ...m, tarifa_hora: String(m.tarifa_hora || '') })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelar = () => { setEditando(null); setForm(EMPTY) }

  const borrar = async (m) => {
    if (!confirm(`¿Eliminar a ${m.nombre} del equipo?`)) return
    await eliminarMecanico(m.id)
    refrescar()
  }

  const toggleActivo = async (m) => {
    await actualizarMecanico(m.id, { activo: !m.activo })
    refrescar()
  }

  const statsPorMecanico = useMemo(() => {
    const stats = {}
    mecanicos.forEach(m => {
      const ots = ordenes.filter(o => o.mecanico === m.nombre)
      const activas = ots.filter(o => o.estado !== 'Entregado' && o.estado !== 'Finalizado')
      stats[m.id] = { total: ots.length, activas: activas.length, finalizadas: ots.length - activas.length }
    })
    return stats
  }, [mecanicos, ordenes])

  const activos = mecanicos.filter(m => m.activo !== false).length
  const otsTotales = ordenes.length
  const otsEnCurso = ordenes.filter(o => o.estado !== 'Entregado' && o.estado !== 'Finalizado').length

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1F3864] mb-2">👷 Equipo</h2>
      <p className="text-sm text-slate-500 mb-6">Gestión de mecánicos, roles, especialidades y carga de trabajo.</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1F3864] text-white rounded-xl p-4 shadow">
          <p className="text-2xl font-bold">{activos}</p>
          <p className="text-xs text-blue-200">Activos en planta</p>
        </div>
        <div className="bg-[#2E75B6] text-white rounded-xl p-4 shadow">
          <p className="text-2xl font-bold">{otsEnCurso}</p>
          <p className="text-xs text-blue-200">OTs en curso</p>
        </div>
        <div className="bg-green-600 text-white rounded-xl p-4 shadow">
          <p className="text-2xl font-bold">{otsTotales}</p>
          <p className="text-xs text-green-200">OTs totales del equipo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-lg font-bold text-[#1F3864] mb-3">{editando ? '✏️ Editar' : '➕ Nuevo'} miembro</h3>
          <form onSubmit={guardar} className="space-y-2 text-sm">
            <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre y apellido *" className="w-full border border-slate-300 rounded-lg px-3 py-2" required />
            <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2">
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
            <select value={form.especialidad} onChange={e => setForm({ ...form, especialidad: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2">
              {ESPECIALIDADES.map(e => <option key={e}>{e}</option>)}
            </select>
            <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="Teléfono" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
            <input type="number" value={form.tarifa_hora} onChange={e => setForm({ ...form, tarifa_hora: e.target.value })} placeholder="Tarifa hora $" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={guardando} className="flex-1 bg-[#1F3864] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#2E75B6] disabled:opacity-50">
                {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Guardar'}
              </button>
              {editando && <button type="button" onClick={cancelar} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-300">Cancelar</button>}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow p-5">
          <h3 className="text-lg font-bold text-[#1F3864] mb-3">Plantilla ({mecanicos.length})</h3>
          {mecanicos.length === 0 ? (
            <p className="text-slate-400 text-center py-8 text-sm">Sin mecánicos aún. Agregá uno a la izquierda.</p>
          ) : (
            <div className="space-y-2">
              {mecanicos.map(m => {
                const s = statsPorMecanico[m.id] || { total: 0, activas: 0, finalizadas: 0 }
                return (
                  <div key={m.id} className={`border rounded-lg p-4 ${m.activo === false ? 'border-slate-200 bg-slate-50/40 opacity-60' : 'border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-[#1F3864] text-base">{m.nombre}</p>
                          <span className="bg-[#D6E4F0] text-[#1F3864] px-2 py-0.5 rounded text-[10px] font-bold">{m.rol}</span>
                          {m.especialidad && m.especialidad !== 'General' && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">{m.especialidad}</span>}
                          {m.activo === false && <span className="bg-slate-300 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">INACTIVO</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {m.telefono && `📞 ${m.telefono}`}
                          {m.email && ` · ✉️ ${m.email}`}
                          {m.tarifa_hora > 0 && ` · ${formatARS(m.tarifa_hora)}/hora`}
                        </p>
                      </div>
                      <div className="flex gap-1 text-xs">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">📋 {s.total}</span>
                        {s.activas > 0 && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold">🔥 {s.activas}</span>}
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-bold">✅ {s.finalizadas}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <button onClick={() => empezarEdicion(m)} className="bg-[#2E75B6] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-[#1F3864]">✏️ Editar</button>
                      <button onClick={() => toggleActivo(m)} className={`${m.activo === false ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'} text-white px-3 py-1.5 rounded text-xs font-bold`}>
                        {m.activo === false ? '▶️ Reactivar' : '⏸ Desactivar'}
                      </button>
                      {m.telefono && (
                        <a href={`https://wa.me/${m.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700">💬 WA</a>
                      )}
                      <button onClick={() => borrar(m)} className="bg-red-100 text-red-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-200 ml-auto">🗑 Eliminar</button>
                    </div>
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
