import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { SERVICIOS } from '../lib/data'
import { crearOrden, crearServiciosOT, actualizarKm } from '../lib/api'
import EtiquetaService from '../components/EtiquetaService'

export default function NuevaOT({ vehiculos, clientes, onCrear }) {
  const navigate = useNavigate()
  const [mostrarEtiqueta, setMostrarEtiqueta] = useState(false)
  const [otCreada, setOtCreada] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const [form, setForm] = useState({
    cliente_id: '',
    vehiculo_id: '',
    km: '',
    patente: '',
    chofer: '',
    servicio: 'service_20k',
    mecanico: 'Bruno Suarez',
    observaciones: '',
  })

  const vehiculo = useMemo(
    () => vehiculos.find(v => v.id === form.vehiculo_id),
    [vehiculos, form.vehiculo_id]
  )
  const cliente = clientes.find(c => c.id === form.cliente_id)
  const servicio = SERVICIOS[form.servicio]

  const vehiculosCliente = form.cliente_id
    ? vehiculos.filter(v => v.cliente_id === form.cliente_id)
    : vehiculos

  // Cuando se selecciona un vehículo, auto-completar cliente y km
  const handleSelectVehiculo = (vehId) => {
    const veh = vehiculos.find(v => v.id === vehId)
    if (!veh) {
      setForm(f => ({ ...f, vehiculo_id: '' }))
      return
    }
    setForm(f => ({
      ...f,
      vehiculo_id: vehId,
      // Auto-asignar cliente si coincide
      cliente_id: f.cliente_id || veh.cliente_id || '',
      // Pre-llenar km con el actual (solo si el form está vacío)
      km: f.km || String(veh.km_actuales || ''),
    }))
  }

  // Validaciones
  const kmNumero = parseInt(form.km) || 0
  const kmActualVehiculo = vehiculo?.km_actuales || 0
  const kmMenor = kmNumero > 0 && kmActualVehiculo > 0 && kmNumero < kmActualVehiculo
  const kmVacio = form.km === ''
  const formValido = form.cliente_id && form.vehiculo_id && kmNumero > 0

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Confirmación si el km es menor al del vehículo
    if (kmMenor) {
      const confirmar = confirm(
        `Atención: el km ingresado (${kmNumero.toLocaleString('es-AR')}) ` +
        `es MENOR al último km registrado del vehículo (${kmActualVehiculo.toLocaleString('es-AR')}).\n\n` +
        `¿Estás seguro de continuar? Esto actualizará el km del vehículo hacia abajo.`
      )
      if (!confirmar) return
    }

    setGuardando(true)

    try {
      const otNum = 'OT-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')

      const obs = [
        form.patente ? `PAT: ${form.patente.toUpperCase()}` : '',
        form.chofer ? `CHOFER: ${form.chofer}` : '',
        form.observaciones || '',
      ].filter(Boolean).join(' | ')

      const orden = {
        ot_numero: otNum,
        vehiculo_id: form.vehiculo_id,
        cliente_id: form.cliente_id,
        km_ingreso: kmNumero,
        km_proximo: kmNumero + 20000,
        servicio_tipo: form.servicio,
        servicio_nombre: servicio.nombre,
        mecanico: form.mecanico,
        observaciones: obs,
        estado: 'Ingresado',
      }

      const otDB = await crearOrden(orden)
      await crearServiciosOT(otDB.id, servicio.items)
      await actualizarKm(form.vehiculo_id, kmNumero)

      const otCompleta = {
        ...otDB,
        codigo: vehiculo?.codigo,
        modelo: `${vehiculo?.marca} ${vehiculo?.modelo} ${vehiculo?.tipo || ''}`.trim(),
        cliente: cliente?.nombre,
        patente: form.patente.toUpperCase(),
        chofer: form.chofer,
        km: kmNumero,
        proximo_km: kmNumero + 20000,
        items: servicio.items,
        fecha: new Date().toLocaleDateString('es-AR'),
      }

      setOtCreada(otCompleta)
      setMostrarEtiqueta(true)
      onCrear()
    } catch (err) {
      alert('Error creando OT: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (mostrarEtiqueta && otCreada) {
    return (
      <div>
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">✓</div>
            <div>
              <h2 className="text-xl font-bold text-green-800">OT Creada: {otCreada.ot_numero}</h2>
              <p className="text-green-600 text-xs">Guardada en Supabase correctamente</p>
            </div>
          </div>
          <p className="text-green-700 font-semibold">{otCreada.codigo} — {otCreada.modelo}</p>
          <p className="text-green-700">Cliente: {otCreada.cliente}</p>
          {otCreada.patente && <p className="text-green-700 font-bold">Patente: {otCreada.patente}</p>}
          <p className="text-green-600 text-sm mt-1">
            KM: <strong>{otCreada.km?.toLocaleString('es-AR')}</strong> →
            Próximo service: <strong>{otCreada.proximo_km?.toLocaleString('es-AR')} km</strong>
          </p>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <button onClick={() => window.print()} className="bg-[#1F3864] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#2E75B6]">
            🖨️ Imprimir Etiqueta
          </button>
          <button onClick={() => navigate('/ordenes')} className="bg-slate-200 text-slate-700 px-6 py-3 rounded-lg font-bold hover:bg-slate-300">
            📋 Ver OTs
          </button>
          <button onClick={() => navigate(`/vehiculo/${otCreada.codigo}`)} className="bg-slate-200 text-slate-700 px-6 py-3 rounded-lg font-bold hover:bg-slate-300">
            🚛 Ver Vehículo
          </button>
          <button
            onClick={() => {
              setMostrarEtiqueta(false)
              setOtCreada(null)
              setForm({
                cliente_id: '',
                vehiculo_id: '',
                km: '',
                patente: '',
                chofer: '',
                servicio: 'service_20k',
                mecanico: 'Bruno Suarez',
                observaciones: '',
              })
            }}
            className="bg-[#2E75B6] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#1F3864]"
          >
            ➕ Otra OT
          </button>
        </div>

        <div className="flex justify-center">
          <EtiquetaService ot={otCreada} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1F3864] dark:text-blue-300 mb-6">Nueva Orden de Trabajo</h2>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 max-w-2xl text-slate-800 dark:text-slate-200">
        {/* Cliente */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
            Cliente <span className="text-red-500">*</span>
          </label>
          <select
            value={form.cliente_id}
            onChange={e => setForm({ ...form, cliente_id: e.target.value, vehiculo_id: '' })}
            required
            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none"
          >
            <option value="">Seleccionar cliente...</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          {cliente && cliente.telefono && (
            <p className="text-xs text-slate-500 mt-1">📞 {cliente.telefono} · {cliente.contacto}</p>
          )}
        </div>

        {/* Vehículo */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
            Unidad <span className="text-red-500">*</span>
          </label>
          <select
            value={form.vehiculo_id}
            onChange={e => handleSelectVehiculo(e.target.value)}
            required
            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none"
          >
            <option value="">Seleccionar unidad...</option>
            {vehiculosCliente.map(v => (
              <option key={v.id} value={v.id}>
                {v.codigo} — {v.marca} {v.modelo} {v.tipo} ({v.categoria})
              </option>
            ))}
          </select>
          {vehiculo && (
            <div className="mt-2 bg-[#D6E4F0] rounded-lg p-3 text-xs text-[#1F3864] flex items-center gap-3">
              <span className="font-bold bg-[#1F3864] text-white px-2 py-0.5 rounded">{vehiculo.codigo}</span>
              <span>
                KM actual: <strong>{(vehiculo.km_actuales || 0).toLocaleString('es-AR')}</strong>
              </span>
              <span className="ml-auto text-[10px] text-slate-500">{vehiculo.categoria}</span>
            </div>
          )}
        </div>

        {/* Patente + Chofer */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Patente</label>
            <input
              type="text"
              value={form.patente}
              onChange={e => setForm({ ...form, patente: e.target.value.toUpperCase() })}
              placeholder="AB 123 CD"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none uppercase font-mono text-lg tracking-wider"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Chofer</label>
            <input
              type="text"
              value={form.chofer}
              onChange={e => setForm({ ...form, chofer: e.target.value })}
              placeholder="Nombre del chofer"
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none"
            />
          </div>
        </div>

        {/* KM con validaciones */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
            Kilómetros actuales <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={form.km}
            onChange={e => setForm({ ...form, km: e.target.value })}
            placeholder="Ej: 85320"
            required
            min="0"
            className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none transition-colors ${
              kmMenor
                ? 'border-red-400 focus:border-red-500 bg-red-50'
                : kmNumero > 0
                ? 'border-green-300 focus:border-[#2E75B6]'
                : 'border-slate-300 focus:border-[#2E75B6]'
            }`}
          />
          {kmNumero > 0 && !kmMenor && (
            <p className="text-sm text-[#2E75B6] mt-1 font-bold">
              ✓ Próximo service: {(kmNumero + 20000).toLocaleString('es-AR')} km
            </p>
          )}
          {kmMenor && (
            <p className="text-sm text-red-600 mt-1 font-bold">
              ⚠️ El km ingresado ({kmNumero.toLocaleString('es-AR')}) es menor que el último registrado ({kmActualVehiculo.toLocaleString('es-AR')})
            </p>
          )}
          {vehiculo && kmVacio && (
            <p className="text-xs text-slate-500 mt-1">
              💡 Sugerido: <button type="button" onClick={() => setForm(f => ({ ...f, km: String(kmActualVehiculo) }))} className="text-[#2E75B6] underline font-bold">{kmActualVehiculo.toLocaleString('es-AR')}</button>
            </p>
          )}
        </div>

        {/* Tipo de Service */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Service</label>
          <select
            value={form.servicio}
            onChange={e => setForm({ ...form, servicio: e.target.value })}
            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none"
          >
            {Object.entries(SERVICIOS).map(([key, s]) => (
              <option key={key} value={key}>{s.nombre} ({s.tiempo})</option>
            ))}
          </select>
          <div className="mt-2 bg-[#D6E4F0] rounded-lg p-3 text-xs space-y-1">
            {servicio.items.map((item, i) => (
              <p key={i}>✓ {item}</p>
            ))}
          </div>
        </div>

        {/* Mecánico */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Mecánico</label>
          <input
            type="text"
            value={form.mecanico}
            onChange={e => setForm({ ...form, mecanico: e.target.value })}
            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none"
          />
        </div>

        {/* Observaciones */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Observaciones</label>
          <textarea
            value={form.observaciones}
            onChange={e => setForm({ ...form, observaciones: e.target.value })}
            rows="3"
            placeholder="Notas adicionales..."
            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none"
          />
        </div>

        {/* Submit con estado de validación */}
        <button
          type="submit"
          disabled={guardando || !formValido}
          className={`w-full py-3 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            formValido
              ? 'bg-[#1F3864] text-white hover:bg-[#2E75B6]'
              : 'bg-slate-300 text-slate-500'
          }`}
        >
          {guardando ? 'Guardando...' : formValido ? '✓ Crear Orden de Trabajo' : 'Completá los campos obligatorios'}
        </button>
      </form>
    </div>
  )
}
