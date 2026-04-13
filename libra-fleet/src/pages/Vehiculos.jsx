import { useState } from 'react'
import { Link } from 'react-router-dom'
import { actualizarKm } from '../lib/api'

export default function Vehiculos({ vehiculos, onRefresh }) {
  const [editandoKm, setEditandoKm] = useState(null)
  const [kmValue, setKmValue] = useState('')
  const [filtro, setFiltro] = useState('todos')

  const categorias = [...new Set(vehiculos.map(v => v.categoria))].filter(Boolean)
  const filtrados = filtro === 'todos' ? vehiculos : vehiculos.filter(v => v.categoria === filtro)

  const handleGuardarKm = async (vehiculoId) => {
    try {
      await actualizarKm(vehiculoId, parseInt(kmValue) || 0)
      setEditandoKm(null)
      if (onRefresh) await onRefresh()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1F3864] dark:text-blue-300">Flota</h2>
          <p className="text-slate-500 dark:text-slate-400">{vehiculos.length} unidades registradas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFiltro('todos')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filtro === 'todos' ? 'bg-[#1F3864] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
            Todos ({vehiculos.length})
          </button>
          {categorias.map(cat => (
            <button key={cat} onClick={() => setFiltro(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filtro === cat ? 'bg-[#2E75B6] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              {cat} ({vehiculos.filter(v => v.categoria === cat).length})
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.map((v) => (
          <div key={v.id} className="bg-white dark:bg-slate-800 rounded-xl shadow hover:shadow-lg transition-shadow p-5 border-l-4 border-[#2E75B6] dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="bg-[#1F3864] text-white px-3 py-1 rounded-full text-sm font-bold">{v.codigo}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                v.categoria === 'Camión Pesado' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
              }`}>{v.categoria}</span>
            </div>
            <h3 className="font-bold text-lg text-[#1F3864] dark:text-blue-300">{v.marca} {v.modelo}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{v.tipo}</p>
            {v.clientes && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Cliente: {v.clientes.nombre}</p>}

            {/* KM con edición inline */}
            <div className="mt-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-2">
              {editandoKm === v.id ? (
                <div className="flex gap-2 items-center">
                  <input type="number" value={kmValue} onChange={e => setKmValue(e.target.value)} className="flex-1 border dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded px-2 py-1 text-sm" placeholder="KM actuales" autoFocus />
                  <button onClick={() => handleGuardarKm(v.id)} className="bg-[#2E75B6] text-white px-2 py-1 rounded text-xs font-bold">OK</button>
                  <button onClick={() => setEditandoKm(null)} className="text-slate-400 text-xs">✕</button>
                </div>
              ) : (
                <div className="flex items-center justify-between cursor-pointer" onClick={() => { setEditandoKm(v.id); setKmValue(v.km_actuales || '') }}>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">KM actuales</p>
                    <p className="font-bold text-[#2E75B6] dark:text-blue-400 font-mono">{v.km_actuales ? v.km_actuales.toLocaleString() + ' km' : 'Sin datos'}</p>
                  </div>
                  <span className="text-slate-300 dark:text-slate-600 text-xs">✏️ editar</span>
                </div>
              )}
            </div>

            {/* Link a detalle */}
            <Link
              to={`/vehiculo/${v.codigo}`}
              className="mt-3 block text-center bg-[#D6E4F0] dark:bg-slate-700 text-[#1F3864] dark:text-blue-300 py-2 rounded-lg text-xs font-bold hover:bg-[#2E75B6] hover:text-white dark:hover:bg-slate-600 transition-colors"
            >
              Ver historial completo →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
