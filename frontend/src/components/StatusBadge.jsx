export default function StatusBadge({ status }) {
  const map = {
    open: 'secondary',
    in_progress: 'primary',
    resolved: 'success',
    closed: 'dark',
  }
  const label = status.replace('_', ' ')
  return <span className={`badge bg-${map[status] ?? 'secondary'}`}>{label}</span>
}
