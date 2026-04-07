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
    if (config) {
      setUrl(config.url)
      setKey(config.key)
    }
  }, [])

  async function handleTestear() {
    setTesting(true)
    setResultado(null)
    const res = await testConexion()
    setResultado(res)
    setTesting(false)
  }

  function handleGuardar() {
    if (!url.includes('supabase.co')) {
      onToast?.('La URL debe ser de Supabase (*.supabase.co)', 'error')
      return
    }
    if (!key.startsWith('eyJ')) {
      onToast?.('La anon key debe empezar con "eyJ..."', 'error')
      return
    }
    guardarConfig(url.trim(), key.trim())
  }

  function handleDesconectar() {
    if (confirm('¿Desconectar Supabase? La app va a usar datos demo locales.')) {
      borrarConfig()
    }
  }

  const conectado = tieneConfig()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-libra-dark">Configuración</h2>
        <p className="text-sm text-gray-500">Conectá tu proyecto de Supabase</p>
      </div>

      {/* Estado de conexión */}
      <div className={`rounded-2xl p-4 border ${
        conectado
          ? 'bg-green-50 border-green-200'
          : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${conectado ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`} />
          <div>
            <div className={`text-sm font-semibold ${conectado ? 'text-green-700' : 'text-amber-700'}`}>
              {conectado ? 'Supabase conectado' : 'Modo offline (datos demo)'}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {conectado
                ? `Conectado a ${configActual?.url}`
                : 'Configurá tus credenciales para sincronizar con la nube'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-libra-dark mb-3">Cómo obtener las credenciales</h3>
        <ol className="space-y-2 text-xs text-gray-600">
          <li className="flex gap-2">
            <span className="w-5 h-5 bg-libra-dark text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
            <span>Entrá a <strong>supabase.com</strong> y creá una cuenta o logueate</span>
          </li>
          <li className="flex gap-2">
            <span className="w-5 h-5 bg-libra-dark text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
            <span>Creá un nuevo proyecto (nombre: <strong>libra-fleet</strong>, región: South America)</span>
          </li>
          <li className="flex gap-2">
            <span className="w-5 h-5 bg-libra-dark text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
            <span>Andá a <strong>Settings → API</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="w-5 h-5 bg-libra-dark text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">4</span>
            <span>Copiá la <strong>Project URL</strong> y la <strong>anon public key</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="w-5 h-5 bg-libra-dark text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">5</span>
            <span>Andá al <strong>SQL Editor</strong> y ejecutá el archivo <code className="bg-gray-100 px-1 rounded">supabase-schema.sql</code> del proyecto</span>
          </li>
          <li className="flex gap-2">
            <span className="w-5 h-5 bg-libra-dark text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">6</span>
            <span>Pegá las credenciales acá abajo y dale a <strong>Guardar y Conectar</strong></span>
          </li>
        </ol>
      </div>

      {/* Formulario de credenciales */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
        <h3 className="text-sm font-bold text-libra-dark">Credenciales de Supabase</h3>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Project URL</label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://abcdefg.supabase.co"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-libra-mid/30 focus:border-libra-mid font-mono"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Anon Key (pública)</label>
          <textarea
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            rows={3}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-libra-mid/30 focus:border-libra-mid font-mono resize-none"
          />
          <p className="text-[10px] text-gray-400 mt-1">
            Esta es la clave pública (anon). Es segura para usar en el cliente.
          </p>
        </div>

        {/* Resultado del test */}
        {resultado && (
          <div className={`rounded-xl p-3 text-xs ${
            resultado.ok
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {resultado.ok
              ? `Conexión exitosa. Tabla vehiculos encontrada.`
              : `Error: ${resultado.error}`
            }
          </div>
        )}

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={handleTestear}
            disabled={testing || !url || !key}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              testing || !url || !key
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-libra-mid text-libra-mid hover:bg-libra-mid/5'
            }`}
          >
            {testing ? 'Testeando...' : 'Testear Conexión'}
          </button>
          <button
            onClick={handleGuardar}
            disabled={!url || !key}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              !url || !key
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-libra-mid text-white hover:bg-libra-dark'
            }`}
          >
            Guardar y Conectar
          </button>
          {conectado && (
            <button
              onClick={handleDesconectar}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
            >
              Desconectar
            </button>
          )}
        </div>
      </div>

      {/* Schema SQL */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-libra-dark mb-2">Schema SQL</h3>
        <p className="text-xs text-gray-500 mb-3">
          Copiá este SQL y ejecutalo en el SQL Editor de Supabase para crear las tablas:
        </p>
        <div className="bg-gray-900 rounded-xl p-3 overflow-x-auto">
          <pre className="text-[10px] text-green-400 font-mono whitespace-pre leading-relaxed">
{`CREATE TABLE vehiculos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  marca TEXT NOT NULL DEFAULT 'Mercedes-Benz',
  modelo TEXT NOT NULL,
  anio INTEGER,
  categoria TEXT NOT NULL,
  km_actuales INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'activo',
  cliente TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ordenes_trabajo (
  id TEXT PRIMARY KEY,
  vehiculo_id UUID REFERENCES vehiculos(id),
  km_ingreso INTEGER NOT NULL,
  km_proximo_service INTEGER,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  mecanico TEXT NOT NULL,
  servicios TEXT[] NOT NULL DEFAULT '{}',
  observaciones TEXT,
  estado TEXT NOT NULL DEFAULT 'ingresado',
  firma_cliente TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS + políticas públicas
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_trabajo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_vehiculos"
  ON vehiculos FOR SELECT USING (true);
CREATE POLICY "public_read_ot"
  ON ordenes_trabajo FOR SELECT USING (true);
CREATE POLICY "crud_vehiculos"
  ON vehiculos FOR ALL USING (true);
CREATE POLICY "crud_ot"
  ON ordenes_trabajo FOR ALL USING (true);`}
          </pre>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(document.querySelector('.bg-gray-900 pre').textContent)
            onToast?.('SQL copiado al portapapeles', 'exito')
          }}
          className="mt-2 text-xs text-libra-mid font-semibold hover:text-libra-dark"
        >
          Copiar SQL
        </button>
      </div>

      {/* Info */}
      <div className="text-center text-xs text-gray-400 pb-4">
        Libra Fleet v1.0 · Módulo 1 · Las credenciales se guardan localmente en tu dispositivo
      </div>
    </div>
  )
}
