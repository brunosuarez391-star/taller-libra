import React, { useState, useCallback } from 'react'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import VehiculosList from './components/VehiculosList'
import OrdenTrabajo from './components/OrdenTrabajo'
import HistorialPublico from './components/HistorialPublico'
import ToastContainer, { crearToast } from './components/Toast'
import { vehiculosDemo, ordenesTrabajoDemo } from './lib/demoData'

export default function App() {
  const [seccionActiva, setSeccionActiva] = useState('dashboard')
  const [vehiculos, setVehiculos] = useState(vehiculosDemo)
  const [ordenes, setOrdenes] = useState(ordenesTrabajoDemo)
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((mensaje, tipo = 'info') => {
    setToasts(prev => [...prev, crearToast(mensaje, tipo)])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <>
      <Layout seccionActiva={seccionActiva} setSeccionActiva={setSeccionActiva}>
        {seccionActiva === 'dashboard' && (
          <Dashboard vehiculos={vehiculos} ordenes={ordenes} />
        )}
        {seccionActiva === 'flota' && (
          <VehiculosList vehiculos={vehiculos} setVehiculos={setVehiculos} onToast={addToast} />
        )}
        {seccionActiva === 'ordenes' && (
          <OrdenTrabajo ordenes={ordenes} setOrdenes={setOrdenes} vehiculos={vehiculos} onToast={addToast} />
        )}
        {seccionActiva === 'historial' && (
          <HistorialPublico vehiculos={vehiculos} ordenes={ordenes} />
        )}
      </Layout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}
