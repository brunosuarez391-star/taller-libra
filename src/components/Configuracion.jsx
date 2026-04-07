import React, { useState, useEffect } from 'react'
import { guardarConfig, borrarConfig, obtenerConfig, tieneConfig, testConexion } from '../lib/supabase'

export default function Configuracion({ onToast }) {
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [testing, setTesting] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [configActual, setConfigActual] = useState(null)

  useEffect(() => {
    const config = obtenerConfig()
    setConfigActual(config)
    if (config) { setUrl(config.url); setKey(config.key) }
  }, [])

  async function handleTestear() {
    setTesting(true); setResultado(null)
    const res = await testConexion()
    setResultado(res); setTesting(false)
  }

  function handleGuardar() {
    if (!url.includes('supabase.co')) { onToast?.('URL inválida', 'error'); return }
    if (!key.startsWith('eyJ')) { onToast?.('Key inválida', 'error'); return }
    guardarConfig(url.trim(), key.trim())
  }

  function handleDesconectar() {
    if (confirm('¿Desconectar Supabase?')) borrarConfig()
  }

  const conectado = tieneConfig()
  const inputCls = "w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-muted focus:outline-none focus:border-libra-mid font-mono"
  const labelCls = "text-xs font-medium text-muted mb-1.5 block"

  return (
    <div className="animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold text-text mb-6">Configuración</h1>

      {/* Estado */}
      <div className={`rounded-xl p-4 border mb-6 flex items-center gap-3 ${
        conectado ? 'bg-green-500/5 border-green-500/20' : 'bg-amber-500/5 border-amber-500/20'
      }`}>
        <div className={`w-3 h-3 rounded-full ${conectado ? 'bg-green-500' : 'bg-amber-500'}`} />
        <div>
          <div className={`text-sm font-semibold ${conectado ? 'text-green-400' : 'text-amber-400'}`}>
            {conectado ? 'Supabase conectado' : 'Modo offline'}
          </div>
          <div className="text-xs text-muted">
            {conectado ? configActual?.url : 'Configurá las credenciales para sincronizar'}
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-text mb-3">Pasos para conectar</h3>
        <ol className="space-y-2 text-xs text-muted">
          <li>1. Creá un proyecto en <span className="text-libra-light">supabase.com</span></li>
          <li>2. Andá a <span className="text-text">Settings → API</span></li>
          <li>3. Copiá la <span className="text-text">Project URL</span> y la <span className="text-text">anon key</span></li>
          <li>4. Ejecutá el SQL del archivo <code className="bg-bg px-1.5 py-0.5 rounded text-libra-light">supabase-schema.sql</code> en el SQL Editor</li>
          <li>5. Pegá las credenciales acá abajo</li>
        </ol>
      </div>

      {/* Credenciales */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4 mb-6">
        <h3 className="text-sm font-semibold text-text">Credenciales</h3>
        <div>
          <label className={labelCls}>Project URL</label>
          <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://abcdefg.supabase.co" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Anon Key</label>
          <textarea value={key} onChange={e => setKey(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIs..." rows={2} className={`${inputCls} resize-none`} />
        </div>

        {resultado && (
          <div className={`rounded-lg p-3 text-xs border ${
            resultado.ok ? 'bg-green-500/5 border-green-500/20 text-green-400' : 'bg-red-500/5 border-red-500/20 text-red-400'
          }`}>
            {resultado.ok ? 'Conexión exitosa' : `Error: ${resultado.error}`}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={handleTestear} disabled={testing || !url || !key}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
              testing || !url || !key ? 'border-border text-muted/50 cursor-not-allowed' : 'border-libra-mid text-libra-mid hover:bg-libra-mid/5'
            }`}>
            {testing ? 'Testeando...' : 'Testear'}
          </button>
          <button onClick={handleGuardar} disabled={!url || !key}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              !url || !key ? 'bg-muted/20 text-muted/50 cursor-not-allowed' : 'bg-libra-mid text-white hover:bg-libra-dark'
            }`}>
            Guardar y Conectar
          </button>
          {conectado && (
            <button onClick={handleDesconectar}
              className="px-4 py-2.5 rounded-lg text-sm font-medium border border-red-500/20 text-red-400 hover:bg-red-500/5 transition-colors">
              Desconectar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
