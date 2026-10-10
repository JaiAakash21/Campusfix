import { createContext, useContext, useEffect, useState } from 'react'
import { initCsrf, setCsrfToken, apiGet } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // {id, name, email, role} or null
  const [loading, setLoading] = useState(true) // true while checking session

  useEffect(() => {
    async function bootstrap() {
      try {
        await initCsrf()
        const res = await apiGet('/backend/api/auth/me.php')
        if (res && res.ok) {
          const data = await res.json()
          setCsrfToken(data.csrf_token)
          setUser({ id: data.id, name: data.name, email: data.email, role: data.role })
        }
      } catch {
        // Not logged in — that's fine
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
  }, [])

  function login(userData, csrfToken) {
    setCsrfToken(csrfToken)
    setUser({ id: userData.id, name: userData.name, email: userData.email, role: userData.role })
  }

  function logout() {
    setUser(null)
    setCsrfToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
