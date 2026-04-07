import React, { useState } from 'react'
import { generarIdOT, serviciosService20k } from '../lib/demoData'

export default function OTForm({ vehiculos, onGuardar, onCerrar }) {
  const [form, setForm] = useState({
    vehiculo_id: vehiculos[0]?.id || '',
    km_ingreso: vehiculos[0]?.km_actuales || 0,
    fecha: new Date().toISOString().split('T')[0],
    mecanico: 'Bruno Suarez',
    servicios: [],
    observaciones: '',
    km_proximo_service: (vehiculos[0]?.km_actuales || 0) + 20000,
  })

  const inputCls = "w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-muted focus:outline-none focus:border-libra-mid"
  const labelCls = "text-xs font-medium text-muted mb-1.5 block"

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => {
      const next = { ...prev, [name]: name === 'km_ingreso' || name === 'km_proximo_service' ? Number(value) : value }
      if (name === 'km_ingreso') next.km_proximo_service = Number(value) + 20000
      if (name === 'vehiculo_id') {
        const v = vehiculos.find(v => v.id === value)
        if (v) { next.km_ingreso = v.km_actuales; next.km_proximo_service = v.km_actuales + 20000 }
      }
      return next
    })
  }

  function toggleServicio(servicio) {
    setForm(prev => ({
      ...prev,
      servicios: prev.servicios.includes(servicio)
        ? prev.servicios.filter(s => s !== servicio)
        : [...prev.servicios, servicio],
    }))
  }

  function seleccionarTodos() {
    setForm(prev => ({
      ...prev,
      servicios: prev.servicios.length === serviciosService20k.length ? [] : [...serviciosService20k],
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (form.servicios.length === 0) { alert('Seleccioná al menos un servicio.'); return }
    onGuardar({ ...form, id: generarIdOT(), estado: 'ingresado' })
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text">Nueva Orden de Trabajo</h2>
          <button onClick={onCerrar} className="text-muted hover:text-text text-lg">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Vehículo</label>
            <select name="vehiculo_id" value={form.vehiculo_id} onChange={handleChange} required className={inputCls}>
              {vehiculos.map(v => (
                <option key={v.id} value={v.id}>{v.codigo} – {v.marca} {v.modelo} ({v.km_actuales.toLocaleString('es-AR')} km)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Km Ingreso</label>
              <input name="km_ingreso" type="number" value={form.km_ingreso} onChange={handleChange} required min="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Fecha</label>
              <input name="fecha" type="date" value={form.fecha} onChange={handleChange} required className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Próximo Service (km)</label>
              <input name="km_proximo_service" type="number" value={form.km_proximo_service} onChange={handleChange} min="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Mecánico</label>
              <input name="mecanico" value={form.mecanico} onChange={handleChange} required className={inputCls} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls}>Servicios a Realizar</label>
              <button type="button" onClick={seleccionarTodos} className="text-xs text-libra-mid hover:text-libra-light font-medium">
                {form.servicios.length === serviciosService20k.length ? 'Deseleccionar' : 'Service 20K completo'}
              </button>
            </div>
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {serviciosService20k.map((servicio, i) => (
                <label key={i}
                  className={`flex items-start gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    form.servicios.includes(servicio) ? 'border-libra-mid bg-libra-mid/5' : 'border-border hover:border-muted'
                  }`}>
                  <input type="checkbox" checked={form.servicios.includes(servicio)} onChange={() => toggleServicio(servicio)}
                    className="mt-0.5 accent-libra-mid" />
                  <span className="text-xs text-text">{servicio}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Observaciones</label>
            <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={3}
              placeholder="Notas adicionales..." className={`${inputCls} resize-none`} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCerrar}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:text-text transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2.5 bg-libra-mid text-white rounded-lg text-sm font-semibold hover:bg-libra-dark transition-colors">
              Crear OT
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
