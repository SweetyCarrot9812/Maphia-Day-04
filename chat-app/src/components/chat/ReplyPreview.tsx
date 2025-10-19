'use client'

import { useMessages } from '@/contexts/MessagesContext'
import { truncateString } from '@/utils/string/truncate'

export function ReplyPreview() {
  const { replyTarget, clearReplyTarget } = useMessages()

  if (!replyTarget) return null

  return (
    <div className="mb-2 p-3 bg-gray-100 rounded-lg flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-700">
          Replying to {replyTarget.author_name}
        </p>
        <p className="text-sm text-gray-600">
          {truncateString(replyTarget.content, 50)}
        </p>
      </div>
      <button
        onClick={clearReplyTarget}
        className="text-gray-500 hover:text-gray-700"
      >
        ✕
      </button>
    </div>
  )
}
