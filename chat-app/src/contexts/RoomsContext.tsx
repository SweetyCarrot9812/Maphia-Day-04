'use client'

import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from 'react'
import { roomsReducer, initialRoomsState, RoomsState } from '@/reducers/roomsReducer'
import * as roomActions from '@/actions/roomActions'
import { ChatRoom } from '@/types/room'

interface RoomsContextType extends RoomsState {
  fetchRooms: () => Promise<void>
  createRoom: (name: string, description?: string) => Promise<ChatRoom | null>
  joinRoom: (roomId: string) => Promise<void>
  leaveRoom: (roomId: string) => Promise<void>
  setActiveRoom: (roomId: string | null) => void
  clearError: () => void
}

const RoomsContext = createContext<RoomsContextType | undefined>(undefined)

export function RoomsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(roomsReducer, initialRoomsState)

  const fetchRooms = useCallback(async () => {
    await roomActions.fetchRooms(dispatch)
  }, [])

  const createRoom = useCallback(async (name: string, description?: string) => {
    return await roomActions.createRoom(name, description, dispatch)
  }, [])

  const joinRoom = useCallback(async (roomId: string) => {
    await roomActions.joinRoom(roomId, dispatch)
  }, [])

  const leaveRoom = useCallback(async (roomId: string) => {
    await roomActions.leaveRoom(roomId, dispatch)
  }, [])

  const setActiveRoom = useCallback((roomId: string | null) => {
    roomActions.setActiveRoom(roomId, dispatch)
  }, [])

  const clearError = useCallback(() => {
    roomActions.clearError(dispatch)
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      fetchRooms,
      createRoom,
      joinRoom,
      leaveRoom,
      setActiveRoom,
      clearError
    }),
    [state, fetchRooms, createRoom, joinRoom, leaveRoom, setActiveRoom, clearError]
  )

  return <RoomsContext.Provider value={value}>{children}</RoomsContext.Provider>
}

export function useRooms() {
  const context = useContext(RoomsContext)
  if (!context) {
    throw new Error('useRooms must be used within RoomsProvider')
  }
  return context
}
