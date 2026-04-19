import React, { useState } from 'react'
import { styles, theme, fmtCurrency, fmtDate, daysBetween, todayIso } from '../styles.js'
import { ROOM_TYPES, EXTRA_SERVICES } from '../data.js'
import { newId } from '../storage.js'

export default function CheckInOut({ state, setState }) {
  const today = todayIso()
  const [tab, setTab] = useState('checkin')

  const arrivals = state.reservations.filter(
    (r) => r.status === 'confirmada' && r.checkIn <= today
  )
  const departures = state.reservations.filter(
    (r) => r.status === 'en_curso'
  )

  function doCheckIn(res) {
    setState((s) => ({
      ...s,
      reservations: s.reservations.map((r) =>
        r.id === res.id
          ? { ...r, status: 'en_curso', checkedInAt: new Date().toISOString() }
          : r
      ),
      rooms: s.rooms.map((r) =>
        r.id === res.roomId ? { ...r, status: 'ocupada' } : r
      ),
      charges: [
        ...s.charges,
        {
          id: newId('CH-'),
          reservationId: res.id,
          guestId: res.guestId,
          concept: `Estadía ${daysBetween(res.checkIn, res.checkOut)} noches - Hab. ${roomNumber(s, res.roomId)}`,
          amount: res.total,
          paid: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }))
  }

  function doCheckOut(res) {
    const pending = state.charges
      .filter((c) => c.reservationId === res.id && !c.paid)
      .reduce((sum, c) => sum + c.amount, 0)
    if (pending > 0) {
      if (!confirm(`La reserva tiene un saldo pendiente de ${fmtCurrency(pending)}. ¿Realizar check-out de todos modos?`)) {
        return
      }
    }
    setState((s) => ({
      ...s,
      reservations: s.reservations.map((r) =>
        r.id === res.id
          ? { ...r, status: 'finalizada', checkedOutAt: new Date().toISOString() }
          : r
      ),
      rooms: s.rooms.map((r) =>
        r.id === res.roomId ? { ...r, status: 'limpieza' } : r
      ),
    }))
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Check-in / Check-out</h1>
          <div style={styles.pageSub}>Ingreso y salida de huéspedes</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          style={{ ...styles.btnGhost, background: tab === 'checkin' ? theme.accent : 'transparent', color: tab === 'checkin' ? '#000' : theme.text }}
          onClick={() => setTab('checkin')}
        >
          Llegadas ({arrivals.length})
        </button>
        <button
          style={{ ...styles.btnGhost, background: tab === 'checkout' ? theme.accent : 'transparent', color: tab === 'checkout' ? '#000' : theme.text }}
          onClick={() => setTab('checkout')}
        >
          Huéspedes alojados ({departures.length})
        </button>
      </div>

      {tab === 'checkin' && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Reserva</th>
                <th style={styles.th}>Huésped</th>
                <th style={styles.th}>Habitación</th>
                <th style={styles.th}>Entrada</th>
                <th style={styles.th}>Salida</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {arrivals.length === 0 && (
                <tr><td colSpan="7" style={styles.empty}>No hay llegadas pendientes</td></tr>
              )}
              {arrivals.map((r) => {
                const g = state.guests.find((x) => x.id === r.guestId)
                const room = state.rooms.find((ro) => ro.id === r.roomId)
                return (
                  <tr key={r.id}>
                    <td style={{ ...styles.td, color: theme.accent2 }}>{r.id}</td>
                    <td style={styles.td}>{g ? `${g.firstName} ${g.lastName}` : '—'}</td>
                    <td style={styles.td}>{room?.number} ({ROOM_TYPES[room?.type]?.label})</td>
                    <td style={styles.td}>{fmtDate(r.checkIn)}</td>
                    <td style={styles.td}>{fmtDate(r.checkOut)}</td>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{fmtCurrency(r.total)}</td>
                    <td style={styles.td}>
                      <button style={styles.btn} onClick={() => doCheckIn(r)}>Check-in</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'checkout' && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Reserva</th>
                <th style={styles.th}>Huésped</th>
                <th style={styles.th}>Habitación</th>
                <th style={styles.th}>Entrada</th>
                <th style={styles.th}>Salida</th>
                <th style={styles.th}>Saldo</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {departures.length === 0 && (
                <tr><td colSpan="7" style={styles.empty}>No hay huéspedes alojados</td></tr>
              )}
              {departures.map((r) => {
                const g = state.guests.find((x) => x.id === r.guestId)
                const room = state.rooms.find((ro) => ro.id === r.roomId)
                const pending = state.charges
                  .filter((c) => c.reservationId === r.id && !c.paid)
                  .reduce((sum, c) => sum + c.amount, 0)
                return (
                  <tr key={r.id}>
                    <td style={{ ...styles.td, color: theme.accent2 }}>{r.id}</td>
                    <td style={styles.td}>{g ? `${g.firstName} ${g.lastName}` : '—'}</td>
                    <td style={styles.td}>{room?.number}</td>
                    <td style={styles.td}>{fmtDate(r.checkIn)}</td>
                    <td style={styles.td}>{fmtDate(r.checkOut)}</td>
                    <td style={{ ...styles.td, fontWeight: 600, color: pending > 0 ? theme.warning : theme.success }}>
                      {fmtCurrency(pending)}
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <AddExtraButton reservation={r} state={state} setState={setState} />
                        <button style={styles.btn} onClick={() => doCheckOut(r)}>Check-out</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AddExtraButton({ reservation, state, setState }) {
  const [open, setOpen] = useState(false)
  const [svc, setSvc] = useState(EXTRA_SERVICES[0].key)
  const [amount, setAmount] = useState(EXTRA_SERVICES[0].price)
  const [qty, setQty] = useState(1)

  function onSelect(key) {
    setSvc(key)
    const s = EXTRA_SERVICES.find((x) => x.key === key)
    setAmount(s?.price || 0)
  }

  function add() {
    const s = EXTRA_SERVICES.find((x) => x.key === svc)
    const total = Number(amount) * Number(qty)
    setState((st) => ({
      ...st,
      charges: [
        ...st.charges,
        {
          id: newId('CH-'),
          reservationId: reservation.id,
          guestId: reservation.guestId,
          concept: `${s.label}${qty > 1 ? ` × ${qty}` : ''}`,
          amount: total,
          paid: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }))
    setOpen(false)
    setQty(1)
  }

  return (
    <>
      <button style={styles.btnSmall} onClick={() => setOpen(true)}>+ Consumo</button>
      {open && (
        <div style={styles.modalBackdrop} onClick={() => setOpen(false)}>
          <div style={{ ...styles.modal, maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Cargar consumo</h2>
              <button style={styles.btnGhost} onClick={() => setOpen(false)}>Cerrar</button>
            </div>
            <div style={styles.formRow}>
              <div>
                <label style={styles.label}>Servicio</label>
                <select style={styles.input} value={svc} onChange={(e) => onSelect(e.target.value)}>
                  {EXTRA_SERVICES.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ ...styles.formRow, gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label style={styles.label}>Cantidad</label>
                <input type="number" min="1" style={styles.input} value={qty} onChange={(e) => setQty(e.target.value)} />
              </div>
              <div>
                <label style={styles.label}>Monto unitario</label>
                <input type="number" min="0" style={styles.input} value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
            </div>
            <div style={{ fontSize: '14px', color: theme.textMuted, textAlign: 'right' }}>
              Total: <strong style={{ color: theme.accent2 }}>{fmtCurrency(Number(amount) * Number(qty))}</strong>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.btnGhost} onClick={() => setOpen(false)}>Cancelar</button>
              <button style={styles.btn} onClick={add}>Agregar al saldo</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function roomNumber(state, roomId) {
  return state.rooms.find((r) => r.id === roomId)?.number || '—'
}
