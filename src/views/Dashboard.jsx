import React from 'react'
import { styles, theme, fmtCurrency, todayIso } from '../styles.js'
import { ROOM_STATUS, ROOM_TYPES, HOTEL } from '../data.js'

export default function Dashboard({ state, onNavigate }) {
  const { rooms, reservations, charges, payments, guests } = state
  const today = todayIso()

  const byStatus = rooms.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})

  const occupied = byStatus.ocupada || 0
  const occupancy = rooms.length ? Math.round((occupied / rooms.length) * 100) : 0

  const checkInsToday = reservations.filter(
    (r) => r.checkIn === today && r.status !== 'cancelada'
  )
  const checkOutsToday = reservations.filter(
    (r) => r.checkOut === today && (r.status === 'en_curso' || r.status === 'confirmada')
  )
  const inHouse = reservations.filter((r) => r.status === 'en_curso')

  const monthStart = today.slice(0, 7) + '-01'
  const revenueMonth = payments
    .filter((p) => p.date >= monthStart)
    .reduce((s, p) => s + p.amount, 0)

  const pendingCharges = charges.filter((c) => !c.paid).reduce((s, c) => s + c.amount, 0)

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Panel Principal</h1>
          <div style={styles.pageSub}>
            {HOTEL.name} · {HOTEL.city} · {new Date().toLocaleDateString('es-AR', {
              weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
            })}
          </div>
        </div>
      </div>

      <div style={styles.statGrid}>
        <StatCard label="Ocupación" value={`${occupancy}%`} color={theme.accent2} hint={`${occupied} de ${rooms.length} habitaciones`} />
        <StatCard label="Disponibles" value={byStatus.disponible || 0} color={theme.success} />
        <StatCard label="Ocupadas" value={occupied} color={theme.accent} />
        <StatCard label="Reservadas" value={byStatus.reservada || 0} color={theme.purple} />
        <StatCard label="En limpieza" value={byStatus.limpieza || 0} color={theme.warning} />
        <StatCard label="Mantenimiento" value={byStatus.mantenimiento || 0} color="#fb923c" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Movimientos de hoy</h3>
          <Row label="Check-ins programados" value={checkInsToday.length} color={theme.accent2} />
          <Row label="Check-outs programados" value={checkOutsToday.length} color={theme.warning} />
          <Row label="Huéspedes alojados" value={inHouse.length} color={theme.success} />
          <button style={{ ...styles.btnGhost, marginTop: '10px' }} onClick={() => onNavigate('checkin')}>
            Ir a Check-in / Check-out →
          </button>
        </div>

        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Finanzas del mes</h3>
          <Row label="Ingresos cobrados" value={fmtCurrency(revenueMonth)} color={theme.success} />
          <Row label="Saldos pendientes" value={fmtCurrency(pendingCharges)} color={theme.warning} />
          <Row label="Clientes registrados" value={guests.length} color={theme.accent2} />
          <button style={{ ...styles.btnGhost, marginTop: '10px' }} onClick={() => onNavigate('billing')}>
            Ir a Facturación →
          </button>
        </div>

        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Distribución por tipo</h3>
          {Object.values(ROOM_TYPES).map((t) => {
            const total = rooms.filter((r) => r.type === t.key).length
            const occ = rooms.filter((r) => r.type === t.key && r.status === 'ocupada').length
            return (
              <Row
                key={t.key}
                label={`${t.label} (${fmtCurrency(t.rate)}/noche)`}
                value={`${occ}/${total}`}
                color={theme.text}
              />
            )
          })}
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Resumen de habitaciones</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {Object.entries(ROOM_STATUS).map(([key, s]) => (
            <span key={key} style={styles.badge(s.color, s.bg)}>
              {s.label}: {byStatus[key] || 0}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, hint }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      {hint && <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '2px' }}>{hint}</div>}
    </div>
  )
}

function Row({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: `1px solid ${theme.border}`,
    }}>
      <span style={{ color: theme.textMuted, fontSize: '13px' }}>{label}</span>
      <span style={{ color, fontWeight: 700, fontSize: '15px' }}>{value}</span>
    </div>
  )
}
