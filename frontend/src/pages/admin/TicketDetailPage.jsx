import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import { apiGet, apiPatch, apiPost } from '../../utils/api'

const STATUSES = ['open', 'in_progress', 'resolved', 'closed']

export default function AdminTicketDetail() {
  const { ref } = useParams()
  const navigate = useNavigate()

  const [ticket, setTicket]       = useState(null)
  const [history, setHistory]     = useState([])
  const [comments, setComments]   = useState([])
  const [attachment, setAttachment] = useState(null)
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  // Update status form
  const [newStatus, setNewStatus]   = useState('')
  const [note, setNote]             = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [updating, setUpdating]     = useState(false)
  const [updateMsg, setUpdateMsg]   = useState('')

  // Comment form
  const [commentBody, setCommentBody] = useState('')
  const [commenting, setCommenting]   = useState(false)

  async function loadTicket() {
    setLoading(true)
    try {
      const res = await apiGet('/backend/api/tickets/detail.php?ref=' + ref)
      if (!res?.ok) { setError('Ticket not found.'); return }
      const d = await res.json()
      setTicket(d.ticket)
      setHistory(d.history ?? [])
      setComments(d.comments ?? [])
      setAttachment(d.attachment ?? null)
      setNewStatus(d.ticket.status)
      setAssignedTo(d.ticket.assigned_to ?? '')
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTicket() }, [ref])

  useEffect(() => {
    apiGet('/backend/api/users/list.php?role=staff')
      .then(r => r?.json())
      .then(d => setStaffList(d?.users ?? []))
      .catch(() => {})
  }, [])

  async function handleUpdate(e) {
    e.preventDefault()
    setUpdating(true)
    setUpdateMsg('')
    const payload = { id: ticket.id }
    if (newStatus !== ticket.status) payload.status = newStatus
    if (note) payload.note = note
    if (String(assignedTo) !== String(ticket.assigned_to ?? '')) {
      payload.assigned_to = assignedTo === '' ? null : parseInt(assignedTo)
    }
    const res = await apiPatch('/backend/api/tickets/update.php', payload)
    if (res?.ok) {
      setUpdateMsg('Updated.')
      setNote('')
      loadTicket()
    } else {
      const d = await res?.json()
      setUpdateMsg(d?.error ?? 'Update failed.')
    }
    setUpdating(false)
  }

  async function handleComment(e) {
    e.preventDefault()
    setCommenting(true)
    const res = await apiPost('/backend/api/comments/create.php', { ticket_id: ticket.id, body: commentBody })
    if (res?.ok) {
      setCommentBody('')
      loadTicket()
    }
    setCommenting(false)
  }

  if (loading) return <><Navbar /><div className="text-center mt-4"><div className="spinner-border" /></div></>
  if (error)   return <><Navbar /><div className="container"><div className="alert alert-danger">{error}</div></div></>

  return (
    <>
      <Navbar />
      <div className="container">
        <button className="btn btn-sm btn-outline-secondary mb-3" onClick={() => navigate(-1)}>← Back</button>
        <div className="d-flex align-items-center gap-3 mb-2">
          <code className="text-muted">{ticket.ticket_ref}</code>
          <StatusBadge status={ticket.status} />
          <span className={`small ${ticket.priority === 'high' ? 'text-danger' : ticket.priority === 'low' ? 'text-success' : 'text-warning'}`}>
            {ticket.priority}
          </span>
        </div>
        <h4 className="mb-1">{ticket.title}</h4>
        <p className="text-muted small">
          Category: <strong>{ticket.category_name}</strong> ·
          Submitted by <strong>{ticket.submitter_name}</strong> ·
          {new Date(ticket.created_at).toLocaleString()}
        </p>
        <p>{ticket.description}</p>

        {attachment && (
          <p>
            <a href={`/backend/files/serve.php?name=${attachment.stored_name}`} target="_blank" rel="noreferrer"
               className="btn btn-sm btn-outline-primary">
              View Attachment ({attachment.original_name})
            </a>
          </p>
        )}

        <hr />

        {/* Admin update form */}
        <form onSubmit={handleUpdate} className="row g-3 mb-4">
          <h6 className="col-12 mb-0">Update Ticket</h6>
          <div className="col-sm-3">
            <label className="form-label small">Status</label>
            <select className="form-select form-select-sm" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </select>
          </div>
          <div className="col-sm-4">
            <label className="form-label small">Assign to</label>
            <select className="form-select form-select-sm" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
              <option value="">— Unassigned —</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="col-sm-5">
            <label className="form-label small">Note (optional)</label>
            <input className="form-control form-control-sm" value={note}
              onChange={e => setNote(e.target.value)} placeholder="Reason for change…" />
          </div>
          <div className="col-12">
            <button className="btn btn-sm btn-primary" disabled={updating}>
              {updating ? 'Saving…' : 'Save Changes'}
            </button>
            {updateMsg && <span className="ms-3 small text-muted">{updateMsg}</span>}
          </div>
        </form>

        {/* History */}
        <h6>Status History</h6>
        {history.length === 0 ? <p className="text-muted small">No history yet.</p> : (
          <ul className="list-group list-group-flush mb-4">
            {history.map(h => (
              <li key={h.id} className="list-group-item px-0 py-2">
                <span className="small text-muted">{new Date(h.created_at).toLocaleString()} · </span>
                <strong>{h.changed_by_name}</strong>:
                {h.old_status && <> <StatusBadge status={h.old_status} /> → </>}
                <StatusBadge status={h.new_status} />
                {h.note && <span className="text-muted ms-2">"{h.note}"</span>}
              </li>
            ))}
          </ul>
        )}

        {/* Comments */}
        <h6>Comments ({comments.length})</h6>
        {comments.map(c => (
          <div key={c.id} className="card card-body mb-2 py-2">
            <p className="mb-1 small">
              <strong>{c.author_name}</strong>
              <span className="text-muted ms-2">{new Date(c.created_at).toLocaleString()}</span>
            </p>
            <p className="mb-0">{c.body}</p>
          </div>
        ))}

        <form onSubmit={handleComment} className="mt-3">
          <textarea className="form-control mb-2" rows={2} placeholder="Add a comment…"
            value={commentBody} onChange={e => setCommentBody(e.target.value)} required />
          <button className="btn btn-sm btn-outline-secondary" disabled={commenting}>
            {commenting ? 'Posting…' : 'Post Comment'}
          </button>
        </form>
      </div>
    </>
  )
}
