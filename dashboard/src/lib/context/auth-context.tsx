'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { UserRole } from '@shared/types/entities'

interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  companyId: string
}

interface AuthCompany {
  id: string
  rut: string
  razonSocial: string
  config?: Record<string, unknown>
  integraciones?: Record<string, unknown>
}

interface AuthState {
  user: AuthUser | null
  company: AuthCompany | null
  token: string | null
  loading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshAuth: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  name: string
  rutEmpresa: string
  razonSocial: string
  recibeEfectivo: boolean
  sistemaRegistroInicial: string
  sistemaRebaja: string
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    company: null,
    token: null,
    loading: true,
    error: null,
  })

  const refreshAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setState(prev => ({ ...prev, loading: false }))
        return
      }

      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setState({
          user: data.user,
          company: data.company,
          token,
          loading: false,
          error: null,
        })
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        setState({
          user: null,
          company: null,
          token: null,
          loading: false,
          error: null,
        })
      }
    } catch {
      setState({
        user: null,
        company: null,
        token: null,
        loading: false,
        error: 'Error de conexión',
      })
    }
  }, [])

  useEffect(() => {
    refreshAuth()
  }, [refreshAuth])

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      setState(prev => ({ ...prev, loading: false, error: data.error || 'Error al iniciar sesión' }))
      throw new Error(data.error || 'Error al iniciar sesión')
    }

    localStorage.setItem('token', data.token)
    localStorage.setItem('refreshToken', data.refreshToken)

    setState({
      user: data.user,
      company: data.company,
      token: data.token,
      loading: false,
      error: null,
    })
  }

  const register = async (registerData: RegisterData) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData),
    })

    const data = await res.json()

    if (!res.ok) {
      setState(prev => ({ ...prev, loading: false, error: data.error || 'Error al registrar' }))
      throw new Error(data.error || 'Error al registrar')
    }

    localStorage.setItem('token', data.token)
    localStorage.setItem('refreshToken', data.refreshToken)

    setState({
      user: data.user,
      company: data.company,
      token: data.token,
      loading: false,
      error: null,
    })
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    setState({
      user: null,
      company: null,
      token: null,
      loading: false,
      error: null,
    })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
