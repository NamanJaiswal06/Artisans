import { createContext, useContext, useState, useEffect } from 'react'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null)
  const [token, setToken] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('narip_token')
    const u = localStorage.getItem('narip_user')
    if (t && u) { setToken(t); setUser(JSON.parse(u)) }
    setReady(true)
  }, [])

  const loginUser = (userData, tok) => {
    setUser(userData); setToken(tok)
    localStorage.setItem('narip_token', tok)
    localStorage.setItem('narip_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null); setToken(null)
    localStorage.removeItem('narip_token')
    localStorage.removeItem('narip_user')
  }

  return (
    <AuthCtx.Provider value={{ user, token, ready, loginUser, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
