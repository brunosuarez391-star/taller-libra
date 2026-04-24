import { useCallback, useEffect, useRef, useState } from 'react'
import { ensureFolder, uploadFile, deleteFile, getWebViewLink } from '../lib/drive'
import { useDrive } from '../lib/useDrive'
import {
  listArchivosOT,
  crearArchivoOT,
  eliminarArchivoOT,
} from '../lib/api'

const ROOT_FOLDER = 'Libra Fleet'

export default function DriveAttachments({ otId, otNumero }) {
  const { authed, busy: authBusy, error: authError, connect, disconnect } = useDrive()
  const [archivos, setArchivos] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState(null)
  const fileRef = useRef(null)
  const cameraRef = useRef(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await listArchivosOT(otId)
      setArchivos(rows)
    } catch (err) {
      setMsg({ type: 'error', text: 'Error cargando adjuntos: ' + err.message })
    } finally {
      setLoading(false)
    }
  }, [otId])

  useEffect(() => { if (otId) cargar() }, [otId, cargar])

  const handleFiles = async (files) => {
    if (!files?.length) return
    if (!authed) {
      try { await connect() } catch { return }
    }
    setUploading(true); setMsg(null)
    try {
      const rootId = await ensureFolder(ROOT_FOLDER)
      const otFolderId = await ensureFolder(otNumero || `OT-${otId.slice(0, 8)}`, rootId)
      for (const file of files) {
        const uploaded = await uploadFile(file, { folderId: otFolderId })
        await crearArchivoOT({
          ot_id: otId,
          drive_file_id: uploaded.id,
          nombre: uploaded.name,
          mime_type: uploaded.mimeType,
          link: uploaded.webViewLink || getWebViewLink(uploaded.id),
        })
      }
      await cargar()
      setMsg({ type: 'ok', text: `${files.length} archivo(s) subidos` })
    } catch (err) {
      setMsg({ type: 'error', text: 'Error subiendo: ' + err.message })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
      if (cameraRef.current) cameraRef.current.value = ''
    }
  }

  const handleEliminar = async (archivo) => {
    if (!confirm(`¿Eliminar "${archivo.nombre}" de Drive?`)) return
    try {
      if (authed) {
        try { await deleteFile(archivo.drive_file_id) } catch (err) { console.warn('Drive delete:', err.message) }
      }
      await eliminarArchivoOT(archivo.id)
      await cargar()
    } catch (err) {
      setMsg({ type: 'error', text: 'Error eliminando: ' + err.message })
    }
  }

  return (
    <div className="mt-3 bg-slate-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-slate-600">📎 Adjuntos Drive</p>
        {authed ? (
          <button onClick={disconnect} className="text-xs text-slate-400 hover:text-slate-600">
            Desconectar Drive
          </button>
        ) : (
          <button onClick={connect} disabled={authBusy} className="text-xs bg-[#1F3864] text-white px-2 py-1 rounded hover:bg-[#2E75B6] disabled:opacity-50">
            {authBusy ? 'Conectando...' : 'Conectar Drive'}
          </button>
        )}
      </div>

      {authError && <p className="text-xs text-red-600 mb-2">{authError}</p>}

      <div className="flex gap-2 mb-2 flex-wrap">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-100 disabled:opacity-50"
        >
          📁 Subir archivo
        </button>
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={uploading}
          className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-100 disabled:opacity-50"
        >
          📷 Sacar foto
        </button>
        {uploading && <span className="text-xs text-slate-500 self-center">Subiendo...</span>}
      </div>

      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(Array.from(e.target.files || []))}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(Array.from(e.target.files || []))}
      />

      {msg && (
        <p className={`text-xs mb-2 ${msg.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
          {msg.text}
        </p>
      )}

      {loading ? (
        <p className="text-xs text-slate-400">Cargando...</p>
      ) : archivos.length === 0 ? (
        <p className="text-xs text-slate-400 italic">Sin adjuntos.</p>
      ) : (
        <ul className="space-y-1">
          {archivos.map((a) => (
            <li key={a.id} className="flex items-center justify-between bg-white rounded px-2 py-1 text-xs">
              <a
                href={a.link || getWebViewLink(a.drive_file_id)}
                target="_blank"
                rel="noreferrer"
                className="text-[#1F3864] hover:underline truncate flex-1 mr-2"
              >
                {a.mime_type?.startsWith('image/') ? '🖼️' : '📄'} {a.nombre}
              </a>
              <button onClick={() => handleEliminar(a)} className="text-red-500 hover:text-red-700">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
