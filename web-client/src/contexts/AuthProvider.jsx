import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  clearAuthSession,
  fetchCurrentUser,
  getStoredToken,
  getStoredUser,
  loginUser,
  registerUser,
  storeAuthSession
} from '../utils/authApi.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken())
  const [user, setUser] = useState(() => getStoredUser())
  const [loading, setLoading] = useState(Boolean(getStoredToken()))

  useEffect(() => {
    let active = true

    if (!token) {
      setLoading(false)
      return () => {
        active = false
      }
    }

    fetchCurrentUser(token)
      .then((data) => {
        if (!active) return
        setUser(data.user || null)
        if (data.user) {
          storeAuthSession({ token, user: data.user })
        }
      })
      .catch(() => {
        if (!active) return
        clearAuthSession()
        setToken('')
        setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token])

  async function signIn(credentials) {
    const data = await loginUser(credentials)
    storeAuthSession({ token: data.token, user: data.user })
    setToken(data.token)
    setUser(data.user)
    return data
  }

  async function signUp(payload) {
    const data = await registerUser(payload)
    storeAuthSession({ token: data.token, user: data.user })
    setToken(data.token)
    setUser(data.user)
    return data
  }

  function signOut() {
    clearAuthSession()
    setToken('')
    setUser(null)
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      signIn,
      signUp,
      signOut
    }),
    [token, user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return value
}
