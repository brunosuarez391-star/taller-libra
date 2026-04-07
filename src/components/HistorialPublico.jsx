import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'

const LIBRA_DARK = '#1F3864'

export default function HistorialPublico({ vehiculos, ordenes }) {
  const [codigoBusqueda, setCodigoBusqueda] = useState('')
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState('')

  const vehiculo = vehiculoSeleccionado
  const historial = vehiculo
    ? ordenes
        .filter(o => (o.vehiculo_id === vehiculo.id || o.vehiculo_id === vehiculo.codigo) && (o.estado === 'finalizado' || o.estado === 'entregado'))
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    : []

  useEffect(() => {
    if (vehiculo) {
      QRCode.toDataURL(`https://librapatagonia.com/flota/${vehiculo.codigo}`, {
        width: 150, margin: 1, color: { dark: '#E2E8F0', light: '#1E293B' },
      }).then(setQrDataUrl)
    }
  }, [vehiculo])

  function buscar() {
    const v = vehiculos.find(v => v.codigo.toLowerCase() === codigoBusqueda.toLowerCase())
    setVehiculoSeleccionado(v || null)
    if (!v) alert('Vehículo no encontrado.')
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-text mb-6">Historial de Vehículo</h1>

      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <p className="text-xs text-muted mb-3">Vista pública que ve el cliente al escanear el QR.</p>
        <div className="flex gap-2 mb-3">
          <input type="text" value={codigoBusqueda} onChange={e => setCodigoBusqueda(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscar()} placeholder="Código del vehículo (ej: U05)"
            className="flex-1 bg-bg border border-border rounded-lg px-4 py-2 text-sm text-text placeholder-muted focus:outline-none focus:border-libra-mid" />
          <button onClick={buscar}
            className="bg-libra-mid text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-libra-dark transition-colors">
            Buscar
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {vehiculos.slice(0, 10).map(v => (
            <button key={v.id} onClick={() => { setCodigoBusqueda(v.codigo); setVehiculoSeleccionado(v) }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                vehiculoSeleccionado?.id === v.id ? 'bg-libra-dark text-white border-libra-dark' : 'text-muted border-border hover:text-text'
              }`}>
              {v.codigo}
            </button>
          ))}
        </div>
      </div>

      {vehiculo && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-5" style={{ background: 'linear-gradient(135deg, #1F3864, #2E75B6)' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Vehículo</div>
                <h3 className="text-white text-xl font-bold">{vehiculo.marca} {vehiculo.modelo}</h3>
                <div className="text-white/60 text-sm mt-1">{vehiculo.codigo} · {vehiculo.categoria} · {vehiculo.anio}</div>
              </div>
              <div className="text-right">
                <div className="text-white text-2xl font-bold">{vehiculo.km_actuales.toLocaleString('es-AR')}<span className="text-sm font-normal text-white/50 ml-1">km</span></div>
              </div>
            </div>
          </div>

          {historial.length > 0 && (
            <div className="px-5 py-3 bg-green-500/5 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-green-400 font-medium uppercase">Próximo Service</div>
                  <div className="text-base font-bold text-green-400">{historial[0].km_proximo_service.toLocaleString('es-AR')} km</div>
                </div>
                <div className="text-xs text-muted">
                  Faltan {(historial[0].km_proximo_service - vehiculo.km_actuales).toLocaleString('es-AR')} km
                </div>
              </div>
            </div>
          )}

          <div className="p-5">
            <h4 className="text-sm font-semibold text-text mb-4">Historial de Services</h4>
            {historial.length === 0 ? (
              <div className="text-center py-8 text-muted text-sm">Sin services registrados.</div>
            ) : (
              <div className="space-y-3">
                {historial.map(ot => (
                  <div key={ot.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-libra-light">{ot.id}</span>
                      <span className="text-xs text-muted">
                        {new Date(ot.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-xs text-muted mb-2">
                      Km: <span className="font-semibold text-text">{ot.km_ingreso.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="space-y-1">
                      {ot.servicios.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="text-green-400 mt-0.5">✓</span>
                          <span className="text-muted">{s}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-muted/60">Mecánico: {ot.mecanico}</div>
                  </div>
                ))}
              </div>
            )}

            {qrDataUrl && (
              <div className="mt-6 flex flex-col items-center border-t border-border pt-6">
                <img src={qrDataUrl} alt="QR" className="w-28 h-28" />
                <div className="text-[10px] text-muted mt-2">librapatagonia.com/flota/{vehiculo.codigo}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
