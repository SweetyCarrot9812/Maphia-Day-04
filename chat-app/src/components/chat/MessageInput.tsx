'use client'

import { useState, FormEvent, KeyboardEvent } from 'react'
import { useMessages } from '@/contexts/MessagesContext'
import { Button } from '@/components/common/Button'
import { ReplyPreview } from './ReplyPreview'
import { MAX_MESSAGE_LENGTH } from '@/utils/constants'

interface MessageInputProps {
  roomId: string
}

export function MessageInput({ roomId }: MessageInputProps) {
  const { sendMessage, replyTarget, clearReplyTarget } = useMessages()
  const [content, setContent] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const trimmed = content.trim()
    if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) return

    await sendMessage(roomId, trimmed, 'text')
    setContent('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <div className="border-t border-gray-200 p-4">
      {replyTarget && <ReplyPreview />}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          rows={2}
          maxLength={MAX_MESSAGE_LENGTH}
        />

        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={!content.trim()}>
            Send
          </Button>
          <p className="text-xs text-gray-500 text-center">
            {content.length}/{MAX_MESSAGE_LENGTH}
          </p>
        </div>
      </form>
    </div>
  )
}
