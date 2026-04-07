import React from 'react'

const ALERTAS_KM = 5000

function IconTruck() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2E75B6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
}
function IconCheck() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="m9 12 2 2 4-4"/></svg>
}
function IconRoute() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></svg>
}
function IconWrench() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
}

export default function Dashboard({ vehiculos, ordenes }) {
  const activos = vehiculos.filter(v => v.estado === 'activo').length
  const enMantenimiento = vehiculos.filter(v => v.estado === 'mantenimiento').length
  const enRuta = vehiculos.filter(v => v.estado === 'activo').length
  const kmTotal = vehiculos.reduce((s, v) => s + v.km_actuales, 0)

  // Próximos servicios
  const proximosServicios = vehiculos.map(v => {
    const ultimaOT = ordenes
      .filter(o => (o.vehiculo_id === v.id || o.vehiculo_id === v.codigo) && (o.estado === 'finalizado' || o.estado === 'entregado'))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0]
    return { vehiculo: v, ot: ultimaOT }
  }).filter(item => item.ot)
    .sort((a, b) => a.ot.km_proximo_service - a.vehiculo.km_actuales - (b.ot.km_proximo_service - b.vehiculo.km_actuales))

  const ESTADO_BADGE = {
    activo: { label: 'Activo', cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
    mantenimiento: { label: 'En taller', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    inactivo: { label: 'Inactivo', cls: 'bg-muted/10 text-muted border-border' },
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-text mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <IconTruck />
          <div>
            <div className="text-3xl font-bold text-text">{vehiculos.length}</div>
            <div className="text-xs text-muted">Total flota</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <IconCheck />
          <div>
            <div className="text-3xl font-bold text-green-400">{activos}</div>
            <div className="text-xs text-muted">Activos</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <IconRoute />
          <div>
            <div className="text-3xl font-bold text-amber-400">{enRuta}</div>
            <div className="text-xs text-muted">En ruta</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <IconWrench />
          <div>
            <div className="text-3xl font-bold text-muted">{enMantenimiento}</div>
            <div className="text-xs text-muted">En taller</div>
          </div>
        </div>
      </div>

      {/* Tabla próximos servicios */}
      <h2 className="text-lg font-semibold text-text mb-4">Próximos servicios</h2>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Código</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Modelo</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Km Actuales</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Próx. Service</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody>
            {vehiculos.map(v => {
              const est = ESTADO_BADGE[v.estado] || ESTADO_BADGE.inactivo
              const ultimaOT = ordenes
                .filter(o => (o.vehiculo_id === v.id || o.vehiculo_id === v.codigo) && (o.estado === 'finalizado' || o.estado === 'entregado'))
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0]
              const proxService = ultimaOT
                ? new Date(new Date(ultimaOT.fecha).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                : '—'

              return (
                <tr key={v.id} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-semibold text-text">{v.codigo}</td>
                  <td className="px-5 py-3.5 text-sm text-muted">{v.marca} {v.modelo}</td>
                  <td className="px-5 py-3.5 text-sm text-muted">{v.km_actuales.toLocaleString('es-AR')} km</td>
                  <td className="px-5 py-3.5 text-sm text-muted">{proxService}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold border ${est.cls}`}>
                      {est.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
