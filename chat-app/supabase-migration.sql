-- ============================================================================
-- CHAT APPLICATION DATABASE SCHEMA
-- Complete setup script for Supabase PostgreSQL
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE DEFINITIONS
-- ============================================================================

-- 1. User Profiles (extends auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT display_name_length CHECK (LENGTH(display_name) >= 2)
);

-- 2. Chat Rooms
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  description VARCHAR(200),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT room_name_length CHECK (LENGTH(name) >= 3)
);

-- 3. Room Members (many-to-many)
CREATE TABLE room_members (
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  PRIMARY KEY (room_id, user_id)
);

-- 4. Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  type VARCHAR(10) DEFAULT 'text' NOT NULL,
  parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT message_type_check CHECK (type IN ('text', 'emoji')),
  CONSTRAINT content_length CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 2000)
);

-- 5. Message Likes
CREATE TABLE message_likes (
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  PRIMARY KEY (message_id, user_id)
);

-- ============================================================================
-- INDEXES (Performance optimization)
-- ============================================================================

-- user_profiles indexes
CREATE INDEX idx_user_profiles_display_name ON user_profiles(display_name);

-- chat_rooms indexes
CREATE INDEX idx_chat_rooms_created_by ON chat_rooms(created_by);
CREATE INDEX idx_chat_rooms_created_at ON chat_rooms(created_at DESC);

-- room_members indexes
CREATE INDEX idx_room_members_user_id ON room_members(user_id);
CREATE INDEX idx_room_members_joined_at ON room_members(joined_at DESC);

-- messages indexes (critical for performance)
CREATE INDEX idx_messages_room_created ON messages(room_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_room_all ON messages(room_id, created_at DESC);
CREATE INDEX idx_messages_parent ON messages(parent_message_id) WHERE parent_message_id IS NOT NULL;
CREATE INDEX idx_messages_user ON messages(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_messages_deleted ON messages(deleted_at) WHERE deleted_at IS NOT NULL;

-- message_likes indexes
CREATE INDEX idx_message_likes_message_id ON message_likes(message_id);
CREATE INDEX idx_message_likes_user_id ON message_likes(user_id);

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Auto-join room creator to room
CREATE OR REPLACE FUNCTION handle_new_room()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.room_members (room_id, user_id)
  VALUES (NEW.id, NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_chat_room_created
  AFTER INSERT ON chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_room();

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_likes ENABLE ROW LEVEL SECURITY;

-- user_profiles policies
CREATE POLICY "user_profiles_select_policy" ON user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_profiles_insert_policy" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "user_profiles_update_policy" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- chat_rooms policies
CREATE POLICY "chat_rooms_select_policy" ON chat_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "chat_rooms_insert_policy" ON chat_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "chat_rooms_update_policy" ON chat_rooms FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "chat_rooms_delete_policy" ON chat_rooms FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- room_members policies
CREATE POLICY "room_members_select_policy" ON room_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "room_members_insert_policy" ON room_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "room_members_delete_policy" ON room_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- messages policies
CREATE POLICY "messages_select_policy" ON messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM room_members WHERE room_members.room_id = messages.room_id AND room_members.user_id = auth.uid())
);
CREATE POLICY "messages_insert_policy" ON messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM room_members WHERE room_members.room_id = messages.room_id AND room_members.user_id = auth.uid())
);
CREATE POLICY "messages_update_policy" ON messages FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (
  auth.uid() = user_id AND deleted_at IS NOT NULL
);

-- message_likes policies
CREATE POLICY "message_likes_select_policy" ON message_likes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM messages JOIN room_members ON messages.room_id = room_members.room_id WHERE messages.id = message_likes.message_id AND room_members.user_id = auth.uid())
);
CREATE POLICY "message_likes_insert_policy" ON message_likes FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM messages JOIN room_members ON messages.room_id = room_members.room_id WHERE messages.id = message_likes.message_id AND room_members.user_id = auth.uid())
);
CREATE POLICY "message_likes_delete_policy" ON message_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get rooms with metadata (member count, last activity)
CREATE OR REPLACE FUNCTION get_rooms_with_metadata()
RETURNS TABLE (
  id UUID,
  name VARCHAR(50),
  description VARCHAR(200),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  member_count BIGINT,
  last_message_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cr.id,
    cr.name,
    cr.description,
    cr.created_by,
    cr.created_at,
    COUNT(DISTINCT rm.user_id) AS member_count,
    MAX(m.created_at) AS last_message_at
  FROM chat_rooms cr
  LEFT JOIN room_members rm ON cr.id = rm.room_id
  LEFT JOIN messages m ON cr.id = m.room_id AND m.deleted_at IS NULL
  GROUP BY cr.id, cr.name, cr.description, cr.created_by, cr.created_at
  ORDER BY last_message_at DESC NULLS LAST, cr.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- END OF SCHEMA SETUP
-- ============================================================================
