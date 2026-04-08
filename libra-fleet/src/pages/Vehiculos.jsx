import { FLOTA_ACACIO } from '../lib/data'

export default function Vehiculos() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1F3864] mb-6">Flota — Acacio Lorenzo</h2>
      <p className="text-slate-500 mb-4">13 unidades Mercedes-Benz</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FLOTA_ACACIO.map((v) => (
          <div key={v.codigo} className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow p-5 border-l-4 border-[#2E75B6]">
            <div className="flex items-center justify-between mb-2">
              <span className="bg-[#1F3864] text-white px-3 py-1 rounded-full text-sm font-bold">{v.codigo}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                v.categoria === 'Camión Pesado' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {v.categoria}
              </span>
            </div>
            <h3 className="font-bold text-lg text-[#1F3864]">{v.modelo}</h3>
            <p className="text-slate-500 text-sm">{v.tipo}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
