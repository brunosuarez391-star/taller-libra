import React, { useState, useMemo } from 'react'
import { styles, theme, fmtDate } from '../styles.js'
import { newId } from '../storage.js'

export default function Guests({ state, setState }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = [...state.guests].sort((a, b) => a.lastName.localeCompare(b.lastName))
    if (!q) return list
    return list.filter((g) =>
      `${g.firstName} ${g.lastName} ${g.dni} ${g.email} ${g.phone}`.toLowerCase().includes(q)
    )
  }, [state.guests, search])

  function save(data) {
    setState((s) => {
      if (editing) {
        return { ...s, guests: s.guests.map((g) => (g.id === editing.id ? { ...g, ...data } : g)) }
      }
      return {
        ...s,
        guests: [...s.guests, { ...data, id: newId('G-'), createdAt: new Date().toISOString() }],
      }
    })
    setShowForm(false)
    setEditing(null)
  }

  function remove(guest) {
    const hasReservations = state.reservations.some(
      (r) => r.guestId === guest.id && r.status !== 'cancelada' && r.status !== 'finalizada'
    )
    if (hasReservations) {
      alert('No se puede eliminar un huésped con reservas activas.')
      return
    }
    if (!confirm(`¿Eliminar huésped ${guest.firstName} ${guest.lastName}?`)) return
    setState((s) => ({ ...s, guests: s.guests.filter((g) => g.id !== guest.id) }))
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Huéspedes</h1>
          <div style={styles.pageSub}>{state.guests.length} registrados</div>
        </div>
        <button style={styles.btn} onClick={() => { setEditing(null); setShowForm(true) }}>
          + Nuevo Huésped
        </button>
      </div>

      <div style={{ ...styles.card, marginBottom: '16px' }}>
        <input
          style={styles.input}
          placeholder="Buscar por nombre, DNI, email o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nombre completo</th>
              <th style={styles.th}>DNI / Doc.</th>
              <th style={styles.th}>Teléfono</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Nacionalidad</th>
              <th style={styles.th}>Alta</th>
              <th style={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan="7" style={styles.empty}>No se encontraron huéspedes</td></tr>
            )}
            {filtered.map((g) => (
              <tr key={g.id}>
                <td style={{ ...styles.td, fontWeight: 600 }}>{g.firstName} {g.lastName}</td>
                <td style={styles.td}>{g.dni}</td>
                <td style={styles.td}>{g.phone}</td>
                <td style={{ ...styles.td, color: theme.textMuted }}>{g.email}</td>
                <td style={styles.td}>{g.nationality}</td>
                <td style={{ ...styles.td, color: theme.textMuted }}>{fmtDate(g.createdAt)}</td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={styles.btnSmall} onClick={() => { setEditing(g); setShowForm(true) }}>Editar</button>
                    <button
                      style={{ ...styles.btnSmall, color: theme.danger, borderColor: theme.danger }}
                      onClick={() => remove(g)}
                    >Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <GuestForm
          editing={editing}
          onSave={save}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}

function GuestForm({ editing, onSave, onClose }) {
  const [data, setData] = useState({
    firstName: editing?.firstName || '',
    lastName: editing?.lastName || '',
    dni: editing?.dni || '',
    phone: editing?.phone || '',
    email: editing?.email || '',
    address: editing?.address || '',
    nationality: editing?.nationality || 'Argentina',
  })

  function update(k, v) { setData((d) => ({ ...d, [k]: v })) }

  function submit(e) {
    e.preventDefault()
    if (!data.firstName || !data.lastName || !data.dni) {
      alert('Nombre, apellido y DNI son obligatorios')
      return
    }
    onSave(data)
  }

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{editing ? 'Editar Huésped' : 'Nuevo Huésped'}</h2>
          <button style={styles.btnGhost} onClick={onClose}>Cerrar</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ ...styles.formRow, gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label style={styles.label}>Nombre</label>
              <input style={styles.input} value={data.firstName} onChange={(e) => update('firstName', e.target.value)} required />
            </div>
            <div>
              <label style={styles.label}>Apellido</label>
              <input style={styles.input} value={data.lastName} onChange={(e) => update('lastName', e.target.value)} required />
            </div>
          </div>
          <div style={{ ...styles.formRow, gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label style={styles.label}>DNI / Documento</label>
              <input style={styles.input} value={data.dni} onChange={(e) => update('dni', e.target.value)} required />
            </div>
            <div>
              <label style={styles.label}>Nacionalidad</label>
              <input style={styles.input} value={data.nationality} onChange={(e) => update('nationality', e.target.value)} />
            </div>
          </div>
          <div style={{ ...styles.formRow, gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label style={styles.label}>Teléfono</label>
              <input style={styles.input} value={data.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
            <div>
              <label style={styles.label}>Email</label>
              <input type="email" style={styles.input} value={data.email} onChange={(e) => update('email', e.target.value)} />
            </div>
          </div>
          <div style={styles.formRow}>
            <div>
              <label style={styles.label}>Domicilio</label>
              <input style={styles.input} value={data.address} onChange={(e) => update('address', e.target.value)} />
            </div>
          </div>
          <div style={styles.modalActions}>
            <button type="button" style={styles.btnGhost} onClick={onClose}>Cancelar</button>
            <button type="submit" style={styles.btn}>{editing ? 'Guardar cambios' : 'Registrar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
