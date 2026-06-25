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

      // Check for mock tokens
      if (token === 'mock_token_123' || token === 'mock_token_admin') {
        setUser({
          id: 1,
          username: 'admin',
          name: 'Alex Rivers',
          email: 'admin@oxygensports.com',
          role: 'admin',
          title: 'Lead Administrator',
          phone: '+91 99999 99999',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80'
        })
        setLoading(false)
        return
      }

      if (token === 'mock_token_sarah') {
        setUser({
          id: 2,
          username: 'sarah.jenkins',
          name: 'Sarah Jenkins',
          email: 'sarah.jenkins@oxygensports.com',
          role: 'employee',
          title: 'Relationship Manager',
          phone: '+91 88888 88888',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80'
        })
        setLoading(false)
        return
      }

      if (token === 'mock_token_marcus') {
        setUser({
          id: 3,
          username: 'marcus.thorne',
          name: 'Marcus Thorne',
          email: 'marcus.thorne@oxygensports.com',
          role: 'employee',
          title: 'Relationship Manager',
          phone: '+91 77777 77777',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80'
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
        // If it starts with mock_, try to recover the session
        if (token.startsWith('mock_')) {
          setLoading(false)
        } else {
          logout()
        }
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [token])

  const login = async (emailOrUsername, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: emailOrUsername, username: emailOrUsername, password })
      })

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
      
      const email = emailOrUsername ? emailOrUsername.trim().toLowerCase() : '';
      
      // Fallback verification for demo accounts
      if ((email === 'admin@oxygensports.com' || email === 'admin') && password === 'admin123') {
        const mockUser = {
          id: 1,
          username: 'admin',
          name: 'Alex Rivers',
          email: 'admin@oxygensports.com',
          role: 'admin',
          title: 'Lead Administrator',
          phone: '+91 99999 99999',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80'
        }
        localStorage.setItem('oxygen_jwt_token', 'mock_token_admin')
        setToken('mock_token_admin')
        setUser(mockUser)
        return mockUser
      }

      if (email === 'sarah.jenkins@oxygensports.com' && password === 'password') {
        const mockUser = {
          id: 2,
          username: 'sarah.jenkins',
          name: 'Sarah Jenkins',
          email: 'sarah.jenkins@oxygensports.com',
          role: 'employee',
          title: 'Relationship Manager',
          phone: '+91 88888 88888',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80'
        }
        localStorage.setItem('oxygen_jwt_token', 'mock_token_sarah')
        setToken('mock_token_sarah')
        setUser(mockUser)
        return mockUser
      }

      if (email === 'marcus.thorne@oxygensports.com' && password === 'password') {
        const mockUser = {
          id: 3,
          username: 'marcus.thorne',
          name: 'Marcus Thorne',
          email: 'marcus.thorne@oxygensports.com',
          role: 'employee',
          title: 'Relationship Manager',
          phone: '+91 77777 77777',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80'
        }
        localStorage.setItem('oxygen_jwt_token', 'mock_token_marcus')
        setToken('mock_token_marcus')
        setUser(mockUser)
        return mockUser
      }
      
      throw new Error('Invalid email/username or password. (Offline mode active)')
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
