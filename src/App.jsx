import React, { useState, useEffect } from 'react'
import { styles, theme } from './styles.js'
import { loadState, saveState, resetState } from './storage.js'
import { HOTEL } from './data.js'

import Dashboard from './views/Dashboard.jsx'
import Rooms from './views/Rooms.jsx'
import Reservations from './views/Reservations.jsx'
import CheckInOut from './views/CheckInOut.jsx'
import Guests from './views/Guests.jsx'
import Billing from './views/Billing.jsx'
import Housekeeping from './views/Housekeeping.jsx'
import Reports from './views/Reports.jsx'

const NAV = [
  { key: 'dashboard',    icon: '■', label: 'Panel' },
  { key: 'rooms',        icon: '▣', label: 'Habitaciones' },
  { key: 'reservations', icon: '◉', label: 'Reservas' },
  { key: 'checkin',      icon: '⇄', label: 'Check-in / out' },
  { key: 'guests',       icon: '◎', label: 'Huéspedes' },
  { key: 'billing',      icon: '$', label: 'Facturación' },
  { key: 'housekeeping', icon: '✦', label: 'Limpieza' },
  { key: 'reports',      icon: '⌬', label: 'Reportes' },
]

export default function App() {
  const [state, setState] = useState(() => loadState())
  const [page, setPage] = useState('dashboard')
  const [version, setVersion] = useState('')

  useEffect(() => { saveState(state) }, [state])

  useEffect(() => {
    if (window.electronAPI?.getVersion) {
      window.electronAPI.getVersion().then(setVersion).catch(() => {})
    }
  }, [])

  function handleReset() {
    if (!confirm('Esto borrará TODOS los datos (reservas, huéspedes, pagos) y restaurará las 60 habitaciones iniciales. ¿Continuar?')) return
    setState(resetState())
    setPage('dashboard')
  }

  const Page = {
    dashboard: <Dashboard state={state} onNavigate={setPage} />,
    rooms: <Rooms state={state} setState={setState} />,
    reservations: <Reservations state={state} setState={setState} />,
    checkin: <CheckInOut state={state} setState={setState} />,
    guests: <Guests state={state} setState={setState} />,
    billing: <Billing state={state} setState={setState} />,
    housekeeping: <Housekeeping state={state} setState={setState} />,
    reports: <Reports state={state} />,
  }[page]

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <h1 style={styles.brandTitle}>{HOTEL.name}</h1>
          <div style={styles.brandSub}>{HOTEL.city}</div>
        </div>
        {NAV.map((n) => (
          <button
            key={n.key}
            style={styles.navBtn(page === n.key)}
            onClick={() => setPage(n.key)}
          >
            <span style={styles.navIcon}>{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: `1px solid ${theme.border}` }}>
          <button style={{ ...styles.btnSmall, width: '100%' }} onClick={handleReset}>
            Restablecer datos
          </button>
          <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '10px', textAlign: 'center' }}>
            {version ? `v${version}` : 'Web'} · {new Date().toLocaleDateString('es-AR')}
          </div>
        </div>
      </aside>
      <main style={styles.main}>{Page}</main>
    </div>
  )
}
