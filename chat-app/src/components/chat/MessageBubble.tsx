'use client'

import { Message } from '@/types/message'
import { formatRelativeTime } from '@/utils/date/formatDate'
import { MessageActions } from './MessageActions'
import { DeletedMessage } from './DeletedMessage'

interface MessageBubbleProps {
  message: Message
  isOwnMessage: boolean
  roomId: string
}

export function MessageBubble({ message, isOwnMessage, roomId }: MessageBubbleProps) {
  if (message.deleted_at) {
    return <DeletedMessage />
  }

  const bubbleClass = isOwnMessage
    ? 'bg-primary text-white ml-auto'
    : 'bg-gray-100 text-gray-900'

  const emojiClass = message.type === 'emoji' ? 'text-4xl text-center' : ''

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-md rounded-lg px-4 py-2 ${bubbleClass}`}>
        {!isOwnMessage && (
          <p className="text-xs font-medium mb-1">{message.author_name || 'Unknown'}</p>
        )}

        {message.parent_message_id && (
          <div className="mb-2 p-2 bg-black/10 rounded text-xs">
            <p className="font-medium">Replying to {message.parent_author}</p>
            <p className="opacity-75 truncate">{message.parent_content || '[Deleted message]'}</p>
          </div>
        )}

        <p className={emojiClass}>{message.content}</p>

        <div className="flex items-center justify-between gap-2 mt-1">
          <p className="text-xs opacity-75">
            {formatRelativeTime(message.created_at)}
          </p>
          {message.status === 'sending' && (
            <span className="text-xs opacity-75">Sending...</span>
          )}
          {message.status === 'failed' && (
            <span className="text-xs text-red-300">Failed</span>
          )}
        </div>

        <MessageActions message={message} isOwnMessage={isOwnMessage} roomId={roomId} />
      </div>
    </div>
  )
}
