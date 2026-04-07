import React, { useState } from 'react'
import Layout from './components/Layout'
import VehiculosList from './components/VehiculosList'
import OrdenTrabajo from './components/OrdenTrabajo'
import HistorialPublico from './components/HistorialPublico'
import { vehiculosDemo, ordenesTrabajoDemo } from './lib/demoData'

export default function App() {
  const [seccionActiva, setSeccionActiva] = useState('flota')
  const [vehiculos, setVehiculos] = useState(vehiculosDemo)
  const [ordenes, setOrdenes] = useState(ordenesTrabajoDemo)

  return (
    <Layout seccionActiva={seccionActiva} setSeccionActiva={setSeccionActiva}>
      {seccionActiva === 'flota' && (
        <VehiculosList vehiculos={vehiculos} setVehiculos={setVehiculos} />
      )}
      {seccionActiva === 'ordenes' && (
        <OrdenTrabajo ordenes={ordenes} setOrdenes={setOrdenes} vehiculos={vehiculos} />
      )}
      {seccionActiva === 'historial' && (
        <HistorialPublico vehiculos={vehiculos} ordenes={ordenes} />
      )}
    </Layout>
  )
}
