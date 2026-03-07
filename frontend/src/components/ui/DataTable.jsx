import Button from './Button'
import styles from './DataTable.module.css'

export default function DataTable({ columns, rows, onEdit, onDelete, canEdit, canDelete }) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={styles.th}>{col.label}</th>
            ))}
            {(canEdit || canDelete) && <th className={styles.th}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row._id || row.id || i} className={styles.tr}>
              {columns.map((col) => (
                <td key={col.key} className={styles.td}>
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </td>
              ))}
              {(canEdit || canDelete) && (
                <td className={styles.td}>
                  <div className={styles.actions}>
                    {canEdit && (
                      <Button variant='secondary' size='sm' onClick={() => onEdit(row)}>
                        ✏️ Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant='danger' size='sm' onClick={() => onDelete(row)}>
                        🗑️
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
