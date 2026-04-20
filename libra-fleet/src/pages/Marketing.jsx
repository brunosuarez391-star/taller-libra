import { useState } from 'react'
import { publicarMarketing, captarLead, getBusLog } from '../lib/api'
import { EMPRESA } from '../lib/data'

const PLANTILLAS = [
  {
    id: 'service_20k',
    titulo: 'Service 20.000 km — Mercedes-Benz',
    texto: 'Servicio integral de 20.000 km para camiones Mercedes-Benz. Cambio de aceite, filtros, engrase, control de frenos y diagnóstico general. Insumos originales, mecánicos especializados y trazabilidad completa.\n\n📍 Comodoro Rivadavia — Parque Industrial\n📞 ' + EMPRESA.tel + '\n🌐 ' + EMPRESA.web,
    hashtags: '#LibraServicios #MercedesBenz #Service20k #CamionesMB #Patagonia #ComodoroRivadavia #Flota #Mantenimiento',
  },
  {
    id: 'flota',
    titulo: 'Mantenimiento de Flotas Industriales',
    texto: 'Gestionamos el mantenimiento preventivo y correctivo de tu flota con órdenes de trabajo digitales, trazabilidad por unidad y facturación mensual consolidada.\n\nEspecialistas en Mercedes-Benz pesado y tractor.\n\n📍 Av. del Progreso 7080 — Comodoro Rivadavia\n📞 ' + EMPRESA.tel,
    hashtags: '#GestiónFlota #Mantenimiento #MercedesBenz #TransporteDeCargas #Patagonia #ComodoroRivadavia',
  },
  {
    id: 'presupuesto',
    titulo: 'Pedí tu presupuesto',
    texto: 'Presupuestá el service de tu unidad en menos de 24hs. Envianos modelo y kilometraje y te respondemos con cotización detallada (mano de obra + insumos + IVA).\n\n📞 WhatsApp: ' + EMPRESA.tel + '\n📧 ' + EMPRESA.email,
    hashtags: '#Presupuesto #Camiones #ServicePatagonia #MercedesBenz #LibraServicios',
  },
  {
    id: 'generico',
    titulo: 'Libra Servicios Industriales',
    texto: 'Taller mecánico pesado en Comodoro Rivadavia. Atención de flotas, services programados, reparaciones y diagnóstico. Confianza y transparencia garantizada.\n\n📍 ' + EMPRESA.direccion + '\n📞 ' + EMPRESA.tel,
    hashtags: '#Taller #Mecánica #Pesados #Patagonia #Comodoro #Libra',
  },
]

export default function Marketing() {
  const [plataformas, setPlataformas] = useState({ facebook: true, instagram: true, whatsapp: false })
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [fotosRaw, setFotosRaw] = useState('')
  const [programadoPara, setProgramadoPara] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [respuesta, setRespuesta] = useState(null)

  // Lead form
  const [lead, setLead] = useState({ nombre: '', telefono: '', fuente: 'Instagram', mensaje: '' })
  const [leadSent, setLeadSent] = useState(false)
  const [historial, setHistorial] = useState(
    () => getBusLog().filter(e => e.evento === 'marketing_publicar' || e.evento === 'lead_captado')
  )
  const refrescarHistorial = () => setHistorial(
    getBusLog().filter(e => e.evento === 'marketing_publicar' || e.evento === 'lead_captado')
  )

  const aplicarPlantilla = (id) => {
    const p = PLANTILLAS.find(x => x.id === id)
    if (!p) return
    setTitulo(p.titulo)
    setTexto(p.texto)
    setHashtags(p.hashtags)
  }

  const togglePlat = (p) => setPlataformas(prev => ({ ...prev, [p]: !prev[p] }))

  const publicar = async () => {
    if (!texto.trim()) { alert('Escribí un texto para publicar.'); return }
    const platActivas = Object.entries(plataformas).filter(([, v]) => v).map(([k]) => k)
    if (platActivas.length === 0) { alert('Seleccioná al menos una plataforma.'); return }
    setEnviando(true)
    const fotos = fotosRaw.split('\n').map(s => s.trim()).filter(Boolean)
    const r = await publicarMarketing({
      plataformas: platActivas,
      titulo,
      texto,
      hashtags,
      fotos,
      programado_para: programadoPara || null,
    })
    setRespuesta(r)
    setEnviando(false)
    refrescarHistorial()
    if (r?.status !== 'bus_offline') {
      setTimeout(() => setRespuesta(null), 4000)
    }
  }

  const enviarLead = async (e) => {
    e.preventDefault()
    if (!lead.nombre || !lead.telefono) { alert('Nombre y teléfono son obligatorios'); return }
    await captarLead(lead)
    setLead({ nombre: '', telefono: '', fuente: 'Instagram', mensaje: '' })
    setLeadSent(true)
    refrescarHistorial()
    setTimeout(() => setLeadSent(false), 3000)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1F3864] mb-2">📣 Marketing & Redes</h2>
      <p className="text-sm text-slate-500 mb-6">Publicá en Facebook e Instagram y capturá leads. Los posts se despachan al Agente Marketing vía bus n8n.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Publicar */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-5">
          <h3 className="text-lg font-bold text-[#1F3864] mb-4">Nueva publicación</h3>

          {/* Plantillas */}
          <div className="mb-4">
            <p className="text-xs font-bold text-slate-500 mb-2">Plantillas rápidas</p>
            <div className="flex flex-wrap gap-2">
              {PLANTILLAS.map(p => (
                <button key={p.id} onClick={() => aplicarPlantilla(p.id)} className="bg-[#D6E4F0] text-[#1F3864] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#2E75B6] hover:text-white">
                  {p.titulo}
                </button>
              ))}
            </div>
          </div>

          {/* Plataformas */}
          <div className="mb-4">
            <p className="text-xs font-bold text-slate-500 mb-2">Plataformas</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'facebook', label: 'Facebook', icon: '📘' },
                { id: 'instagram', label: 'Instagram', icon: '📸' },
                { id: 'whatsapp', label: 'WhatsApp Status', icon: '💬' },
              ].map(p => (
                <button key={p.id} onClick={() => togglePlat(p.id)} className={`px-3 py-2 rounded-lg text-sm font-bold border-2 ${plataformas[p.id] ? 'bg-[#1F3864] text-white border-[#1F3864]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#2E75B6]'}`}>
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Título (opcional)</label>
              <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Service 20k Mercedes-Benz" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-[#2E75B6] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Texto del post *</label>
              <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={8} placeholder="Escribí tu publicación..." className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-[#2E75B6] focus:outline-none font-sans" />
              <p className="text-[11px] text-slate-400 mt-1">{texto.length} caracteres</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Hashtags</label>
              <input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#LibraServicios #MercedesBenz" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-[#2E75B6] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Fotos (URLs públicas de Supabase Storage, una por línea)</label>
              <textarea value={fotosRaw} onChange={e => setFotosRaw(e.target.value)} rows={3} placeholder="https://zcballhidbpsatqjnbuw.supabase.co/storage/v1/object/public/fotos/..." className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-[#2E75B6] focus:outline-none font-mono text-xs" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Programar para (opcional)</label>
              <input type="datetime-local" value={programadoPara} onChange={e => setProgramadoPara(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 focus:border-[#2E75B6] focus:outline-none" />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button onClick={publicar} disabled={enviando} className="bg-[#1F3864] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#2E75B6] disabled:opacity-50">
              {enviando ? 'Enviando al bus...' : programadoPara ? '⏰ Programar publicación' : '🚀 Publicar ahora'}
            </button>
            {respuesta && (
              <span className={`text-sm font-bold ${respuesta.status === 'bus_offline' ? 'text-red-700' : 'text-green-700'}`}>
                {respuesta.status === 'bus_offline' ? '⚠️ Bus offline — guardado local' : '✅ Despachado al bus'}
              </span>
            )}
          </div>
        </div>

        {/* Preview + Lead */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-lg font-bold text-[#1F3864] mb-3">Vista previa</h3>
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 min-h-[200px]">
              {titulo && <p className="font-bold text-[#1F3864] mb-2">{titulo}</p>}
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{texto || <span className="text-slate-400">El post aparecerá acá...</span>}</p>
              {hashtags && <p className="text-sm text-[#2E75B6] mt-2">{hashtags}</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-lg font-bold text-[#1F3864] mb-1">Capturar lead</h3>
            <p className="text-xs text-slate-500 mb-3">Cargá manualmente una consulta de redes.</p>
            <form onSubmit={enviarLead} className="space-y-2">
              <input value={lead.nombre} onChange={e => setLead({ ...lead, nombre: e.target.value })} placeholder="Nombre" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input value={lead.telefono} onChange={e => setLead({ ...lead, telefono: e.target.value })} placeholder="Teléfono" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <select value={lead.fuente} onChange={e => setLead({ ...lead, fuente: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option>Instagram</option>
                <option>Facebook</option>
                <option>WhatsApp</option>
                <option>Google</option>
                <option>Referido</option>
                <option>Otro</option>
              </select>
              <textarea value={lead.mensaje} onChange={e => setLead({ ...lead, mensaje: e.target.value })} placeholder="Consulta" rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <button type="submit" className="w-full bg-[#2E75B6] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#1F3864]">
                {leadSent ? '✅ Enviado' : 'Enviar al bus'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Historial */}
      <div className="bg-white rounded-xl shadow p-5 mt-6">
        <h3 className="text-lg font-bold text-[#1F3864] mb-3">Historial reciente</h3>
        {historial.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">Sin publicaciones todavía.</p>
        ) : (
          <div className="space-y-2">
            {historial.slice(0, 10).map((e, i) => (
              <div key={i} className="flex items-start justify-between border-b border-slate-100 pb-2 text-sm">
                <div>
                  <p className="font-bold text-[#1F3864]">
                    {e.evento === 'marketing_publicar' ? '📣 ' + (e.datos?.titulo || e.datos?.texto?.slice(0, 60) || 'Publicación') : '🎯 Lead: ' + (e.datos?.nombre || '')}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(e.ts).toLocaleString('es-AR')}
                    {e.datos?.plataformas && ' · ' + e.datos.plataformas.join(', ')}
                    {e.datos?.fuente && ' · ' + e.datos.fuente}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${e.status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{e.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
