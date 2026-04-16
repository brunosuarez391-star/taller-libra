import { useState, useMemo } from 'react'
import { EMPRESA, PANELES, TIPOS_TRABAJO, COMPLEJIDAD } from '../lib/data'
import { crearPresupuestoChapa, crearCliente } from '../lib/api'

export default function NuevoPresupuesto({ clientes, onCreado, onRefresh }) {
  const [clienteId, setClienteId] = useState('')
  const [clienteNuevo, setClienteNuevo] = useState('')
  const [telNuevo, setTelNuevo] = useState('')
  const [vehiculo, setVehiculo] = useState('')
  const [tipoTrabajo, setTipoTrabajo] = useState('pintura_parcial')
  const [complejidad, setComplejidad] = useState('media')
  const [precioPorPanel, setPrecioPorPanel] = useState(0)
  const [paneles, setPaneles] = useState({})
  const [observaciones, setObservaciones] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [presupuestoCreado, setPresupuestoCreado] = useState(null)
  const [modoCliente, setModoCliente] = useState('existente')

  const cliente = clientes.find(c => c.id === clienteId)
  const complejidadObj = COMPLEJIDAD.find(c => c.id === complejidad)

  const togglePanel = (id) => {
    setPaneles(prev => {
      const copia = { ...prev }
      if (copia[id]) delete copia[id]
      else copia[id] = true
      return copia
    })
  }

  const panelesSeleccionados = PANELES.filter(p => paneles[p.id])
  const totalPaneles = panelesSeleccionados.reduce((s, p) => s + p.paneles, 0)
  const precioBase = totalPaneles * precioPorPanel
  const precioFinal = Math.round(precioBase * (complejidadObj?.multiplicador || 1))
  const iva = Math.round(precioFinal * 0.21)
  const totalConIva = precioFinal + iva

  const formatARS = (n) => '$' + (n || 0).toLocaleString('es-AR')

  const handleGuardar = async () => {
    if (panelesSeleccionados.length === 0) return alert('Seleccioná al menos un panel')
    if (precioPorPanel <= 0) return alert('Ingresá el precio por panel')
    if (!clienteId && !clienteNuevo.trim()) return alert('Ingresá el nombre del cliente')

    setGuardando(true)
    try {
      let cId = clienteId
      let cNombre = cliente?.nombre || clienteNuevo.trim()
      let cTel = cliente?.telefono || telNuevo.trim()

      if (!cId && clienteNuevo.trim()) {
        const nuevo = await crearCliente({
          nombre: clienteNuevo.trim(),
          telefono: telNuevo.trim() || null,
          contacto: clienteNuevo.trim(),
        })
        cId = nuevo.id
        cNombre = nuevo.nombre
        if (onRefresh) await onRefresh()
      }

      const num = 'CHP-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')

      const detallePaneles = panelesSeleccionados.map(p => ({
        panel_id: p.id,
        nombre: p.nombre,
        paneles: p.paneles,
        zona: p.zona,
      }))

      const presupuesto = {
        numero: num,
        cliente_id: cId,
        vehiculo: vehiculo.trim() || null,
        tipo_trabajo: tipoTrabajo,
        complejidad,
        paneles_detalle: detallePaneles,
        total_paneles: totalPaneles,
        precio_por_panel: precioPorPanel,
        subtotal_siva: precioFinal,
        iva,
        total_civa: totalConIva,
        observaciones: observaciones.trim() || null,
        estado: 'Cotizado',
      }

      const guardado = await crearPresupuestoChapa(presupuesto)

      setPresupuestoCreado({
        ...guardado,
        clienteNombre: cNombre,
        clienteTel: cTel,
        detallePaneles,
      })
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (presupuestoCreado) {
    const p = presupuestoCreado
    const whatsappText = encodeURIComponent(
      `*${EMPRESA.nombre}*\n` +
      `Presupuesto: ${p.numero}\n` +
      `Fecha: ${new Date().toLocaleDateString('es-AR')}\n` +
      (p.vehiculo ? `Vehículo: ${p.vehiculo}\n` : '') +
      `\n*Trabajo: ${TIPOS_TRABAJO.find(t => t.id === p.tipo_trabajo)?.nombre || p.tipo_trabajo}*\n` +
      `Complejidad: ${COMPLEJIDAD.find(c => c.id === p.complejidad)?.nombre}\n` +
      `\n*Paneles:*\n` +
      p.detallePaneles.map(dp => `• ${dp.nombre} (${dp.paneles} panel${dp.paneles > 1 ? 'es' : ''})`).join('\n') +
      `\n\nTotal paneles: ${p.total_paneles}\n` +
      `Subtotal s/IVA: ${formatARS(p.subtotal_siva)}\n` +
      `IVA 21%: ${formatARS(p.iva)}\n` +
      `*TOTAL c/IVA: ${formatARS(p.total_civa)}*\n` +
      `\nMateriales y mano de obra incluidos.\n` +
      `Validez: 15 días.\n` +
      `\n📍 ${EMPRESA.direccion}, ${EMPRESA.ciudad}\n📞 ${EMPRESA.tel}\n📷 ${EMPRESA.instagram}`
    )
    const whatsappUrl = p.clienteTel
      ? `https://wa.me/${p.clienteTel.replace(/[^0-9]/g, '')}?text=${whatsappText}`
      : null

    return (
      <div>
        <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">✓</div>
            <div>
              <h2 className="text-xl font-bold text-green-800 dark:text-green-300">Presupuesto creado: {p.numero}</h2>
              <p className="text-green-600 dark:text-green-400 text-sm">Guardado en el sistema</p>
            </div>
          </div>
          <p className="text-green-700 dark:text-green-300"><strong>Cliente:</strong> {p.clienteNombre}</p>
          {p.vehiculo && <p className="text-green-700 dark:text-green-300"><strong>Vehículo:</strong> {p.vehiculo}</p>}
          <p className="text-green-700 dark:text-green-300"><strong>Paneles:</strong> {p.total_paneles} · <strong>Total:</strong> {formatARS(p.total_civa)} c/IVA</p>
        </div>

        <div className="flex gap-3 flex-wrap mb-6">
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold inline-flex items-center gap-2">
              📲 Enviar por WhatsApp
            </a>
          )}
          <button onClick={() => { setPresupuestoCreado(null); setPaneles({}); setVehiculo(''); setObservaciones(''); setPrecioPorPanel(0); onCreado() }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bold">
            ➕ Nuevo presupuesto
          </button>
        </div>

        {/* Resumen visual */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-5">
          <div className="bg-slate-900 text-white rounded-t-xl p-4 -mx-5 -mt-5 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-orange-400">{EMPRESA.nombre.toUpperCase()}</h3>
                <p className="text-xs text-slate-400">{EMPRESA.direccion} · {EMPRESA.ciudad}</p>
                <p className="text-xs text-slate-400">CUIT: {EMPRESA.cuit} · Tel: {EMPRESA.tel}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">PRESUPUESTO</p>
                <p className="text-orange-300">{p.numero}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div><strong>Cliente:</strong> {p.clienteNombre}</div>
            {p.vehiculo && <div><strong>Vehículo:</strong> {p.vehiculo}</div>}
            <div><strong>Trabajo:</strong> {TIPOS_TRABAJO.find(t => t.id === p.tipo_trabajo)?.nombre}</div>
            <div><strong>Complejidad:</strong> {COMPLEJIDAD.find(c => c.id === p.complejidad)?.nombre}</div>
          </div>

          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                <th className="px-3 py-2 text-left">Panel</th>
                <th className="px-3 py-2 text-center">Zona</th>
                <th className="px-3 py-2 text-center">Paneles</th>
                <th className="px-3 py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {p.detallePaneles.map((dp, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                  <td className="px-3 py-2">{dp.nombre}</td>
                  <td className="px-3 py-2 text-center text-xs text-slate-500">{dp.zona}</td>
                  <td className="px-3 py-2 text-center font-bold">{dp.paneles}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatARS(dp.paneles * p.precio_por_panel * (complejidadObj?.multiplicador || 1))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-right space-y-1">
            <p className="text-sm">Subtotal s/IVA: <strong className="font-mono">{formatARS(p.subtotal_siva)}</strong></p>
            <p className="text-sm">IVA 21%: <strong className="font-mono">{formatARS(p.iva)}</strong></p>
            <p className="text-xl font-bold text-orange-500">TOTAL c/IVA: <span className="font-mono">{formatARS(p.total_civa)}</span></p>
          </div>

          <p className="mt-4 text-xs text-slate-400">Materiales y mano de obra incluidos · Validez: 15 días</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-orange-300 mb-6">🎨 Nuevo presupuesto de Chapa y Pintura</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: datos + tipo */}
        <div className="lg:col-span-1 space-y-4">
          {/* Cliente */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3">Cliente</h3>

            <div className="flex gap-2 mb-3">
              <button onClick={() => setModoCliente('existente')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${modoCliente === 'existente' ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                Existente
              </button>
              <button onClick={() => setModoCliente('nuevo')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${modoCliente === 'nuevo' ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                Nuevo
              </button>
            </div>

            {modoCliente === 'existente' ? (
              <select value={clienteId} onChange={e => setClienteId(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm">
                <option value="">Seleccionar...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            ) : (
              <div className="space-y-2">
                <input type="text" value={clienteNuevo} onChange={e => setClienteNuevo(e.target.value)}
                  placeholder="Nombre del cliente" className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
                <input type="tel" value={telNuevo} onChange={e => setTelNuevo(e.target.value)}
                  placeholder="WhatsApp (ej: 2974000000)" className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
              </div>
            )}
          </div>

          {/* Vehículo */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3">Vehículo</h3>
            <input type="text" value={vehiculo} onChange={e => setVehiculo(e.target.value)}
              placeholder="Ej: VW Gol Trend 2018 Blanco" className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
          </div>

          {/* Tipo de trabajo */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3">Tipo de trabajo</h3>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS_TRABAJO.map(t => (
                <button key={t.id} onClick={() => setTipoTrabajo(t.id)}
                  className={`p-2 rounded-lg text-xs font-bold text-left ${tipoTrabajo === t.id ? 'bg-orange-500 text-white' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}>
                  {t.icon} {t.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Complejidad */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3">Complejidad</h3>
            {COMPLEJIDAD.map(c => (
              <button key={c.id} onClick={() => setComplejidad(c.id)}
                className={`w-full p-3 rounded-lg text-left mb-2 ${complejidad === c.id ? 'bg-orange-500 text-white' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                <p className="font-bold text-sm">{c.nombre} {c.multiplicador !== 1 && <span className="opacity-70">({c.multiplicador > 1 ? '+' : ''}{Math.round((c.multiplicador - 1) * 100)}%)</span>}</p>
                <p className="text-xs opacity-80">{c.desc}</p>
              </button>
            ))}
          </div>

          {/* Precio por panel */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3">Precio por panel (M.O. + materiales)</h3>
            <input type="number" value={precioPorPanel || ''} onChange={e => setPrecioPorPanel(parseFloat(e.target.value) || 0)}
              placeholder="$0" min="0" className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2.5 text-lg font-mono font-bold text-right" />
            <p className="text-xs text-slate-400 mt-1">Incluye materiales y mano de obra</p>
          </div>

          {/* Observaciones */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3">Observaciones</h3>
            <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
              rows="3" placeholder="Notas, detalles del daño, colores, plazo..." className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        {/* Columna derecha: paneles */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-700 dark:text-slate-200">Seleccioná los paneles a trabajar</h3>
              <span className="text-sm text-orange-500 font-bold">{totalPaneles} paneles seleccionados</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PANELES.map(p => (
                <button key={p.id} onClick={() => togglePanel(p.id)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    paneles[p.id]
                      ? 'bg-orange-500 text-white shadow-lg scale-[1.02]'
                      : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                  }`}>
                  <p className="font-bold text-sm">{p.nombre}</p>
                  <p className="text-xs opacity-80">{p.zona} · {p.paneles} panel{p.paneles > 1 ? 'es' : ''}</p>
                  {paneles[p.id] && precioPorPanel > 0 && (
                    <p className="text-xs font-mono mt-1 font-bold">
                      {formatARS(Math.round(p.paneles * precioPorPanel * (complejidadObj?.multiplicador || 1)))}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-5 sticky top-20">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3">Resumen del presupuesto</h3>

            {panelesSeleccionados.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">Seleccioná paneles arriba para ver el resumen</p>
            ) : (
              <>
                <div className="space-y-1 mb-4">
                  {panelesSeleccionados.map(p => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span>{p.nombre} <span className="text-slate-400">({p.paneles}p)</span></span>
                      <span className="font-mono">{formatARS(Math.round(p.paneles * precioPorPanel * (complejidadObj?.multiplicador || 1)))}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-1 text-right">
                  <p className="text-sm">Total paneles: <strong>{totalPaneles}</strong> × {formatARS(precioPorPanel)} × {complejidadObj?.multiplicador}</p>
                  <p className="text-sm">Subtotal s/IVA: <strong className="font-mono">{formatARS(precioFinal)}</strong></p>
                  <p className="text-sm">IVA 21%: <strong className="font-mono">{formatARS(iva)}</strong></p>
                  <p className="text-2xl font-bold text-orange-500">
                    TOTAL: <span className="font-mono">{formatARS(totalConIva)}</span>
                  </p>
                </div>

                <button onClick={handleGuardar} disabled={guardando || precioPorPanel <= 0}
                  className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  {guardando ? 'Guardando...' : '✓ Guardar presupuesto'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
