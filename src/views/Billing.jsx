import React, { useState, useMemo } from 'react'
import { styles, theme, fmtCurrency, fmtDateTime, todayIso } from '../styles.js'
import { PAYMENT_METHODS } from '../data.js'
import { newId } from '../storage.js'

export default function Billing({ state, setState }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('pending')
  const [payingCharge, setPayingCharge] = useState(null)

  const charges = useMemo(() => {
    const list = [...state.charges].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return list.filter((c) => {
      if (filter === 'pending' && c.paid) return false
      if (filter === 'paid' && !c.paid) return false
      if (search) {
        const g = state.guests.find((x) => x.id === c.guestId)
        const name = g ? `${g.firstName} ${g.lastName}`.toLowerCase() : ''
        if (!name.includes(search.toLowerCase()) && !c.concept.toLowerCase().includes(search.toLowerCase())) return false
      }
      return true
    })
  }, [state.charges, state.guests, filter, search])

  const totals = useMemo(() => {
    const pending = state.charges.filter((c) => !c.paid).reduce((s, c) => s + c.amount, 0)
    const paid = state.payments.reduce((s, p) => s + p.amount, 0)
    const month = todayIso().slice(0, 7)
    const paidMonth = state.payments
      .filter((p) => p.date.startsWith(month))
      .reduce((s, p) => s + p.amount, 0)
    return { pending, paid, paidMonth }
  }, [state.charges, state.payments])

  function registerPayment(charge, method, reference) {
    setState((s) => ({
      ...s,
      charges: s.charges.map((c) =>
        c.id === charge.id ? { ...c, paid: true, paidAt: new Date().toISOString() } : c
      ),
      payments: [
        ...s.payments,
        {
          id: newId('P-'),
          chargeId: charge.id,
          reservationId: charge.reservationId,
          guestId: charge.guestId,
          amount: charge.amount,
          method,
          reference,
          date: todayIso(),
          createdAt: new Date().toISOString(),
        },
      ],
    }))
    setPayingCharge(null)
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Facturación y Cobros</h1>
          <div style={styles.pageSub}>Consumos, saldos y pagos</div>
        </div>
      </div>

      <div style={styles.statGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Saldo pendiente</div>
          <div style={{ ...styles.statValue, color: theme.warning }}>{fmtCurrency(totals.pending)}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Cobrado (mes)</div>
          <div style={{ ...styles.statValue, color: theme.success }}>{fmtCurrency(totals.paidMonth)}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Cobrado (total)</div>
          <div style={{ ...styles.statValue, color: theme.accent2 }}>{fmtCurrency(totals.paid)}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Transacciones</div>
          <div style={{ ...styles.statValue, color: theme.text }}>{state.payments.length}</div>
        </div>
      </div>

      <div style={{ ...styles.card, marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <label style={styles.label}>Buscar</label>
          <input
            style={styles.input}
            placeholder="Huésped o concepto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label style={styles.label}>Filtro</label>
          <select style={{ ...styles.input, minWidth: '180px', cursor: 'pointer' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="paid">Cobrados</option>
          </select>
        </div>
      </div>

      <h3 style={styles.sectionTitle}>Consumos y cargos</h3>
      <div style={{ ...styles.tableWrap, marginBottom: '24px' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Fecha</th>
              <th style={styles.th}>Huésped</th>
              <th style={styles.th}>Reserva</th>
              <th style={styles.th}>Concepto</th>
              <th style={styles.th}>Monto</th>
              <th style={styles.th}>Estado</th>
              <th style={styles.th}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {charges.length === 0 && (
              <tr><td colSpan="7" style={styles.empty}>No hay movimientos</td></tr>
            )}
            {charges.map((c) => {
              const g = state.guests.find((x) => x.id === c.guestId)
              return (
                <tr key={c.id}>
                  <td style={{ ...styles.td, color: theme.textMuted }}>{fmtDateTime(c.createdAt)}</td>
                  <td style={styles.td}>{g ? `${g.firstName} ${g.lastName}` : '—'}</td>
                  <td style={{ ...styles.td, color: theme.accent2, fontSize: '12px' }}>{c.reservationId}</td>
                  <td style={styles.td}>{c.concept}</td>
                  <td style={{ ...styles.td, fontWeight: 700 }}>{fmtCurrency(c.amount)}</td>
                  <td style={styles.td}>
                    {c.paid
                      ? <span style={styles.badge(theme.success)}>Cobrado</span>
                      : <span style={styles.badge(theme.warning)}>Pendiente</span>}
                  </td>
                  <td style={styles.td}>
                    {!c.paid && (
                      <button style={styles.btn} onClick={() => setPayingCharge(c)}>Cobrar</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <h3 style={styles.sectionTitle}>Pagos registrados</h3>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Fecha</th>
              <th style={styles.th}>Huésped</th>
              <th style={styles.th}>Concepto</th>
              <th style={styles.th}>Método</th>
              <th style={styles.th}>Referencia</th>
              <th style={styles.th}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {state.payments.length === 0 && (
              <tr><td colSpan="6" style={styles.empty}>Sin pagos registrados</td></tr>
            )}
            {[...state.payments].reverse().map((p) => {
              const g = state.guests.find((x) => x.id === p.guestId)
              const c = state.charges.find((x) => x.id === p.chargeId)
              return (
                <tr key={p.id}>
                  <td style={{ ...styles.td, color: theme.textMuted }}>{fmtDateTime(p.createdAt)}</td>
                  <td style={styles.td}>{g ? `${g.firstName} ${g.lastName}` : '—'}</td>
                  <td style={styles.td}>{c?.concept || '—'}</td>
                  <td style={styles.td}>{p.method}</td>
                  <td style={{ ...styles.td, color: theme.textMuted }}>{p.reference || '—'}</td>
                  <td style={{ ...styles.td, fontWeight: 700, color: theme.success }}>{fmtCurrency(p.amount)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {payingCharge && (
        <PayModal
          charge={payingCharge}
          guest={state.guests.find((g) => g.id === payingCharge.guestId)}
          onConfirm={registerPayment}
          onClose={() => setPayingCharge(null)}
        />
      )}
    </div>
  )
}

function PayModal({ charge, guest, onConfirm, onClose }) {
  const [method, setMethod] = useState(PAYMENT_METHODS[0])
  const [reference, setReference] = useState('')

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Registrar cobro</h2>
          <button style={styles.btnGhost} onClick={onClose}>Cerrar</button>
        </div>
        <div style={{ ...styles.card, background: theme.panel2, marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', color: theme.textMuted }}>Huésped</div>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>{guest ? `${guest.firstName} ${guest.lastName}` : '—'}</div>
          <div style={{ fontSize: '13px', color: theme.textMuted, marginTop: '8px' }}>{charge.concept}</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: theme.accent2, marginTop: '4px' }}>
            {fmtCurrency(charge.amount)}
          </div>
        </div>
        <div style={styles.formRow}>
          <div>
            <label style={styles.label}>Método de pago</label>
            <select style={styles.input} value={method} onChange={(e) => setMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div style={styles.formRow}>
          <div>
            <label style={styles.label}>Referencia (opcional)</label>
            <input style={styles.input} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Nº de comprobante, cuenta, etc." />
          </div>
        </div>
        <div style={styles.modalActions}>
          <button style={styles.btnGhost} onClick={onClose}>Cancelar</button>
          <button style={styles.btn} onClick={() => onConfirm(charge, method, reference)}>
            Confirmar cobro
          </button>
        </div>
      </div>
    </div>
  )
}
