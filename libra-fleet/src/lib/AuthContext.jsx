import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Chequear sesión actual al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))

    // Listener de cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
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
        // En Supabase la confirmación por email está activada por default.
        // Para una app de 1 solo usuario, hay que desactivarla en el proyecto
        // o confirmar el email manualmente desde la UI de Supabase.
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
        // silenciar — el usuario igual se creó, solo necesita confirmar email
      }
    }
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
