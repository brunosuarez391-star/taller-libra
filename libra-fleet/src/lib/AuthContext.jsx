import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

// Sesión guest: se activa cuando el usuario clickea "Entrar sin login"
// Se guarda en localStorage con la clave GUEST_KEY
const GUEST_KEY = 'libra-guest-mode'
const GUEST_USER = { id: 'guest', email: 'guest@libra.local', guest: true }

const AuthContext = createContext({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  enterAsGuest: () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Chequear si hay sesión guest persistida
    if (typeof window !== 'undefined' && localStorage.getItem(GUEST_KEY) === '1') {
      setUser(GUEST_USER)
      setLoading(false)
      return
    }

    // 2. Chequear sesión de Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))

    // Listener de cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Solo actualizar si no estamos en modo guest
      if (localStorage.getItem(GUEST_KEY) !== '1') {
        setUser(session?.user ?? null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) throw error

    // Si el usuario fue creado pero no está confirmado, intentar login directo
    // (funciona si "Enable email confirmations" está OFF en Supabase)
    if (data.user && !data.session) {
      try {
        const signInResult = await supabase.auth.signInWithPassword({ email, password })
        if (signInResult.data?.session) return signInResult.data
      } catch {
        // silenciar — el usuario igual se creó
      }
    }
    return data
  }

  const signOut = async () => {
    localStorage.removeItem(GUEST_KEY)
    await supabase.auth.signOut()
    setUser(null)
  }

  const enterAsGuest = () => {
    localStorage.setItem(GUEST_KEY, '1')
    setUser(GUEST_USER)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, enterAsGuest }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
