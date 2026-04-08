import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FLOTA_ACACIO, SERVICIOS, ESTADOS_OT } from '../lib/data'
import EtiquetaService from '../components/EtiquetaService'

export default function NuevaOT({ onCrear }) {
  const navigate = useNavigate()
  const printRef = useRef()
  const [mostrarEtiqueta, setMostrarEtiqueta] = useState(false)
  const [otCreada, setOtCreada] = useState(null)

  const [form, setForm] = useState({
    cliente: 'Acacio Lorenzo',
    codigo: 'U05',
    km: '',
    servicio: 'service_20k',
    mecanico: 'Bruno Suarez',
    observaciones: '',
  })

  const vehiculo = FLOTA_ACACIO.find(v => v.codigo === form.codigo)
  const servicio = SERVICIOS[form.servicio]

  const handleSubmit = (e) => {
    e.preventDefault()
    const km = parseInt(form.km) || 0
    const otNum = 'OT-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
    const fecha = new Date().toLocaleDateString('es-AR')

    const ot = {
      ot_numero: otNum,
      cliente: form.cliente,
      codigo: form.codigo,
      modelo: vehiculo ? `${vehiculo.modelo} ${vehiculo.tipo}` : form.codigo,
      km,
      proximo_km: km + 20000,
      servicio_tipo: form.servicio,
      servicio_nombre: servicio.nombre,
      items: servicio.items,
      tiempo: servicio.tiempo,
      mecanico: form.mecanico,
      observaciones: form.observaciones,
      fecha,
      estado: 'Ingresado',
    }

    onCrear(ot)
    setOtCreada(ot)
    setMostrarEtiqueta(true)
  }

  const handleImprimir = () => {
    window.print()
  }

  if (mostrarEtiqueta && otCreada) {
    return (
      <div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
          <h2 className="text-xl font-bold text-green-800 mb-2">OT Creada: {otCreada.ot_numero}</h2>
          <p className="text-green-700">{otCreada.codigo} — {otCreada.modelo} — {otCreada.cliente}</p>
          <p className="text-green-600 text-sm">KM: {otCreada.km?.toLocaleString()} | Próximo: {otCreada.proximo_km?.toLocaleString()} km</p>
        </div>

        <div className="flex gap-4 mb-6">
          <button onClick={handleImprimir} className="bg-[#1F3864] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#2E75B6] transition-colors">
            🖨️ Imprimir Etiqueta
          </button>
          <button onClick={() => navigate('/ordenes')} className="bg-slate-200 text-slate-700 px-6 py-3 rounded-lg font-bold hover:bg-slate-300 transition-colors">
            Ver OTs
          </button>
          <button onClick={() => { setMostrarEtiqueta(false); setOtCreada(null); setForm(f => ({ ...f, km: '', observaciones: '' })) }} className="bg-[#2E75B6] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#1F3864] transition-colors">
            + Otra OT
          </button>
        </div>

        <div className="flex justify-center" ref={printRef}>
          <EtiquetaService ot={otCreada} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1F3864] mb-6">Nueva Orden de Trabajo</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 max-w-2xl">
        {/* Cliente */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-1">Cliente</label>
          <select value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none">
            <option>Acacio Lorenzo</option>
            <option>La Anónima</option>
            <option>PECOM</option>
          </select>
        </div>

        {/* Unidad */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-1">Unidad</label>
          <select value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none">
            {FLOTA_ACACIO.map(v => (
              <option key={v.codigo} value={v.codigo}>{v.codigo} — {v.modelo} {v.tipo} ({v.categoria})</option>
            ))}
          </select>
          {vehiculo && (
            <p className="text-sm text-slate-500 mt-1">{vehiculo.modelo} {vehiculo.tipo} — {vehiculo.categoria}</p>
          )}
        </div>

        {/* KM */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-1">Kilómetros actuales</label>
          <input type="number" value={form.km} onChange={e => setForm({ ...form, km: e.target.value })} placeholder="Ej: 85320" required className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none" />
          {form.km && <p className="text-sm text-[#2E75B6] mt-1 font-bold">Próximo service: {(parseInt(form.km) + 20000).toLocaleString()} km</p>}
        </div>

        {/* Servicio */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Service</label>
          <select value={form.servicio} onChange={e => setForm({ ...form, servicio: e.target.value })} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none">
            {Object.entries(SERVICIOS).map(([key, s]) => (
              <option key={key} value={key}>{s.nombre} ({s.tiempo})</option>
            ))}
          </select>
          <div className="mt-2 bg-[#D6E4F0] rounded-lg p-3 text-xs">
            {servicio.items.map((item, i) => (
              <p key={i}>✓ {item}</p>
            ))}
          </div>
        </div>

        {/* Mecánico */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-1">Mecánico</label>
          <input type="text" value={form.mecanico} onChange={e => setForm({ ...form, mecanico: e.target.value })} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none" />
        </div>

        {/* Observaciones */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-1">Observaciones</label>
          <textarea value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} rows="3" placeholder="Notas adicionales..." className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none" />
        </div>

        <button type="submit" className="w-full bg-[#1F3864] text-white py-3 rounded-lg font-bold text-lg hover:bg-[#2E75B6] transition-colors">
          Crear Orden de Trabajo
        </button>
      </form>
    </div>
  )
}
