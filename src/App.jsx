import React, { useState, useEffect } from 'react'

const styles = {
  app: {
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    background: '#0f172a',
    color: '#e2e8f0',
    minHeight: '100vh',
    margin: 0,
  },
  header: {
    background: '#1e293b',
    borderBottom: '1px solid #334155',
    padding: '16px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#38bdf8',
    margin: 0,
  },
  headerSub: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: '2px 0 0',
  },
  main: {
    padding: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '20px',
  },
  statValue: {
    fontSize: '36px',
    fontWeight: '700',
    margin: '4px 0',
  },
  statLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  sectionTitle: {
    fontSize: '17px',
    fontWeight: '600',
    marginBottom: '14px',
    color: '#cbd5e1',
  },
  tableWrap: {
    background: '#1e293b',
    borderRadius: '12px',
    border: '1px solid #334155',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '11px 16px',
    background: '#0f172a',
    color: '#94a3b8',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: '600',
  },
  td: {
    padding: '13px 16px',
    borderTop: '1px solid #334155',
    fontSize: '14px',
  },
  button: {
    padding: '5px 13px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    background: '#0ea5e9',
    color: '#fff',
  },
  loadingText: {
    textAlign: 'center',
    padding: '48px',
    color: '#94a3b8',
  },
  errorText: {
    textAlign: 'center',
    padding: '48px',
    color: '#f87171',
  },
}

const STATUS_LABELS = {
  active: 'Activo',
  maintenance: 'Mantenimiento',
  inactive: 'Inactivo',
}

function badgeStyle(status) {
  const map = {
    active:      { bg: '#052e16', color: '#4ade80', border: '#166534' },
    maintenance: { bg: '#1c1917', color: '#fb923c', border: '#9a3412' },
    inactive:    { bg: '#1e293b', color: '#94a3b8', border: '#475569' },
  }
  const s = map[status] ?? map.inactive
  return {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    background: s.bg,
    color: s.color,
    border: `1px solid ${s.border}`,
  }
}

export default function App() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        if (window.electronAPI) {
          const [data, ver] = await Promise.all([
            window.electronAPI.getVehicles(),
            window.electronAPI.getVersion(),
          ])
          setVehicles(data)
          setVersion(ver)
        } else {
          setVehicles([])
        }
      } catch (err) {
        setError('Error al cargar los datos de la flota: ' + err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  async function handleStatusChange(vehicle) {
    const next =
      vehicle.status === 'active' ? 'maintenance' :
      vehicle.status === 'maintenance' ? 'inactive' : 'active'

    if (!window.electronAPI) return
    const result = await window.electronAPI.updateVehicleStatus(vehicle.id, next)
    if (result.success) {
      setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, status: next } : v))
    }
  }

  const activeCount      = vehicles.filter(v => v.status === 'active').length
  const maintenanceCount = vehicles.filter(v => v.status === 'maintenance').length
  const inactiveCount    = vehicles.filter(v => v.status === 'inactive').length
  const totalKm          = vehicles.reduce((sum, v) => sum + v.km, 0)

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Libra Flota</h1>
          <p style={styles.headerSub}>Sistema de Gestión de Flota de Camiones</p>
        </div>
        <div style={{ fontSize: '12px', color: '#475569' }}>
          {version && `v${version}`}&nbsp;&nbsp;|&nbsp;&nbsp;
          {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total vehículos</div>
            <div style={{ ...styles.statValue, color: '#38bdf8' }}>{vehicles.length}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Activos</div>
            <div style={{ ...styles.statValue, color: '#4ade80' }}>{activeCount}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Mantenimiento</div>
            <div style={{ ...styles.statValue, color: '#fb923c' }}>{maintenanceCount}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Inactivos</div>
            <div style={{ ...styles.statValue, color: '#94a3b8' }}>{inactiveCount}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Km totales (flota)</div>
            <div style={{ ...styles.statValue, color: '#c084fc', fontSize: '26px' }}>
              {totalKm.toLocaleString('es-ES')}
            </div>
          </div>
        </div>

        <h2 style={styles.sectionTitle}>Vehículos de la Flota</h2>

        {loading && <p style={styles.loadingText}>Cargando datos de la flota...</p>}
        {error   && <p style={styles.errorText}>{error}</p>}

        {!loading && !error && (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Matrícula</th>
                  <th style={styles.th}>Modelo</th>
                  <th style={styles.th}>Conductor</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Kilómetros</th>
                  <th style={styles.th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id}>
                    <td style={{ ...styles.td, fontWeight: '600', color: '#38bdf8' }}>{v.plate}</td>
                    <td style={styles.td}>{v.model}</td>
                    <td style={styles.td}>{v.driver}</td>
                    <td style={styles.td}>
                      <span style={badgeStyle(v.status)}>
                        {STATUS_LABELS[v.status] ?? v.status}
                      </span>
                    </td>
                    <td style={{ ...styles.td, color: '#94a3b8' }}>
                      {v.km.toLocaleString('es-ES')} km
                    </td>
                    <td style={styles.td}>
                      <button style={styles.button} onClick={() => handleStatusChange(v)}>
                        Cambiar Estado
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
