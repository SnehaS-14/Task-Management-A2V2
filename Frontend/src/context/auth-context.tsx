import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import {
  getMe,
  login as loginRequest,
  register as registerRequest,
} from '@/lib/api'
import { getToken, setToken } from '@/lib/api'
import type { AuthUser, LoginInput, RegisterInput, User } from '@/lib/types'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setIsLoading(false)
      return
    }
    getMe()
      .then(setUser)
      .catch(() => {
        setToken(null)
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const result = await loginRequest(input)
    setToken(result.token)
    setUser(result.user)
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const result = await registerRequest(input)
    setToken(result.token)
    setUser(result.user)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((updatedUser: User) => {
    setUser((currentUser) =>
      currentUser ? { ...currentUser, ...updatedUser } : currentUser
    )
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, updateUser }),
    [user, isLoading, login, register, logout, updateUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
