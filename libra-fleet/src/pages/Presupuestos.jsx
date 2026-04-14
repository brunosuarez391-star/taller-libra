import { useState, useMemo } from 'react'
import { obtenerPrecio, SERVICIOS } from '../lib/data'
import PresupuestoView from '../components/PresupuestoView'

// Tipos de presupuesto
const TIPOS = {
  service: { label: 'Service preventivo', icon: '🔧' },
  reparacion: { label: 'Reparación / Trabajo personalizado', icon: '🛠️' },
}

// Crea una línea de ítem vacía
const lineaVacia = () => ({
  id: Math.random().toString(36).slice(2, 9),
  descripcion: '',
  cantidad: 1,
  precio: 0,
})

export default function Presupuestos({ vehiculos, clientes }) {
  const [tipo, setTipo] = useState('service')
  const [clienteId, setClienteId] = useState('')
  const [vehiculoId, setVehiculoId] = useState('')
  const [servicio, setServicio] = useState('service_20k')
  const [items, setItems] = useState([lineaVacia()])
  const [observaciones, setObservaciones] = useState('')
  const [presupuesto, setPresupuesto] = useState(null)

  const cliente = clientes.find(c => c.id === clienteId)
  const vehiculo = vehiculos.find(v => v.id === vehiculoId)
  const vehiculosCliente = clienteId
    ? vehiculos.filter(v => v.cliente_id === clienteId)
    : vehiculos

  // Cuando cambia el modo a "service" y hay un vehículo, autocompletar items
  const cargarItemsService = () => {
    if (!vehiculo) {
      alert('Primero seleccioná un vehículo')
      return
    }
    const srv = SERVICIOS[servicio]
    const precio = obtenerPrecio(vehiculo)
    setItems([
      {
        id: Math.random().toString(36).slice(2, 9),
        descripcion: `Mano de obra — ${srv.nombre} (${srv.tiempo})`,
        cantidad: 1,
        precio: precio.mo,
      },
      {
        id: Math.random().toString(36).slice(2, 9),
        descripcion: `Insumos y filtros — ${srv.nombre}`,
        cantidad: 1,
        precio: precio.insumos,
      },
    ])
    setObservaciones('Incluye: ' + srv.items.join(', '))
  }

  // Cálculos
  const subtotal = useMemo(
    () => items.reduce((s, it) => s + (it.cantidad * it.precio), 0),
    [items]
  )
  const iva = Math.round(subtotal * 0.21)
  const total = subtotal + iva
  const formatARS = (n) => '$' + (n || 0).toLocaleString('es-AR')

  const updateItem = (id, campo, valor) => {
    setItems(items.map(it => it.id === id ? { ...it, [campo]: valor } : it))
  }

  const addItem = () => setItems([...items, lineaVacia()])
  const removeItem = (id) => setItems(items.filter(it => it.id !== id))

  const generar = () => {
    if (!clienteId) return alert('Seleccioná un cliente')
    if (items.filter(it => it.descripcion && it.precio > 0).length === 0) {
      return alert('Agregá al menos un ítem con descripción y precio')
    }
    const num = 'PP-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
    setPresupuesto({
      numero: num,
      cliente: cliente?.nombre,
      cliente_obj: cliente,
      vehiculo: vehiculo
        ? `${vehiculo.codigo} — ${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.tipo || ''}`.trim()
        : null,
      tipo,
      tipoLabel: TIPOS[tipo].label,
      items: items.filter(it => it.descripcion && it.precio > 0),
      subtotal,
      iva,
      total,
      observaciones,
      fecha: new Date().toLocaleDateString('es-AR'),
    })
  }

  const reset = () => {
    setPresupuesto(null)
    setItems([lineaVacia()])
    setObservaciones('')
  }

  if (presupuesto) {
    return <PresupuestoView presupuesto={presupuesto} onReset={reset} />
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1F3864] dark:text-blue-300 mb-6">Nuevo Presupuesto</h2>

      <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl shadow p-6 max-w-4xl">
        {/* Tipo de presupuesto */}
        <div className="mb-5">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tipo de presupuesto</label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(TIPOS).map(([key, t]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTipo(key)}
                className={`p-3 rounded-lg border-2 text-left transition ${
                  tipo === key
                    ? 'border-[#2E75B6] bg-[#D6E4F0] dark:bg-slate-900 dark:border-blue-500'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="text-2xl mb-1">{t.icon}</div>
                <div className="text-sm font-bold">{t.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Cliente + Vehículo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
              Cliente <span className="text-red-500">*</span>
            </label>
            <select
              value={clienteId}
              onChange={e => { setClienteId(e.target.value); setVehiculoId('') }}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5"
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Vehículo (opcional)</label>
            <select
              value={vehiculoId}
              onChange={e => setVehiculoId(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5"
            >
              <option value="">Sin vehículo específico</option>
              {vehiculosCliente.map(v => (
                <option key={v.id} value={v.id}>
                  {v.codigo} — {v.marca} {v.modelo} {v.tipo || ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Si es service, selector + botón cargar */}
        {tipo === 'service' && (
          <div className="bg-[#D6E4F0] dark:bg-slate-900 rounded-lg p-3 mb-4 flex items-center gap-3 flex-wrap">
            <select
              value={servicio}
              onChange={e => setServicio(e.target.value)}
              className="flex-1 min-w-[200px] border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm"
            >
              {Object.entries(SERVICIOS).map(([key, s]) => (
                <option key={key} value={key}>{s.nombre} ({s.tiempo})</option>
              ))}
            </select>
            <button
              type="button"
              onClick={cargarItemsService}
              className="bg-[#2E75B6] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#1F3864]"
            >
              📋 Cargar items del service
            </button>
          </div>
        )}

        {/* Items editables */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Items del presupuesto</label>
            <button
              type="button"
              onClick={addItem}
              className="text-xs text-[#2E75B6] dark:text-blue-400 hover:underline font-bold"
            >
              + Agregar línea
            </button>
          </div>
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <div className="bg-slate-100 dark:bg-slate-900 grid grid-cols-12 gap-2 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400">
              <div className="col-span-6">Descripción</div>
              <div className="col-span-2 text-center">Cant.</div>
              <div className="col-span-2 text-right">Precio unit.</div>
              <div className="col-span-2 text-right">Subtotal</div>
            </div>
            {items.map(it => (
              <div key={it.id} className="grid grid-cols-12 gap-2 px-3 py-2 border-t border-slate-100 dark:border-slate-700 items-center">
                <input
                  type="text"
                  value={it.descripcion}
                  onChange={e => updateItem(it.id, 'descripcion', e.target.value)}
                  placeholder="Ej: Cambio de bomba de agua, Mano de obra, Filtro de aceite..."
                  className="col-span-6 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded px-2 py-1.5 text-sm"
                />
                <input
                  type="number"
                  value={it.cantidad}
                  onChange={e => updateItem(it.id, 'cantidad', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.5"
                  className="col-span-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded px-2 py-1.5 text-sm text-center"
                />
                <input
                  type="number"
                  value={it.precio}
                  onChange={e => updateItem(it.id, 'precio', parseFloat(e.target.value) || 0)}
                  min="0"
                  className="col-span-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded px-2 py-1.5 text-sm text-right font-mono"
                />
                <div className="col-span-1 text-right text-sm font-mono font-bold">
                  {formatARS(it.cantidad * it.precio)}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(it.id)}
                  className="col-span-1 text-red-400 hover:text-red-600 text-lg"
                  title="Eliminar línea"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Observaciones */}
        <div className="mb-5">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Observaciones (opcional)</label>
          <textarea
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            rows="2"
            placeholder="Notas, garantía, plazo de entrega, etc."
            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2 text-sm"
          />
        </div>

        {/* Totales en vivo */}
        <div className="bg-[#D6E4F0] dark:bg-slate-900 rounded-lg p-4 mb-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Subtotal s/IVA</p>
              <p className="text-lg font-bold font-mono text-slate-700 dark:text-slate-200">{formatARS(subtotal)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">IVA 21%</p>
              <p className="text-lg font-bold font-mono text-slate-700 dark:text-slate-200">{formatARS(iva)}</p>
            </div>
            <div>
              <p className="text-xs text-[#1F3864] dark:text-blue-300">TOTAL c/IVA</p>
              <p className="text-2xl font-bold font-mono text-[#1F3864] dark:text-blue-300">{formatARS(total)}</p>
            </div>
          </div>
        </div>

        <button
          onClick={generar}
          disabled={!clienteId || subtotal === 0}
          className="w-full bg-[#1F3864] hover:bg-[#2E75B6] text-white py-3 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✓ Generar Presupuesto
        </button>
      </div>
    </div>
  )
}
