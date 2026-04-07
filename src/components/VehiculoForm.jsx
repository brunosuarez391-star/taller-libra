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
    onGuardar({ ...form, id: form.id || form.codigo || `V${Date.now()}` })
  }

  const inputCls = "w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-muted focus:outline-none focus:border-libra-mid"
  const labelCls = "text-xs font-medium text-muted mb-1.5 block"

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text">
            {vehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}
          </h2>
          <button onClick={onCerrar} className="text-muted hover:text-text text-lg">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Código</label>
              <input name="codigo" value={form.codigo} onChange={handleChange} required placeholder="U14" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Marca</label>
              <input name="marca" value={form.marca} onChange={handleChange} required className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Modelo</label>
            <input name="modelo" value={form.modelo} onChange={handleChange} required placeholder="1634 Semi Largo 3 Ejes" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Año</label>
              <input name="anio" type="number" value={form.anio} onChange={handleChange} min="2000" max="2030" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Categoría</label>
              <select name="categoria" value={form.categoria} onChange={handleChange} className={inputCls}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Km Actuales</label>
              <input name="km_actuales" type="number" value={form.km_actuales} onChange={handleChange} min="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <select name="estado" value={form.estado} onChange={handleChange} className={inputCls}>
                {ESTADOS.map(e => (
                  <option key={e} value={e}>
                    {e === 'activo' ? 'Activo' : e === 'mantenimiento' ? 'En taller' : 'Inactivo'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Cliente</label>
            <input name="cliente" value={form.cliente} onChange={handleChange} placeholder="Nombre del cliente" className={inputCls} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCerrar}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-muted hover:text-text hover:bg-bg transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2.5 bg-libra-mid text-white rounded-lg text-sm font-semibold hover:bg-libra-dark transition-colors">
              {vehiculo ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
