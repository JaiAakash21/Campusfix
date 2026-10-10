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

export default function AdminTicketsPage() {
  const navigate = useNavigate()

  const [tickets, setTickets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [search, setSearch] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  // Load category list for the filter dropdown
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiGet('/backend/api/categories/list.php')
        if (res && res.ok) {
          const data = await res.json()
          setCategories(data.categories ?? data)
        }
      } catch {
        // Non-fatal
      }
    }
    loadCategories()
  }, [])

  async function fetchTickets() {
    setLoading(true)
    setError('')

    const params = new URLSearchParams({ page, per_page: 10 })
    if (statusFilter) params.set('status', statusFilter)
    if (categoryFilter) params.set('category_id', categoryFilter)
    if (priorityFilter) params.set('priority', priorityFilter)
    if (search) params.set('search', search)

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
    fetchTickets()
  }, [statusFilter, categoryFilter, priorityFilter, page])

  // Search is triggered on form submit only
  function handleSearchSubmit(e) {
    e.preventDefault()
    setPage(1)
    fetchTickets()
  }

  function resetFilters() {
    setStatusFilter('')
    setCategoryFilter('')
    setPriorityFilter('')
    setSearch('')
    setPage(1)
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h4 className="mb-3">All Tickets</h4>

        {/* Filter bar */}
        <div className="row g-2 mb-3 align-items-end">
          <div className="col-auto">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="col-auto">
            <select
              className="form-select form-select-sm"
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-auto">
            <select
              className="form-select form-select-sm"
              value={priorityFilter}
              onChange={e => { setPriorityFilter(e.target.value); setPage(1) }}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="col">
            <form onSubmit={handleSearchSubmit} className="d-flex gap-1">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search by title..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className="btn btn-outline-primary btn-sm" type="submit">Search</button>
            </form>
          </div>
          <div className="col-auto">
            <button className="btn btn-outline-secondary btn-sm" onClick={resetFilters}>
              Reset
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center mt-4"><div className="spinner-border" /></div>
        )}

        {!loading && error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && tickets.length === 0 && (
          <p className="text-muted">No tickets found.</p>
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
                  <th>Submitter</th>
                  <th>Assigned To</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr
                    key={t.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/tickets/${t.ticket_ref}`)}
                  >
                    <td><code>{t.ticket_ref}</code></td>
                    <td>{t.title}</td>
                    <td>{t.category_name ?? t.category}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><span className={priorityClass(t.priority)}>{t.priority}</span></td>
                    <td>{t.submitted_by_name ?? '-'}</td>
                    <td>{t.assigned_to_name ?? 'Unassigned'}</td>
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
