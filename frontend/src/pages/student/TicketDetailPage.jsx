import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import { apiGet, apiPost } from '../../utils/api'

// Renders the timeline of status history entries
function HistoryTimeline({ history }) {
  if (!history || history.length === 0) return <p className="text-muted">No history yet.</p>
  return (
    <ul className="list-group list-group-flush">
      {history.map((h, i) => (
        <li key={h.id ?? i} className="list-group-item px-0">
          <div className="d-flex justify-content-between">
            <span>
              {h.old_status && <><StatusBadge status={h.old_status} /> &rarr; </>}
              <StatusBadge status={h.new_status} />
              {h.note && <span className="ms-2 text-muted small">{h.note}</span>}
            </span>
            <small className="text-muted">{new Date(h.created_at ?? h.changed_at).toLocaleString()}</small>
          </div>
          {h.changed_by_name && (
            <small className="text-muted">by {h.changed_by_name}</small>
          )}
        </li>
      ))}
    </ul>
  )
}

// Renders list of comments
function CommentList({ comments }) {
  if (!comments || comments.length === 0) return <p className="text-muted">No comments yet.</p>
  return (
    <div>
      {comments.map((c, i) => (
        <div key={c.id ?? i} className="border rounded p-3 mb-2">
          <div className="d-flex justify-content-between mb-1">
            <strong>{c.author_name ?? 'User'}</strong>
            <small className="text-muted">{new Date(c.created_at).toLocaleString()}</small>
          </div>
          <p className="mb-0">{c.body}</p>
        </div>
      ))}
    </div>
  )
}

export default function StudentTicketDetail() {
  const { ref } = useParams()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState(null)
  const [history, setHistory] = useState([])
  const [comments, setComments] = useState([])
  const [attachment, setAttachment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Comment form state
  const [commentBody, setCommentBody] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentError, setCommentError] = useState('')

  async function fetchTicket() {
    setLoading(true)
    setError('')
    try {
      const res = await apiGet(`/backend/api/tickets/detail.php?ref=${ref}`)
      if (!res || !res.ok) {
        const data = res ? await res.json() : {}
        setError(data.error || 'Failed to load ticket.')
        return
      }
      const data = await res.json()
      setTicket(data.ticket)
      setHistory(data.history ?? [])
      setComments(data.comments ?? [])
      setAttachment(data.attachment ?? null)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTicket()
  }, [ref])

  async function handleCommentSubmit(e) {
    e.preventDefault()
    if (!ticket) return
    setCommentError('')
    setCommentLoading(true)
    try {
      const res = await apiPost('/backend/api/comments/create.php', {
        ticket_id: ticket.id,
        body: commentBody,
      })
      const data = await res.json()
      if (!res.ok) {
        setCommentError(data.error || 'Failed to add comment.')
        return
      }
      setCommentBody('')
      await fetchTicket() // Re-fetch to show new comment
    } catch {
      setCommentError('Network error. Please try again.')
    } finally {
      setCommentLoading(false)
    }
  }

  if (loading) return (
    <>
      <Navbar />
      <div className="text-center mt-4"><div className="spinner-border" /></div>
    </>
  )

  if (error) return (
    <>
      <Navbar />
      <div className="container"><div className="alert alert-danger">{error}</div></div>
    </>
  )

  if (!ticket) return null

  return (
    <>
      <Navbar />
      <div className="container" style={{ maxWidth: '760px' }}>
        {/* Back link */}
        <button className="btn btn-link ps-0 mb-3" onClick={() => navigate('/student/dashboard')}>
          &larr; Back to My Tickets
        </button>

        {/* Ticket info card */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start">
              <h5 className="card-title mb-1">{ticket.title}</h5>
              <StatusBadge status={ticket.status} />
            </div>
            <small className="text-muted">Ref: <code>{ticket.ticket_ref}</code></small>

            <hr />
            <p>{ticket.description}</p>

            <div className="row g-2 text-sm">
              <div className="col-sm-6">
                <strong>Category:</strong> {ticket.category_name ?? ticket.category}
              </div>
              <div className="col-sm-6">
                <strong>Priority:</strong> {ticket.priority}
              </div>
              <div className="col-sm-6">
                <strong>Submitted by:</strong> {ticket.submitter_name ?? ticket.submitted_by_name ?? 'You'}
              </div>
              <div className="col-sm-6">
                <strong>Assigned to:</strong> {ticket.assigned_name ?? ticket.assigned_to_name ?? 'Unassigned'}
              </div>
              <div className="col-sm-6">
                <strong>Created:</strong> {new Date(ticket.created_at).toLocaleString()}
              </div>
              {ticket.updated_at && (
                <div className="col-sm-6">
                  <strong>Updated:</strong> {new Date(ticket.updated_at).toLocaleString()}
                </div>
              )}
            </div>

            {/* Attachment */}
            {attachment && (
              <div className="mt-3">
                <a
                  href={`/backend/files/serve.php?name=${attachment.stored_name}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline-secondary btn-sm"
                >
                  View Attachment ({attachment.original_name ?? 'File'})
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Status history */}
        <h6 className="fw-bold mb-2">Status History</h6>
        <HistoryTimeline history={history} />

        <hr />

        {/* Comments */}
        <h6 className="fw-bold mb-2 mt-3">Comments ({comments.length})</h6>
        <CommentList comments={comments} />

        {/* Add comment form */}
        <form onSubmit={handleCommentSubmit} className="mt-3">
          {commentError && <div className="alert alert-danger py-2">{commentError}</div>}
          <div className="mb-2">
            <textarea
              className="form-control"
              rows={3}
              placeholder="Write a comment..."
              value={commentBody}
              onChange={e => setCommentBody(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary btn-sm" type="submit" disabled={commentLoading}>
            {commentLoading
              ? <span className="spinner-border spinner-border-sm me-2" />
              : null}
            {commentLoading ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      </div>
    </>
  )
}

