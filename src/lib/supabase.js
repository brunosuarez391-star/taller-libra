import { createClient } from '@supabase/supabase-js'

const STORAGE_KEY = 'libra_supabase_config'

// Leer config de localStorage, .env, o placeholder
function getConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.url && parsed.key && !parsed.url.includes('tu-proyecto')) {
        return parsed
      }
    }
  } catch {}

  const envUrl = import.meta.env.VITE_SUPABASE_URL
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (envUrl && envKey && !envUrl.includes('tu-proyecto')) {
    return { url: envUrl, key: envKey }
  }

  return null
}

// Guardar config en localStorage
export function guardarConfig(url, key) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ url, key }))
  // Recargar para reconectar
  window.location.reload()
}

// Borrar config
export function borrarConfig() {
  localStorage.removeItem(STORAGE_KEY)
  window.location.reload()
}

// Obtener config actual
export function obtenerConfig() {
  return getConfig()
}

// Verificar si hay config válida
export function tieneConfig() {
  return getConfig() !== null
}

// Crear cliente (o placeholder que siempre falla)
const config = getConfig()
export const supabase = config
  ? createClient(config.url, config.key)
  : createClient('https://placeholder.supabase.co', 'placeholder')

// Test de conexión
export async function testConexion() {
  if (!config) return { ok: false, error: 'Sin credenciales configuradas' }
  try {
    const { data, error } = await supabase.from('vehiculos').select('id').limit(1)
    if (error) return { ok: false, error: error.message }
    return { ok: true, registros: data?.length || 0 }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
