import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiPost } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

// Maps role to the correct dashboard route
function dashboardFor(role) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'staff') return '/staff/dashboard'
  return '/student/dashboard'
}

export default function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await apiPost('/backend/api/auth/login.php', { email, password })
      if (!res) {
        setError('No response from server. Please reload and try again.')
        return
      }

      let data
      try {
        data = await res.json()
      } catch {
        setError(res.ok ? 'Unexpected response format.' : `Server returned status ${res.status}. Please reload and try again.`)
        return
      }

      if (!res.ok) {
        setError(data?.error || `Login failed (${res.status}).`)
        return
      }

      auth.login(data, data.csrf_token)
      navigate(dashboardFor(data.role))
    } catch (err) {
      setError(err?.message || 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="card-body p-4">
          <h4 className="card-title text-center mb-4 fw-bold text-primary">CampusFix Login</h4>

          {error && <div className="alert alert-danger py-2">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
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

            <button className="btn btn-primary w-100" type="submit" disabled={loading}>
              {loading
                ? <span className="spinner-border spinner-border-sm me-2" />
                : null}
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-center mt-3 mb-0">
            No account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
