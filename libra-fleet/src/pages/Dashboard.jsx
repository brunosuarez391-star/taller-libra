import { useState } from 'react'
import { FLOTA_ACACIO, ESTADOS_OT } from '../lib/data'

export default function Dashboard({ ordenes }) {
  const otActivas = ordenes.filter(o => o.estado !== 'Entregado')
  const otFinalizadas = ordenes.filter(o => o.estado === 'Finalizado' || o.estado === 'Entregado')

  const stats = [
    { label: 'Unidades en flota', value: FLOTA_ACACIO.length, color: 'bg-[#1F3864]' },
    { label: 'OTs activas', value: otActivas.length, color: 'bg-[#2E75B6]' },
    { label: 'Finalizadas', value: otFinalizadas.length, color: 'bg-green-600' },
    { label: 'Total OTs', value: ordenes.length, color: 'bg-slate-600' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1F3864] mb-6">Dashboard — Libra Fleet</h2>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, color }) => (
          <div key={label} className={`${color} text-white rounded-xl p-5 shadow-lg`}>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* OTs recientes */}
      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="text-lg font-bold text-[#1F3864] mb-4">Ordenes de Trabajo Recientes</h3>
        {ordenes.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No hay OTs todavía. Creá una desde "+ Nueva OT"</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#D6E4F0] text-[#1F3864]">
                  <th className="px-3 py-2 text-left">OT</th>
                  <th className="px-3 py-2 text-left">Unidad</th>
                  <th className="px-3 py-2 text-left">Cliente</th>
                  <th className="px-3 py-2 text-left">Servicio</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                  <th className="px-3 py-2 text-left">KM</th>
                </tr>
              </thead>
              <tbody>
                {ordenes.slice().reverse().map((ot, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono font-bold">{ot.ot_numero}</td>
                    <td className="px-3 py-2">{ot.codigo} {ot.modelo}</td>
                    <td className="px-3 py-2">{ot.cliente}</td>
                    <td className="px-3 py-2">{ot.servicio_nombre}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        ot.estado === 'Ingresado' ? 'bg-yellow-100 text-yellow-800' :
                        ot.estado === 'En proceso' ? 'bg-blue-100 text-blue-800' :
                        ot.estado === 'Finalizado' ? 'bg-green-100 text-green-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {ot.estado}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono">{ot.km?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
