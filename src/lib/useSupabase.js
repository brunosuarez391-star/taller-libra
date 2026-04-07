import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

// Hook genérico para CRUD con Supabase, con fallback a datos locales
export function useSupabaseTable(tableName, localData, setLocalData) {
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(false)

  // Intentar cargar desde Supabase al montar
  useEffect(() => {
    async function cargar() {
      try {
        const { data, error } = await supabase.from(tableName).select('*')
        if (error) throw error
        if (data && data.length > 0) {
          setLocalData(data)
          setOnline(true)
        }
      } catch {
        // Supabase no disponible, usamos datos locales
        setOnline(false)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [tableName])

  const insertar = useCallback(async (item) => {
    if (!online) return item
    try {
      const { data, error } = await supabase.from(tableName).insert(item).select().single()
      if (error) throw error
      return data
    } catch {
      return item
    }
  }, [tableName, online])

  const actualizar = useCallback(async (id, cambios) => {
    if (!online) return cambios
    try {
      const { data, error } = await supabase.from(tableName).update(cambios).eq('id', id).select().single()
      if (error) throw error
      return data
    } catch {
      return cambios
    }
  }, [tableName, online])

  const eliminar = useCallback(async (id) => {
    if (!online) return true
    try {
      const { error } = await supabase.from(tableName).delete().eq('id', id)
      if (error) throw error
      return true
    } catch {
      return true
    }
  }, [tableName, online])

  return { loading, online, insertar, actualizar, eliminar }
}

// Hook para suscripción en tiempo real
export function useRealtimeTable(tableName, setData) {
  useEffect(() => {
    const channel = supabase
      .channel(`${tableName}_changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
        switch (payload.eventType) {
          case 'INSERT':
            setData(prev => [...prev, payload.new])
            break
          case 'UPDATE':
            setData(prev => prev.map(item => item.id === payload.new.id ? payload.new : item))
            break
          case 'DELETE':
            setData(prev => prev.filter(item => item.id !== payload.old.id))
            break
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tableName])
}
