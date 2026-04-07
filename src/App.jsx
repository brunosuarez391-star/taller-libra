import React, { useState, useCallback, useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import VehiculosList from './components/VehiculosList'
import OrdenTrabajo from './components/OrdenTrabajo'
import HistorialPublico from './components/HistorialPublico'
import Configuracion from './components/Configuracion'
import ToastContainer, { crearToast } from './components/Toast'
import { vehiculosDemo, ordenesTrabajoDemo } from './lib/demoData'
import { tieneConfig, supabase } from './lib/supabase'

export default function App() {
  const [seccionActiva, setSeccionActiva] = useState('dashboard')
  const [vehiculos, setVehiculos] = useState(vehiculosDemo)
  const [ordenes, setOrdenes] = useState(ordenesTrabajoDemo)
  const [toasts, setToasts] = useState([])
  const [cargando, setCargando] = useState(true)

  const addToast = useCallback((mensaje, tipo = 'info') => {
    setToasts(prev => [...prev, crearToast(mensaje, tipo)])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Cargar datos de Supabase si está configurado
  useEffect(() => {
    async function cargarDatos() {
      if (!tieneConfig()) {
        setCargando(false)
        return
      }

      try {
        const [vehiculosRes, ordenesRes] = await Promise.all([
          supabase.from('vehiculos').select('*').order('codigo'),
          supabase.from('ordenes_trabajo').select('*').order('fecha', { ascending: false }),
        ])

        if (vehiculosRes.data && vehiculosRes.data.length > 0) {
          setVehiculos(vehiculosRes.data)
        }
        if (ordenesRes.data && ordenesRes.data.length > 0) {
          setOrdenes(ordenesRes.data)
        }

        if (vehiculosRes.error) throw vehiculosRes.error
        addToast('Datos sincronizados con Supabase', 'exito')
      } catch (err) {
        addToast('Supabase no disponible, usando datos locales', 'aviso')
      } finally {
        setCargando(false)
      }
    }
    cargarDatos()
  }, [])

  // Sync a Supabase en cada cambio (si está configurado)
  const syncVehiculo = useCallback(async (accion, vehiculo) => {
    if (!tieneConfig()) return
    try {
      if (accion === 'crear') {
        await supabase.from('vehiculos').insert(vehiculo)
      } else if (accion === 'actualizar') {
        await supabase.from('vehiculos').update(vehiculo).eq('id', vehiculo.id)
      } else if (accion === 'eliminar') {
        await supabase.from('vehiculos').delete().eq('id', vehiculo.id)
      }
    } catch {}
  }, [])

  const syncOT = useCallback(async (accion, ot) => {
    if (!tieneConfig()) return
    try {
      if (accion === 'crear') {
        await supabase.from('ordenes_trabajo').insert(ot)
      } else if (accion === 'actualizar') {
        await supabase.from('ordenes_trabajo').update(ot).eq('id', ot.id)
      } else if (accion === 'eliminar') {
        await supabase.from('ordenes_trabajo').delete().eq('id', ot.id)
      }
    } catch {}
  }, [])

  // Wrappers que sincronizan con Supabase
  const setVehiculosSync = useCallback((updater) => {
    setVehiculos(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      // Detectar cambios para sync
      if (next.length > prev.length) {
        const nuevo = next.find(n => !prev.some(p => p.id === n.id))
        if (nuevo) syncVehiculo('crear', nuevo)
      } else if (next.length < prev.length) {
        const eliminado = prev.find(p => !next.some(n => n.id === p.id))
        if (eliminado) syncVehiculo('eliminar', eliminado)
      } else {
        const modificado = next.find((n, i) => JSON.stringify(n) !== JSON.stringify(prev[i]))
        if (modificado) syncVehiculo('actualizar', modificado)
      }
      return next
    })
  }, [syncVehiculo])

  const setOrdenesSync = useCallback((updater) => {
    setOrdenes(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (next.length > prev.length) {
        const nuevo = next.find(n => !prev.some(p => p.id === n.id))
        if (nuevo) syncOT('crear', nuevo)
      } else if (next.length < prev.length) {
        const eliminado = prev.find(p => !next.some(n => n.id === p.id))
        if (eliminado) syncOT('eliminar', eliminado)
      } else {
        const modificado = next.find((n, i) => JSON.stringify(n) !== JSON.stringify(prev[i]))
        if (modificado) syncOT('actualizar', modificado)
      }
      return next
    })
  }, [syncOT])

  if (cargando) {
    return (
      <div className="min-h-screen bg-libra-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-libra-mid border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <div className="text-sm text-gray-500">Cargando Libra Fleet...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Layout seccionActiva={seccionActiva} setSeccionActiva={setSeccionActiva}>
        {seccionActiva === 'dashboard' && (
          <Dashboard vehiculos={vehiculos} ordenes={ordenes} />
        )}
        {seccionActiva === 'flota' && (
          <VehiculosList vehiculos={vehiculos} setVehiculos={setVehiculosSync} onToast={addToast} />
        )}
        {seccionActiva === 'ordenes' && (
          <OrdenTrabajo ordenes={ordenes} setOrdenes={setOrdenesSync} vehiculos={vehiculos} onToast={addToast} />
        )}
        {seccionActiva === 'historial' && (
          <HistorialPublico vehiculos={vehiculos} ordenes={ordenes} />
        )}
        {seccionActiva === 'config' && (
          <Configuracion onToast={addToast} />
        )}
      </Layout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}
