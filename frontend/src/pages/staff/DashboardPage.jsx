import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import { apiGet } from '../../utils/api'

function priorityClass(priority) {
  if (priority === 'high') return 'text-danger fw-bold'
  if (priority === 'medium') return 'text-warning fw-bold'
  return 'text-success'
}

export default function StaffDashboard() {
  const navigate = useNavigate()

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  async function fetchTickets(status, pageNum) {
    setLoading(true)
    setError('')

    const params = new URLSearchParams({ page: pageNum, per_page: 10 })
    if (status) params.set('status', status)

    try {
      const res = await apiGet('/backend/api/tickets/list.php?' + params)
      if (!res || !res.ok) {
        const data = res ? await res.json() : {}
        setError(data.error || 'Failed to load tickets.')
        return
      }
      const data = await res.json()
      setTickets(data.tickets ?? data)
      setMeta(data.meta ?? null)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets(statusFilter, page)
  }, [statusFilter, page])

  function handleStatusChange(e) {
    setStatusFilter(e.target.value)
    setPage(1)
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h4 className="mb-3">My Queue</h4>

        {/* Status filter */}
        <div className="mb-3">
          <select className="form-select form-select-sm w-auto" value={statusFilter} onChange={handleStatusChange}>
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {loading && (
          <div className="text-center mt-4"><div className="spinner-border" /></div>
        )}

        {!loading && error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && tickets.length === 0 && (
          <p className="text-muted">No tickets assigned to you.</p>
        )}

        {!loading && !error && tickets.length > 0 && (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Ref</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Submitted by</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr
                    key={t.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/staff/tickets/${t.ticket_ref}`)}
                  >
                    <td><code>{t.ticket_ref}</code></td>
                    <td>{t.title}</td>
                    <td>{t.category_name ?? t.category}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><span className={priorityClass(t.priority)}>{t.priority}</span></td>
                    <td>{t.submitted_by_name ?? '-'}</td>
                    <td>{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.total_pages > 1 && (
          <div className="d-flex gap-2 align-items-center">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span className="text-muted">Page {meta.page} of {meta.total_pages}</span>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page >= meta.total_pages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  )
}
