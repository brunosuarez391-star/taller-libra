import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getVehiculoPorCodigo, getOrdenesPorCodigo } from '../lib/api'
import { EMPRESA } from '../lib/data'

export default function VehiculoPublico() {
  const { codigo } = useParams()
  const [vehiculo, setVehiculo] = useState(null)
  const [ordenes, setOrdenes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const [v, ots] = await Promise.all([getVehiculoPorCodigo(codigo), getOrdenesPorCodigo(codigo)])
      setVehiculo(v)
      setOrdenes(ots || [])
      setLoading(false)
    }
    cargar()
  }, [codigo])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#2E75B6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!vehiculo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <p className="text-4xl mb-4">🚛</p>
          <h1 className="text-xl font-bold text-[#1F3864] mb-2">Vehículo no encontrado</h1>
          <p className="text-slate-500">El código "{codigo}" no existe en el sistema.</p>
        </div>
      </div>
    )
  }

  const ultimaOT = ordenes[0]

  const getEstadoBadge = () => {
    if (!ultimaOT) return { text: 'SIN DATOS', color: 'bg-slate-400', emoji: '❓' }
    const km = ultimaOT.km_ingreso || 0
    const proximo = ultimaOT.km_proximo || km + 20000
    const faltante = proximo - km
    if (faltante <= 0) return { text: 'VENCIDO', color: 'bg-red-500', emoji: '🔴' }
    if (faltante <= 2000) return { text: `PRÓXIMO EN ${faltante.toLocaleString()} KM`, color: 'bg-yellow-500', emoji: '🟡' }
    return { text: 'AL DÍA', color: 'bg-green-500', emoji: '🟢' }
  }

  const badge = getEstadoBadge()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#1F3864] text-white p-5 text-center">
        <h1 className="text-2xl font-bold">LIBRA FLEET</h1>
        <p className="text-blue-200 text-sm">{EMPRESA.nombre} | {EMPRESA.ciudad}</p>
      </header>

      <div className="max-w-lg mx-auto p-4">
        <div className={`${badge.color} text-white rounded-xl p-4 text-center mb-6 shadow-lg`}>
          <p className="text-3xl">{badge.emoji}</p>
          <p className="text-xl font-bold">{badge.text}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-5 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-[#1F3864] text-white px-4 py-2 rounded-full font-bold text-lg">{vehiculo.codigo}</span>
            <div>
              <h2 className="font-bold text-lg text-[#1F3864]">{vehiculo.marca} {vehiculo.modelo}</h2>
              <p className="text-slate-500 text-sm">{vehiculo.tipo} — {vehiculo.categoria}</p>
              {vehiculo.clientes && <p className="text-xs text-slate-400">Cliente: {vehiculo.clientes.nombre}</p>}
            </div>
          </div>
          {ultimaOT && (
            <div className="bg-[#D6E4F0] rounded-lg p-3 text-sm">
              <div className="flex justify-between"><span>Último service:</span><span className="font-bold">{new Date(ultimaOT.fecha).toLocaleDateString('es-AR')}</span></div>
              <div className="flex justify-between"><span>KM:</span><span className="font-bold">{ultimaOT.km_ingreso?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Próximo service:</span><span className="font-bold text-[#2E75B6]">{ultimaOT.km_proximo?.toLocaleString()} km</span></div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-bold text-[#1F3864] mb-3">Historial de Services</h3>
          {ordenes.length === 0 ? (
            <p className="text-slate-400 text-center py-4">Sin registros todavía</p>
          ) : (
            <div className="space-y-3">
              {ordenes.map((ot) => (
                <div key={ot.id} className="border-l-4 border-[#2E75B6] pl-3 py-1">
                  <p className="font-bold text-sm">{ot.servicio_nombre}</p>
                  <p className="text-xs text-slate-500">{new Date(ot.fecha).toLocaleDateString('es-AR')} | {ot.km_ingreso?.toLocaleString()} km | {ot.mecanico}</p>
                  <p className="text-xs text-slate-400">{ot.ot_numero}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-6 mb-8">
          <a href={`https://wa.me/54${EMPRESA.tel}`} className="inline-block bg-green-500 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-green-600">
            💬 Contactar por WhatsApp
          </a>
          <p className="text-slate-400 text-xs mt-3">{EMPRESA.nombre} | {EMPRESA.direccion}</p>
        </div>
      </div>
    </div>
  )
}
