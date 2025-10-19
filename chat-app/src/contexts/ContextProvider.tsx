'use client'

import { ReactNode } from 'react'
import { AuthProvider } from './AuthContext'
import { RoomsProvider } from './RoomsContext'
import { MessagesProvider } from './MessagesContext'

/**
 * Combined context provider
 * Wraps entire application with all contexts
 */
export function ContextProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RoomsProvider>
        <MessagesProvider>
          {children}
        </MessagesProvider>
      </RoomsProvider>
    </AuthProvider>
  )
}
