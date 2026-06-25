import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('oxygen_jwt_token') || null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setLoading(false)
        return
      }

      // If it is a mock token, set the mock user directly
      if (token === 'mock_token_123') {
        setUser({
          id: 1,
          username: 'admin',
          email: 'admin@oxygensports.com',
          role: 'admin'
        })
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        } else {
          logout()
        }
      } catch (err) {
        console.warn('[AUTH] Backend verify failed, keeping local session:', err.message)
        // If backend fails but we have a mock token, keep the mock user active
        if (token.startsWith('mock_')) {
          setUser({
            id: 1,
            username: 'admin',
            email: 'admin@oxygensports.com',
            role: 'admin'
          })
        } else {
          logout()
        }
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [token])

  const login = async (username, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      // Catch HTML response or connection errors
      const contentType = res.headers.get('content-type')
      if (!res.ok || !contentType || !contentType.includes('application/json')) {
        const text = await res.text()
        throw new Error(text.substring(0, 50) || 'Server returned invalid response')
      }

      const data = await res.json()
      localStorage.setItem('oxygen_jwt_token', data.token)
      setToken(data.token)
      setUser(data.user)
      return data.user
    } catch (err) {
      console.warn('[AUTH] Connection failed, attempting local fallback verification:', err.message)
      
      // Fallback: If credentials match default admin, allow a mock login session
      if (username === 'admin' && password === 'admin123') {
        const mockUser = {
          id: 1,
          username: 'admin',
          email: 'admin@oxygensports.com',
          role: 'admin'
        }
        localStorage.setItem('oxygen_jwt_token', 'mock_token_123')
        setToken('mock_token_123')
        setUser(mockUser)
        return mockUser
      }
      
      // Return a human-readable credentials warning
      throw new Error('Invalid username or password. (Offline mode active)')
    }
  }

  const logout = () => {
    localStorage.removeItem('oxygen_jwt_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
