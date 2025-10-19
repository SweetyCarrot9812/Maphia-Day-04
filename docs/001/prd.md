# Product Requirements Document (PRD)
# Chat Application - MVP Learning Project

**Document Version:** 1.0
**Last Updated:** 2025-10-19
**Project Type:** Learning Project (MVP)
**Tech Stack:** Next.js (App Router) + TypeScript + Supabase

---

## 1. Executive Summary

### 1.1 Project Overview
A web-based chat application built with Next.js and Supabase, implementing Flux architecture patterns for state management. The application enables real-time-like messaging through polling, focusing on clean architecture and centralized business logic.

### 1.2 Business Objectives
- **Learning Goal**: Master Flux architecture with React Context API
- **Technical Goal**: Build scalable state management without external libraries (Redux, Zustand)
- **Product Goal**: Deliver functional chat application with core messaging features

### 1.3 Success Criteria
- ✅ All state management follows Flux unidirectional data flow
- ✅ Business logic centralized in Context providers
- ✅ Only necessary data managed in state (no over-engineering)
- ✅ Clean separation: UI Components → Actions → Dispatcher → Store → UI
- ✅ Polling-based updates work reliably (no websocket complexity)

---

## 2. Product Vision & Scope

### 2.1 Vision Statement
Create a lightweight, educational chat application demonstrating professional state management architecture while providing real-world messaging functionality.

### 2.2 Target Users
- **Primary**: Developers learning Next.js and Flux architecture
- **Secondary**: Small teams needing simple internal communication

### 2.3 Core Value Proposition
- Clean architectural patterns suitable for production scaling
- Simple deployment (no complex websocket infrastructure)
- Full-featured messaging without bloated dependencies

### 2.4 Out of Scope (V1)
- ❌ File/image uploads
- ❌ Video/voice calls
- ❌ Message read receipts
- ❌ User presence indicators ("online" status)
- ❌ Message editing (delete only)
- ❌ Push notifications
- ❌ Mobile native apps
- ❌ End-to-end encryption
- ❌ Message search functionality

---

## 3. User Requirements

### 3.1 User Stories

#### Authentication
```
AS A user
I WANT TO register with email/password
SO THAT I can access the chat application

AS A user
I WANT TO login with my credentials
SO THAT I can use my existing account

AS A user
I WANT TO stay logged in across sessions
SO THAT I don't have to re-login constantly
```

#### Chat Room Management
```
AS A user
I WANT TO create a new chat room
SO THAT I can start conversations on specific topics

AS A user
I WANT TO see available chat rooms
SO THAT I can join conversations

AS A user
I WANT TO join existing chat rooms
SO THAT I can participate in discussions

AS A user
I WANT TO leave chat rooms
SO THAT I can manage my active conversations
```

#### Messaging
```
AS A user
I WANT TO send text messages
SO THAT I can communicate with others

AS A user
I WANT TO send emoji messages
SO THAT I can express emotions

AS A user
I WANT TO see messages in chronological order
SO THAT I can follow the conversation flow

AS A user
I WANT TO delete my own messages
SO THAT I can remove mistakes or unwanted content
```

#### Message Interactions
```
AS A user
I WANT TO like messages
SO THAT I can show appreciation without replying

AS A user
I WANT TO reply to specific messages
SO THAT I can maintain conversation context

AS A user
I WANT TO see message reactions (likes count)
SO THAT I can see popular messages
```

### 3.2 User Personas

#### Persona 1: Learning Developer "Alex"
- **Age**: 25, Junior Frontend Developer
- **Goal**: Understand Flux architecture through practical implementation
- **Pain Points**: Confused by complex state management libraries
- **Needs**: Clear code examples, well-structured architecture

#### Persona 2: Small Team Lead "Jordan"
- **Age**: 32, Tech Lead at startup
- **Goal**: Simple internal communication tool
- **Pain Points**: Slack/Discord overkill for 5-person team
- **Needs**: Lightweight, self-hosted, easy maintenance

---

## 4. Functional Requirements

### 4.1 Authentication System

#### FR-AUTH-001: User Registration
**Priority**: P0 (Critical)
**Description**: Users can create accounts with email and password

**Acceptance Criteria**:
- Email validation (valid format, unique)
- Password requirements: min 8 characters
- Success → Auto-login → Redirect to chat rooms list
- Error handling: duplicate email, weak password
- Form validation (client + server)

**Technical Notes**:
- Use Supabase Auth (`supabase.auth.signUp`)
- Store minimal user profile: id, email, display_name, created_at
- Leverage Supabase built-in email validation

#### FR-AUTH-002: User Login
**Priority**: P0 (Critical)
**Description**: Users can authenticate with existing credentials

**Acceptance Criteria**:
- Email + password login
- Success → Redirect to last viewed room or rooms list
- Error handling: invalid credentials, account not found
- "Remember me" functionality (Supabase default session management)

**Technical Notes**:
- Use Supabase Auth (`supabase.auth.signInWithPassword`)
- Session stored in local storage (Supabase default)
- Token refresh handled automatically

#### FR-AUTH-003: Session Persistence
**Priority**: P0 (Critical)
**Description**: Users remain authenticated across browser sessions

**Acceptance Criteria**:
- Session persists on page refresh
- Session persists after browser close/reopen
- Auto-logout after token expiration
- Redirect to login if unauthenticated

**Technical Notes**:
- Supabase handles token storage and refresh
- Implement auth middleware for protected routes
- Use `onAuthStateChange` listener in root layout

#### FR-AUTH-004: Logout
**Priority**: P1 (High)
**Description**: Users can terminate their session

**Acceptance Criteria**:
- Logout button accessible from all pages
- Clear all session data
- Redirect to login page
- Prevent access to protected routes

**Technical Notes**:
- Use `supabase.auth.signOut()`
- Clear Context state on logout

---

### 4.2 Chat Room Management

#### FR-ROOM-001: Create Chat Room
**Priority**: P0 (Critical)
**Description**: Users can create new chat rooms

**Acceptance Criteria**:
- Required: room name (3-50 chars)
- Optional: room description (0-200 chars)
- Room creator becomes admin
- Auto-join creator to new room
- Duplicate names allowed (unique by ID)

**Technical Notes**:
- Table: `chat_rooms (id, name, description, created_by, created_at)`
- Auto-generate UUID for room ID
- Insert into `room_members` on creation

**Data Model**:
```sql
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  description VARCHAR(200),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### FR-ROOM-002: List Available Rooms
**Priority**: P0 (Critical)
**Description**: Users can browse all chat rooms

**Acceptance Criteria**:
- Show all public rooms
- Display: room name, description, member count, last message timestamp
- Sort by: last activity (most recent first)
- Empty state: "No rooms yet. Create one!"

**Technical Notes**:
- Query: JOIN chat_rooms with aggregated messages/members
- Cache room list in Context (refresh every 10s via polling)
- Optimistic UI: new rooms appear immediately

**UI Components**:
- Room list container
- Room card (name, description, metadata)
- Create room button (FAB or header button)

#### FR-ROOM-003: Join Chat Room
**Priority**: P0 (Critical)
**Description**: Users can join existing rooms

**Acceptance Criteria**:
- Click to join from room list
- Add user to `room_members`
- Navigate to room chat view
- Show success feedback

**Technical Notes**:
- Insert into `room_members (room_id, user_id, joined_at)`
- Update Context: add room to user's active rooms
- Prevent duplicate joins (UNIQUE constraint)

#### FR-ROOM-004: Leave Chat Room
**Priority**: P1 (High)
**Description**: Users can leave rooms they've joined

**Acceptance Criteria**:
- Leave button in room header
- Confirm dialog: "Leave [Room Name]?"
- Remove from room members
- Navigate back to room list
- Retain message history (soft delete membership)

**Technical Notes**:
- DELETE from `room_members` WHERE room_id AND user_id
- Update Context: remove room from active rooms
- Messages remain in database

---

### 4.3 Messaging System

#### FR-MSG-001: Send Text Message
**Priority**: P0 (Critical)
**Description**: Users can send text messages in rooms

**Acceptance Criteria**:
- Input field at bottom of chat view
- Max length: 2000 characters
- Enter key → send (Shift+Enter → new line)
- Disable send if empty/whitespace only
- Optimistic UI: message appears immediately
- Auto-scroll to bottom on send

**Technical Notes**:
- Table: `messages (id, room_id, user_id, content, type, created_at)`
- Type: 'text' or 'emoji'
- Sanitize input (prevent XSS)
- Optimistic update: add to Context before DB confirmation

**Data Model**:
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  type VARCHAR(10) DEFAULT 'text',
  parent_message_id UUID REFERENCES messages(id), -- for replies
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

#### FR-MSG-002: Send Emoji Message
**Priority**: P1 (High)
**Description**: Users can send emoji-only messages

**Acceptance Criteria**:
- Emoji picker button next to text input
- Click emoji → send immediately (no text input)
- Emoji rendered larger than text emojis
- Recent emojis saved locally

**Technical Notes**:
- Use native emoji picker or library (emoji-mart)
- Store as message type: 'emoji'
- Render differently in UI (larger size, centered)

#### FR-MSG-003: Display Message History
**Priority**: P0 (Critical)
**Description**: Users see chronological message history

**Acceptance Criteria**:
- Messages ordered by `created_at` ASC
- Show: sender name, content, timestamp
- Grouped by date ("Today", "Yesterday", specific dates)
- Scroll to load earlier messages (pagination)
- Auto-scroll to bottom on new messages
- Indicate deleted messages: "[Message deleted]"

**Technical Notes**:
- Initial load: last 50 messages
- Polling: fetch messages newer than last_message_timestamp every 3s
- Context manages message array per room
- Implement virtual scrolling for 100+ messages (react-window)

**UI Components**:
- Message list container (scrollable)
- Message bubble (sender, content, timestamp, actions)
- Date separator
- Deleted message placeholder

#### FR-MSG-004: Delete Own Message
**Priority**: P1 (High)
**Description**: Users can delete their own messages

**Acceptance Criteria**:
- Delete button visible only on own messages
- Confirm dialog: "Delete this message?"
- Soft delete: set `deleted_at` timestamp
- Display: "[Message deleted]" placeholder
- Preserve thread if message has replies

**Technical Notes**:
- UPDATE messages SET deleted_at = NOW() WHERE id AND user_id
- Context: mark message as deleted (don't remove from array)
- Retain message for reply context
- No restore functionality (permanent deletion)

---

### 4.4 Message Interactions

#### FR-INT-001: Like Message
**Priority**: P1 (High)
**Description**: Users can like messages

**Acceptance Criteria**:
- Heart/thumbs-up icon on each message
- Click to toggle like/unlike
- Show like count next to icon
- User can see if they've liked (filled icon)
- No like limit per user

**Technical Notes**:
- Table: `message_likes (message_id, user_id, created_at)` UNIQUE(message_id, user_id)
- Toggle: INSERT ON CONFLICT DO DELETE
- Aggregate likes in Context (reduce DB queries)
- Optimistic update: increment count immediately

**Data Model**:
```sql
CREATE TABLE message_likes (
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);
```

#### FR-INT-002: Reply to Message
**Priority**: P1 (High)
**Description**: Users can reply to specific messages

**Acceptance Criteria**:
- Reply button on each message
- Click → show reply context above input field
- Reply includes reference to parent message
- Display reply thread visually (indent/line)
- Cancel reply action available

**Technical Notes**:
- Use `parent_message_id` foreign key in messages table
- Context: track active reply target
- UI: show parent message preview above input
- Render threads with visual connection (line/indent)

**UI Components**:
- Reply indicator in message bubble
- Reply preview in input area
- Thread visualization (parent-child connection)

---

### 4.5 Real-Time Updates (Polling)

#### FR-RT-001: Message Polling
**Priority**: P0 (Critical)
**Description**: New messages appear without manual refresh

**Acceptance Criteria**:
- Poll every 3 seconds while viewing room
- Fetch messages newer than `last_message_timestamp`
- Append new messages to Context state
- Auto-scroll to bottom if already at bottom
- Stop polling when leaving room

**Technical Notes**:
- Use `setInterval` in room view component
- Query: SELECT WHERE room_id AND created_at > last_timestamp
- Context action: APPEND_MESSAGES
- Cleanup interval on unmount

#### FR-RT-002: Room List Polling
**Priority**: P2 (Medium)
**Description**: Room list updates periodically

**Acceptance Criteria**:
- Poll every 10 seconds on room list view
- Update member counts and last message timestamps
- Highlight rooms with new activity

**Technical Notes**:
- Lighter query than full room details
- Update Context room metadata
- Visual indicator for updated rooms

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **Page Load**: < 2s on 3G connection
- **Message Send**: Optimistic UI (instant feedback)
- **Polling Impact**: < 100ms query time for incremental updates
- **Bundle Size**: < 500KB initial JS (code splitting)

### 5.2 Scalability
- **Users**: Support 100 concurrent users (MVP scale)
- **Messages**: Efficient pagination for 10,000+ messages per room
- **Rooms**: No practical limit (database-constrained)

### 5.3 Security
- **Authentication**: Supabase Auth (industry-standard JWT)
- **Authorization**: Row-Level Security (RLS) policies
- **Input Validation**: Sanitize all user input (XSS prevention)
- **HTTPS**: Enforce SSL in production

### 5.4 Usability
- **Responsive**: Mobile-friendly (320px - 2560px)
- **Accessibility**: WCAG 2.1 AA compliance (semantic HTML, ARIA labels)
- **Error Messages**: Clear, actionable feedback

### 5.5 Reliability
- **Uptime**: 99% (Supabase infrastructure)
- **Data Persistence**: PostgreSQL with backups
- **Error Handling**: Graceful degradation (show cached data on network errors)

---

## 6. Technical Architecture

### 6.1 Technology Stack

#### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 3+
- **State Management**: React Context API (Flux pattern)
- **Form Handling**: Native React (controlled components)
- **Date/Time**: date-fns or native Intl API

#### Backend
- **BaaS**: Supabase (PostgreSQL + Auth + Storage)
- **Database**: PostgreSQL 15+
- **Authentication**: Supabase Auth (JWT)
- **API**: Supabase Client (REST + PostgreSQL functions)

#### DevOps
- **Hosting**: Vercel (Next.js optimized)
- **Database**: Supabase Cloud
- **Version Control**: Git
- **CI/CD**: Vercel auto-deploy

### 6.2 Flux Architecture Implementation

#### Flux Pattern Overview
```
┌──────────┐      ┌────────────┐      ┌────────────┐      ┌───────┐
│   View   │─────→│  Actions   │─────→│ Dispatcher │─────→│ Store │
│ (UI)     │      │ (Functions)│      │ (Reducer)  │      │(State)│
└──────────┘      └────────────┘      └────────────┘      └───────┘
     ↑                                                         │
     └─────────────────────────────────────────────────────────┘
                    (State change triggers re-render)
```

#### Context Structure
```typescript
// 1. AuthContext - User authentication state
interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// 2. RoomsContext - Chat rooms data
interface RoomsState {
  rooms: ChatRoom[];
  activeRoom: string | null;
  loading: boolean;
  error: string | null;
}

// 3. MessagesContext - Messages per room
interface MessagesState {
  messagesByRoom: Record<string, Message[]>;
  likesCache: Record<string, Like[]>;
  replyTarget: Message | null;
  loading: boolean;
  error: string | null;
}
```

#### Actions (Business Logic)
```typescript
// AuthActions
- login(email, password)
- register(email, password, displayName)
- logout()
- refreshSession()

// RoomActions
- fetchRooms()
- createRoom(name, description)
- joinRoom(roomId)
- leaveRoom(roomId)
- setActiveRoom(roomId)

// MessageActions
- fetchMessages(roomId)
- sendMessage(roomId, content, type)
- deleteMessage(messageId)
- likeMessage(messageId)
- unlikeMessage(messageId)
- setReplyTarget(message)
- clearReplyTarget()
```

#### Dispatcher (Reducer Pattern)
```typescript
// Each Context has a reducer handling action types
type Action =
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_ROOMS'; payload: ChatRoom[] }
  | { type: 'ADD_ROOM'; payload: ChatRoom }
  | { type: 'APPEND_MESSAGES'; payload: { roomId: string; messages: Message[] } }
  | { type: 'DELETE_MESSAGE'; payload: string }
  | { type: 'TOGGLE_LIKE'; payload: { messageId: string; liked: boolean } }
  // ... etc
```

#### State Management Rules
1. **Only manage what's necessary**: Don't store derived data
2. **Single source of truth**: Each piece of data lives in one Context
3. **Immutable updates**: Always return new state objects
4. **Separation of concerns**: UI components don't contain business logic
5. **Optimistic updates**: Update UI immediately, rollback on errors

### 6.3 Database Schema

```sql
-- Users (managed by Supabase Auth)
-- auth.users table automatically created

-- User Profiles (extends auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat Rooms
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  description VARCHAR(200),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Room Members (many-to-many)
CREATE TABLE room_members (
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  type VARCHAR(10) DEFAULT 'text', -- 'text' | 'emoji'
  parent_message_id UUID REFERENCES messages(id),
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,

  CHECK (type IN ('text', 'emoji'))
);

-- Message Likes
CREATE TABLE message_likes (
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_messages_room_created ON messages(room_id, created_at DESC);
CREATE INDEX idx_messages_parent ON messages(parent_message_id);
CREATE INDEX idx_room_members_user ON room_members(user_id);
CREATE INDEX idx_message_likes_message ON message_likes(message_id);
```

### 6.4 Row-Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_likes ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can read all, update only their own
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Chat Rooms: Everyone can read/create
CREATE POLICY "Chat rooms are viewable by everyone"
  ON chat_rooms FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create rooms"
  ON chat_rooms FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Room Members: Read if member, insert to join, delete to leave
CREATE POLICY "Room members are viewable by everyone"
  ON room_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join rooms"
  ON room_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
  ON room_members FOR DELETE
  USING (auth.uid() = user_id);

-- Messages: Read if room member, insert if room member, delete own only
CREATE POLICY "Messages viewable by room members"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_id = messages.room_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Room members can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM room_members
      WHERE room_id = messages.room_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Message Likes: Read all, insert/delete own only
CREATE POLICY "Likes viewable by room members"
  ON message_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN room_members rm ON m.room_id = rm.room_id
      WHERE m.id = message_likes.message_id
      AND rm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can like messages"
  ON message_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike messages"
  ON message_likes FOR DELETE
  USING (auth.uid() = user_id);
```

### 6.5 File Structure

```
chat-app/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (protected)/
│   │   ├── rooms/
│   │   │   ├── page.tsx              # Room list
│   │   │   └── [roomId]/
│   │   │       └── page.tsx          # Chat room view
│   │   └── layout.tsx                # Auth middleware
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Landing page (redirect)
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── rooms/
│   │   ├── RoomList.tsx
│   │   ├── RoomCard.tsx
│   │   └── CreateRoomDialog.tsx
│   ├── chat/
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   ├── EmojiPicker.tsx
│   │   └── ReplyPreview.tsx
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Sidebar.tsx
├── contexts/
│   ├── AuthContext.tsx
│   ├── RoomsContext.tsx
│   └── MessagesContext.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Supabase client instance
│   │   ├── auth.ts                   # Auth helpers
│   │   └── types.ts                  # Database types
│   ├── actions/
│   │   ├── authActions.ts
│   │   ├── roomActions.ts
│   │   └── messageActions.ts
│   └── utils/
│       ├── dateFormat.ts
│       └── validation.ts
├── types/
│   ├── auth.ts
│   ├── room.ts
│   └── message.ts
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 6.6 Key Technical Decisions

#### Decision 1: Polling vs WebSocket
**Choice**: Polling (3s interval)
**Rationale**:
- Simpler implementation (no WebSocket server management)
- Easier deployment (no persistent connections)
- Sufficient for MVP (<100 users)
- Supabase Realtime costs avoided

**Trade-offs**:
- Higher latency (up to 3s delay)
- More database queries
- Less efficient for high-traffic rooms

#### Decision 2: Context API vs Redux
**Choice**: React Context API
**Rationale**:
- Learning objective (understand Flux without abstraction)
- No external dependencies
- Sufficient for app complexity
- Better performance with proper memoization

**Trade-offs**:
- More boilerplate
- Manual optimization required
- No dev tools (Redux DevTools)

#### Decision 3: Soft Delete vs Hard Delete
**Choice**: Soft delete (deleted_at timestamp)
**Rationale**:
- Preserve reply threads
- Audit trail for learning/debugging
- Easy to restore if needed

**Trade-offs**:
- Database storage increases
- Queries need WHERE deleted_at IS NULL

---

## 7. User Interface Design

### 7.1 Page Structure

#### Landing Page (Unauthenticated)
- Hero section with app description
- Login/Register buttons
- Redirect to /login if not authenticated

#### Login Page
- Email input
- Password input
- Login button
- Link to register page
- Error message display

#### Register Page
- Display name input
- Email input
- Password input
- Confirm password input
- Register button
- Link to login page
- Error message display

#### Room List Page
- Header with app name + logout button
- Create room button (prominent)
- List of available rooms:
  - Room name
  - Description
  - Member count
  - Last message timestamp
  - Join button
- Empty state: "No rooms yet. Create the first one!"

#### Chat Room Page
- Header:
  - Room name
  - Leave room button
  - Back to rooms button
- Message list (scrollable):
  - Date separators
  - Message bubbles (own messages right-aligned)
  - Sender name + timestamp
  - Like button + count
  - Reply button
  - Delete button (own messages only)
- Reply preview (if replying)
- Message input:
  - Text input field
  - Emoji picker button
  - Send button

### 7.2 Component Hierarchy

```
App Layout
├── Header (global)
│   ├── App Logo
│   ├── Room Name (if in room)
│   └── User Menu → Logout
├── Page Content
│   ├── Room List View
│   │   ├── CreateRoomButton
│   │   └── RoomList
│   │       └── RoomCard[]
│   └── Chat Room View
│       ├── RoomHeader
│       ├── MessageList
│       │   ├── DateSeparator[]
│       │   └── MessageBubble[]
│       │       ├── MessageContent
│       │       ├── MessageActions
│       │       │   ├── LikeButton
│       │       │   ├── ReplyButton
│       │       │   └── DeleteButton
│       │       └── ReplyThread
│       └── MessageInput
│           ├── ReplyPreview
│           ├── TextInput
│           ├── EmojiPicker
│           └── SendButton
```

### 7.3 Design System

#### Colors (Tailwind)
```typescript
colors: {
  primary: 'blue-600',      // Buttons, links
  secondary: 'gray-600',    // Secondary actions
  success: 'green-600',     // Success states
  error: 'red-600',         // Errors
  background: 'gray-50',    // Page background
  surface: 'white',         // Cards, bubbles
  border: 'gray-200',       // Borders
  text: {
    primary: 'gray-900',
    secondary: 'gray-600',
    muted: 'gray-400'
  }
}
```

#### Typography
- **Headings**: font-bold, text-xl/2xl/3xl
- **Body**: font-normal, text-sm/base
- **Captions**: font-normal, text-xs, text-gray-500

#### Spacing
- **Padding**: p-2/4/6/8
- **Margins**: m-2/4/6/8
- **Gaps**: gap-2/4/6

#### Responsive Breakpoints
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md-lg)
- **Desktop**: > 1024px (xl)

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Week 1)
**Goal**: Setup + Authentication

**Tasks**:
- [ ] Project setup (Next.js + TypeScript + Tailwind)
- [ ] Supabase project creation + environment config
- [ ] Database schema creation
- [ ] RLS policies implementation
- [ ] AuthContext + AuthActions
- [ ] Login/Register pages
- [ ] Session persistence
- [ ] Protected route middleware

**Deliverables**: Working auth system, users can register/login/logout

---

### Phase 2: Room Management (Week 2)
**Goal**: Chat rooms CRUD

**Tasks**:
- [ ] RoomsContext + RoomActions
- [ ] Room list page + UI
- [ ] Create room functionality
- [ ] Join room functionality
- [ ] Leave room functionality
- [ ] Room list polling (10s interval)
- [ ] Room navigation

**Deliverables**: Users can create, join, leave rooms

---

### Phase 3: Messaging Core (Week 3)
**Goal**: Basic messaging

**Tasks**:
- [ ] MessagesContext + MessageActions
- [ ] Chat room page UI
- [ ] Message list component
- [ ] Send text messages
- [ ] Message polling (3s interval)
- [ ] Delete own messages
- [ ] Auto-scroll behavior
- [ ] Optimistic UI updates

**Deliverables**: Users can send/delete messages in real-time

---

### Phase 4: Message Interactions (Week 4)
**Goal**: Likes + Replies

**Tasks**:
- [ ] Like/unlike messages
- [ ] Like count display
- [ ] Reply to message UI
- [ ] Reply threading display
- [ ] Emoji picker integration
- [ ] Send emoji messages
- [ ] Polish UI/UX

**Deliverables**: Full feature set complete

---

### Phase 5: Polish & Deploy (Week 5)
**Goal**: Production-ready

**Tasks**:
- [ ] Error handling improvements
- [ ] Loading states
- [ ] Responsive design testing
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Vercel deployment
- [ ] Documentation

**Deliverables**: Deployed, polished application

---

## 9. Testing Strategy

### 9.1 Testing Approach
- **Manual Testing**: Primary method for MVP
- **Unit Tests**: Optional (if time permits)
- **E2E Tests**: Not required for MVP

### 9.2 Test Scenarios

#### Authentication
- ✅ Register new user → Success
- ✅ Register duplicate email → Error
- ✅ Login valid credentials → Success
- ✅ Login invalid credentials → Error
- ✅ Session persists on refresh
- ✅ Logout → Redirect to login

#### Room Management
- ✅ Create room → Appears in list
- ✅ Join room → Navigate to chat
- ✅ Leave room → Return to list
- ✅ Room list updates (polling)

#### Messaging
- ✅ Send message → Appears immediately
- ✅ Delete message → Shows "[Message deleted]"
- ✅ New messages appear (polling)
- ✅ Auto-scroll on new message

#### Message Interactions
- ✅ Like message → Count increments
- ✅ Unlike message → Count decrements
- ✅ Reply to message → Thread visible
- ✅ Send emoji → Displays correctly

### 9.3 Browser Compatibility
- **Primary**: Chrome (latest)
- **Secondary**: Firefox, Safari, Edge (latest)
- **Mobile**: iOS Safari, Chrome Android

---

## 10. Success Metrics

### 10.1 Technical Metrics
- ✅ **Architecture Compliance**: 100% Flux pattern adherence
- ✅ **Type Safety**: Zero TypeScript errors
- ✅ **Performance**: < 2s page load on 3G
- ✅ **Accessibility**: WCAG 2.1 AA compliance

### 10.2 Feature Completeness
- ✅ All P0 requirements implemented
- ✅ All P1 requirements implemented
- ✅ Error handling for all user actions
- ✅ Responsive design (mobile + desktop)

### 10.3 Learning Objectives
- ✅ Understand Flux architecture deeply
- ✅ Implement Context API effectively
- ✅ Integrate Supabase backend
- ✅ Build real-time-like features with polling

---

## 11. Risk Assessment

### 11.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Polling performance degrades | High | Medium | Implement efficient queries, add indexes, optimize polling intervals |
| Context re-render issues | Medium | High | Use React.memo, useMemo, useCallback strategically |
| Supabase rate limits | Medium | Low | Monitor usage, implement request caching |
| Database query slowness | High | Medium | Add proper indexes, optimize queries, pagination |

### 11.2 Scope Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Feature creep | High | Medium | Stick to PRD, defer nice-to-haves to V2 |
| Overengineering state | Medium | High | Only manage necessary state, validate against Flux principles |
| Time overrun | Medium | Medium | Prioritize P0 features, cut P2 if needed |

---

## 12. Dependencies

### 12.1 Required Dependencies
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.38.0",
    "@supabase/auth-helpers-nextjs": "^0.8.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0"
  }
}
```

### 12.2 Optional Dependencies (P2)
```json
{
  "emoji-mart": "^5.5.0",           // Emoji picker
  "react-window": "^1.8.0",         // Virtual scrolling
  "@headlessui/react": "^1.7.0"     // Accessible UI components
}
```

---

## 13. Environment Configuration

### 13.1 Required Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 13.2 Supabase Setup Steps
1. Create Supabase project at https://supabase.com
2. Run database schema SQL (section 6.3)
3. Enable RLS policies (section 6.4)
4. Configure Auth settings (Email + Password provider)
5. Copy API keys to `.env.local`

---

## 14. Deployment Checklist

### 14.1 Pre-Deployment
- [ ] All environment variables configured in Vercel
- [ ] Database migrations applied to production Supabase
- [ ] RLS policies enabled and tested
- [ ] TypeScript build passes (`npm run build`)
- [ ] No console errors in production build

### 14.2 Post-Deployment
- [ ] Test auth flow (register, login, logout)
- [ ] Test room creation and joining
- [ ] Test messaging and polling
- [ ] Verify responsive design on mobile
- [ ] Check browser console for errors

---

## 15. Future Enhancements (V2+)

### Potential Features
- Message search functionality
- File/image uploads
- User presence indicators (online/offline)
- Message read receipts
- Typing indicators
- Message editing (currently delete-only)
- Direct messages (1-on-1 chat)
- Room categories/tags
- User profiles and avatars
- Push notifications (PWA)
- Message formatting (bold, italic, code)
- Link previews
- WebSocket implementation (replace polling)

### Technical Improvements
- Implement Redis caching
- Add comprehensive test suite
- Set up monitoring (Sentry, PostHog)
- Optimize bundle size
- Implement service worker (offline support)
- Add GraphQL layer (Hasura + Supabase)

---

## 16. Appendix

### 16.1 Glossary
- **Flux Architecture**: Unidirectional data flow pattern (Action → Dispatcher → Store → View)
- **Polling**: Periodic API requests to check for updates (vs WebSocket's push notifications)
- **RLS**: Row-Level Security - database-level access control
- **Optimistic UI**: Update UI immediately before server confirmation
- **Soft Delete**: Mark as deleted without removing from database

### 16.2 References
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Flux Architecture Explained](https://facebook.github.io/flux/docs/in-depth-overview/)
- [React Context API](https://react.dev/reference/react/createContext)
- [Tailwind CSS](https://tailwindcss.com/docs)

### 16.3 Document History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-19 | PRD Agent | Initial comprehensive PRD |

---

**End of Document**
