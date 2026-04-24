import { useCallback, useEffect, useState } from 'react'
import { isSignedIn, signIn, signOut } from './drive'

export function useDrive() {
  const [authed, setAuthed] = useState(() => isSignedIn())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const tick = () => setAuthed(isSignedIn())
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  const connect = useCallback(async () => {
    setBusy(true); setError(null)
    try {
      await signIn({ prompt: authed ? '' : 'consent' })
      setAuthed(true)
    } catch (err) {
      setError(err.message || String(err))
      setAuthed(false)
    } finally {
      setBusy(false)
    }
  }, [authed])

  const disconnect = useCallback(() => {
    signOut()
    setAuthed(false)
  }, [])

  return { authed, busy, error, connect, disconnect }
}
