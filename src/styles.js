export const theme = {
  bg: '#0b1220',
  panel: '#111c2e',
  panel2: '#162337',
  border: '#1f2d45',
  text: '#e6edf7',
  textMuted: '#94a3b8',
  accent: '#0ea5e9',
  accent2: '#22d3ee',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#a78bfa',
}

export const styles = {
  app: {
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    background: theme.bg,
    color: theme.text,
    minHeight: '100vh',
    margin: 0,
    display: 'flex',
  },
  sidebar: {
    width: '240px',
    background: theme.panel,
    borderRight: `1px solid ${theme.border}`,
    padding: '20px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
  },
  brand: {
    padding: '6px 10px 18px',
    borderBottom: `1px solid ${theme.border}`,
    marginBottom: '12px',
  },
  brandTitle: {
    fontSize: '20px',
    fontWeight: 800,
    color: theme.accent2,
    letterSpacing: '0.5px',
    margin: 0,
  },
  brandSub: {
    fontSize: '11px',
    color: theme.textMuted,
    marginTop: '2px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  navBtn: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    border: 'none',
    background: active ? theme.panel2 : 'transparent',
    color: active ? theme.accent2 : theme.text,
    fontSize: '14px',
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s',
  }),
  navIcon: { fontSize: '16px', width: '20px', textAlign: 'center' },
  main: {
    flex: 1,
    minWidth: 0,
    padding: '24px 32px 48px',
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  pageTitle: { fontSize: '26px', fontWeight: 700, margin: 0, color: theme.text },
  pageSub: { fontSize: '13px', color: theme.textMuted, marginTop: '2px' },

  card: {
    background: theme.panel,
    border: `1px solid ${theme.border}`,
    borderRadius: '12px',
    padding: '18px',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
    marginBottom: '24px',
  },
  statCard: {
    background: theme.panel,
    border: `1px solid ${theme.border}`,
    borderRadius: '12px',
    padding: '16px 18px',
  },
  statLabel: {
    fontSize: '11px',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
  },
  statValue: { fontSize: '30px', fontWeight: 800, marginTop: '4px' },

  sectionTitle: { fontSize: '16px', fontWeight: 700, margin: '8px 0 14px', color: theme.text },

  tableWrap: {
    background: theme.panel,
    border: `1px solid ${theme.border}`,
    borderRadius: '12px',
    overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    padding: '11px 14px',
    background: theme.panel2,
    color: theme.textMuted,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 700,
    borderBottom: `1px solid ${theme.border}`,
  },
  td: { padding: '12px 14px', borderTop: `1px solid ${theme.border}`, fontSize: '14px' },

  btn: {
    padding: '8px 14px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    background: theme.accent,
    color: '#fff',
  },
  btnGhost: {
    padding: '8px 14px',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    background: 'transparent',
    color: theme.text,
  },
  btnDanger: {
    padding: '8px 14px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    background: theme.danger,
    color: '#fff',
  },
  btnSmall: {
    padding: '5px 10px',
    border: `1px solid ${theme.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    background: 'transparent',
    color: theme.text,
  },

  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
    background: theme.panel2,
    color: theme.text,
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    color: theme.textMuted,
    marginBottom: '4px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  formRow: { display: 'grid', gap: '12px', marginBottom: '12px' },

  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(5, 10, 20, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '16px',
  },
  modal: {
    background: theme.panel,
    border: `1px solid ${theme.border}`,
    borderRadius: '14px',
    width: '100%',
    maxWidth: '640px',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '22px 24px',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
  },
  modalTitle: { fontSize: '18px', fontWeight: 700, margin: 0 },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '18px',
    paddingTop: '14px',
    borderTop: `1px solid ${theme.border}`,
  },

  badge: (color, bg) => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 700,
    color,
    background: bg ?? `${color}22`,
    border: `1px solid ${color}55`,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  }),

  empty: {
    textAlign: 'center',
    padding: '40px 20px',
    color: theme.textMuted,
    fontSize: '14px',
  },
}

export function fmtCurrency(n) {
  if (n == null || isNaN(n)) return '$ 0'
  return '$ ' + Math.round(n).toLocaleString('es-AR')
}

export function fmtDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function fmtDateTime(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

export function daysBetween(a, b) {
  if (!a || !b) return 0
  const d1 = new Date(a)
  const d2 = new Date(b)
  const ms = d2 - d1
  return Math.max(1, Math.round(ms / 86400000))
}

export function todayIso() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export function isoPlusDays(iso, days) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
