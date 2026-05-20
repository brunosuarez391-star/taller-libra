import { useState } from 'react'
import { Link } from 'react-router-dom'
import { actualizarKm, actualizarVehiculo, eliminarVehiculo } from '../lib/api'
import { CATEGORIAS_VEHICULO, MARCAS_COMUNES } from '../lib/data'

export default function Vehiculos({ vehiculos, clientes = [], onRefresh }) {
  const [editandoKm, setEditandoKm] = useState(null)
  const [kmValue, setKmValue] = useState('')
  const [editandoPatente, setEditandoPatente] = useState(null)
  const [patenteValue, setPatenteValue] = useState('')
  const [editandoChofer, setEditandoChofer] = useState(null)
  const [choferValue, setChoferValue] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [editModal, setEditModal] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [confirmEliminar, setConfirmEliminar] = useState(null)
  const [loading, setLoading] = useState(false)

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

  const handleGuardarPatente = async (vehiculoId) => {
    try {
      await actualizarVehiculo(vehiculoId, { patente: patenteValue.trim().toUpperCase() || null })
      setEditandoPatente(null)
      if (onRefresh) await onRefresh()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const handleGuardarChofer = async (vehiculoId) => {
    try {
      await actualizarVehiculo(vehiculoId, { chofer: choferValue.trim() || null })
      setEditandoChofer(null)
      if (onRefresh) await onRefresh()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const abrirEdicion = (v) => {
    setEditModal(v.id)
    setEditForm({
      codigo: v.codigo || '',
      marca: v.marca || '',
      modelo: v.modelo || '',
      tipo: v.tipo || '',
      categoria: v.categoria || 'Camión Pesado',
      anio: v.anio || '',
      cliente_id: v.cliente_id || '',
      activo: v.activo !== false,
      patente: v.patente || '',
      chofer: v.chofer || '',
      chofer_telefono: v.chofer_telefono || '',
      vtv_vencimiento: v.vtv_vencimiento || '',
      seguro_vencimiento: v.seguro_vencimiento || '',
      seguro_compania: v.seguro_compania || '',
      seguro_poliza: v.seguro_poliza || '',
      ruta_vencimiento: v.ruta_vencimiento || '',
      rto_vencimiento: v.rto_vencimiento || '',
    })
  }

  const guardarEdicion = async () => {
    if (!editModal) return
    setLoading(true)
    try {
      await actualizarVehiculo(editModal, {
        codigo: editForm.codigo.toUpperCase(),
        marca: editForm.marca,
        modelo: editForm.modelo,
        tipo: editForm.tipo || null,
        categoria: editForm.categoria,
        anio: editForm.anio ? parseInt(editForm.anio) : null,
        cliente_id: editForm.cliente_id || null,
        activo: editForm.activo,
        patente: editForm.patente?.trim().toUpperCase() || null,
        chofer: editForm.chofer?.trim() || null,
        chofer_telefono: editForm.chofer_telefono?.trim() || null,
        vtv_vencimiento: editForm.vtv_vencimiento || null,
        seguro_vencimiento: editForm.seguro_vencimiento || null,
        seguro_compania: editForm.seguro_compania?.trim() || null,
        seguro_poliza: editForm.seguro_poliza?.trim() || null,
        ruta_vencimiento: editForm.ruta_vencimiento || null,
        rto_vencimiento: editForm.rto_vencimiento || null,
      })
      await onRefresh()
      setEditModal(null)
    } catch (err) {
      alert('Error guardando: ' + err.message)
    }
    setLoading(false)
  }

  const eliminar = async () => {
    if (!confirmEliminar) return
    setLoading(true)
    try {
      await eliminarVehiculo(confirmEliminar.id)
      await onRefresh()
      setConfirmEliminar(null)
    } catch (err) {
      alert('Error eliminando: ' + err.message + '\n\nNota: si el vehículo tiene OTs, primero eliminá esas OTs.')
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1F3864] dark:text-blue-300">Flota</h2>
          <p className="text-slate-500 dark:text-slate-400">{vehiculos.length} unidades registradas</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            to="/nuevo-vehiculo"
            className="bg-[#1F3864] hover:bg-[#2E75B6] text-white px-4 py-2 rounded-lg text-xs font-bold"
          >
            + Nuevo Vehículo
          </Link>
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
              <div className="flex items-center gap-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  v.categoria === 'Camión Pesado' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                }`}>{v.categoria}</span>
                <button
                  onClick={() => abrirEdicion(v)}
                  className="text-slate-400 dark:text-slate-500 hover:text-[#2E75B6] p-1"
                  title="Editar vehículo"
                >
                  ✏️
                </button>
              </div>
            </div>
            <h3 className="font-bold text-lg text-[#1F3864] dark:text-blue-300">{v.marca} {v.modelo}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{v.tipo} {v.anio && `· ${v.anio}`}</p>
            {v.clientes && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Cliente: {v.clientes.nombre}</p>}

            {/* Patente editable inline */}
            <div className="mt-2">
              {editandoPatente === v.id ? (
                <div className="flex gap-1 items-center bg-amber-50 dark:bg-amber-900/30 rounded p-1.5">
                  <input
                    type="text"
                    value={patenteValue}
                    onChange={e => setPatenteValue(e.target.value.toUpperCase())}
                    placeholder="AB123CD"
                    className="flex-1 border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 dark:text-slate-100 rounded px-2 py-1 text-sm font-mono uppercase"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleGuardarPatente(v.id)
                      if (e.key === 'Escape') setEditandoPatente(null)
                    }}
                  />
                  <button onClick={() => handleGuardarPatente(v.id)} className="bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded text-xs font-bold">OK</button>
                  <button onClick={() => setEditandoPatente(null)} className="text-slate-400 px-1 text-xs">✕</button>
                </div>
              ) : (
                <div
                  onClick={() => { setEditandoPatente(v.id); setPatenteValue(v.patente || '') }}
                  className="flex items-center justify-between cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded px-2 py-1 -mx-2"
                  title="Click para editar patente"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Patente:</span>
                    {v.patente ? (
                      <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-mono font-bold text-sm">
                        {v.patente}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500 italic">Sin cargar — click para agregar</span>
                    )}
                  </div>
                  <span className="text-slate-300 dark:text-slate-600 text-xs">✏️</span>
                </div>
              )}
            </div>

            {/* Chofer editable inline */}
            <div className="mt-1">
              {editandoChofer === v.id ? (
                <div className="flex gap-1 items-center bg-blue-50 dark:bg-blue-900/30 rounded p-1.5">
                  <input
                    type="text"
                    value={choferValue}
                    onChange={e => setChoferValue(e.target.value)}
                    placeholder="Nombre del chofer"
                    className="flex-1 border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 dark:text-slate-100 rounded px-2 py-1 text-sm"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleGuardarChofer(v.id)
                      if (e.key === 'Escape') setEditandoChofer(null)
                    }}
                  />
                  <button onClick={() => handleGuardarChofer(v.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-bold">OK</button>
                  <button onClick={() => setEditandoChofer(null)} className="text-slate-400 px-1 text-xs">✕</button>
                </div>
              ) : (
                <div
                  onClick={() => { setEditandoChofer(v.id); setChoferValue(v.chofer || '') }}
                  className="flex items-center justify-between cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded px-2 py-1 -mx-2"
                  title="Click para editar chofer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Chofer:</span>
                    {v.chofer ? (
                      <span className="text-blue-700 dark:text-blue-300 text-xs">👤 {v.chofer}</span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500 italic">Sin cargar</span>
                    )}
                  </div>
                  <span className="text-slate-300 dark:text-slate-600 text-xs">✏️</span>
                </div>
              )}
            </div>
            {(v.vtv_vencimiento || v.seguro_vencimiento || v.ruta_vencimiento) && (
              <div className="flex flex-wrap gap-1 mt-1 text-xs">
                {[
                  ['VTV', v.vtv_vencimiento],
                  ['Seguro', v.seguro_vencimiento],
                  ['RUTA', v.ruta_vencimiento],
                ].filter(([, f]) => f).map(([label, fecha]) => {
                  const dias = Math.floor((new Date(fecha + 'T12:00:00') - new Date()) / 86400000)
                  const tone = dias < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    : dias <= 7 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                    : dias <= 30 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                    : 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  return (
                    <span key={label} className={`${tone} px-2 py-0.5 rounded`}>
                      {label}: {new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR')}
                    </span>
                  )
                })}
              </div>
            )}

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

      {/* Modal de edición */}
      {editModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto text-slate-800 dark:text-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#1F3864] dark:text-blue-300">Editar Vehículo</h3>
              <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Código</label>
                  <input
                    type="text"
                    value={editForm.codigo}
                    onChange={e => setEditForm({ ...editForm, codigo: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Categoría</label>
                  <select
                    value={editForm.categoria}
                    onChange={e => setEditForm({ ...editForm, categoria: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
                  >
                    {CATEGORIAS_VEHICULO.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Marca</label>
                <input
                  type="text"
                  value={editForm.marca}
                  onChange={e => setEditForm({ ...editForm, marca: e.target.value })}
                  list="marcas-edit"
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
                />
                <datalist id="marcas-edit">
                  {MARCAS_COMUNES.map(m => <option key={m} value={m} />)}
                </datalist>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Modelo</label>
                  <input
                    type="text"
                    value={editForm.modelo}
                    onChange={e => setEditForm({ ...editForm, modelo: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Año</label>
                  <input
                    type="number"
                    value={editForm.anio}
                    onChange={e => setEditForm({ ...editForm, anio: e.target.value })}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Tipo / Carrocería</label>
                <input
                  type="text"
                  value={editForm.tipo}
                  onChange={e => setEditForm({ ...editForm, tipo: e.target.value })}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Cliente</label>
                <select
                  value={editForm.cliente_id || ''}
                  onChange={e => setEditForm({ ...editForm, cliente_id: e.target.value })}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Sin cliente asignado</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              {/* Patente y chofer */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-2">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Identificación y conductor</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Patente / Dominio</label>
                    <input
                      type="text"
                      value={editForm.patente}
                      onChange={e => setEditForm({ ...editForm, patente: e.target.value.toUpperCase() })}
                      placeholder="AB123CD"
                      className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Tel. chofer</label>
                    <input
                      type="text"
                      value={editForm.chofer_telefono}
                      onChange={e => setEditForm({ ...editForm, chofer_telefono: e.target.value })}
                      placeholder="2974xxxxxx"
                      className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm font-mono"
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Chofer</label>
                  <input
                    type="text"
                    value={editForm.chofer}
                    onChange={e => setEditForm({ ...editForm, chofer: e.target.value })}
                    placeholder="Nombre del chofer asignado"
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Vencimientos */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-2">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Vencimientos</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">VTV vence</label>
                    <input
                      type="date"
                      value={editForm.vtv_vencimiento}
                      onChange={e => setEditForm({ ...editForm, vtv_vencimiento: e.target.value })}
                      className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">RTO vence</label>
                    <input
                      type="date"
                      value={editForm.rto_vencimiento}
                      onChange={e => setEditForm({ ...editForm, rto_vencimiento: e.target.value })}
                      className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Seguro vence</label>
                    <input
                      type="date"
                      value={editForm.seguro_vencimiento}
                      onChange={e => setEditForm({ ...editForm, seguro_vencimiento: e.target.value })}
                      className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">RUTA vence</label>
                    <input
                      type="date"
                      value={editForm.ruta_vencimiento}
                      onChange={e => setEditForm({ ...editForm, ruta_vencimiento: e.target.value })}
                      className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Compañía seguro</label>
                    <input
                      type="text"
                      value={editForm.seguro_compania}
                      onChange={e => setEditForm({ ...editForm, seguro_compania: e.target.value })}
                      placeholder="Sancor, La Segunda..."
                      className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Nº póliza</label>
                    <input
                      type="text"
                      value={editForm.seguro_poliza}
                      onChange={e => setEditForm({ ...editForm, seguro_poliza: e.target.value })}
                      className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={editForm.activo}
                  onChange={e => setEditForm({ ...editForm, activo: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Vehículo activo</span>
              </label>
            </div>

            <div className="flex gap-2 mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={guardarEdicion}
                disabled={loading}
                className="flex-1 bg-[#1F3864] text-white py-2.5 rounded-lg font-bold hover:bg-[#2E75B6] disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                onClick={() => { setConfirmEliminar(vehiculos.find(v => v.id === editModal)); setEditModal(null) }}
                className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-lg font-bold hover:bg-red-100 dark:hover:bg-red-900/50"
                title="Eliminar vehículo"
              >
                🗑️
              </button>
              <button
                onClick={() => setEditModal(null)}
                className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-lg font-bold hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmEliminar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setConfirmEliminar(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-red-600 dark:text-red-400 text-lg mb-2">Eliminar Vehículo</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-1">
              ¿Estás seguro de eliminar <strong>{confirmEliminar.codigo}</strong>?
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
              {confirmEliminar.marca} {confirmEliminar.modelo} — {confirmEliminar.clientes?.nombre || 'Sin cliente'}
            </p>
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 text-xs text-red-700 dark:text-red-300">
              ⚠️ Si este vehículo tiene OTs registradas, primero hay que eliminarlas.
            </div>
            <div className="flex gap-3">
              <button
                onClick={eliminar}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
              <button
                onClick={() => setConfirmEliminar(null)}
                className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-lg font-bold hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
