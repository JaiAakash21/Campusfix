import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiPost } from '../utils/api'

// Links shown in the navbar per role
function NavLinks({ role }) {
  if (role === 'student') {
    return <Link className="nav-link" to="/student/dashboard">My Tickets</Link>
  }
  if (role === 'staff') {
    return <Link className="nav-link" to="/staff/dashboard">My Queue</Link>
  }
  if (role === 'admin') {
    return (
      <>
        <Link className="nav-link" to="/admin/dashboard">Dashboard</Link>
        <Link className="nav-link" to="/admin/tickets">Tickets</Link>
        <Link className="nav-link" to="/admin/users">Users</Link>
        <Link className="nav-link" to="/admin/categories">Categories</Link>
      </>
    )
  }
  return null
}

export default function Navbar() {
  const auth = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await apiPost('/backend/api/auth/logout.php', {})
    } catch {
      // Ignore errors — log out client-side anyway
    }
    auth.logout()
    navigate('/login')
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">CampusFix</Link>

        <div className="navbar-nav me-auto">
          {auth.user && <NavLinks role={auth.user.role} />}
        </div>

        <div className="d-flex align-items-center gap-3">
          {auth.user && (
            <>
              <span className="text-white">{auth.user.name}</span>
              <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
