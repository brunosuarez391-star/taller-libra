import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATEGORIAS_VEHICULO, MARCAS_COMUNES } from '../lib/data'
import { crearVehiculo, crearCliente } from '../lib/api'

export default function NuevoVehiculo({ clientes, vehiculos, onCrear }) {
  const navigate = useNavigate()
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [creandoCliente, setCreandoCliente] = useState(false)
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState('')
  const [nuevoClienteTel, setNuevoClienteTel] = useState('')

  const [form, setForm] = useState({
    codigo: '',
    marca: 'Mercedes-Benz',
    modelo: '',
    tipo: '',
    categoria: 'Camión Pesado',
    anio: '',
    km_actuales: 0,
    cliente_id: '',
    activo: true,
  })

  // Sugerir siguiente código (U14, U15, etc.)
  const siguienteCodigo = useMemo(() => {
    const codigosU = vehiculos
      .map(v => v.codigo)
      .filter(c => /^U\d+$/.test(c))
      .map(c => parseInt(c.slice(1)))
      .sort((a, b) => a - b)
    const ultimo = codigosU.length > 0 ? codigosU[codigosU.length - 1] : 0
    return `U${String(ultimo + 1).padStart(2, '0')}`
  }, [vehiculos])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const codigo = (form.codigo || siguienteCodigo).trim().toUpperCase()
    if (!codigo) {
      setError('El código es obligatorio')
      return
    }
    if (vehiculos.some(v => v.codigo === codigo)) {
      setError(`Ya existe un vehículo con código ${codigo}`)
      return
    }
    if (!form.modelo.trim()) {
      setError('El modelo es obligatorio')
      return
    }

    setGuardando(true)
    try {
      const payload = {
        codigo,
        marca: form.marca.trim() || 'Mercedes-Benz',
        modelo: form.modelo.trim(),
        tipo: form.tipo.trim() || null,
        categoria: form.categoria,
        anio: form.anio ? parseInt(form.anio) : null,
        km_actuales: parseInt(form.km_actuales) || 0,
        cliente_id: form.cliente_id || null,
        activo: form.activo,
      }
      await crearVehiculo(payload)
      await onCrear()
      navigate(`/vehiculo/${codigo}`)
    } catch (err) {
      setError('Error al crear vehículo: ' + (err.message || err))
    } finally {
      setGuardando(false)
    }
  }

  const handleCrearCliente = async () => {
    if (!nuevoClienteNombre.trim()) return
    try {
      const nuevoCliente = await crearCliente({
        nombre: nuevoClienteNombre.trim(),
        telefono: nuevoClienteTel.trim(),
        contacto: nuevoClienteNombre.trim(),
      })
      await onCrear()
      setForm(f => ({ ...f, cliente_id: nuevoCliente.id }))
      setCreandoCliente(false)
      setNuevoClienteNombre('')
      setNuevoClienteTel('')
    } catch (err) {
      alert('Error al crear cliente: ' + err.message)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1F3864] dark:text-blue-300 mb-6">Nuevo Vehículo</h2>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 max-w-2xl text-slate-800 dark:text-slate-200">
        {/* Código + Categoría */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
              Código <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.codigo}
              onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
              placeholder={siguienteCodigo}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none uppercase font-mono"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Sugerido: <button type="button" onClick={() => setForm(f => ({ ...f, codigo: siguienteCodigo }))} className="text-[#2E75B6] underline font-bold">{siguienteCodigo}</button>
            </p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
            <select
              value={form.categoria}
              onChange={e => setForm({ ...form, categoria: e.target.value })}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none"
            >
              {CATEGORIAS_VEHICULO.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Marca */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Marca</label>
          <input
            type="text"
            value={form.marca}
            onChange={e => setForm({ ...form, marca: e.target.value })}
            list="marcas-list"
            placeholder="Ej: Mercedes-Benz, Ford, Scania..."
            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none"
          />
          <datalist id="marcas-list">
            {MARCAS_COMUNES.map(m => <option key={m} value={m} />)}
          </datalist>
        </div>

        {/* Modelo + Año */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="col-span-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
              Modelo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.modelo}
              onChange={e => setForm({ ...form, modelo: e.target.value })}
              required
              placeholder="Ej: Sprinter 413, 1634, Cronos, F-100..."
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Año</label>
            <input
              type="number"
              value={form.anio}
              onChange={e => setForm({ ...form, anio: e.target.value })}
              placeholder="2020"
              min="1950"
              max="2100"
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none"
            />
          </div>
        </div>

        {/* Tipo + KM */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo / Carrocería</label>
            <input
              type="text"
              value={form.tipo}
              onChange={e => setForm({ ...form, tipo: e.target.value })}
              placeholder="Ej: Balancín, Van, Pickup, Cerrado..."
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">KM Actuales</label>
            <input
              type="number"
              value={form.km_actuales}
              onChange={e => setForm({ ...form, km_actuales: e.target.value })}
              placeholder="0"
              min="0"
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none"
            />
          </div>
        </div>

        {/* Cliente */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Cliente</label>
            <button
              type="button"
              onClick={() => setCreandoCliente(!creandoCliente)}
              className="text-xs text-[#2E75B6] hover:underline font-bold"
            >
              {creandoCliente ? '← Elegir existente' : '+ Crear cliente nuevo'}
            </button>
          </div>

          {creandoCliente ? (
            <div className="bg-[#D6E4F0] dark:bg-slate-900 rounded-lg p-3 space-y-2">
              <input
                type="text"
                value={nuevoClienteNombre}
                onChange={e => setNuevoClienteNombre(e.target.value)}
                placeholder="Nombre del cliente"
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={nuevoClienteTel}
                onChange={e => setNuevoClienteTel(e.target.value)}
                placeholder="Teléfono (opcional)"
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleCrearCliente}
                disabled={!nuevoClienteNombre.trim()}
                className="w-full bg-[#2E75B6] text-white py-2 rounded-lg text-sm font-bold hover:bg-[#1F3864] disabled:opacity-50"
              >
                Crear cliente
              </button>
            </div>
          ) : (
            <select
              value={form.cliente_id}
              onChange={e => setForm({ ...form, cliente_id: e.target.value })}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none"
            >
              <option value="">Sin cliente asignado</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          )}
        </div>

        {/* Activo */}
        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={e => setForm({ ...form, activo: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Vehículo activo</span>
          </label>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={guardando}
            className="flex-1 bg-[#1F3864] hover:bg-[#2E75B6] text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {guardando ? 'Guardando...' : '✓ Crear Vehículo'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/vehiculos')}
            className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-lg font-bold hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
