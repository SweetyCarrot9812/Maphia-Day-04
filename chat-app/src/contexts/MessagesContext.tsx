'use client'

import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from 'react'
import { messagesReducer, initialMessagesState, MessagesState } from '@/reducers/messagesReducer'
import * as messageActions from '@/actions/messageActions'
import { Message } from '@/types/message'
import { useAuth } from './AuthContext'

interface MessagesContextType extends MessagesState {
  fetchMessages: (roomId: string, since?: string) => Promise<void>
  sendMessage: (roomId: string, content: string, type?: 'text' | 'emoji') => Promise<void>
  deleteMessage: (messageId: string, roomId: string) => Promise<void>
  likeMessage: (messageId: string) => Promise<void>
  unlikeMessage: (messageId: string) => Promise<void>
  setReplyTarget: (message: Message | null) => void
  clearReplyTarget: () => void
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined)

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(messagesReducer, initialMessagesState)
  const { user } = useAuth()

  const fetchMessages = useCallback(async (roomId: string, since?: string) => {
    await messageActions.fetchMessages(roomId, since, dispatch)
  }, [])

  const sendMessage = useCallback(
    async (roomId: string, content: string, type: 'text' | 'emoji' = 'text') => {
      if (!user) return
      await messageActions.sendMessage(
        roomId,
        content,
        type,
        state.replyTarget?.id || null,
        dispatch,
        user.id
      )
      // Clear reply target after sending
      dispatch({ type: 'CLEAR_REPLY_TARGET' })
    },
    [user, state.replyTarget]
  )

  const deleteMessage = useCallback(async (messageId: string, roomId: string) => {
    await messageActions.deleteMessage(messageId, roomId, dispatch)
  }, [])

  const likeMessage = useCallback(
    async (messageId: string) => {
      if (!user) return
      await messageActions.likeMessage(messageId, user.id, dispatch)
    },
    [user]
  )

  const unlikeMessage = useCallback(
    async (messageId: string) => {
      if (!user) return
      await messageActions.unlikeMessage(messageId, user.id, dispatch)
    },
    [user]
  )

  const setReplyTarget = useCallback((message: Message | null) => {
    messageActions.setReplyTarget(message, dispatch)
  }, [])

  const clearReplyTarget = useCallback(() => {
    messageActions.clearReplyTarget(dispatch)
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      fetchMessages,
      sendMessage,
      deleteMessage,
      likeMessage,
      unlikeMessage,
      setReplyTarget,
      clearReplyTarget
    }),
    [
      state,
      fetchMessages,
      sendMessage,
      deleteMessage,
      likeMessage,
      unlikeMessage,
      setReplyTarget,
      clearReplyTarget
    ]
  )

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>
}

export function useMessages() {
  const context = useContext(MessagesContext)
  if (!context) {
    throw new Error('useMessages must be used within MessagesProvider')
  }
  return context
}
