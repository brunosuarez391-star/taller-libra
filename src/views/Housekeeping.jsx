import React from 'react'
import { styles, theme, fmtDateTime } from '../styles.js'
import { ROOM_STATUS, ROOM_TYPES } from '../data.js'
import { newId } from '../storage.js'

export default function Housekeeping({ state, setState }) {
  const dirty = state.rooms.filter((r) => r.status === 'limpieza')
  const maintenance = state.rooms.filter((r) => r.status === 'mantenimiento')
  const outOfService = state.rooms.filter((r) => r.status === 'fuera_servicio')

  function markClean(room) {
    setState((s) => ({
      ...s,
      rooms: s.rooms.map((r) => (r.id === room.id ? { ...r, status: 'disponible' } : r)),
      housekeepingLog: [
        ...s.housekeepingLog,
        {
          id: newId('HK-'),
          roomId: room.id,
          action: 'Limpieza completada',
          at: new Date().toISOString(),
        },
      ],
    }))
  }

  function setMaintenance(room) {
    const reason = prompt(`Describir trabajo de mantenimiento para habitación ${room.number}:`)
    if (reason === null) return
    setState((s) => ({
      ...s,
      rooms: s.rooms.map((r) =>
        r.id === room.id ? { ...r, status: 'mantenimiento', notes: reason } : r
      ),
      housekeepingLog: [
        ...s.housekeepingLog,
        {
          id: newId('HK-'),
          roomId: room.id,
          action: `Mantenimiento: ${reason}`,
          at: new Date().toISOString(),
        },
      ],
    }))
  }

  function finishMaintenance(room) {
    setState((s) => ({
      ...s,
      rooms: s.rooms.map((r) => (r.id === room.id ? { ...r, status: 'limpieza', notes: '' } : r)),
      housekeepingLog: [
        ...s.housekeepingLog,
        {
          id: newId('HK-'),
          roomId: room.id,
          action: 'Mantenimiento finalizado',
          at: new Date().toISOString(),
        },
      ],
    }))
  }

  const recentLog = [...state.housekeepingLog].reverse().slice(0, 20)

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Limpieza y Mantenimiento</h1>
          <div style={styles.pageSub}>Gestión de tareas de housekeeping</div>
        </div>
      </div>

      <div style={styles.statGrid}>
        <StatBox label="Pendientes de limpieza" value={dirty.length} color={theme.warning} />
        <StatBox label="En mantenimiento" value={maintenance.length} color="#fb923c" />
        <StatBox label="Fuera de servicio" value={outOfService.length} color={theme.textMuted} />
        <StatBox label="Listas" value={state.rooms.filter(r => r.status === 'disponible').length} color={theme.success} />
      </div>

      <SectionList
        title="Habitaciones a limpiar"
        rooms={dirty}
        emptyText="No hay habitaciones pendientes de limpieza"
        actions={(r) => [
          { label: 'Marcar como limpia', style: styles.btn, fn: () => markClean(r) },
          { label: 'Requiere mantenimiento', style: styles.btnGhost, fn: () => setMaintenance(r) },
        ]}
      />

      <SectionList
        title="En mantenimiento"
        rooms={maintenance}
        emptyText="No hay habitaciones en mantenimiento"
        showNotes
        actions={(r) => [
          { label: 'Finalizar mantenimiento', style: styles.btn, fn: () => finishMaintenance(r) },
        ]}
      />

      <h3 style={{ ...styles.sectionTitle, marginTop: '24px' }}>Historial reciente</h3>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Fecha</th>
              <th style={styles.th}>Habitación</th>
              <th style={styles.th}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {recentLog.length === 0 && (
              <tr><td colSpan="3" style={styles.empty}>Sin actividad registrada</td></tr>
            )}
            {recentLog.map((log) => {
              const room = state.rooms.find((r) => r.id === log.roomId)
              return (
                <tr key={log.id}>
                  <td style={{ ...styles.td, color: theme.textMuted }}>{fmtDateTime(log.at)}</td>
                  <td style={styles.td}>{room?.number || '—'}</td>
                  <td style={styles.td}>{log.action}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={{ ...styles.statValue, color }}>{value}</div>
    </div>
  )
}

function SectionList({ title, rooms, emptyText, actions, showNotes }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      {rooms.length === 0 ? (
        <div style={{ ...styles.card, ...styles.empty }}>{emptyText}</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Habitación</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Estado</th>
                {showNotes && <th style={styles.th}>Notas</th>}
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => {
                const s = ROOM_STATUS[r.status]
                return (
                  <tr key={r.id}>
                    <td style={{ ...styles.td, fontWeight: 700 }}>{r.number} · P{r.floor}</td>
                    <td style={styles.td}>{ROOM_TYPES[r.type].label}</td>
                    <td style={styles.td}><span style={styles.badge(s.color)}>{s.label}</span></td>
                    {showNotes && <td style={{ ...styles.td, color: theme.textMuted, fontSize: '13px' }}>{r.notes || '—'}</td>}
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {actions(r).map((a, i) => (
                          <button key={i} style={a.style} onClick={a.fn}>{a.label}</button>
                        ))}
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
