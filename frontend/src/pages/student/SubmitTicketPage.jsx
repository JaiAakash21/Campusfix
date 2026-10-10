import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { apiGet, apiPost } from '../../utils/api'

export default function SubmitTicketPage() {
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [catLoading, setCatLoading] = useState(true)

  // Form fields
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState('medium')
  const [description, setDescription] = useState('')
  const [attachment, setAttachment] = useState(null)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch categories for the dropdown on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiGet('/backend/api/categories/list.php')
        if (res && res.ok) {
          const data = await res.json()
          setCategories(data.categories ?? data)
        }
      } catch {
        // Non-fatal — user will see empty dropdown
      } finally {
        setCatLoading(false)
      }
    }
    loadCategories()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Use FormData so the file is sent as multipart
      const formData = new FormData()
      formData.append('title', title)
      formData.append('category_id', categoryId)
      formData.append('priority', priority)
      formData.append('description', description)
      if (attachment) {
        formData.append('attachment', attachment)
      }

      const res = await apiPost('/backend/api/tickets/create.php', formData)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit ticket.')
        return
      }

      navigate(`/student/tickets/${data.ticket_ref}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container" style={{ maxWidth: '600px' }}>
        <h4 className="mb-4">Submit a New Ticket</h4>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Title *</label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Category *</label>
            <select
              className="form-select"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              required
            >
              <option value="">{catLoading ? 'Loading...' : 'Select a category'}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Priority *</label>
            <select
              className="form-select"
              value={priority}
              onChange={e => setPriority(e.target.value)}
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Description *</label>
            <textarea
              className="form-control"
              rows={5}
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Attach image (JPEG/PNG, max 2MB)</label>
            <input
              type="file"
              className="form-control"
              accept="image/jpeg,image/png"
              onChange={e => setAttachment(e.target.files[0] ?? null)}
            />
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading
                ? <span className="spinner-border spinner-border-sm me-2" />
                : null}
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate('/student/dashboard')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
