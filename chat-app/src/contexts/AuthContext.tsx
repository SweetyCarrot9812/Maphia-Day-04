'use client'

import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect, ReactNode } from 'react'
import { authReducer, initialAuthState, AuthState } from '@/reducers/authReducer'
import * as authActions from '@/actions/authActions'
import { supabase } from '@/lib/supabase/client'

// Context type (state + actions)
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  clearError: () => void
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState)

  // Initialize session on mount
  useEffect(() => {
    authActions.refreshSession(dispatch)

    // Listen for auth state changes (login/logout in other tabs)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        authActions.refreshSession(dispatch)
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'LOGOUT_SUCCESS' })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Memoize action functions
  const login = useCallback(async (email: string, password: string) => {
    await authActions.login(email, password, dispatch)
  }, [])

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      await authActions.register(email, password, displayName, dispatch)
    },
    []
  )

  const logout = useCallback(async () => {
    await authActions.logout(dispatch)
  }, [])

  const refreshSession = useCallback(async () => {
    await authActions.refreshSession(dispatch)
  }, [])

  const clearError = useCallback(() => {
    authActions.clearError(dispatch)
  }, [])

  // Memoize context value
  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      refreshSession,
      clearError
    }),
    [state, login, register, logout, refreshSession, clearError]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
