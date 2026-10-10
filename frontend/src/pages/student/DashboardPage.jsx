import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import { apiGet } from '../../utils/api'

// Color class for priority text
function priorityClass(priority) {
  if (priority === 'high') return 'text-danger fw-bold'
  if (priority === 'medium') return 'text-warning fw-bold'
  return 'text-success'
}

export default function StudentDashboard() {
  const navigate = useNavigate()

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter state
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  // Pagination state
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  // Build query string and fetch tickets
  async function fetchTickets(status, priority, pageNum) {
    setLoading(true)
    setError('')

    const params = new URLSearchParams({ page: pageNum, per_page: 10 })
    if (status) params.set('status', status)
    if (priority) params.set('priority', priority)

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

  // Re-fetch whenever filters or page change
  useEffect(() => {
    fetchTickets(statusFilter, priorityFilter, page)
  }, [statusFilter, priorityFilter, page])

  function handleStatusChange(e) {
    setStatusFilter(e.target.value)
    setPage(1)
  }

  function handlePriorityChange(e) {
    setPriorityFilter(e.target.value)
    setPage(1)
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">My Tickets</h4>
          <Link to="/student/tickets/new" className="btn btn-primary btn-sm">
            + Submit New Ticket
          </Link>
        </div>

        {/* Filters */}
        <div className="row g-2 mb-3">
          <div className="col-auto">
            <select className="form-select form-select-sm" value={statusFilter} onChange={handleStatusChange}>
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="col-auto">
            <select className="form-select form-select-sm" value={priorityFilter} onChange={handlePriorityChange}>
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Loading spinner */}
        {loading && (
          <div className="text-center mt-4">
            <div className="spinner-border" />
          </div>
        )}

        {/* Error */}
        {!loading && error && <div className="alert alert-danger">{error}</div>}

        {/* Empty state */}
        {!loading && !error && tickets.length === 0 && (
          <p className="text-muted">No tickets found. Submit one to get started!</p>
        )}

        {/* Tickets table */}
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
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr
                    key={t.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/student/tickets/${t.ticket_ref}`)}
                  >
                    <td><code>{t.ticket_ref}</code></td>
                    <td>{t.title}</td>
                    <td>{t.category_name ?? t.category}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><span className={priorityClass(t.priority)}>{t.priority}</span></td>
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
