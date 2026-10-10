import { useEffect, useState } from 'react'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js'
import Navbar from '../../components/Navbar'
import { apiGet } from '../../utils/api'

// Register Chart.js components once
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

// A single stat card for the top row
function StatCard({ label, count, colorClass }) {
  return (
    <div className="col-sm-6 col-lg-3">
      <div className={`card text-white ${colorClass} text-center py-3`}>
        <div className="card-body py-2">
          <h2 className="mb-0">{count}</h2>
          <p className="mb-0 small">{label}</p>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await apiGet('/backend/api/analytics/summary.php')
        if (!res || !res.ok) {
          const data = res ? await res.json() : {}
          setError(data.error || 'Failed to load analytics.')
          return
        }
        const data = await res.json()
        setSummary(data)
      } catch {
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [])

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

  // Backend returns flat fields: open_count, in_progress_count, resolved_count, closed_count
  const doughnutData = {
    labels: ['Open', 'In Progress', 'Resolved', 'Closed'],
    datasets: [{
      data: [
        summary.open_count        ?? 0,
        summary.in_progress_count ?? 0,
        summary.resolved_count    ?? 0,
        summary.closed_count      ?? 0,
      ],
      backgroundColor: ['#6c757d', '#0d6efd', '#198754', '#212529'],
    }],
  }

  // Bar chart data — tickets by category
  const catData = summary.tickets_by_category ?? []
  const barData = {
    labels: catData.map(c => c.name),
    datasets: [{
      label: 'Tickets',
      data: catData.map(c => c.count),
      backgroundColor: '#0d6efd',
    }],
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h4 className="mb-4">Analytics Dashboard</h4>

        {/* Stat cards */}
        <div className="row g-3 mb-4">
          <StatCard label="Open"        count={summary.open_count        ?? 0} colorClass="bg-secondary" />
          <StatCard label="In Progress" count={summary.in_progress_count ?? 0} colorClass="bg-primary" />
          <StatCard label="Resolved"    count={summary.resolved_count    ?? 0} colorClass="bg-success" />
          <StatCard label="Closed"      count={summary.closed_count      ?? 0} colorClass="bg-dark" />
        </div>

        {/* Average resolution time */}
        {summary.avg_resolution_hours != null && (
          <p className="mb-4">
            <strong>Average resolution time:</strong> {summary.avg_resolution_hours} hours
          </p>
        )}

        {/* Charts */}
        <div className="row g-4 mb-4">
          <div className="col-md-5">
            <div className="card p-3">
              <h6 className="fw-bold mb-3 text-center">Tickets by Status</h6>
              <Doughnut data={doughnutData} />
            </div>
          </div>
          <div className="col-md-7">
            <div className="card p-3">
              <h6 className="fw-bold mb-3 text-center">Tickets by Category</h6>
              {catData.length > 0
                ? <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                : <p className="text-muted text-center">No category data.</p>
              }
            </div>
          </div>
        </div>

        {/* Export CSV */}
        <button
          className="btn btn-outline-success btn-sm"
          onClick={() => window.open('/backend/api/analytics/export.php', '_blank')}
        >
          Export CSV
        </button>
      </div>
    </>
  )
}
