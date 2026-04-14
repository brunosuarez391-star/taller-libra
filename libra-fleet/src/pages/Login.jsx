import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { EMPRESA } from '../lib/data'

export default function Login() {
  const { signIn, signUp, enterAsGuest } = useAuth()
  const [modo, setModo] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMensaje('')
    setLoading(true)
    try {
      if (modo === 'signup') {
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres')
        }
        const result = await signUp(email, password)
        if (result?.session) {
          // Login automático si la confirmación de email está desactivada
          return
        }
        // Caso: confirmación de email activada en Supabase
        setMensaje('✓ Cuenta creada. Usá "Entrar sin login" abajo para continuar, o confirmá el email desde Supabase.')
        setModo('login')
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      let msg = err?.message || 'Error'
      // Mensajes más amigables
      if (msg.includes('Email not confirmed') || msg.includes('no confirmado')) {
        msg = 'Email no confirmado. Usá "Entrar sin login" abajo o confirmá el email desde Supabase.'
      } else if (msg.includes('Invalid login credentials')) {
        msg = 'Email o contraseña incorrectos. ¿Primera vez? Creá la cuenta primero.'
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md">
        {/* Logo + header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1F3864] dark:bg-slate-800 rounded-2xl shadow-lg mb-4">
            <span className="text-white text-2xl font-black">LF</span>
          </div>
          <h1 className="text-3xl font-bold text-[#1F3864] dark:text-blue-300">LIBRA FLEET</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{EMPRESA.nombre}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-5">
            {modo === 'login' ? 'Ingresá a tu cuenta' : 'Crear cuenta nueva'}
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              placeholder="bruno@librapatagonia.com"
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900"
            />
            {modo === 'signup' && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Mínimo 6 caracteres</p>
            )}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {mensaje && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-3 py-2 rounded-lg text-sm">
              {mensaje}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-[#1F3864] hover:bg-[#2E75B6] text-white py-3 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? (modo === 'login' ? 'Ingresando...' : 'Creando cuenta...')
              : (modo === 'login' ? 'Ingresar' : 'Crear cuenta')}
          </button>

          {/* Toggle login / signup */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                setModo(modo === 'login' ? 'signup' : 'login')
                setError('')
                setMensaje('')
              }}
              className="text-xs text-[#2E75B6] dark:text-blue-400 hover:underline font-bold"
            >
              {modo === 'login' ? '¿Primera vez? Crear cuenta nueva' : '← Ya tengo cuenta, ingresar'}
            </button>
          </div>

          {/* Separador */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-slate-800 px-2 text-slate-400 dark:text-slate-500">o</span>
            </div>
          </div>

          {/* Botón Entrar sin login */}
          <button
            type="button"
            onClick={enterAsGuest}
            className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-2.5 rounded-lg font-bold text-sm transition-colors"
          >
            Entrar sin login
          </button>
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">
            Uso rápido sin autenticación — los datos siguen protegidos en Supabase
          </p>

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-4">
            Sistema interno — Taller Libra
          </p>
        </form>

        {/* Info */}
        <div className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
          {EMPRESA.ciudad} · Tel {EMPRESA.tel}
        </div>
      </div>
    </div>
  )
}
