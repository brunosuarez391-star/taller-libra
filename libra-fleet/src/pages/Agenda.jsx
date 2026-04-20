import { useMemo, useState } from 'react'
import { crearTurno, actualizarTurno, eliminarTurno } from '../lib/api'
import { SERVICIOS } from '../lib/data'

const ESTADOS = ['Programado', 'Confirmado', 'Enproceso', 'Completado', 'Cancelado']
const HORAS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30']

const EMPTY = { fecha: '', hora: '09:00', cliente: '', telefono: '', vehiculo: '', servicio: 'Service 20.000 km', mecanico: '', notas: '' }

export default function Agenda({ clientes = [], vehiculos = [], mecanicos = [], turnos = [], onRefresh }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({ ...EMPTY, fecha: today })
  const [filtroFecha, setFiltroFecha] = useState(today)
  const [editando, setEditando] = useState(null)
  const [vistaSemana, setVistaSemana] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const guardar = async (e) => {
    e.preventDefault()
    if (!form.fecha || !form.cliente.trim()) { alert('Fecha y cliente son obligatorios'); return }
    setGuardando(true)
    try {
      if (editando) await actualizarTurno(editando, form)
      else await crearTurno(form)
      setForm({ ...EMPTY, fecha: today })
      setEditando(null)
      onRefresh?.()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  const empezarEdicion = (t) => {
    setEditando(t.id)
    setForm(t)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelar = () => { setEditando(null); setForm({ ...EMPTY, fecha: today }) }

  const cambiarEstado = async (t, estado) => {
    try {
      await actualizarTurno(t.id, { estado })
      onRefresh?.()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const borrar = async (t) => {
    if (!confirm(`¿Cancelar turno de ${t.cliente}?`)) return
    try {
      await eliminarTurno(t.id)
      onRefresh?.()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  // Días de la semana del día filtrado
  const diasSemana = useMemo(() => {
    const base = new Date(filtroFecha + 'T12:00:00')
    const dow = base.getDay()
    const monday = new Date(base)
    monday.setDate(base.getDate() - (dow === 0 ? 6 : dow - 1))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d.toISOString().slice(0, 10)
    })
  }, [filtroFecha])

  const turnosPorDia = useMemo(() => {
    const map = {}
    turnos.forEach(t => {
      if (!map[t.fecha]) map[t.fecha] = []
      map[t.fecha].push(t)
    })
    Object.values(map).forEach(arr => arr.sort((a, b) => a.hora.localeCompare(b.hora)))
    return map
  }, [turnos])

  const turnosDelDia = (turnosPorDia[filtroFecha] || [])

  const stats = useMemo(() => {
    const hoy = turnos.filter(t => t.fecha === today).length
    const semana = diasSemana.reduce((s, d) => s + (turnosPorDia[d]?.length || 0), 0)
    const pendientes = turnos.filter(t => t.fecha >= today && t.estado === 'Programado').length
    return { hoy, semana, pendientes, total: turnos.length }
  }, [turnos, today, diasSemana, turnosPorDia])

  const colorEstado = (estado) => ({
    Programado: 'bg-yellow-100 text-yellow-800',
    Confirmado: 'bg-blue-100 text-blue-800',
    Enproceso: 'bg-purple-100 text-purple-800',
    Completado: 'bg-green-100 text-green-800',
    Cancelado: 'bg-slate-200 text-slate-500',
  }[estado] || 'bg-slate-100 text-slate-700')

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1F3864] mb-2">📅 Agenda</h2>
      <p className="text-sm text-slate-500 mb-6">Programá ingresos y asigná mecánicos. Cada turno dispara al Agente Agenda para confirmación WhatsApp.</p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1F3864] text-white rounded-xl p-4 shadow">
          <p className="text-2xl font-bold">{stats.hoy}</p>
          <p className="text-xs text-blue-200">Hoy</p>
        </div>
        <div className="bg-[#2E75B6] text-white rounded-xl p-4 shadow">
          <p className="text-2xl font-bold">{stats.semana}</p>
          <p className="text-xs text-blue-200">Esta semana</p>
        </div>
        <div className="bg-yellow-600 text-white rounded-xl p-4 shadow">
          <p className="text-2xl font-bold">{stats.pendientes}</p>
          <p className="text-xs text-yellow-100">Pendientes</p>
        </div>
        <div className="bg-slate-600 text-white rounded-xl p-4 shadow">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-slate-300">Total histórico</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-lg font-bold text-[#1F3864] mb-3">{editando ? '✏️ Editar' : '➕ Nuevo'} turno</h3>
          <form onSubmit={guardar} className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2" required />
              <select value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2">
                {HORAS.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
            <input list="clientes-list" value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} placeholder="Cliente *" className="w-full border border-slate-300 rounded-lg px-3 py-2" required />
            <datalist id="clientes-list">
              {(clientes || []).map(c => <option key={c.id} value={c.nombre} />)}
            </datalist>
            <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="Teléfono" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
            <input list="vehiculos-list" value={form.vehiculo} onChange={e => setForm({ ...form, vehiculo: e.target.value })} placeholder="Unidad / patente" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
            <datalist id="vehiculos-list">
              {(vehiculos || []).map(v => <option key={v.id} value={`${v.codigo} ${v.modelo}`} />)}
            </datalist>
            <select value={form.servicio} onChange={e => setForm({ ...form, servicio: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2">
              {Object.values(SERVICIOS).map(s => <option key={s.nombre}>{s.nombre}</option>)}
              <option>Diagnóstico</option>
              <option>Reparación correctiva</option>
              <option>Otro</option>
            </select>
            <select value={form.mecanico} onChange={e => setForm({ ...form, mecanico: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2">
              <option value="">Asignar mecánico...</option>
              {mecanicos.filter(m => m.activo !== false).map(m => <option key={m.id} value={m.nombre}>{m.nombre} ({m.especialidad})</option>)}
            </select>
            <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Notas / observaciones" rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={guardando} className="flex-1 bg-[#1F3864] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#2E75B6] disabled:opacity-50">
                {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Programar'}
              </button>
              {editando && <button type="button" onClick={cancelar} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-300">Cancelar</button>}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <button onClick={() => setFiltroFecha(today)} className="bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-300">Hoy</button>
            </div>
            <button onClick={() => setVistaSemana(!vistaSemana)} className="bg-[#2E75B6] text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-[#1F3864]">
              {vistaSemana ? '📋 Vista día' : '📆 Vista semana'}
            </button>
          </div>

          {vistaSemana ? (
            <div className="grid grid-cols-7 gap-2">
              {diasSemana.map(d => {
                const ts = turnosPorDia[d] || []
                const dateObj = new Date(d + 'T12:00:00')
                const esHoy = d === today
                return (
                  <div key={d} className={`border rounded-lg p-2 ${esHoy ? 'border-[#2E75B6] bg-blue-50/30' : 'border-slate-200'}`}>
                    <div className="text-center mb-2">
                      <p className="text-[10px] uppercase text-slate-500">{dateObj.toLocaleDateString('es-AR', { weekday: 'short' })}</p>
                      <p className="font-bold text-[#1F3864]">{dateObj.getDate()}</p>
                    </div>
                    {ts.length === 0 ? (
                      <p className="text-[10px] text-slate-300 text-center">—</p>
                    ) : ts.slice(0, 4).map(t => (
                      <div key={t.id} onClick={() => setFiltroFecha(d)} className="bg-white border border-slate-200 rounded p-1.5 mb-1 text-[10px] cursor-pointer hover:border-[#2E75B6]">
                        <p className="font-bold text-[#1F3864]">{t.hora}</p>
                        <p className="truncate">{t.cliente}</p>
                      </div>
                    ))}
                    {ts.length > 4 && <p className="text-[10px] text-slate-400 text-center">+{ts.length - 4} más</p>}
                  </div>
                )
              })}
            </div>
          ) : (
            <>
              <h4 className="text-sm font-bold text-[#1F3864] mb-3">
                {new Date(filtroFecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} — {turnosDelDia.length} turno(s)
              </h4>
              {turnosDelDia.length === 0 ? (
                <p className="text-slate-400 text-center py-8 text-sm">Sin turnos para este día.</p>
              ) : (
                <div className="space-y-2">
                  {turnosDelDia.map(t => (
                    <div key={t.id} className="border border-slate-200 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-[#1F3864] text-white px-2 py-0.5 rounded font-mono font-bold text-sm">🕐 {t.hora}</span>
                            <span className={`${colorEstado(t.estado)} px-2 py-0.5 rounded text-[10px] font-bold`}>{t.estado}</span>
                          </div>
                          <p className="font-bold text-[#1F3864] mt-1">{t.cliente}</p>
                          <p className="text-xs text-slate-500">
                            {t.vehiculo && `🚛 ${t.vehiculo} · `}
                            {t.servicio}
                            {t.mecanico && ` · 👷 ${t.mecanico}`}
                            {t.telefono && ` · 📞 ${t.telefono}`}
                          </p>
                          {t.notas && <p className="text-xs text-slate-600 mt-1 italic">{t.notas}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {ESTADOS.map(est => (
                          <button key={est} onClick={() => cambiarEstado(t, est)} className={`px-2 py-1 rounded text-[10px] font-bold ${t.estado === est ? 'bg-[#1F3864] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            {est}
                          </button>
                        ))}
                        <button onClick={() => empezarEdicion(t)} className="bg-[#2E75B6] text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-[#1F3864]">✏️</button>
                        {t.telefono && (
                          <a href={`https://wa.me/${t.telefono.replace(/\D/g,'')}?text=${encodeURIComponent(`Hola ${t.cliente}, te recordamos tu turno el ${t.fecha} a las ${t.hora}. Libra Servicios.`)}`} target="_blank" rel="noreferrer" className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-green-700">💬</a>
                        )}
                        <button onClick={() => borrar(t)} className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold hover:bg-red-200 ml-auto">🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
