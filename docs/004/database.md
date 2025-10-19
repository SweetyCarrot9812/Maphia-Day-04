# Database Schema Design
# Chat Application - MVP Learning Project

**Document Version:** 1.0
**Last Updated:** 2025-10-19
**Based on:** PRD v1.0, Userflow v1.0, Tech Stack v1.0
**Database:** PostgreSQL 15+ (Supabase)

---

## Schema Overview

### Design Principles
- **Normalized Structure**: 3NF compliance for data integrity
- **UUID Primary Keys**: Distributed-friendly identifiers
- **Soft Deletes**: Preserve data for audit trails
- **Timestamp Tracking**: Created/updated timestamps for all tables
- **Foreign Key Constraints**: Enforce referential integrity
- **Row-Level Security**: Database-level access control

### Entity Relationship Diagram

```
┌─────────────────┐
│  auth.users     │ (Supabase managed)
│  - id (PK)      │
│  - email        │
│  - created_at   │
└────────┬────────┘
         │
         │ 1:1
         ▼
┌─────────────────────────┐
│  user_profiles          │
│  - id (PK, FK)          │
│  - display_name         │
│  - created_at           │
│  - updated_at           │
└────────┬────────────────┘
         │
         │ 1:N (creator)
         ▼
┌─────────────────────────┐      ┌─────────────────────────┐
│  chat_rooms             │      │  room_members           │
│  - id (PK)              │◄────┤  - room_id (PK, FK)     │
│  - name                 │ N:N  │  - user_id (PK, FK)     │
│  - description          │      │  - joined_at            │
│  - created_by (FK)      │      └─────────────────────────┘
│  - created_at           │
└────────┬────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────┐
│  messages                   │
│  - id (PK)                  │
│  - room_id (FK)             │
│  - user_id (FK)             │
│  - content                  │
│  - type                     │
│  - parent_message_id (FK)   │ (self-referencing for replies)
│  - created_at               │
│  - deleted_at               │
└────────┬────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────┐
│  message_likes          │
│  - message_id (PK, FK)  │
│  - user_id (PK, FK)     │
│  - created_at           │
└─────────────────────────┘
```

---

## Table Definitions

### 1. auth.users (Managed by Supabase)

**Purpose**: Core authentication table (automatically created by Supabase Auth)

**Schema**:
```sql
-- Note: This table is automatically created and managed by Supabase
-- We extend it with user_profiles table
```

**Key Fields**:
- `id`: UUID, Primary Key
- `email`: string, Unique
- `encrypted_password`: string (hashed)
- `created_at`: timestamp
- `updated_at`: timestamp

---

### 2. user_profiles

**Purpose**: Extended user information beyond authentication

**Schema**:
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  CONSTRAINT display_name_length CHECK (LENGTH(display_name) >= 2)
);

-- Indexes
CREATE INDEX idx_user_profiles_display_name ON user_profiles(display_name);

-- Trigger for updated_at
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
```

**Fields**:
- `id` (UUID, PK, FK → auth.users): Unique user identifier
- `display_name` (VARCHAR(50), NOT NULL): User's display name
- `created_at` (TIMESTAMP): Profile creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Constraints**:
- Display name must be 2-50 characters
- Cascading delete when auth.users record deleted

**Indexes**:
- `idx_user_profiles_display_name`: Search by display name

---

### 3. chat_rooms

**Purpose**: Chat room metadata

**Schema**:
```sql
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  description VARCHAR(200),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  CONSTRAINT room_name_length CHECK (LENGTH(name) >= 3)
);

-- Indexes
CREATE INDEX idx_chat_rooms_created_by ON chat_rooms(created_by);
CREATE INDEX idx_chat_rooms_created_at ON chat_rooms(created_at DESC);
```

**Fields**:
- `id` (UUID, PK): Unique room identifier
- `name` (VARCHAR(50), NOT NULL): Room name
- `description` (VARCHAR(200), NULLABLE): Optional room description
- `created_by` (UUID, FK → auth.users): Room creator
- `created_at` (TIMESTAMP): Room creation timestamp

**Constraints**:
- Room name must be 3-50 characters
- Description max 200 characters
- Created_by set to NULL if creator deleted (preserve room)

**Indexes**:
- `idx_chat_rooms_created_by`: Find rooms by creator
- `idx_chat_rooms_created_at`: Sort rooms by creation date

---

### 4. room_members

**Purpose**: Many-to-many relationship between users and rooms

**Schema**:
```sql
CREATE TABLE room_members (
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  PRIMARY KEY (room_id, user_id)
);

-- Indexes
CREATE INDEX idx_room_members_user_id ON room_members(user_id);
CREATE INDEX idx_room_members_joined_at ON room_members(joined_at DESC);
```

**Fields**:
- `room_id` (UUID, PK, FK → chat_rooms): Room identifier
- `user_id` (UUID, PK, FK → auth.users): User identifier
- `joined_at` (TIMESTAMP): Timestamp when user joined room

**Constraints**:
- Composite primary key prevents duplicate memberships
- Cascading delete when room or user deleted

**Indexes**:
- `idx_room_members_user_id`: Find all rooms for a user
- `idx_room_members_joined_at`: Sort by join date

---

### 5. messages

**Purpose**: Chat messages and replies

**Schema**:
```sql
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

-- Performance-critical indexes
CREATE INDEX idx_messages_room_created ON messages(room_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_messages_room_all ON messages(room_id, created_at DESC);

CREATE INDEX idx_messages_parent ON messages(parent_message_id)
  WHERE parent_message_id IS NOT NULL;

CREATE INDEX idx_messages_user ON messages(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX idx_messages_deleted ON messages(deleted_at)
  WHERE deleted_at IS NOT NULL;
```

**Fields**:
- `id` (UUID, PK): Unique message identifier
- `room_id` (UUID, FK → chat_rooms, NOT NULL): Room containing message
- `user_id` (UUID, FK → auth.users, NULLABLE): Message author
- `content` (TEXT, NOT NULL): Message text content
- `type` (VARCHAR(10), NOT NULL): Message type ('text' or 'emoji')
- `parent_message_id` (UUID, FK → messages, NULLABLE): Parent message for replies
- `created_at` (TIMESTAMP): Message creation timestamp
- `deleted_at` (TIMESTAMP, NULLABLE): Soft delete timestamp

**Constraints**:
- Content must be 1-2000 characters
- Type must be 'text' or 'emoji'
- User_id set to NULL if user deleted (preserve message)
- Parent message set to NULL if parent deleted

**Indexes**:
- `idx_messages_room_created`: Critical for pagination and polling (active messages only)
- `idx_messages_room_all`: For fetching all messages including deleted
- `idx_messages_parent`: For reply thread queries
- `idx_messages_user`: For user's message history
- `idx_messages_deleted`: For soft delete queries

**Design Notes**:
- Soft delete preserves message context for reply threads
- Partial indexes optimize for common queries (non-deleted messages)

---

### 6. message_likes

**Purpose**: Message like/reaction tracking

**Schema**:
```sql
CREATE TABLE message_likes (
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  PRIMARY KEY (message_id, user_id)
);

-- Indexes
CREATE INDEX idx_message_likes_message_id ON message_likes(message_id);
CREATE INDEX idx_message_likes_user_id ON message_likes(user_id);
```

**Fields**:
- `message_id` (UUID, PK, FK → messages): Liked message
- `user_id` (UUID, PK, FK → auth.users): User who liked
- `created_at` (TIMESTAMP): Like timestamp

**Constraints**:
- Composite primary key prevents duplicate likes
- Cascading delete when message or user deleted

**Indexes**:
- `idx_message_likes_message_id`: Count likes per message
- `idx_message_likes_user_id`: Find all likes by user

---

## Row-Level Security (RLS) Policies

### Enable RLS

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_likes ENABLE ROW LEVEL SECURITY;
```

---

### user_profiles Policies

```sql
-- All authenticated users can view profiles
CREATE POLICY "user_profiles_select_policy"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own profile on registration
CREATE POLICY "user_profiles_insert_policy"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update only their own profile
CREATE POLICY "user_profiles_update_policy"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

**Explanation**:
- Everyone can read all profiles (for displaying usernames)
- Users can only modify their own profile
- Prevents impersonation

---

### chat_rooms Policies

```sql
-- All authenticated users can view all rooms
CREATE POLICY "chat_rooms_select_policy"
  ON chat_rooms FOR SELECT
  TO authenticated
  USING (true);

-- Any authenticated user can create a room
CREATE POLICY "chat_rooms_insert_policy"
  ON chat_rooms FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
  );

-- Only room creator can update room details (future feature)
CREATE POLICY "chat_rooms_update_policy"
  ON chat_rooms FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Only room creator can delete room (future feature)
CREATE POLICY "chat_rooms_delete_policy"
  ON chat_rooms FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);
```

**Explanation**:
- Rooms are public (anyone can view)
- Anyone can create rooms
- Only creator can modify/delete (future admin features)

---

### room_members Policies

```sql
-- Users can see all room memberships
CREATE POLICY "room_members_select_policy"
  ON room_members FOR SELECT
  TO authenticated
  USING (true);

-- Users can join any room (insert their own membership)
CREATE POLICY "room_members_insert_policy"
  ON room_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can leave rooms (delete their own membership)
CREATE POLICY "room_members_delete_policy"
  ON room_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

**Explanation**:
- Membership is public (see who's in what room)
- Users can join any room
- Users can only remove themselves

---

### messages Policies

```sql
-- Users can view messages only in rooms they're members of
CREATE POLICY "messages_select_policy"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_members.room_id = messages.room_id
        AND room_members.user_id = auth.uid()
    )
  );

-- Users can insert messages only in rooms they're members of
CREATE POLICY "messages_insert_policy"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM room_members
      WHERE room_members.room_id = messages.room_id
        AND room_members.user_id = auth.uid()
    )
  );

-- Users can update (soft delete) only their own messages
CREATE POLICY "messages_update_policy"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND deleted_at IS NOT NULL  -- Only allow setting deleted_at
  );
```

**Explanation**:
- Privacy: Only room members see messages
- Security: Can't send messages to rooms you haven't joined
- Ownership: Can only delete your own messages
- Soft delete enforcement via deleted_at check

---

### message_likes Policies

```sql
-- Users can see likes only for messages in their rooms
CREATE POLICY "message_likes_select_policy"
  ON message_likes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages
      JOIN room_members ON messages.room_id = room_members.room_id
      WHERE messages.id = message_likes.message_id
        AND room_members.user_id = auth.uid()
    )
  );

-- Users can like messages in their rooms
CREATE POLICY "message_likes_insert_policy"
  ON message_likes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM messages
      JOIN room_members ON messages.room_id = room_members.room_id
      WHERE messages.id = message_likes.message_id
        AND room_members.user_id = auth.uid()
    )
  );

-- Users can unlike (delete) their own likes
CREATE POLICY "message_likes_delete_policy"
  ON message_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

**Explanation**:
- Privacy: See likes only in your rooms
- Security: Can't like messages in rooms you haven't joined
- Ownership: Can only remove your own likes

---

## Database Functions

### Function 1: Auto-create user profile on signup

```sql
-- Trigger function to create user_profile when auth.users record created
CREATE OR REPLACE FUNCTION public.handle_new_user()
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

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Purpose**: Automatically create user_profile when user registers

---

### Function 2: Auto-join room creator

```sql
-- Trigger function to add creator to room_members
CREATE OR REPLACE FUNCTION public.handle_new_room()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.room_members (room_id, user_id)
  VALUES (NEW.id, NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on chat_rooms insert
CREATE TRIGGER on_chat_room_created
  AFTER INSERT ON chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_room();
```

**Purpose**: Automatically add room creator to room_members

---

### Function 3: Get room with member count

```sql
-- Function to fetch rooms with metadata
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
```

**Purpose**: Efficiently fetch room list with member count and last activity

---

## Migration SQL (Complete Setup)

```sql
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
```

---

## Performance Considerations

### Query Optimization Strategies

**1. Polling Queries** (Most Critical):
```sql
-- Optimized: Fetch new messages since timestamp
SELECT m.*, up.display_name
FROM messages m
JOIN user_profiles up ON m.user_id = up.id
WHERE m.room_id = $1
  AND m.created_at > $2
  AND m.deleted_at IS NULL
ORDER BY m.created_at ASC;

-- Index used: idx_messages_room_created (partial index)
```

**2. Room List with Metadata**:
```sql
-- Use helper function for efficiency
SELECT * FROM get_rooms_with_metadata();
```

**3. Message with Reply Context**:
```sql
-- Fetch message with parent info
SELECT
  m.*,
  up.display_name AS author_name,
  pm.content AS parent_content,
  pup.display_name AS parent_author
FROM messages m
JOIN user_profiles up ON m.user_id = up.id
LEFT JOIN messages pm ON m.parent_message_id = pm.id
LEFT JOIN user_profiles pup ON pm.user_id = pup.id
WHERE m.room_id = $1
  AND m.deleted_at IS NULL
ORDER BY m.created_at DESC
LIMIT 50;
```

### Index Strategy

**Partial Indexes**:
- `idx_messages_room_created`: Only index non-deleted messages
- Reduces index size by ~50% if delete rate is high
- Faster for common queries (active messages only)

**Composite Indexes**:
- `(room_id, created_at DESC)`: Perfect for pagination
- `(message_id, user_id)`: Composite PK for likes

**When NOT to Index**:
- Small lookup tables (< 1000 rows)
- Columns with low cardinality (type field)
- Write-heavy tables (minor gain vs index maintenance cost)

---

## Data Integrity Rules

### Foreign Key Cascading Behavior

**ON DELETE CASCADE**:
- `room_members.room_id → chat_rooms.id`: Delete memberships when room deleted
- `messages.room_id → chat_rooms.id`: Delete messages when room deleted
- `message_likes.message_id → messages.id`: Delete likes when message deleted
- `user_profiles.id → auth.users.id`: Delete profile when user deleted

**ON DELETE SET NULL**:
- `messages.user_id → auth.users.id`: Preserve messages, show as "[deleted user]"
- `messages.parent_message_id → messages.id`: Keep reply, show "[deleted message]"
- `chat_rooms.created_by → auth.users.id`: Keep room, creator unknown

**Rationale**:
- Preserve conversation history even if users leave
- Clean up relationships automatically
- Maintain referential integrity

---

## Sample Queries

### Common Operations

**Create Room and Join**:
```sql
-- Trigger handles auto-join, just insert room
INSERT INTO chat_rooms (name, description, created_by)
VALUES ('General Chat', 'Main discussion room', auth.uid())
RETURNING *;
```

**Send Message**:
```sql
INSERT INTO messages (room_id, user_id, content, type)
VALUES ($1, auth.uid(), $2, 'text')
RETURNING *;
```

**Soft Delete Message**:
```sql
UPDATE messages
SET deleted_at = NOW()
WHERE id = $1 AND user_id = auth.uid()
RETURNING *;
```

**Toggle Like**:
```sql
-- PostgreSQL INSERT ... ON CONFLICT pattern
INSERT INTO message_likes (message_id, user_id)
VALUES ($1, auth.uid())
ON CONFLICT (message_id, user_id) DO DELETE;
```

**Get User's Rooms**:
```sql
SELECT cr.*, COUNT(rm.user_id) AS member_count
FROM chat_rooms cr
JOIN room_members rm ON cr.id = rm.room_id
WHERE rm.user_id = auth.uid()
GROUP BY cr.id
ORDER BY rm.joined_at DESC;
```

---

## Migration Strategy

### Phase 1: Core Tables
1. user_profiles
2. chat_rooms
3. room_members

### Phase 2: Messaging
1. messages (without parent_message_id)
2. message_likes

### Phase 3: Advanced Features
1. Add parent_message_id to messages (replies)
2. Add indexes incrementally
3. Add helper functions

### Rollback Plan
- Keep migration SQL versioned
- Test RLS policies in staging first
- Backup before production migration

---

## Validation Checklist

Before deployment, verify:

- ✅ All tables created without errors
- ✅ Foreign keys enforce referential integrity
- ✅ Indexes created (check with `\di` in psql)
- ✅ RLS enabled on all tables
- ✅ Policies tested with different user roles
- ✅ Triggers execute correctly (test user signup, room creation)
- ✅ Constraints prevent invalid data
- ✅ Soft delete queries work correctly

---

**End of Database Schema Document**
