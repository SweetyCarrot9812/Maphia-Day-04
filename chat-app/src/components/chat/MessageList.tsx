'use client'

import { useMessages } from '@/contexts/MessagesContext'
import { useAuth } from '@/contexts/AuthContext'
import { MessageBubble } from './MessageBubble'
import { DateSeparator } from './DateSeparator'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { useEffect, useRef } from 'react'

interface MessageListProps {
  roomId: string
}

export function MessageList({ roomId }: MessageListProps) {
  const { messagesByRoom, fetchMessages, loading, error } = useMessages()
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messages = messagesByRoom[roomId] || []

  useEffect(() => {
    fetchMessages(roomId)

    const interval = setInterval(() => {
      const lastMessage = messages[messages.length - 1]
      const since = lastMessage?.created_at || new Date(0).toISOString()
      fetchMessages(roomId, since)
    }, 3000)

    return () => clearInterval(interval)
  }, [roomId, fetchMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    )
  }

  if (error && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <ErrorMessage message={error} onRetry={() => fetchMessages(roomId)} />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No messages yet. Start the conversation!
      </div>
    )
  }

  const messagesByDate = messages.reduce((acc, message) => {
    const date = new Date(message.created_at).toDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(message)
    return acc
  }, {} as Record<string, typeof messages>)

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {Object.entries(messagesByDate).map(([date, msgs]) => (
        <div key={date}>
          <DateSeparator date={new Date(date)} />
          <div className="space-y-2">
            {msgs.map(message => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.user_id === user?.id}
                roomId={roomId}
              />
            ))}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
