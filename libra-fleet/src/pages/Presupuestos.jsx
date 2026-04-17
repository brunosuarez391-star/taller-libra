import { useState, useMemo } from 'react'
import { obtenerPrecio, SERVICIOS } from '../lib/data'
import { crearPresupuestoCompleto, actualizarEstadoPresupuesto, actualizarRemitoPresupuesto, eliminarPresupuesto } from '../lib/api'
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

export default function Presupuestos({ vehiculos, clientes, presupuestos = [], onRefresh }) {
  const [vista, setVista] = useState('nuevo') // 'nuevo' | 'lista'
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
      cliente_id: clienteId,
      vehiculo_id: vehiculoId || null,
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
      guardado: false,
      guardado_id: null,
    })
  }

  const reset = () => {
    setPresupuesto(null)
    setItems([lineaVacia()])
    setObservaciones('')
  }

  const guardarPresupuesto = async () => {
    if (!presupuesto) return
    try {
      const guardado = await crearPresupuestoCompleto({
        numero: presupuesto.numero,
        cliente_id: presupuesto.cliente_id,
        vehiculo_id: presupuesto.vehiculo_id,
        fecha: new Date().toISOString().slice(0, 10),
        subtotal_siva: presupuesto.subtotal,
        iva: presupuesto.iva,
        total_civa: presupuesto.total,
        estado: 'enviado',
        validez_dias: 15,
        condicion_pago: '30 días',
        items: presupuesto.items.map(it => ({
          descripcion: it.descripcion,
          cantidad: it.cantidad,
          precio_unit: it.precio,
        })),
      })
      setPresupuesto({ ...presupuesto, guardado: true, guardado_id: guardado.id })
      if (onRefresh) await onRefresh()
      return guardado
    } catch (err) {
      alert('Error al guardar el presupuesto: ' + err.message)
      throw err
    }
  }

  if (presupuesto) {
    return <PresupuestoView presupuesto={presupuesto} onReset={reset} onGuardar={guardarPresupuesto} />
  }

  if (vista === 'lista') {
    return (
      <ListaPresupuestos
        presupuestos={presupuestos}
        onNuevo={() => setVista('nuevo')}
        onRefresh={onRefresh}
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-[#1F3864] dark:text-blue-300">Nuevo Presupuesto</h2>
        <button
          onClick={() => setVista('lista')}
          className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600"
        >
          📋 Ver presupuestos guardados ({presupuestos.length})
        </button>
      </div>

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

// ============================================================
// Listado de presupuestos guardados
// ============================================================
function ListaPresupuestos({ presupuestos, onNuevo, onRefresh }) {
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroMes, setFiltroMes] = useState('todos')
  const [loading, setLoading] = useState(null)

  const formatARS = (n) => '$' + (n || 0).toLocaleString('es-AR')

  // Calcular meses disponibles
  const meses = useMemo(() => {
    const set = new Set()
    presupuestos.forEach(p => {
      const f = new Date(p.created_at || p.fecha)
      set.add(`${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`)
    })
    return [...set].sort().reverse()
  }, [presupuestos])

  const filtrados = useMemo(() => {
    return presupuestos.filter(p => {
      if (filtroEstado !== 'todos' && p.estado !== filtroEstado) return false
      if (filtroMes !== 'todos') {
        const f = new Date(p.created_at || p.fecha)
        const key = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`
        if (key !== filtroMes) return false
      }
      return true
    })
  }, [presupuestos, filtroEstado, filtroMes])

  const totales = useMemo(() => {
    return filtrados.reduce((acc, p) => {
      acc.count++
      acc.total += parseFloat(p.total_civa || 0)
      if (p.estado === 'aprobado') acc.aprobados += parseFloat(p.total_civa || 0)
      return acc
    }, { count: 0, total: 0, aprobados: 0 })
  }, [filtrados])

  const cambiarEstado = async (id, nuevoEstado) => {
    setLoading(id)
    try {
      await actualizarEstadoPresupuesto(id, nuevoEstado)
      if (onRefresh) await onRefresh()
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setLoading(null)
  }

  const borrar = async (id) => {
    if (!confirm('¿Eliminar este presupuesto? Esta acción no se puede deshacer.')) return
    setLoading(id)
    try {
      await eliminarPresupuesto(id)
      if (onRefresh) await onRefresh()
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setLoading(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1F3864] dark:text-blue-300">Presupuestos guardados</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {presupuestos.length} presupuestos totales · {filtrados.length} con los filtros actuales
          </p>
        </div>
        <button
          onClick={onNuevo}
          className="bg-[#1F3864] hover:bg-[#2E75B6] text-white px-4 py-2 rounded-lg text-sm font-bold"
        >
          ➕ Nuevo Presupuesto
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Estado:</span>
          {[
            { key: 'todos', label: 'Todos' },
            { key: 'borrador', label: 'Borrador' },
            { key: 'enviado', label: 'Enviado' },
            { key: 'aprobado', label: 'Aprobado' },
            { key: 'rechazado', label: 'Rechazado' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFiltroEstado(key)}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                filtroEstado === key
                  ? 'bg-[#2E75B6] text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
          <div className="flex-1" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Mes:</span>
          <select
            value={filtroMes}
            onChange={e => setFiltroMes(e.target.value)}
            className="border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-1 text-xs"
          >
            <option value="todos">Todos</option>
            {meses.map(m => (
              <option key={m} value={m}>
                {new Date(m + '-15').toLocaleString('es-AR', { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-[#1F3864] text-white rounded-xl p-4">
          <p className="text-2xl font-bold">{totales.count}</p>
          <p className="text-xs opacity-80">Presupuestos</p>
        </div>
        <div className="bg-[#2E75B6] text-white rounded-xl p-4">
          <p className="text-xl font-bold">{formatARS(totales.total)}</p>
          <p className="text-xs opacity-80">Valor total</p>
        </div>
        <div className="bg-green-600 text-white rounded-xl p-4">
          <p className="text-xl font-bold">{formatARS(totales.aprobados)}</p>
          <p className="text-xs opacity-80">Aprobados</p>
        </div>
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-8 text-center text-slate-400 dark:text-slate-500">
          {presupuestos.length === 0
            ? 'No hay presupuestos guardados. Creá uno desde "+ Nuevo Presupuesto".'
            : 'No hay presupuestos con los filtros actuales.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(p => {
            const fecha = new Date(p.created_at || p.fecha).toLocaleDateString('es-AR')
            const color = {
              borrador: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
              enviado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
              aprobado: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
              rechazado: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
            }[p.estado] || 'bg-slate-100 text-slate-700'

            return (
              <div key={p.id} className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 border-l-4 border-[#2E75B6]">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono font-bold text-[#1F3864] dark:text-blue-300 text-lg">{p.numero}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${color}`}>
                        {p.estado}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{fecha}</span>
                      {p.remito_numero && (
                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full text-xs font-bold">
                          📄 Remito {p.remito_numero}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-200 font-semibold">
                      {p.clientes?.nombre || 'Sin cliente'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {p.items_presupuesto?.length || 0} items · Total c/IVA: <strong>{formatARS(p.total_civa)}</strong>
                    </p>
                  </div>
                  <div className="flex gap-1 flex-wrap items-center">
                    {p.estado !== 'aprobado' && (
                      <button
                        onClick={() => cambiarEstado(p.id, 'aprobado')}
                        disabled={loading === p.id}
                        className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50"
                      >
                        ✓ Aprobar
                      </button>
                    )}
                    {p.estado !== 'rechazado' && (
                      <button
                        onClick={() => cambiarEstado(p.id, 'rechazado')}
                        disabled={loading === p.id}
                        className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50"
                      >
                        ✕ Rechazar
                      </button>
                    )}
                    <button
                      onClick={() => borrar(p.id)}
                      disabled={loading === p.id}
                      className="bg-slate-100 dark:bg-slate-700 text-slate-500 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Remito — editable */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">📄 Remito:</span>
                  <input
                    type="text"
                    defaultValue={p.remito_numero || ''}
                    placeholder="N° remito (ej: 0001-00000123)"
                    onBlur={async (e) => {
                      const val = e.target.value.trim()
                      if (val === (p.remito_numero || '')) return
                      try {
                        await actualizarRemitoPresupuesto(p.id, val, val ? new Date().toISOString().slice(0, 10) : null)
                        if (onRefresh) await onRefresh()
                      } catch (err) { alert('Error guardando remito: ' + err.message) }
                    }}
                    className="border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded px-2 py-1 text-xs w-48 focus:border-[#2E75B6] focus:outline-none"
                  />
                  {p.remito_fecha && (
                    <span className="text-xs text-slate-400">
                      {new Date(p.remito_fecha).toLocaleDateString('es-AR')}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
