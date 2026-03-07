import styles from './Misc.module.css'

export function Card({ children, className = '', padding = true }) {
  return (
    <div className={[styles.card, padding ? styles.padded : '', className].join(' ')}>
      {children}
    </div>
  )
}

export function CardHeader({ title, children }) {
  return (
    <div className={styles.cardHeader}>
      <span className={styles.cardTitle}>{title}</span>
      {children}
    </div>
  )
}

export function Badge({ role }) {
  const map = {
    admin: styles.admin, hod: styles.hod,
    faculty: styles.faculty, student: styles.student,
    all: styles.all, active: styles.ok, inactive: styles.danger,
  }
  return (
    <span className={[styles.badge, map[role] || styles.neutral].join(' ')}>
      {(role || '—').toUpperCase()}
    </span>
  )
}

export function Alert({ type = 'error', message }) {
  if (!message) return null
  return <div className={[styles.alert, styles[type]].join(' ')}>{message}</div>
}

export function Spinner({ size = 20 }) {
  return (
    <div className={styles.spinnerWrap}>
      <div className={styles.spinner} style={{ width: size, height: size }} />
    </div>
  )
}

export function Empty({ icon = '📭', title = 'Nothing here', subtitle, action }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>{icon}</div>
      <h3 className={styles.emptyTitle}>{title}</h3>
      {subtitle && <p className={styles.emptySub}>{subtitle}</p>}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className={styles.pageHeader}>
      <div>
        <h1 className={styles.pageTitle}>{title}</h1>
        {subtitle && <p className={styles.pageSub}>{subtitle}</p>}
      </div>
      {children && <div className={styles.pageActions}>{children}</div>}
    </div>
  )
}

export function StatCard({ icon, value, label, color, bg }) {
  return (
    <div className={styles.statCard} style={{ '--sc': color }}>
      <div className={styles.statIcon} style={{ background: bg }}>{icon}</div>
      <div className={styles.statValue}>{value ?? '…'}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}
