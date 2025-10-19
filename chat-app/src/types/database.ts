// Database table types (raw from Supabase)

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          display_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      chat_rooms: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string
          created_at?: string
        }
      }
      room_members: {
        Row: {
          room_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          room_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          room_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          room_id: string
          user_id: string
          content: string
          type: string
          parent_message_id: string | null
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          content: string
          type?: string
          parent_message_id?: string | null
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          content?: string
          type?: string
          parent_message_id?: string | null
          created_at?: string
          deleted_at?: string | null
        }
      }
      message_likes: {
        Row: {
          message_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          message_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          message_id?: string
          user_id?: string
          created_at?: string
        }
      }
    }
  }
}
