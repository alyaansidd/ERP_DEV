import styles from './Button.module.css'

export default function Button({
  children, variant = 'primary', size = 'md',
  fullWidth, disabled, loading, onClick, type = 'button', className = '',
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        fullWidth ? styles.full : '',
        className,
      ].join(' ')}
    >
      {loading && <span className={styles.spinner} />}
      {children}
    </button>
  )
}
