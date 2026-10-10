import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="container py-5">
      {/* Hero Section */}
      <div className="text-center py-5">
        <h1 className="display-4 fw-bold text-primary">CampusFix</h1>
        <p className="lead text-muted mb-4">
          Report campus issues and track their resolution
        </p>
        <div className="d-flex justify-content-center gap-3">
          <Link to="/login" className="btn btn-primary btn-lg px-5">
            Login
          </Link>
          <Link to="/register" className="btn btn-outline-primary btn-lg px-5">
            Register
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="row mt-5 g-4">
        <div className="col-md-4 text-center">
          <div className="p-4 border rounded shadow-sm h-100">
            <h5 className="fw-bold">Track Issues</h5>
            <p className="text-muted">Submit tickets and monitor their progress in real time.</p>
          </div>
        </div>
        <div className="col-md-4 text-center">
          <div className="p-4 border rounded shadow-sm h-100">
            <h5 className="fw-bold">Get Updates</h5>
            <p className="text-muted">Receive status changes and staff comments on your reports.</p>
          </div>
        </div>
        <div className="col-md-4 text-center">
          <div className="p-4 border rounded shadow-sm h-100">
            <h5 className="fw-bold">Admin Oversight</h5>
            <p className="text-muted">Administrators manage staff, categories, and analytics.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
