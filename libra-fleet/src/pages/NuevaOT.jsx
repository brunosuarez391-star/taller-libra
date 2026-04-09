import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { SERVICIOS } from '../lib/data'
import { crearOrden, crearServiciosOT, actualizarKm } from '../lib/api'
import EtiquetaService from '../components/EtiquetaService'

export default function NuevaOT({ vehiculos, clientes, onCrear }) {
  const navigate = useNavigate()
  const [mostrarEtiqueta, setMostrarEtiqueta] = useState(false)
  const [otCreada, setOtCreada] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const [form, setForm] = useState({
    cliente_id: '',
    vehiculo_id: '',
    km: '',
    patente: '',
    servicio: 'service_20k',
    mecanico: 'Bruno Suarez',
    observaciones: '',
  })

  const vehiculo = vehiculos.find(v => v.id === form.vehiculo_id)
  const cliente = clientes.find(c => c.id === form.cliente_id)
  const servicio = SERVICIOS[form.servicio]

  const vehiculosCliente = form.cliente_id
    ? vehiculos.filter(v => v.cliente_id === form.cliente_id)
    : vehiculos

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)

    try {
      const km = parseInt(form.km) || 0
      const otNum = 'OT-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')

      const orden = {
        ot_numero: otNum,
        vehiculo_id: form.vehiculo_id,
        cliente_id: form.cliente_id,
        km_ingreso: km,
        km_proximo: km + 20000,
        patente: form.patente.toUpperCase(),
        servicio_tipo: form.servicio,
        servicio_nombre: servicio.nombre,
        mecanico: form.mecanico,
        observaciones: form.observaciones,
        estado: 'Ingresado',
      }

      const otDB = await crearOrden(orden)
      await crearServiciosOT(otDB.id, servicio.items)
      await actualizarKm(form.vehiculo_id, km)

      const otCompleta = {
        ...otDB,
        codigo: vehiculo?.codigo,
        modelo: `${vehiculo?.marca} ${vehiculo?.modelo} ${vehiculo?.tipo}`,
        cliente: cliente?.nombre,
        patente: form.patente.toUpperCase(),
        km,
        proximo_km: km + 20000,
        items: servicio.items,
        fecha: new Date().toLocaleDateString('es-AR'),
      }

      setOtCreada(otCompleta)
      setMostrarEtiqueta(true)
      onCrear()
    } catch (err) {
      alert('Error creando OT: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (mostrarEtiqueta && otCreada) {
    return (
      <div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
          <h2 className="text-xl font-bold text-green-800 mb-2">OT Creada: {otCreada.ot_numero}</h2>
          <p className="text-green-700">{otCreada.codigo} — {otCreada.modelo} — {otCreada.cliente}</p>
          {otCreada.patente && <p className="text-green-700 font-bold">Patente: {otCreada.patente}</p>}
          <p className="text-green-600 text-sm">KM: {otCreada.km?.toLocaleString()} | Próximo: {otCreada.proximo_km?.toLocaleString()} km</p>
          <p className="text-green-500 text-xs mt-1">Guardado en Supabase</p>
        </div>

        <div className="flex gap-4 mb-6 flex-wrap">
          <button onClick={() => window.print()} className="bg-[#1F3864] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#2E75B6]">
            Imprimir Etiqueta
          </button>
          <button onClick={() => navigate('/ordenes')} className="bg-slate-200 text-slate-700 px-6 py-3 rounded-lg font-bold hover:bg-slate-300">
            Ver OTs
          </button>
          <button onClick={() => { setMostrarEtiqueta(false); setOtCreada(null); setForm(f => ({ ...f, km: '', observaciones: '' })) }} className="bg-[#2E75B6] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#1F3864]">
            + Otra OT
          </button>
        </div>

        <div className="flex justify-center">
          <EtiquetaService ot={otCreada} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1F3864] mb-6">Nueva Orden de Trabajo</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 max-w-2xl">
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-1">Cliente</label>
          <select value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value, vehiculo_id: '' })} required className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none">
            <option value="">Seleccionar cliente...</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-1">Unidad</label>
          <select value={form.vehiculo_id} onChange={e => setForm({ ...form, vehiculo_id: e.target.value })} required className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none">
            <option value="">Seleccionar unidad...</option>
            {vehiculosCliente.map(v => <option key={v.id} value={v.id}>{v.codigo} — {v.marca} {v.modelo} {v.tipo} ({v.categoria})</option>)}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-1">Patente</label>
          <input type="text" value={form.patente} onChange={e => setForm({ ...form, patente: e.target.value.toUpperCase() })} placeholder="Ej: AB 123 CD" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none uppercase font-mono text-lg tracking-wider" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-1">Kilómetros actuales</label>
          <input type="number" value={form.km} onChange={e => setForm({ ...form, km: e.target.value })} placeholder="Ej: 85320" required className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none" />
          {form.km && <p className="text-sm text-[#2E75B6] mt-1 font-bold">Próximo service: {(parseInt(form.km) + 20000).toLocaleString()} km</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Service</label>
          <select value={form.servicio} onChange={e => setForm({ ...form, servicio: e.target.value })} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none">
            {Object.entries(SERVICIOS).map(([key, s]) => <option key={key} value={key}>{s.nombre} ({s.tiempo})</option>)}
          </select>
          <div className="mt-2 bg-[#D6E4F0] rounded-lg p-3 text-xs">
            {servicio.items.map((item, i) => <p key={i}>✓ {item}</p>)}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-1">Mecánico</label>
          <input type="text" value={form.mecanico} onChange={e => setForm({ ...form, mecanico: e.target.value })} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none" />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-1">Observaciones</label>
          <textarea value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} rows="3" placeholder="Notas adicionales..." className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none" />
        </div>

        <button type="submit" disabled={guardando} className="w-full bg-[#1F3864] text-white py-3 rounded-lg font-bold text-lg hover:bg-[#2E75B6] transition-colors disabled:opacity-50">
          {guardando ? 'Guardando...' : 'Crear Orden de Trabajo'}
        </button>
      </form>
    </div>
  )
}
