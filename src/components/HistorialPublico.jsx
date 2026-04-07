import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'

const LIBRA_DARK = '#1F3864'

function BadgeEstado({ vehiculo, ordenes }) {
  const ultimaOT = ordenes
    .filter(o => o.vehiculo_id === vehiculo.id && (o.estado === 'finalizado' || o.estado === 'entregado'))
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0]

  if (!ultimaOT) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
        SIN SERVICES
      </span>
    )
  }

  const diff = ultimaOT.km_proximo_service - vehiculo.km_actuales
  if (diff <= 0) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
        SERVICE VENCIDO
      </span>
    )
  }
  if (diff <= 5000) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
        PRÓXIMO EN {diff.toLocaleString('es-AR')} KM
      </span>
    )
  }
  return (
    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
      AL DÍA
    </span>
  )
}

export default function HistorialPublico({ vehiculos, ordenes }) {
  const [codigoBusqueda, setCodigoBusqueda] = useState('')
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState('')

  const vehiculo = vehiculoSeleccionado
  const historial = vehiculo
    ? ordenes
        .filter(o => o.vehiculo_id === vehiculo.id && (o.estado === 'finalizado' || o.estado === 'entregado'))
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    : []

  useEffect(() => {
    if (vehiculo) {
      QRCode.toDataURL(`https://librapatagonia.com/flota/${vehiculo.codigo}`, {
        width: 150,
        margin: 1,
        color: { dark: LIBRA_DARK, light: '#FFFFFF' },
      }).then(setQrDataUrl)
    }
  }, [vehiculo])

  function buscar() {
    const v = vehiculos.find(
      v => v.codigo.toLowerCase() === codigoBusqueda.toLowerCase()
    )
    setVehiculoSeleccionado(v || null)
    if (!v) alert('Vehículo no encontrado. Probá con U01, U05, etc.')
  }

  return (
    <div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-bold text-libra-dark mb-1">Historial Público de Vehículo</h2>
        <p className="text-xs text-gray-500 mb-4">
          Esta es la vista que ve el cliente al escanear el QR de la etiqueta de service.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={codigoBusqueda}
            onChange={e => setCodigoBusqueda(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscar()}
            placeholder="Código del vehículo (ej: U05)"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-libra-mid/30"
          />
          <button
            onClick={buscar}
            className="bg-libra-mid text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-libra-dark transition-colors"
          >
            Buscar
          </button>
        </div>

        {/* Acceso rápido */}
        <div className="flex flex-wrap gap-2 mt-3">
          {vehiculos.slice(0, 8).map(v => (
            <button
              key={v.id}
              onClick={() => { setCodigoBusqueda(v.codigo); setVehiculoSeleccionado(v) }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                vehiculoSeleccionado?.id === v.id
                  ? 'bg-libra-dark text-white border-libra-dark'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {v.codigo}
            </button>
          ))}
        </div>
      </div>

      {/* Vista pública del vehículo */}
      {vehiculo && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header con degradé Libra */}
          <div className="p-6" style={{ background: `linear-gradient(135deg, ${LIBRA_DARK}, #2E75B6)` }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/60 text-xs uppercase tracking-wider mb-1">Vehículo</div>
                <h3 className="text-white text-xl font-bold">
                  M.B. {vehiculo.modelo}
                </h3>
                <div className="text-white/80 text-sm mt-1">
                  {vehiculo.codigo} · {vehiculo.categoria} · {vehiculo.anio}
                </div>
              </div>
              <div className="text-right">
                <BadgeEstado vehiculo={vehiculo} ordenes={ordenes} />
                <div className="text-white text-2xl font-bold mt-2">
                  {vehiculo.km_actuales.toLocaleString('es-AR')}
                  <span className="text-sm font-normal text-white/60"> km</span>
                </div>
              </div>
            </div>
          </div>

          {/* Próximo service */}
          {historial.length > 0 && (
            <div className="px-6 py-4 bg-green-50 border-b border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-green-600 font-medium uppercase">Próximo Service Programado</div>
                  <div className="text-lg font-bold text-green-700">
                    {historial[0].km_proximo_service.toLocaleString('es-AR')} km
                  </div>
                </div>
                <div className="text-right text-xs text-green-600">
                  Faltan {(historial[0].km_proximo_service - vehiculo.km_actuales).toLocaleString('es-AR')} km
                </div>
              </div>
            </div>
          )}

          {/* Historial de services */}
          <div className="p-6">
            <h4 className="text-sm font-bold text-libra-dark mb-4">Historial de Services</h4>
            {historial.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                Este vehículo no tiene services registrados aún.
              </div>
            ) : (
              <div className="space-y-4">
                {historial.map(ot => (
                  <div key={ot.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-libra-mid">{ot.id}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(ot.fecha).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      Km al momento: <span className="font-semibold text-gray-700">{ot.km_ingreso.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="space-y-1">
                      {ot.servicios.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span className="text-gray-700">{s}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      Mecánico: {ot.mecanico}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* QR */}
            {qrDataUrl && (
              <div className="mt-6 flex flex-col items-center border-t border-gray-100 pt-6">
                <img src={qrDataUrl} alt="QR" className="w-28 h-28" />
                <div className="text-[10px] text-gray-400 mt-2">
                  librapatagonia.com/flota/{vehiculo.codigo}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
