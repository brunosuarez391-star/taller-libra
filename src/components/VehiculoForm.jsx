import React, { useState } from 'react'

const CATEGORIAS = ['Camión Pesado', 'Tractor', 'Semirremolque']
const ESTADOS = ['activo', 'mantenimiento', 'inactivo']

export default function VehiculoForm({ vehiculo, onGuardar, onCerrar }) {
  const [form, setForm] = useState(vehiculo || {
    codigo: '',
    marca: 'Mercedes-Benz',
    modelo: '',
    anio: new Date().getFullYear(),
    categoria: 'Camión Pesado',
    km_actuales: 0,
    estado: 'activo',
    cliente: '',
  })

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'km_actuales' || name === 'anio' ? Number(value) : value,
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onGuardar({
      ...form,
      id: form.id || form.codigo || `V${Date.now()}`,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-libra-dark">
            {vehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}
          </h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Código</label>
              <input
                name="codigo"
                value={form.codigo}
                onChange={handleChange}
                required
                placeholder="U14"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-libra-mid/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Marca</label>
              <input
                name="marca"
                value={form.marca}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-libra-mid/30"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Modelo</label>
            <input
              name="modelo"
              value={form.modelo}
              onChange={handleChange}
              required
              placeholder="1634 Semi Largo 3 Ejes"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-libra-mid/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Año</label>
              <input
                name="anio"
                type="number"
                value={form.anio}
                onChange={handleChange}
                min="2000"
                max="2030"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-libra-mid/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Categoría</label>
              <select
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-libra-mid/30"
              >
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Km Actuales</label>
              <input
                name="km_actuales"
                type="number"
                value={form.km_actuales}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-libra-mid/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Estado</label>
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-libra-mid/30"
              >
                {ESTADOS.map(e => (
                  <option key={e} value={e}>
                    {e === 'activo' ? 'Activo' : e === 'mantenimiento' ? 'Mantenimiento' : 'Inactivo'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Cliente</label>
            <input
              name="cliente"
              value={form.cliente}
              onChange={handleChange}
              placeholder="Nombre del cliente"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-libra-mid/30"
            />
          </div>

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
              {vehiculo ? 'Guardar Cambios' : 'Crear Vehículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
