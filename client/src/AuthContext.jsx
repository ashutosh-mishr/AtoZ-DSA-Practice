import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function refreshUser() {
    try {
      const data = await api.getCurrentUser()
      setUser(data.user || null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refreshUser() }, [])

  async function login(email, password) {
    const data = await api.login(email, password)
    setUser(data.user)
    return data.user
  }

  async function register(name, email, password) {
    const data = await api.register(name, email, password)
    setUser(data.user)
    return data.user
  }

  function updateUser(updatedUser) {
    setUser(updatedUser)
    return updatedUser
  }

  async function logout() {
    await api.logout()
    setUser(null)
  }

  const value = useMemo(() => ({ user, loading, login, register, logout, refreshUser, updateUser }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
