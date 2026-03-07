import styles from './Input.module.css'

export default function Input({
  label, name, type = 'text', value, onChange,
  placeholder, required, error, options,
}) {
  const id = `field-${name}`

  const renderControl = () => {
    if (type === 'select') {
      return (
        <select
          id={id} name={name} value={value ?? ''} required={required}
          className={[styles.control, error ? styles.hasError : ''].join(' ')}
          onChange={(e) => onChange(name, e.target.value)}
        >
          <option value=''>Select…</option>
          {(options || []).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )
    }

    if (type === 'textarea') {
      return (
        <textarea
          id={id} name={name} value={value ?? ''} placeholder={placeholder}
          required={required} rows={3}
          className={[styles.control, styles.textarea, error ? styles.hasError : ''].join(' ')}
          onChange={(e) => onChange(name, e.target.value)}
        />
      )
    }

    return (
      <input
        id={id} type={type} name={name} value={value ?? ''}
        placeholder={placeholder} required={required}
        className={[styles.control, error ? styles.hasError : ''].join(' ')}
        onChange={(e) => onChange(name, e.target.value)}
      />
    )
  }

  return (
    <div className={styles.group}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}{required && <span className={styles.required}> *</span>}
        </label>
      )}
      {renderControl()}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
