import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import { apiGet, apiPatch, apiPost } from '../../utils/api'

// Modal backdrop — clicking it closes the modal
function ModalBackdrop({ onClose }) {
  return (
    <div
      className="modal-backdrop fade show"
      style={{ zIndex: 1040 }}
      onClick={onClose}
    />
  )
}

// Create User modal form
function CreateUserModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('staff')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await apiPost('/backend/api/users/create.php', { name, email, password, role })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create user.')
        return
      }
      onCreated()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <ModalBackdrop onClose={onClose} />
      <div className="modal d-block" style={{ zIndex: 1050 }} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Create User</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2">{error}</div>}
              <form id="create-user-form" onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-primary"
                type="submit"
                form="create-user-form"
                disabled={loading}
              >
                {loading
                  ? <span className="spinner-border spinner-border-sm me-2" />
                  : null}
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [showModal, setShowModal] = useState(false)

  async function fetchUsers() {
    setLoading(true)
    setError('')
    try {
      const res = await apiGet('/backend/api/users/list.php')
      if (!res || !res.ok) {
        const data = res ? await res.json() : {}
        setError(data.error || 'Failed to load users.')
        return
      }
      const data = await res.json()
      setUsers(data.users ?? data)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Toggle a user between active and suspended
  async function toggleStatus(user) {
    setActionError('')
    const newStatus = user.status === 'active' ? 'suspended' : 'active'
    try {
      const res = await apiPatch('/backend/api/users/update.php', { id: user.id, status: newStatus })
      const data = await res.json()
      if (!res.ok) {
        setActionError(data.error || 'Failed to update user.')
        return
      }
      await fetchUsers()
    } catch {
      setActionError('Network error. Please try again.')
    }
  }

  function handleCreated() {
    setShowModal(false)
    fetchUsers()
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">Users</h4>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            + Create User
          </button>
        </div>

        {actionError && <div className="alert alert-danger">{actionError}</div>}

        {loading && (
          <div className="text-center mt-4"><div className="spinner-border" /></div>
        )}

        {!loading && error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && users.length === 0 && (
          <p className="text-muted">No users found.</p>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className="badge bg-secondary">{u.role}</span></td>
                    <td>
                      {u.status === 'active'
                        ? <span className="badge bg-success">Active</span>
                        : <span className="badge bg-danger">Suspended</span>
                      }
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className={`btn btn-sm ${u.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        onClick={() => toggleStatus(u)}
                      >
                        {u.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <CreateUserModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  )
}
