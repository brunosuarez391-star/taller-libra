import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { SERVICIOS, EMPRESA } from '../lib/data'
import { crearOrden, crearServiciosOT, crearInsumosOT, actualizarKm } from '../lib/api'
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

  // Items editables para reparaciones / trabajos extras
  const [itemsExtra, setItemsExtra] = useState([
    { descripcion: '', cantidad: 1, precio_unit: 0 },
  ])

  const agregarItem = () => setItemsExtra([...itemsExtra, { descripcion: '', cantidad: 1, precio_unit: 0 }])
  const quitarItem = (i) => setItemsExtra(itemsExtra.filter((_, idx) => idx !== i))
  const editarItem = (i, campo, valor) => {
    const copia = [...itemsExtra]
    copia[i] = { ...copia[i], [campo]: valor }
    setItemsExtra(copia)
  }

  const esReparacion = form.servicio === 'reparacion'
  const totalItems = itemsExtra.reduce((s, it) => s + (it.cantidad || 1) * (it.precio_unit || 0), 0)
  const ivaItems = Math.round(totalItems * 0.21)
  const totalConIva = totalItems + ivaItems
  const formatARS = (n) => '$' + (n || 0).toLocaleString('es-AR')

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
  const itemsValidos = !esReparacion || itemsExtra.some(it => it.descripcion.trim() && it.precio_unit > 0)
  const formValido = form.cliente_id && form.vehiculo_id && kmNumero > 0 && itemsValidos

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

      const itemsLimpios = esReparacion
        ? itemsExtra.filter(it => it.descripcion.trim() && it.precio_unit > 0)
        : []

      const orden = {
        ot_numero: otNum,
        vehiculo_id: form.vehiculo_id,
        cliente_id: form.cliente_id,
        km_ingreso: kmNumero,
        km_proximo: esReparacion ? kmNumero : kmNumero + 20000,
        servicio_tipo: form.servicio,
        servicio_nombre: esReparacion ? 'Reparación / Trabajo extra' : servicio.nombre,
        mecanico: form.mecanico,
        observaciones: obs,
        estado: 'Ingresado',
      }

      const otDB = await crearOrden(orden)

      if (esReparacion && itemsLimpios.length > 0) {
        await crearInsumosOT(otDB.id, itemsLimpios)
        // También crear checklist de servicios con las descripciones
        await crearServiciosOT(otDB.id, itemsLimpios.map(it => it.descripcion))
      } else {
        await crearServiciosOT(otDB.id, servicio.items)
      }

      await actualizarKm(form.vehiculo_id, kmNumero)

      const otCompleta = {
        ...otDB,
        codigo: vehiculo?.codigo,
        modelo: `${vehiculo?.marca} ${vehiculo?.modelo} ${vehiculo?.tipo || ''}`.trim(),
        cliente: cliente?.nombre,
        clienteTel: cliente?.telefono || '',
        patente: form.patente.toUpperCase(),
        chofer: form.chofer,
        km: kmNumero,
        proximo_km: esReparacion ? kmNumero : kmNumero + 20000,
        items: esReparacion ? itemsLimpios.map(it => `${it.descripcion} (x${it.cantidad})`) : servicio.items,
        itemsDetalle: itemsLimpios,
        totalItems: totalItems,
        esReparacion,
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

        {otCreada.esReparacion && otCreada.itemsDetalle?.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 mb-4">
            <h3 className="font-bold text-[#1F3864] dark:text-blue-300 mb-2">Detalle del trabajo</h3>
            <table className="w-full text-sm">
              <thead><tr className="bg-[#D6E4F0] dark:bg-slate-700 text-[#1F3864] dark:text-blue-200">
                <th className="px-3 py-2 text-left">Descripción</th>
                <th className="px-3 py-2 text-center w-16">Cant.</th>
                <th className="px-3 py-2 text-right w-28">Precio u.</th>
                <th className="px-3 py-2 text-right w-28">Subtotal</th>
              </tr></thead>
              <tbody>
                {otCreada.itemsDetalle.map((it, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="px-3 py-2">{it.descripcion}</td>
                    <td className="px-3 py-2 text-center">{it.cantidad}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatARS(it.precio_unit)}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold">{formatARS(it.cantidad * it.precio_unit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right mt-2 space-y-1">
              <p className="text-sm">Subtotal s/IVA: <strong className="font-mono">{formatARS(otCreada.totalItems)}</strong></p>
              <p className="text-sm">IVA 21%: <strong className="font-mono">{formatARS(Math.round(otCreada.totalItems * 0.21))}</strong></p>
              <p className="text-lg font-bold text-[#1F3864] dark:text-blue-300">Total c/IVA: <span className="font-mono">{formatARS(otCreada.totalItems + Math.round(otCreada.totalItems * 0.21))}</span></p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mb-6 flex-wrap">
          {otCreada.clienteTel && (
            <a
              href={`https://wa.me/${otCreada.clienteTel.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `*${EMPRESA.nombre}*\n` +
                `OT: ${otCreada.ot_numero}\n` +
                `Vehículo: ${otCreada.codigo} — ${otCreada.modelo}\n` +
                `Fecha: ${otCreada.fecha}\n` +
                (otCreada.esReparacion && otCreada.itemsDetalle?.length
                  ? `\n*Detalle:*\n` + otCreada.itemsDetalle.map(it => `• ${it.descripcion} x${it.cantidad} — ${formatARS(it.cantidad * it.precio_unit)}`).join('\n') +
                    `\n\nSubtotal: ${formatARS(otCreada.totalItems)}\nIVA 21%: ${formatARS(Math.round(otCreada.totalItems * 0.21))}\n*Total: ${formatARS(otCreada.totalItems + Math.round(otCreada.totalItems * 0.21))}*`
                  : `Servicio: ${otCreada.servicio_nombre || 'Service'}`) +
                `\n\n📍 ${EMPRESA.direccion}, ${EMPRESA.ciudad}\n📞 ${EMPRESA.tel}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold inline-flex items-center gap-2"
            >
              📲 Enviar por WhatsApp
            </a>
          )}
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
          {!esReparacion && (
            <div className="mt-2 bg-[#D6E4F0] rounded-lg p-3 text-xs space-y-1">
              {servicio.items.map((item, i) => (
                <p key={i}>✓ {item}</p>
              ))}
            </div>
          )}
        </div>

        {/* Items editables para reparación / trabajo extra */}
        {esReparacion && (
          <div className="mb-6 bg-[#D6E4F0] dark:bg-slate-900 rounded-xl p-4">
            <h3 className="font-bold text-[#1F3864] dark:text-blue-300 mb-3">Detalle del trabajo</h3>
            <p className="text-xs text-slate-500 mb-3">Cargá cada item: mano de obra, repuestos, insumos. Todo lo que quieras que aparezca en la factura.</p>

            {itemsExtra.map((item, i) => (
              <div key={i} className="flex gap-2 mb-2 items-end">
                <div className="flex-1">
                  {i === 0 && <label className="block text-xs font-bold text-slate-600 mb-1">Descripción</label>}
                  <input
                    type="text"
                    value={item.descripcion}
                    onChange={e => editarItem(i, 'descripcion', e.target.value)}
                    placeholder="Ej: Cambio bomba de agua"
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:border-[#2E75B6] focus:outline-none"
                  />
                </div>
                <div className="w-20">
                  {i === 0 && <label className="block text-xs font-bold text-slate-600 mb-1">Cant.</label>}
                  <input
                    type="number"
                    value={item.cantidad}
                    onChange={e => editarItem(i, 'cantidad', parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm text-center focus:border-[#2E75B6] focus:outline-none"
                  />
                </div>
                <div className="w-32">
                  {i === 0 && <label className="block text-xs font-bold text-slate-600 mb-1">Precio u. (s/IVA)</label>}
                  <input
                    type="number"
                    value={item.precio_unit || ''}
                    onChange={e => editarItem(i, 'precio_unit', parseFloat(e.target.value) || 0)}
                    placeholder="$0"
                    min="0"
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm text-right font-mono focus:border-[#2E75B6] focus:outline-none"
                  />
                </div>
                <div className="w-28 text-right">
                  {i === 0 && <label className="block text-xs font-bold text-slate-600 mb-1">Subtotal</label>}
                  <span className="text-sm font-mono font-bold text-[#1F3864] dark:text-blue-300 leading-[2.5rem] block">
                    {formatARS((item.cantidad || 1) * (item.precio_unit || 0))}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => quitarItem(i)}
                  disabled={itemsExtra.length <= 1}
                  className="text-red-400 hover:text-red-600 disabled:opacity-30 text-lg leading-[2.5rem]"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={agregarItem}
              className="mt-2 text-sm text-[#2E75B6] hover:text-[#1F3864] font-bold"
            >
              + Agregar item
            </button>

            <div className="mt-3 pt-3 border-t border-slate-300 dark:border-slate-700 text-right space-y-1">
              <p className="text-sm">Subtotal s/IVA: <strong className="font-mono">{formatARS(totalItems)}</strong></p>
              <p className="text-sm">IVA 21%: <strong className="font-mono">{formatARS(ivaItems)}</strong></p>
              <p className="text-lg font-bold text-[#1F3864] dark:text-blue-300">
                Total c/IVA: <span className="font-mono">{formatARS(totalConIva)}</span>
              </p>
            </div>
          </div>
        )}

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
