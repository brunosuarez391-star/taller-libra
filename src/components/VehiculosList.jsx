import React, { useState } from 'react'
import VehiculoForm from './VehiculoForm'

const CATEGORIAS = ['Todos', 'Camión Pesado', 'Tractor', 'Semirremolque']
const ESTADOS = {
  activo: { label: 'Activo', cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
  mantenimiento: { label: 'En taller', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  inactivo: { label: 'Inactivo', cls: 'bg-muted/10 text-muted border-border' },
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
      onToast?.('Vehículo eliminado', 'info')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">Camiones</h1>
        <button
          onClick={() => { setEditando(null); setMostrarForm(true) }}
          className="bg-libra-mid text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-libra-dark transition-colors"
        >
          + Nuevo vehículo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5">
        <input
          type="text"
          placeholder="Buscar por código, modelo o cliente..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="flex-1 bg-card border border-border rounded-lg px-4 py-2 text-sm text-text placeholder-muted focus:outline-none focus:border-libra-mid"
        />
        <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
          {CATEGORIAS.map(cat => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filtroCategoria === cat
                  ? 'bg-libra-dark text-white'
                  : 'text-muted hover:text-text'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Código</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Modelo</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Categoría</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Kilómetros</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Cliente</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Estado</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(v => {
              const est = ESTADOS[v.estado] || ESTADOS.inactivo
              return (
                <tr key={v.id} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-semibold text-libra-light">{v.codigo}</td>
                  <td className="px-5 py-3.5 text-sm text-text">{v.marca} {v.modelo}</td>
                  <td className="px-5 py-3.5 text-sm text-muted">{v.categoria}</td>
                  <td className="px-5 py-3.5 text-sm text-muted">{v.km_actuales.toLocaleString('es-AR')} km</td>
                  <td className="px-5 py-3.5 text-sm text-muted">{v.cliente || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold border ${est.cls}`}>
                      {est.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleEditar(v)}
                      className="text-xs text-libra-mid hover:text-libra-light font-medium mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(v.id)}
                      className="text-xs text-red-400/60 hover:text-red-400 font-medium"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtrados.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">
            No se encontraron vehículos con esos filtros.
          </div>
        )}
      </div>

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
