import React, { useState } from 'react'
import { generarIdOT, serviciosService20k } from '../lib/demoData'

export default function OTForm({ vehiculos, onGuardar, onCerrar }) {
  const [form, setForm] = useState({
    vehiculo_id: vehiculos[0]?.id || '',
    km_ingreso: 0,
    fecha: new Date().toISOString().split('T')[0],
    mecanico: 'Bruno Suarez',
    servicios: [],
    observaciones: '',
    km_proximo_service: 0,
  })

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => {
      const next = {
        ...prev,
        [name]: name === 'km_ingreso' || name === 'km_proximo_service' ? Number(value) : value,
      }
      // Auto-calcular próximo service al cambiar km
      if (name === 'km_ingreso') {
        next.km_proximo_service = Number(value) + 20000
      }
      // Auto-llenar km al seleccionar vehículo
      if (name === 'vehiculo_id') {
        const v = vehiculos.find(v => v.id === value)
        if (v) {
          next.km_ingreso = v.km_actuales
          next.km_proximo_service = v.km_actuales + 20000
        }
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
    if (form.servicios.length === 0) {
      alert('Seleccioná al menos un servicio.')
      return
    }
    onGuardar({
      ...form,
      id: generarIdOT(),
      estado: 'ingresado',
    })
  }

  const vehiculoSeleccionado = vehiculos.find(v => v.id === form.vehiculo_id)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-libra-dark">Nueva Orden de Trabajo</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Vehículo */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Vehículo</label>
            <select
              name="vehiculo_id"
              value={form.vehiculo_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-libra-mid/30"
            >
              {vehiculos.map(v => (
                <option key={v.id} value={v.id}>
                  {v.codigo} – M.B. {v.modelo} ({v.km_actuales.toLocaleString('es-AR')} km)
                </option>
              ))}
            </select>
          </div>

          {/* Km y fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Km Ingreso</label>
              <input
                name="km_ingreso"
                type="number"
                value={form.km_ingreso}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-libra-mid/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Fecha</label>
              <input
                name="fecha"
                type="date"
                value={form.fecha}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-libra-mid/30"
              />
            </div>
          </div>

          {/* Próximo service */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Próximo Service (km)</label>
              <input
                name="km_proximo_service"
                type="number"
                value={form.km_proximo_service}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-libra-mid/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Mecánico</label>
              <input
                name="mecanico"
                value={form.mecanico}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-libra-mid/30"
              />
            </div>
          </div>

          {/* Servicios */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">Servicios a Realizar</label>
              <button
                type="button"
                onClick={seleccionarTodos}
                className="text-xs text-libra-mid hover:text-libra-dark font-medium"
              >
                {form.servicios.length === serviciosService20k.length ? 'Deseleccionar todos' : 'Service 20.000 km completo'}
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {serviciosService20k.map((servicio, i) => (
                <label
                  key={i}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    form.servicios.includes(servicio)
                      ? 'border-libra-mid bg-libra-mid/5'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.servicios.includes(servicio)}
                    onChange={() => toggleServicio(servicio)}
                    className="mt-0.5 accent-libra-mid"
                  />
                  <span className="text-xs text-gray-700">{servicio}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Observaciones</label>
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              rows={3}
              placeholder="Notas adicionales..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-libra-mid/30 resize-none"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-libra-mid text-white rounded-xl text-sm font-semibold hover:bg-libra-dark transition-colors"
            >
              Crear OT
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
