// Chat room type
export interface ChatRoom {
  id: string                    // UUID
  name: string                  // 3-50 chars
  description: string | null    // Optional, max 200 chars
  created_by: string            // UUID of creator
  created_at: string            // ISO timestamp

  // Metadata (from database function)
  member_count?: number         // Number of members
  last_message_at?: string | null // ISO timestamp
}

// Room member type
export interface RoomMember {
  room_id: string
  user_id: string
  joined_at: string
}
