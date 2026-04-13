import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { EMPRESA } from '../lib/data'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err?.message || 'Error al ingresar')
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
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-5">Ingresá a tu cuenta</h2>

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
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 focus:border-[#2E75B6] focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900"
            />
          </div>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-[#1F3864] hover:bg-[#2E75B6] text-white py-3 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-4">
            Sistema interno — acceso solo con credenciales autorizadas
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
