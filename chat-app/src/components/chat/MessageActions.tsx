'use client'

import { Message } from '@/types/message'
import { useMessages } from '@/contexts/MessagesContext'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

interface MessageActionsProps {
  message: Message
  isOwnMessage: boolean
  roomId: string
}

export function MessageActions({ message, isOwnMessage, roomId }: MessageActionsProps) {
  const { likeMessage, unlikeMessage, setReplyTarget, deleteMessage, likesCache } = useMessages()
  const { user } = useAuth()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const likes = likesCache[message.id] || []
  const hasLiked = likes.some(like => like.user_id === user?.id)
  const likeCount = likes.length

  const handleLike = () => {
    if (hasLiked) {
      unlikeMessage(message.id)
    } else {
      likeMessage(message.id)
    }
  }

  const handleReply = () => {
    setReplyTarget(message)
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    deleteMessage(message.id, roomId)
    setShowDeleteConfirm(false)
  }

  return (
    <div className="flex items-center gap-3 mt-2">
      <button
        onClick={handleLike}
        className="flex items-center gap-1 text-xs opacity-75 hover:opacity-100"
      >
        <span>{hasLiked ? '♥' : '♡'}</span>
        {likeCount > 0 && <span>{likeCount}</span>}
      </button>

      <button
        onClick={handleReply}
        className="text-xs opacity-75 hover:opacity-100"
      >
        Reply
      </button>

      {isOwnMessage && (
        <>
          <button
            onClick={handleDelete}
            className="text-xs opacity-75 hover:opacity-100"
          >
            Delete
          </button>

          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white p-6 rounded-lg shadow-xl">
                <h3 className="font-bold mb-2">Delete this message?</h3>
                <p className="text-sm text-gray-600 mb-4">This action cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-error text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
