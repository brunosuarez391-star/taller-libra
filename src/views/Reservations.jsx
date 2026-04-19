import React, { useState, useMemo } from 'react'
import { styles, theme, fmtCurrency, fmtDate, daysBetween, todayIso, isoPlusDays } from '../styles.js'
import { ROOM_TYPES, RESERVATION_STATUS } from '../data.js'
import { newId } from '../storage.js'

export default function Reservations({ state, setState }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    const list = [...state.reservations].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (filter === 'all') return list
    return list.filter((r) => r.status === filter)
  }, [state.reservations, filter])

  function saveReservation(data) {
    setState((s) => {
      if (editing) {
        return {
          ...s,
          reservations: s.reservations.map((r) =>
            r.id === editing.id ? { ...r, ...data } : r
          ),
        }
      }
      const id = newId('RES-')
      const rooms = s.rooms.map((r) =>
        r.id === data.roomId && r.status === 'disponible'
          ? { ...r, status: 'reservada' }
          : r
      )
      return {
        ...s,
        rooms,
        reservations: [
          ...s.reservations,
          { ...data, id, status: 'confirmada', createdAt: new Date().toISOString() },
        ],
      }
    })
    setShowForm(false)
    setEditing(null)
  }

  function cancelReservation(res) {
    if (!confirm(`¿Cancelar la reserva de la habitación ${roomNumber(state, res.roomId)}?`)) return
    setState((s) => ({
      ...s,
      reservations: s.reservations.map((r) =>
        r.id === res.id ? { ...r, status: 'cancelada' } : r
      ),
      rooms: s.rooms.map((r) =>
        r.id === res.roomId && r.status === 'reservada'
          ? { ...r, status: 'disponible' }
          : r
      ),
    }))
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Reservas</h1>
          <div style={styles.pageSub}>Gestión de reservas y disponibilidad</div>
        </div>
        <button style={styles.btn} onClick={() => { setEditing(null); setShowForm(true) }}>
          + Nueva Reserva
        </button>
      </div>

      <div style={{ ...styles.card, marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <FilterBtn value="all" cur={filter} onClick={setFilter} label="Todas" />
          {Object.entries(RESERVATION_STATUS).map(([k, s]) => (
            <FilterBtn key={k} value={k} cur={filter} onClick={setFilter} label={s.label} color={s.color} />
          ))}
        </div>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Código</th>
              <th style={styles.th}>Huésped</th>
              <th style={styles.th}>Habitación</th>
              <th style={styles.th}>Check-in</th>
              <th style={styles.th}>Check-out</th>
              <th style={styles.th}>Noches</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Estado</th>
              <th style={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan="9" style={styles.empty}>No hay reservas</td></tr>
            )}
            {filtered.map((r) => {
              const guest = state.guests.find((g) => g.id === r.guestId)
              const room = state.rooms.find((ro) => ro.id === r.roomId)
              const status = RESERVATION_STATUS[r.status]
              return (
                <tr key={r.id}>
                  <td style={{ ...styles.td, color: theme.accent2, fontWeight: 600 }}>{r.id}</td>
                  <td style={styles.td}>{guest ? `${guest.firstName} ${guest.lastName}` : '—'}</td>
                  <td style={styles.td}>{room ? `${room.number} (${ROOM_TYPES[room.type].label})` : '—'}</td>
                  <td style={styles.td}>{fmtDate(r.checkIn)}</td>
                  <td style={styles.td}>{fmtDate(r.checkOut)}</td>
                  <td style={styles.td}>{daysBetween(r.checkIn, r.checkOut)}</td>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{fmtCurrency(r.total)}</td>
                  <td style={styles.td}>
                    <span style={styles.badge(status.color)}>{status.label}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {r.status !== 'cancelada' && r.status !== 'finalizada' && (
                        <>
                          <button style={styles.btnSmall} onClick={() => { setEditing(r); setShowForm(true) }}>Editar</button>
                          <button style={{ ...styles.btnSmall, color: theme.danger, borderColor: theme.danger }} onClick={() => cancelReservation(r)}>
                            Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <ReservationForm
          state={state}
          editing={editing}
          onSave={saveReservation}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}

function FilterBtn({ value, cur, onClick, label, color }) {
  const active = cur === value
  return (
    <button
      onClick={() => onClick(value)}
      style={{
        ...styles.btnSmall,
        background: active ? (color || theme.accent) : 'transparent',
        color: active ? '#000' : theme.text,
        borderColor: color || theme.border,
      }}
    >
      {label}
    </button>
  )
}

function ReservationForm({ state, editing, onSave, onClose }) {
  const [guestId, setGuestId] = useState(editing?.guestId || state.guests[0]?.id || '')
  const [roomId, setRoomId] = useState(editing?.roomId || '')
  const [checkIn, setCheckIn] = useState(editing?.checkIn || todayIso())
  const [checkOut, setCheckOut] = useState(editing?.checkOut || isoPlusDays(todayIso(), 1))
  const [guests, setGuests] = useState(editing?.guests || 1)
  const [notes, setNotes] = useState(editing?.notes || '')

  const availableRooms = useMemo(() => {
    return state.rooms.filter((r) => {
      if (editing && r.id === editing.roomId) return true
      const hasConflict = state.reservations.some((res) =>
        res.roomId === r.id &&
        res.status !== 'cancelada' &&
        res.status !== 'finalizada' &&
        res.id !== editing?.id &&
        !(checkOut <= res.checkIn || checkIn >= res.checkOut)
      )
      return !hasConflict && r.status !== 'fuera_servicio' && r.status !== 'mantenimiento'
    })
  }, [state.rooms, state.reservations, checkIn, checkOut, editing])

  const room = state.rooms.find((r) => r.id === roomId)
  const nights = daysBetween(checkIn, checkOut)
  const rate = room ? ROOM_TYPES[room.type].rate : 0
  const total = rate * nights

  function submit(e) {
    e.preventDefault()
    if (!guestId || !roomId) {
      alert('Seleccioná huésped y habitación')
      return
    }
    if (checkOut <= checkIn) {
      alert('La fecha de salida debe ser posterior a la de entrada')
      return
    }
    onSave({
      guestId, roomId, checkIn, checkOut,
      guests: Number(guests), notes,
      rate, nights, total,
    })
  }

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{editing ? 'Editar Reserva' : 'Nueva Reserva'}</h2>
          <button style={styles.btnGhost} onClick={onClose}>Cerrar</button>
        </div>

        <form onSubmit={submit}>
          <div style={styles.formRow}>
            <div>
              <label style={styles.label}>Huésped</label>
              <select style={styles.input} value={guestId} onChange={(e) => setGuestId(e.target.value)} required>
                <option value="">— Seleccionar —</option>
                {state.guests.map((g) => (
                  <option key={g.id} value={g.id}>{g.firstName} {g.lastName} · DNI {g.dni}</option>
                ))}
              </select>
              {!state.guests.length && (
                <div style={{ fontSize: '12px', color: theme.warning, marginTop: '4px' }}>
                  Registrá primero un huésped en la sección Huéspedes.
                </div>
              )}
            </div>
          </div>

          <div style={{ ...styles.formRow, gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div>
              <label style={styles.label}>Check-in</label>
              <input type="date" style={styles.input} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
            </div>
            <div>
              <label style={styles.label}>Check-out</label>
              <input type="date" style={styles.input} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
            </div>
            <div>
              <label style={styles.label}>Personas</label>
              <input type="number" min="1" max="6" style={styles.input} value={guests} onChange={(e) => setGuests(e.target.value)} required />
            </div>
          </div>

          <div style={styles.formRow}>
            <div>
              <label style={styles.label}>Habitación disponible</label>
              <select style={styles.input} value={roomId} onChange={(e) => setRoomId(e.target.value)} required>
                <option value="">— Seleccionar —</option>
                {availableRooms.map((r) => {
                  const t = ROOM_TYPES[r.type]
                  return (
                    <option key={r.id} value={r.id}>
                      Hab. {r.number} · {t.label} · {fmtCurrency(t.rate)}/noche (cap. {t.capacity})
                    </option>
                  )
                })}
              </select>
              <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '4px' }}>
                {availableRooms.length} habitación{availableRooms.length === 1 ? '' : 'es'} disponible{availableRooms.length === 1 ? '' : 's'} para estas fechas
              </div>
            </div>
          </div>

          <div style={styles.formRow}>
            <div>
              <label style={styles.label}>Notas / pedidos especiales</label>
              <textarea
                style={{ ...styles.input, minHeight: '70px', resize: 'vertical' }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div style={{ ...styles.card, background: theme.panel2, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: theme.textMuted, fontSize: '13px' }}>Tarifa por noche</span>
              <span>{fmtCurrency(rate)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: theme.textMuted, fontSize: '13px' }}>Noches</span>
              <span>{nights}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: `1px solid ${theme.border}` }}>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>Total estimado</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: theme.accent2 }}>{fmtCurrency(total)}</span>
            </div>
          </div>

          <div style={styles.modalActions}>
            <button type="button" style={styles.btnGhost} onClick={onClose}>Cancelar</button>
            <button type="submit" style={styles.btn}>{editing ? 'Guardar cambios' : 'Crear Reserva'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function roomNumber(state, roomId) {
  return state.rooms.find((r) => r.id === roomId)?.number || '—'
}
