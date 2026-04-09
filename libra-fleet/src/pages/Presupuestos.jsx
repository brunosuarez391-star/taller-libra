import { useState } from 'react'
import { PRECIOS, SERVICIOS } from '../lib/data'

export default function Presupuestos({ vehiculos, clientes }) {
  const [clienteId, setClienteId] = useState('')
  const [servicio, setServicio] = useState('service_20k')
  const [presupuesto, setPresupuesto] = useState(null)

  const vehiculosCliente = clienteId ? vehiculos.filter(v => v.cliente_id === clienteId) : []
  const cliente = clientes.find(c => c.id === clienteId)
  const srv = SERVICIOS[servicio]

  const generarPresupuesto = () => {
    const items = vehiculosCliente.map(v => {
      const precio = PRECIOS[`M.B. ${v.modelo}`] || PRECIOS['M.B. 1634']
      return {
        codigo: v.codigo,
        modelo: `${v.marca} ${v.modelo} ${v.tipo}`,
        categoria: v.categoria,
        mo: precio.mo,
        insumos: precio.insumos,
        total: precio.total,
      }
    })

    const subtotal = items.reduce((s, i) => s + i.total, 0)
    const iva = Math.round(subtotal * 0.21)
    const total = subtotal + iva
    const num = 'PP-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')

    setPresupuesto({ numero: num, cliente: cliente?.nombre, items, subtotal, iva, total, fecha: new Date().toLocaleDateString('es-AR'), servicio: srv.nombre })
  }

  const formatARS = (n) => '$' + n.toLocaleString('es-AR')

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1F3864] mb-6">Presupuestos Flota</h2>

      {!presupuesto ? (
        <div className="bg-white rounded-xl shadow p-6 max-w-2xl">
          <div className="mb-4">
            <label className="block text-sm font-bold text-slate-700 mb-1">Cliente</label>
            <select value={clienteId} onChange={e => setClienteId(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none">
              <option value="">Seleccionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Service</label>
            <select value={servicio} onChange={e => setServicio(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none">
              {Object.entries(SERVICIOS).map(([key, s]) => <option key={key} value={key}>{s.nombre} ({s.tiempo})</option>)}
            </select>
          </div>

          {clienteId && (
            <div className="bg-[#D6E4F0] rounded-lg p-4 mb-4">
              <p className="font-bold text-[#1F3864] mb-2">{vehiculosCliente.length} unidades de {cliente?.nombre}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {vehiculosCliente.map(v => (
                  <span key={v.id} className="bg-white px-2 py-1 rounded text-xs font-mono">{v.codigo} — {v.modelo}</span>
                ))}
              </div>
            </div>
          )}

          <button onClick={generarPresupuesto} disabled={!clienteId || vehiculosCliente.length === 0} className="w-full bg-[#1F3864] text-white py-3 rounded-lg font-bold text-lg hover:bg-[#2E75B6] transition-colors disabled:opacity-50">
            Generar Presupuesto
          </button>
        </div>
      ) : (
        <div>
          {/* Header presupuesto */}
          <div className="bg-[#1F3864] text-white rounded-t-xl p-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold">LIBRA SERVICIOS INDUSTRIALES</h3>
                <p className="text-blue-200 text-sm">Av. del Progreso 7080, Parque Industrial, Comodoro Rivadavia</p>
                <p className="text-blue-200 text-sm">CUIT: 20-35658676-0 | Tel: 297-4773784</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">PRESUPUESTO</p>
                <p className="text-blue-200">{presupuesto.numero}</p>
                <p className="text-blue-200 text-sm">{presupuesto.fecha}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#2E75B6] text-white px-5 py-2 flex justify-between">
            <span>Cliente: <strong>{presupuesto.cliente}</strong></span>
            <span>{presupuesto.servicio} — {presupuesto.items.length} unidades</span>
          </div>

          {/* Tabla */}
          <div className="bg-white shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#D6E4F0] text-[#1F3864]">
                  <th className="px-4 py-3 text-left">Código</th>
                  <th className="px-4 py-3 text-left">Modelo</th>
                  <th className="px-4 py-3 text-left">Categoría</th>
                  <th className="px-4 py-3 text-right">M.O.</th>
                  <th className="px-4 py-3 text-right">Insumos</th>
                  <th className="px-4 py-3 text-right">Total s/IVA</th>
                </tr>
              </thead>
              <tbody>
                {presupuesto.items.map((item, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono font-bold">{item.codigo}</td>
                    <td className="px-4 py-2">{item.modelo}</td>
                    <td className="px-4 py-2 text-xs">{item.categoria}</td>
                    <td className="px-4 py-2 text-right font-mono">{formatARS(item.mo)}</td>
                    <td className="px-4 py-2 text-right font-mono">{formatARS(item.insumos)}</td>
                    <td className="px-4 py-2 text-right font-mono font-bold">{formatARS(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="bg-white shadow rounded-b-xl p-5">
            <div className="flex justify-end">
              <div className="w-72">
                <div className="flex justify-between py-1 border-b"><span>Subtotal s/IVA:</span><span className="font-mono">{formatARS(presupuesto.subtotal)}</span></div>
                <div className="flex justify-between py-1 border-b"><span>IVA 21%:</span><span className="font-mono">{formatARS(presupuesto.iva)}</span></div>
                <div className="flex justify-between py-2 text-xl font-bold text-[#1F3864]"><span>TOTAL c/IVA:</span><span className="font-mono">{formatARS(presupuesto.total)}</span></div>
              </div>
            </div>
            <div className="mt-4 bg-[#D6E4F0] rounded-lg p-3 text-xs text-slate-600">
              <p><strong>Condición de pago:</strong> 30 días</p>
              <p><strong>Validez:</strong> 15 días</p>
              <p><strong>Insumos:</strong> Cotización Jones SRL N°33036 (30/03/2026)</p>
              <p><strong>Incluye:</strong> {srv.items.join(', ')}</p>
            </div>

            <div className="flex gap-4 mt-6">
              <button onClick={() => window.print()} className="bg-[#1F3864] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#2E75B6]">
                Imprimir / PDF
              </button>
              <button onClick={() => setPresupuesto(null)} className="bg-slate-200 text-slate-700 px-6 py-3 rounded-lg font-bold hover:bg-slate-300">
                Nuevo Presupuesto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
