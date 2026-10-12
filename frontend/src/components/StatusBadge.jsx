export default function StatusBadge({ status }) {
  if (!status) return null
  const map = {
    open: 'secondary',
    in_progress: 'primary',
    resolved: 'success',
    closed: 'dark',
  }
  const label = typeof status === 'string' ? status.replace('_', ' ') : String(status)
  return <span className={`badge bg-${map[status] ?? 'secondary'}`}>{label}</span>
}

