import React, { useState, useMemo } from 'react'
import { styles, theme, fmtCurrency } from '../styles.js'
import { ROOM_STATUS, ROOM_TYPES } from '../data.js'

export default function Rooms({ state, setState }) {
  const [floorFilter, setFloorFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => {
    return state.rooms.filter((r) => {
      if (floorFilter !== 'all' && r.floor !== Number(floorFilter)) return false
      if (typeFilter !== 'all' && r.type !== typeFilter) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      return true
    })
  }, [state.rooms, floorFilter, typeFilter, statusFilter])

  function updateRoom(id, patch) {
    setState((s) => ({
      ...s,
      rooms: s.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))
  }

  const currentReservation = (roomId) =>
    state.reservations.find(
      (r) => r.roomId === roomId && (r.status === 'en_curso' || r.status === 'confirmada')
    )

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Habitaciones</h1>
          <div style={styles.pageSub}>{state.rooms.length} habitaciones · 4 plantas</div>
        </div>
      </div>

      <div style={{ ...styles.card, marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Select label="Planta" value={floorFilter} onChange={setFloorFilter}
          options={[['all', 'Todas'], ['1', 'Planta 1'], ['2', 'Planta 2'], ['3', 'Planta 3'], ['4', 'Planta 4']]}
        />
        <Select label="Tipo" value={typeFilter} onChange={setTypeFilter}
          options={[['all', 'Todos'], ...Object.values(ROOM_TYPES).map(t => [t.key, t.label])]}
        />
        <Select label="Estado" value={statusFilter} onChange={setStatusFilter}
          options={[['all', 'Todos'], ...Object.entries(ROOM_STATUS).map(([k, s]) => [k, s.label])]}
        />
        <div style={{ marginLeft: 'auto', alignSelf: 'flex-end', fontSize: '13px', color: theme.textMuted }}>
          Mostrando {filtered.length} de {state.rooms.length}
        </div>
      </div>

      {[1, 2, 3, 4].map((floor) => {
        const floorRooms = filtered.filter((r) => r.floor === floor)
        if (!floorRooms.length) return null
        return (
          <div key={floor} style={{ marginBottom: '24px' }}>
            <h3 style={styles.sectionTitle}>Planta {floor}</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '10px',
            }}>
              {floorRooms.map((r) => (
                <RoomCard
                  key={r.id}
                  room={r}
                  reservation={currentReservation(r.id)}
                  onClick={() => setSelected(r)}
                />
              ))}
            </div>
          </div>
        )
      })}

      {selected && (
        <RoomModal
          room={selected}
          reservation={currentReservation(selected.id)}
          guest={
            currentReservation(selected.id)
              ? state.guests.find(g => g.id === currentReservation(selected.id).guestId)
              : null
          }
          onClose={() => setSelected(null)}
          onUpdate={(patch) => {
            updateRoom(selected.id, patch)
            setSelected({ ...selected, ...patch })
          }}
        />
      )}
    </div>
  )
}

function RoomCard({ room, reservation, onClick }) {
  const status = ROOM_STATUS[room.status]
  const type = ROOM_TYPES[room.type]
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        padding: '12px',
        borderRadius: '10px',
        background: status.bg,
        border: `1px solid ${status.color}66`,
        color: theme.text,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '20px', fontWeight: 800 }}>{room.number}</span>
        <span style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: status.color,
        }} />
      </div>
      <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>
        {type.label}
      </div>
      <div style={{ fontSize: '10px', fontWeight: 700, color: status.color, marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {status.label}
      </div>
      {reservation && (
        <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          → {reservation.checkOut}
        </div>
      )}
    </button>
  )
}

function RoomModal({ room, reservation, guest, onClose, onUpdate }) {
  const type = ROOM_TYPES[room.type]
  const [notes, setNotes] = useState(room.notes || '')
  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>Habitación {room.number}</h2>
            <div style={{ color: theme.textMuted, fontSize: '13px' }}>
              Planta {room.floor} · {type.label} · {fmtCurrency(type.rate)}/noche
            </div>
          </div>
          <button style={styles.btnGhost} onClick={onClose}>Cerrar</button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={styles.label}>Capacidad y servicios</div>
          <div style={{ fontSize: '13px', color: theme.text }}>
            Hasta {type.capacity} {type.capacity === 1 ? 'persona' : 'personas'}
          </div>
          <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {type.amenities.map((a) => (
              <span key={a} style={styles.badge(theme.accent2)}>{a}</span>
            ))}
          </div>
        </div>

        {reservation && guest && (
          <div style={{ ...styles.card, marginBottom: '16px', background: theme.panel2 }}>
            <div style={styles.label}>Huésped actual</div>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>
              {guest.firstName} {guest.lastName}
            </div>
            <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '4px' }}>
              DNI: {guest.dni} · Tel: {guest.phone}
            </div>
            <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '6px' }}>
              Check-in: {reservation.checkIn} · Check-out: {reservation.checkOut}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <div style={styles.label}>Cambiar estado</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {Object.entries(ROOM_STATUS).map(([key, s]) => (
              <button
                key={key}
                onClick={() => onUpdate({ status: key })}
                disabled={reservation && (key === 'disponible' || key === 'fuera_servicio')}
                style={{
                  ...styles.btnSmall,
                  background: room.status === key ? s.color : 'transparent',
                  color: room.status === key ? '#000' : s.color,
                  borderColor: s.color,
                  opacity: reservation && (key === 'disponible' || key === 'fuera_servicio') ? 0.4 : 1,
                  cursor: reservation && (key === 'disponible' || key === 'fuera_servicio') ? 'not-allowed' : 'pointer',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={styles.label}>Notas internas</label>
          <textarea
            style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => onUpdate({ notes })}
            placeholder="Observaciones, incidencias, pedidos especiales..."
          />
        </div>
      </div>
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...styles.input, minWidth: '160px', cursor: 'pointer' }}
      >
        {options.map(([k, l]) => (
          <option key={k} value={k}>{l}</option>
        ))}
      </select>
    </div>
  )
}
