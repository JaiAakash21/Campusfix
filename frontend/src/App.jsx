import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import StudentDashboard from './pages/student/DashboardPage'
import SubmitTicketPage from './pages/student/SubmitTicketPage'
import StudentTicketDetail from './pages/student/TicketDetailPage'
import StaffDashboard from './pages/staff/DashboardPage'
import StaffTicketDetail from './pages/staff/TicketDetailPage'
import AdminDashboard from './pages/admin/DashboardPage'
import AdminTicketsPage from './pages/admin/TicketsPage'
import AdminTicketDetail from './pages/admin/TicketDetailPage'
import AdminUsersPage from './pages/admin/UsersPage'
import AdminCategoriesPage from './pages/admin/CategoriesPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/student/dashboard" element={
            <ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>
          } />
          <Route path="/student/tickets/new" element={
            <ProtectedRoute roles={['student']}><SubmitTicketPage /></ProtectedRoute>
          } />
          <Route path="/student/tickets/:ref" element={
            <ProtectedRoute roles={['student']}><StudentTicketDetail /></ProtectedRoute>
          } />

          <Route path="/staff/dashboard" element={
            <ProtectedRoute roles={['staff']}><StaffDashboard /></ProtectedRoute>
          } />
          <Route path="/staff/tickets/:ref" element={
            <ProtectedRoute roles={['staff']}><StaffTicketDetail /></ProtectedRoute>
          } />

          <Route path="/admin/dashboard" element={
            <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/tickets" element={
            <ProtectedRoute roles={['admin']}><AdminTicketsPage /></ProtectedRoute>
          } />
          <Route path="/admin/tickets/:ref" element={
            <ProtectedRoute roles={['admin']}><AdminTicketDetail /></ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute roles={['admin']}><AdminUsersPage /></ProtectedRoute>
          } />
          <Route path="/admin/categories" element={
            <ProtectedRoute roles={['admin']}><AdminCategoriesPage /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
