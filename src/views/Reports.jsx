import React, { useMemo, useState } from 'react'
import { styles, theme, fmtCurrency, daysBetween, todayIso } from '../styles.js'
import { ROOM_TYPES } from '../data.js'

export default function Reports({ state }) {
  const [range, setRange] = useState('month')

  const { from, to, label } = useMemo(() => {
    const today = new Date()
    if (range === 'today') {
      return { from: todayIso(), to: todayIso(), label: 'Hoy' }
    }
    if (range === 'week') {
      const start = new Date(today)
      start.setDate(start.getDate() - 6)
      return { from: start.toISOString().slice(0, 10), to: todayIso(), label: 'Últimos 7 días' }
    }
    if (range === 'year') {
      return { from: `${today.getFullYear()}-01-01`, to: todayIso(), label: 'Este año' }
    }
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    return { from: start.toISOString().slice(0, 10), to: todayIso(), label: 'Este mes' }
  }, [range])

  const payments = state.payments.filter((p) => p.date >= from && p.date <= to)
  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0)

  const reservationsInRange = state.reservations.filter(
    (r) => r.status !== 'cancelada' && r.checkIn >= from && r.checkIn <= to
  )

  const revenueByMethod = payments.reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + p.amount
    return acc
  }, {})

  const revenueByType = reservationsInRange.reduce((acc, r) => {
    const room = state.rooms.find((ro) => ro.id === r.roomId)
    if (!room) return acc
    acc[room.type] = (acc[room.type] || 0) + r.total
    return acc
  }, {})

  const nightsSold = reservationsInRange.reduce(
    (s, r) => s + daysBetween(r.checkIn, r.checkOut),
    0
  )

  const totalCapacityNights = state.rooms.length * Math.max(1, daysBetween(from, to))
  const occupancyPct = totalCapacityNights ? Math.round((nightsSold / totalCapacityNights) * 100) : 0

  const avgRate = nightsSold > 0 ? totalRevenue / nightsSold : 0

  const topGuests = useMemo(() => {
    const map = {}
    payments.forEach((p) => {
      map[p.guestId] = (map[p.guestId] || 0) + p.amount
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([gid, amount]) => {
        const g = state.guests.find((x) => x.id === gid)
        return { guest: g, amount }
      })
  }, [payments, state.guests])

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Reportes</h1>
          <div style={styles.pageSub}>Indicadores de gestión · {label}</div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            ['today', 'Hoy'],
            ['week', '7 días'],
            ['month', 'Mes'],
            ['year', 'Año'],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setRange(k)}
              style={{
                ...styles.btnSmall,
                background: range === k ? theme.accent : 'transparent',
                color: range === k ? '#000' : theme.text,
              }}
            >{l}</button>
          ))}
        </div>
      </div>

      <div style={styles.statGrid}>
        <Stat label="Ingresos" value={fmtCurrency(totalRevenue)} color={theme.success} />
        <Stat label="Ocupación" value={`${occupancyPct}%`} color={theme.accent2} />
        <Stat label="Noches vendidas" value={nightsSold} color={theme.accent} />
        <Stat label="Tarifa promedio / noche" value={fmtCurrency(avgRate)} color={theme.purple} />
        <Stat label="Reservas del período" value={reservationsInRange.length} color={theme.text} />
      </div>

      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Ingresos por método de pago</h3>
          {Object.keys(revenueByMethod).length === 0 && (
            <div style={styles.empty}>Sin cobros en el período</div>
          )}
          {Object.entries(revenueByMethod).map(([m, amount]) => {
            const pct = totalRevenue ? Math.round((amount / totalRevenue) * 100) : 0
            return (
              <BarRow key={m} label={m} amount={amount} pct={pct} color={theme.accent2} />
            )
          })}
        </div>

        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Facturación por tipo de habitación</h3>
          {Object.keys(revenueByType).length === 0 && (
            <div style={styles.empty}>Sin reservas en el período</div>
          )}
          {Object.entries(revenueByType).map(([k, amount]) => {
            const total = Object.values(revenueByType).reduce((s, v) => s + v, 0)
            const pct = total ? Math.round((amount / total) * 100) : 0
            return (
              <BarRow key={k} label={ROOM_TYPES[k]?.label || k} amount={amount} pct={pct} color={theme.purple} />
            )
          })}
        </div>

        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Top 5 huéspedes</h3>
          {topGuests.length === 0 && <div style={styles.empty}>Sin datos</div>}
          {topGuests.map(({ guest, amount }, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${theme.border}` }}>
              <span>{guest ? `${guest.firstName} ${guest.lastName}` : '—'}</span>
              <strong style={{ color: theme.success }}>{fmtCurrency(amount)}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={{ ...styles.statValue, color, fontSize: '24px' }}>{value}</div>
    </div>
  )
}

function BarRow({ label, amount, pct, color }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 600 }}>{fmtCurrency(amount)} · {pct}%</span>
      </div>
      <div style={{ height: '6px', background: theme.border, borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
      </div>
    </div>
  )
}
