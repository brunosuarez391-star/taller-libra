import React, { useState } from 'react'
import VehiculoForm from './VehiculoForm'

const CATEGORIAS = ['Todos', 'Camión Pesado', 'Tractor', 'Semirremolque']
const ESTADOS = {
  activo: { label: 'Activo', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  mantenimiento: { label: 'Mantenimiento', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  inactivo: { label: 'Inactivo', bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
}

export default function VehiculosList({ vehiculos, setVehiculos, onToast }) {
  const [filtroCategoria, setFiltroCategoria] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)

  const filtrados = vehiculos.filter(v => {
    const matchCat = filtroCategoria === 'Todos' || v.categoria === filtroCategoria
    const matchBusq = !busqueda ||
      v.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.modelo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (v.cliente || '').toLowerCase().includes(busqueda.toLowerCase())
    return matchCat && matchBusq
  })

  const activos = vehiculos.filter(v => v.estado === 'activo').length
  const enMant = vehiculos.filter(v => v.estado === 'mantenimiento').length
  const kmTotal = vehiculos.reduce((s, v) => s + v.km_actuales, 0)

  function handleGuardar(vehiculo) {
    if (editando) {
      setVehiculos(prev => prev.map(v => v.id === vehiculo.id ? vehiculo : v))
      onToast?.(`Vehículo ${vehiculo.codigo} actualizado`, 'exito')
    } else {
      setVehiculos(prev => [...prev, vehiculo])
      onToast?.(`Vehículo ${vehiculo.codigo} creado`, 'exito')
    }
    setMostrarForm(false)
    setEditando(null)
  }

  function handleEditar(v) {
    setEditando(v)
    setMostrarForm(true)
  }

  function handleEliminar(id) {
    if (confirm('¿Estás seguro de eliminar este vehículo?')) {
      setVehiculos(prev => prev.filter(v => v.id !== id))
      onToast?.(`Vehículo eliminado`, 'info')
    }
  }

  return (
    <div>
      {/* Stats rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-libra-dark">{vehiculos.length}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-green-600">{activos}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Activos</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-amber-600">{enMant}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Mantenimiento</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-libra-mid text-lg">{kmTotal.toLocaleString('es-AR')}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Km Totales</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por código, modelo o cliente..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-libra-mid/30 focus:border-libra-mid"
        />
        <div className="flex gap-2 overflow-x-auto">
          {CATEGORIAS.map(cat => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filtroCategoria === cat
                  ? 'bg-libra-dark text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setEditando(null); setMostrarForm(true) }}
          className="bg-libra-mid text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-libra-dark transition-colors whitespace-nowrap"
        >
          + Nuevo Vehículo
        </button>
      </div>

      {/* Lista de vehículos - cards mobile */}
      <div className="space-y-3">
        {filtrados.map(v => {
          const est = ESTADOS[v.estado] || ESTADOS.inactivo
          return (
            <div key={v.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-libra-dark/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-libra-dark">{v.codigo}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-libra-dark">
                      M.B. {v.modelo}
                    </div>
                    <div className="text-xs text-gray-500">
                      {v.categoria} · {v.anio}
                    </div>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${est.bg} ${est.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${est.dot}`} />
                  {est.label}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-4">
                  <div>
                    <div className="text-xs text-gray-400">Kilometraje</div>
                    <div className="text-sm font-semibold text-libra-mid">
                      {v.km_actuales.toLocaleString('es-AR')} km
                    </div>
                  </div>
                  {v.cliente && (
                    <div>
                      <div className="text-xs text-gray-400">Cliente</div>
                      <div className="text-sm text-gray-700">{v.cliente}</div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditar(v)}
                    className="text-xs text-libra-mid hover:text-libra-dark font-medium px-2 py-1"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(v.id)}
                    className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtrados.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No se encontraron vehículos con esos filtros.
        </div>
      )}

      {/* Modal formulario */}
      {mostrarForm && (
        <VehiculoForm
          vehiculo={editando}
          onGuardar={handleGuardar}
          onCerrar={() => { setMostrarForm(false); setEditando(null) }}
        />
      )}
    </div>
  )
}
