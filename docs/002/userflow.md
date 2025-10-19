# Userflow Specification
# Chat Application - MVP Learning Project

**Document Version:** 1.0
**Last Updated:** 2025-10-19
**Based on:** PRD v1.0
**Tech Stack:** Next.js (App Router) + TypeScript + Supabase + Flux Architecture

---

## Table of Contents
1. [회원가입 (User Registration)](#1-회원가입-user-registration)
2. [로그인 (Login)](#2-로그인-login)
3. [로그아웃 (Logout)](#3-로그아웃-logout)
4. [채팅방 목록 조회 (Room List View)](#4-채팅방-목록-조회-room-list-view)
5. [채팅방 생성 (Create Room)](#5-채팅방-생성-create-room)
6. [채팅방 참여 (Join Room)](#6-채팅방-참여-join-room)
7. [텍스트 메시지 전송 (Send Text Message)](#7-텍스트-메시지-전송-send-text-message)
8. [이모지 전송 (Send Emoji)](#8-이모지-전송-send-emoji)
9. [좋아요 (Like Message)](#9-좋아요-like-message)
10. [답장 (Reply to Message)](#10-답장-reply-to-message)
11. [삭제 (Delete Message)](#11-삭제-delete-message)

---

## 1. 회원가입 (User Registration)

### 입력 (Input)
**Entry Point**: `/register` page (accessed from landing page or login page link)

**Required Fields**:
- `displayName`: string (min 2, max 50 chars)
- `email`: string (valid email format)
- `password`: string (min 8 chars)
- `confirmPassword`: string (must match password)

**User Actions**:
1. Navigate to register page
2. Fill in display name, email, password fields
3. Click "Register" button

### 처리 (Processing)

**Client-Side Validation**:
- Email format check (regex)
- Password length >= 8 chars
- Password confirmation match
- Display name not empty
- Show inline validation errors

**Flux Action Flow**:
```typescript
// AuthActions.register(email, password, displayName)
1. Dispatch: { type: 'REGISTER_LOADING' }
2. Call: supabase.auth.signUp({ email, password })
3. On success:
   - Create user_profile record (display_name)
   - Dispatch: { type: 'REGISTER_SUCCESS', payload: user }
4. On error:
   - Dispatch: { type: 'REGISTER_ERROR', payload: errorMessage }
```

**Supabase Operations**:
- `supabase.auth.signUp({ email, password })` → Creates auth.users record
- `supabase.from('user_profiles').insert({ id: user.id, display_name })` → Creates profile

**Edge Cases**:
- Duplicate email → Show: "Email already registered"
- Weak password → Show: "Password must be at least 8 characters"
- Network error → Show: "Registration failed. Please try again"
- Invalid email format → Show: "Please enter a valid email"

### 출력 (Output)

**Success State**:
- Auto-login with new credentials
- Update AuthContext: `{ user: User, loading: false, error: null }`
- Redirect to: `/rooms` (chat rooms list)
- Show toast: "Welcome to the chat!"

**Error State**:
- Display error message below form
- Keep form data (except passwords)
- Enable retry

**UI Feedback**:
- Loading spinner on submit button
- Disable form during submission
- Success → Smooth transition to rooms page

---

## 2. 로그인 (Login)

### 입력 (Input)
**Entry Point**: `/login` page (default landing page for unauthenticated users)

**Required Fields**:
- `email`: string
- `password`: string

**User Actions**:
1. Navigate to login page
2. Enter email and password
3. Click "Login" button

### 처리 (Processing)

**Client-Side Validation**:
- Email and password not empty
- Email basic format check

**Flux Action Flow**:
```typescript
// AuthActions.login(email, password)
1. Dispatch: { type: 'LOGIN_LOADING' }
2. Call: supabase.auth.signInWithPassword({ email, password })
3. On success:
   - Fetch user_profile data
   - Dispatch: { type: 'LOGIN_SUCCESS', payload: { user, profile } }
4. On error:
   - Dispatch: { type: 'LOGIN_ERROR', payload: errorMessage }
```

**Supabase Operations**:
- `supabase.auth.signInWithPassword({ email, password })` → Returns session + user
- Session stored automatically in localStorage by Supabase client

**Edge Cases**:
- Invalid credentials → Show: "Invalid email or password"
- Account not found → Show: "No account found with this email"
- Network error → Show: "Login failed. Check your connection"
- Session already active → Auto-redirect to `/rooms`

### 출력 (Output)

**Success State**:
- Update AuthContext: `{ user: User, loading: false, error: null }`
- Store session in localStorage (Supabase handles)
- Redirect to: `/rooms` (or last visited room if stored)
- Start auth state listener

**Error State**:
- Display error message below form
- Clear password field
- Keep email field value

**UI Feedback**:
- Loading spinner on button
- Disable form during submission
- Show success checkmark before redirect

---

## 3. 로그아웃 (Logout)

### 입력 (Input)
**Entry Point**: Logout button in app header (visible on all authenticated pages)

**User Actions**:
1. Click "Logout" button in header
2. Confirm action (optional dialog)

### 처리 (Processing)

**Flux Action Flow**:
```typescript
// AuthActions.logout()
1. Dispatch: { type: 'LOGOUT_LOADING' }
2. Call: supabase.auth.signOut()
3. Clear all Context state:
   - AuthContext → reset to initial state
   - RoomsContext → clear rooms data
   - MessagesContext → clear messages cache
4. Dispatch: { type: 'LOGOUT_SUCCESS' }
```

**Supabase Operations**:
- `supabase.auth.signOut()` → Clears session from localStorage
- Revoke JWT token

**Edge Cases**:
- Network error during logout → Force local logout anyway
- Already logged out → Skip operation, redirect to login
- Multiple tabs open → Auth state change propagates via storage event

### 출력 (Output)

**Success State**:
- Clear AuthContext: `{ user: null, loading: false, error: null }`
- Clear all application state
- Redirect to: `/login`
- Show toast: "Logged out successfully"

**UI Feedback**:
- Immediate local state clear
- Brief loading indicator
- Smooth transition to login page

---

## 4. 채팅방 목록 조회 (Room List View)

### 입력 (Input)
**Entry Point**: `/rooms` page (default authenticated home)

**User Actions**:
1. Navigate to rooms page (post-login or via back button)
2. View list of available chat rooms
3. Wait for polling updates (every 10s)

### 처리 (Processing)

**Initial Load**:
```typescript
// RoomActions.fetchRooms()
1. Dispatch: { type: 'FETCH_ROOMS_LOADING' }
2. Query Supabase:
   SELECT
     rooms.*,
     COUNT(DISTINCT members.user_id) as member_count,
     MAX(messages.created_at) as last_activity
   FROM chat_rooms rooms
   LEFT JOIN room_members members ON rooms.id = members.room_id
   LEFT JOIN messages ON rooms.id = messages.room_id
   GROUP BY rooms.id
   ORDER BY last_activity DESC NULLS LAST
3. Dispatch: { type: 'SET_ROOMS', payload: rooms }
```

**Polling Updates**:
- Start interval on component mount: `setInterval(fetchRooms, 10000)`
- Fetch same query every 10s
- Merge updates into existing state
- Highlight rooms with new activity
- Clear interval on unmount

**Supabase Operations**:
- Single query with JOINs for efficient data fetch
- RLS policy: All authenticated users can view rooms
- Cached in RoomsContext

**Edge Cases**:
- No rooms exist → Show empty state: "No rooms yet. Create the first one!"
- Network error during fetch → Show cached data, retry indicator
- New room created by other user → Appears on next poll
- User joins room → Navigate immediately (optimistic), confirm on next poll

### 출력 (Output)

**Success State**:
- Update RoomsContext: `{ rooms: ChatRoom[], loading: false, error: null }`
- Render room list with cards

**Room Card Display**:
- Room name (bold)
- Room description (truncated to 100 chars)
- Member count: "X members"
- Last activity: Relative time ("2 min ago", "Yesterday")
- "Join" button (disabled if already member)

**UI Feedback**:
- Loading skeleton on initial load
- Subtle refresh indicator during polling
- New activity badge on updated rooms
- Smooth list animations

---

## 5. 채팅방 생성 (Create Room)

### 입력 (Input)
**Entry Point**: "Create Room" button on `/rooms` page → Opens modal dialog

**Required Fields**:
- `roomName`: string (min 3, max 50 chars)

**Optional Fields**:
- `description`: string (max 200 chars)

**User Actions**:
1. Click "Create Room" button
2. Fill in room name (required)
3. Fill in description (optional)
4. Click "Create" button

### 처리 (Processing)

**Client-Side Validation**:
- Room name length: 3-50 chars
- Description length: max 200 chars
- Trim whitespace

**Flux Action Flow**:
```typescript
// RoomActions.createRoom(name, description)
1. Dispatch: { type: 'CREATE_ROOM_LOADING' }
2. Optimistically add room to state:
   - Generate temporary ID
   - Add to rooms array
3. Call Supabase transaction:
   a. Insert into chat_rooms
   b. Insert into room_members (creator auto-joins)
4. On success:
   - Replace temp ID with real UUID
   - Dispatch: { type: 'CREATE_ROOM_SUCCESS', payload: room }
5. On error:
   - Remove optimistic room
   - Dispatch: { type: 'CREATE_ROOM_ERROR', payload: errorMessage }
```

**Supabase Operations**:
```typescript
// Transaction (automatic via RLS + triggers)
1. Insert: chat_rooms { name, description, created_by: auth.uid() }
2. Insert: room_members { room_id, user_id: auth.uid() }
```

**Edge Cases**:
- Empty name → Show: "Room name is required"
- Name too short → Show: "Room name must be at least 3 characters"
- Network error → Rollback optimistic update, show error
- User closes modal → Cancel operation, no state change

### 출력 (Output)

**Success State**:
- Add room to RoomsContext immediately (optimistic)
- Close modal
- Navigate to: `/rooms/[newRoomId]` (chat view)
- Show toast: "Room created successfully"

**Error State**:
- Show error in modal
- Keep modal open
- Keep form data for retry

**UI Feedback**:
- Loading spinner in modal
- Disable submit button during creation
- Smooth transition to chat room

---

## 6. 채팅방 참여 (Join Room)

### 입력 (Input)
**Entry Point**: "Join" button on room card in `/rooms` page

**Required Data**:
- `roomId`: UUID (from room card)

**User Actions**:
1. Click "Join" button on specific room card

### 처리 (Processing)

**Flux Action Flow**:
```typescript
// RoomActions.joinRoom(roomId)
1. Dispatch: { type: 'JOIN_ROOM_LOADING', payload: roomId }
2. Optimistically update UI:
   - Mark room as joined
   - Navigate to room
3. Insert into room_members:
   supabase.from('room_members').insert({
     room_id: roomId,
     user_id: auth.uid()
   })
4. On success:
   - Dispatch: { type: 'JOIN_ROOM_SUCCESS', payload: roomId }
   - Initialize MessagesContext for room
5. On error:
   - Revert optimistic update
   - Navigate back to rooms list
   - Dispatch: { type: 'JOIN_ROOM_ERROR', payload: errorMessage }
```

**Supabase Operations**:
- `INSERT INTO room_members (room_id, user_id) VALUES (roomId, currentUserId)`
- RLS policy: Authenticated users can insert their own membership
- UNIQUE constraint prevents duplicate joins

**Edge Cases**:
- Already a member → Skip insert, navigate directly to room
- Room deleted → Show: "This room no longer exists"
- Network error → Show error, allow retry
- Duplicate join attempt → Supabase returns UNIQUE constraint error (handle gracefully)

### 출력 (Output)

**Success State**:
- Update RoomsContext: Add roomId to user's joined rooms
- Navigate to: `/rooms/[roomId]`
- Initialize message polling for room
- Show toast: "Joined room successfully"

**Error State**:
- Stay on rooms list page
- Show error toast
- Remove loading state from button

**UI Feedback**:
- Button shows loading spinner
- Optimistic navigation (instant)
- Smooth transition to chat view

---

## 7. 텍스트 메시지 전송 (Send Text Message)

### 입력 (Input)
**Entry Point**: Message input field at bottom of `/rooms/[roomId]` page

**Required Fields**:
- `content`: string (max 2000 chars, not empty/whitespace only)

**User Actions**:
1. Type message in input field
2. Press Enter key OR click Send button
3. (Shift+Enter adds new line without sending)

### 처리 (Processing)

**Client-Side Validation**:
- Content not empty after trim
- Content length <= 2000 chars
- Sanitize input (prevent XSS)

**Flux Action Flow**:
```typescript
// MessageActions.sendMessage(roomId, content, type='text')
1. Dispatch: { type: 'SEND_MESSAGE_LOADING' }
2. Optimistically add message:
   - Generate temp ID
   - Add to messages array for roomId
   - Timestamp: now
   - Status: 'sending'
3. Insert into messages:
   supabase.from('messages').insert({
     room_id: roomId,
     user_id: auth.uid(),
     content: sanitizedContent,
     type: 'text',
     parent_message_id: replyTarget?.id || null
   })
4. On success:
   - Replace temp ID with real UUID
   - Status: 'sent'
   - Dispatch: { type: 'SEND_MESSAGE_SUCCESS', payload: message }
5. On error:
   - Mark message as failed
   - Show retry option
   - Dispatch: { type: 'SEND_MESSAGE_ERROR', payload: { tempId, error } }
```

**Supabase Operations**:
- `INSERT INTO messages` with auto-generated UUID
- RLS policy: User must be room member to insert
- Trigger updates room's last_activity timestamp

**Edge Cases**:
- Empty/whitespace only → Disable send button, no action
- Message too long → Show character count, prevent send
- Not room member → RLS blocks insert, show error
- Network error → Mark as failed, show retry button
- Rapid fire messages → Queue sends, process sequentially
- Reply mode active → Include parent_message_id

### 출력 (Output)

**Success State**:
- Add message to MessagesContext: `messagesByRoom[roomId].push(newMessage)`
- Clear input field
- Auto-scroll to bottom
- Show message with sent status

**Error State**:
- Mark message with error icon
- Keep in message list
- Show retry button
- Keep input content (allow editing)

**UI Feedback**:
- Message appears immediately (optimistic)
- Sending indicator (subtle spinner)
- Sent checkmark on confirmation
- Auto-scroll to new message
- Input field clears and refocuses

---

## 8. 이모지 전송 (Send Emoji)

### 입력 (Input)
**Entry Point**: Emoji picker button next to message input

**User Actions**:
1. Click emoji picker button
2. Select emoji from picker
3. Emoji sends immediately (no additional click needed)

### 처리 (Processing)

**Flux Action Flow**:
```typescript
// MessageActions.sendMessage(roomId, emoji, type='emoji')
1. Same flow as text message BUT:
   - content: single emoji character
   - type: 'emoji'
   - No input field interaction
2. Optimistically add emoji message
3. Insert into messages with type='emoji'
```

**Supabase Operations**:
- Same as text message with `type = 'emoji'`
- Content stored as UTF-8 emoji character

**UI Rendering**:
- Emoji messages displayed larger (text-4xl)
- Centered in message bubble
- No text wrapping needed

**Edge Cases**:
- Multiple emojis selected → Each sends separately
- Emoji picker closed → No action
- Recent emojis → Store locally (localStorage)
- Network error → Same retry mechanism as text

### 출력 (Output)

**Success State**:
- Add emoji message to MessagesContext
- Close emoji picker
- Auto-scroll to message
- Larger emoji bubble rendering

**Error State**:
- Same as text message errors
- Retry button available

**UI Feedback**:
- Instant emoji appearance
- Smooth animation
- Picker closes automatically

---

## 9. 좋아요 (Like Message)

### 입력 (Input)
**Entry Point**: Heart/Like icon on each message bubble

**Required Data**:
- `messageId`: UUID (from message)

**User Actions**:
1. Click like button/icon on any message
2. Toggle behavior: Click again to unlike

### 처리 (Processing)

**Flux Action Flow**:
```typescript
// MessageActions.likeMessage(messageId) / unlikeMessage(messageId)
1. Check current like status in likesCache
2. Optimistically update:
   - Toggle like status
   - Increment/decrement like count
3. If currently not liked:
   - INSERT INTO message_likes (message_id, user_id)
4. If currently liked:
   - DELETE FROM message_likes WHERE message_id AND user_id
5. On success:
   - Update likesCache
   - Dispatch: { type: 'UPDATE_LIKES', payload: { messageId, likes } }
6. On error:
   - Revert optimistic change
   - Dispatch: { type: 'LIKE_ERROR', payload: errorMessage }
```

**Supabase Operations**:
```typescript
// Toggle like (upsert pattern)
1. Check existence:
   SELECT * FROM message_likes
   WHERE message_id = ? AND user_id = auth.uid()
2. If exists → DELETE
3. If not exists → INSERT
```

**Efficient Implementation**:
```typescript
// Alternative: Use Postgres ON CONFLICT
INSERT INTO message_likes (message_id, user_id)
VALUES (messageId, currentUserId)
ON CONFLICT (message_id, user_id) DO DELETE
```

**Edge Cases**:
- Double-click → Toggle twice, ends in original state
- Message deleted → Likes persist but hidden
- Network error → Revert optimistic update, show error toast
- Rapid toggling → Debounce to prevent spam
- Concurrent likes from multiple users → Polling updates count

### 출력 (Output)

**Success State**:
- Update likesCache in MessagesContext
- Update like count display
- Fill/unfill heart icon
- Subtle animation on change

**Error State**:
- Revert UI change
- Show error toast briefly
- Allow retry

**UI Feedback**:
- Instant icon fill/unfill
- Count updates immediately
- Subtle scale animation
- Red heart when liked, gray when not

---

## 10. 답장 (Reply to Message)

### 입력 (Input)
**Entry Point**: Reply button/icon on each message bubble

**Required Data**:
- `parentMessage`: Message object (ID, content, sender)

**User Actions**:
1. Click reply button on target message
2. Reply preview appears above input field
3. Type reply message
4. Send normally (Enter or Send button)
5. Optional: Cancel reply (X button on preview)

### 처리 (Processing)

**Set Reply Target**:
```typescript
// MessageActions.setReplyTarget(message)
1. Dispatch: { type: 'SET_REPLY_TARGET', payload: message }
2. Update MessagesContext.replyTarget = message
3. Scroll to input field
4. Focus input field
```

**Send Reply**:
```typescript
// MessageActions.sendMessage(roomId, content, type='text')
1. Same as regular message send BUT:
   - Include parent_message_id: replyTarget.id
2. After send:
   - Clear reply target
   - Dispatch: { type: 'CLEAR_REPLY_TARGET' }
```

**Supabase Operations**:
- Insert message with `parent_message_id` foreign key
- Query parent message for display context

**Display Reply Thread**:
```typescript
// Fetch message with parent context
SELECT
  m.*,
  parent.content as parent_content,
  parent_user.display_name as parent_author
FROM messages m
LEFT JOIN messages parent ON m.parent_message_id = parent.id
LEFT JOIN user_profiles parent_user ON parent.user_id = parent_user.id
```

**Edge Cases**:
- Parent message deleted → Show "[Original message deleted]"
- Cancel reply → Clear replyTarget, no state change
- Reply to reply (nested) → Only one level of parent shown
- Multiple reply chains → Each reply independent

### 출력 (Output)

**Reply Preview (above input)**:
- Small card showing:
  - Parent author name
  - Parent message content (truncated to 50 chars)
  - Cancel button (X)

**Reply Message Display**:
- Indented or with connecting line
- Shows parent message preview inline
- "Replying to @username" label
- Tap to scroll to original message

**UI Feedback**:
- Smooth scroll to input
- Preview slides in from bottom
- Clear visual connection to parent
- Cancel clears state smoothly

---

## 11. 삭제 (Delete Message)

### 입력 (Input)
**Entry Point**: Delete button on own messages only

**Required Data**:
- `messageId`: UUID (from message)

**User Actions**:
1. Click delete button on own message
2. Confirm in dialog: "Delete this message?"
3. Click "Confirm Delete" or "Cancel"

### 처리 (Processing)

**Flux Action Flow**:
```typescript
// MessageActions.deleteMessage(messageId)
1. Show confirmation dialog
2. On confirm:
   - Dispatch: { type: 'DELETE_MESSAGE_LOADING', payload: messageId }
   - Optimistically mark as deleted in state
3. Soft delete:
   UPDATE messages
   SET deleted_at = NOW()
   WHERE id = messageId AND user_id = auth.uid()
4. On success:
   - Dispatch: { type: 'DELETE_MESSAGE_SUCCESS', payload: messageId }
5. On error:
   - Revert optimistic change
   - Dispatch: { type: 'DELETE_MESSAGE_ERROR', payload: errorMessage }
```

**Supabase Operations**:
- Soft delete: `UPDATE messages SET deleted_at = CURRENT_TIMESTAMP`
- RLS policy: Only message author can update
- Message preserved for reply context

**Display Deleted Messages**:
- Content replaced with: "[Message deleted]"
- Timestamp and author preserved
- Likes hidden
- Reply threads preserved (show placeholder)

**Edge Cases**:
- Message has replies → Still delete, show placeholder for context
- Message not owned → Delete button hidden (shouldn't happen)
- Network error → Revert deletion, show error
- Concurrent deletion → Polling updates show deleted state
- Already deleted → Show already deleted state

### 출력 (Output)

**Success State**:
- Update message in MessagesContext:
  - Set `deleted_at` timestamp
  - Replace content with placeholder
- Dismiss confirmation dialog
- Show toast: "Message deleted"

**Deleted Message Display**:
- Gray background
- Italic text: "[Message deleted]"
- No action buttons
- Timestamp and author name still visible
- Reply chain intact with placeholder

**Error State**:
- Show error in dialog OR toast
- Revert optimistic change
- Allow retry

**UI Feedback**:
- Confirmation dialog (prevent accidents)
- Smooth transition to deleted state
- Placeholder maintains message layout
- No jarring jumps in message list

---

## Appendix: Cross-Feature Flows

### Polling Architecture

**Message Polling (Active Room)**:
```typescript
// In /rooms/[roomId] component
useEffect(() => {
  const interval = setInterval(() => {
    fetchNewMessages(roomId, lastMessageTimestamp)
  }, 3000) // 3 seconds

  return () => clearInterval(interval)
}, [roomId])

// fetchNewMessages implementation
async function fetchNewMessages(roomId, since) {
  const { data } = await supabase
    .from('messages')
    .select('*, user_profiles(*)')
    .eq('room_id', roomId)
    .gt('created_at', since)
    .order('created_at', { ascending: true })

  dispatch({ type: 'APPEND_MESSAGES', payload: { roomId, messages: data } })
}
```

**Room List Polling**:
```typescript
// In /rooms component
useEffect(() => {
  const interval = setInterval(() => {
    fetchRoomUpdates()
  }, 10000) // 10 seconds

  return () => clearInterval(interval)
}, [])
```

### Optimistic UI Pattern

**Standard Optimistic Update Flow**:
1. User action triggers
2. Update local state immediately
3. Send request to Supabase
4. On success: Replace temp data with server data
5. On error: Revert local state + show error

**Example**:
```typescript
// Optimistic message send
1. Add message with tempId to local state → Instant UI update
2. POST to Supabase
3. Success: Replace tempId with real UUID from server
4. Error: Mark message as failed, show retry button
```

### Error Handling Strategy

**Network Errors**:
- Show cached data when available
- Display offline indicator
- Queue writes for retry
- Auto-retry on connection restore

**Permission Errors**:
- RLS policy violations → Clear explanation
- Redirect to appropriate page
- Don't expose technical details

**Validation Errors**:
- Inline field-level feedback
- Clear, actionable messages
- Prevent form submission until fixed

### Navigation Patterns

**Authenticated User Flow**:
```
/login → /rooms → /rooms/[roomId] → back to /rooms → logout → /login
```

**Unauthenticated Access**:
```
Any protected route → Redirect to /login → After login → Original destination
```

**Route Protection**:
- Middleware checks auth state
- Redirect to /login if unauthenticated
- Preserve intended destination in query param
- Auto-redirect after successful login

---

**End of Userflow Specification**
