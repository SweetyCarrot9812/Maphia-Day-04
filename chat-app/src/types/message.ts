// Message type
export interface Message {
  id: string
  room_id: string
  user_id: string
  content: string
  type: 'text' | 'emoji'
  parent_message_id: string | null
  created_at: string
  deleted_at: string | null

  // Optimistic UI fields (not in database)
  status?: 'sending' | 'sent' | 'failed'
  tempId?: string

  // Joined data (from query)
  author_name?: string
  parent_content?: string
  parent_author?: string
}

// Like type
export interface MessageLike {
  message_id: string
  user_id: string
  created_at: string
}
