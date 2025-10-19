# Use Cases Specification
# Chat Application - MVP Learning Project

**Document Version:** 1.0
**Last Updated:** 2025-10-19
**Based on:** PRD v1.0, Userflow v1.0, Database Schema v1.0

---

## Use Case Template

Each use case follows this structure:
- **UC-ID**: Unique identifier
- **Name**: Descriptive title
- **Actor**: Primary user
- **Preconditions**: Required state before execution
- **Main Flow**: Step-by-step success path
- **Alternative Flows**: Variations and edge cases
- **Exception Flows**: Error handling paths
- **Postconditions**: System state after execution
- **Business Rules**: Constraints and validations

---

## UC-001: User Registration

### Overview
**ID**: UC-001
**Name**: Register New User Account
**Actor**: Unauthenticated User
**Priority**: P0 (Critical)
**Frequency**: Once per user

### Preconditions
- User has not registered before OR has valid email not in system
- Application is accessible
- Supabase authentication service is operational

### Main Flow (Success Path)

1. User navigates to `/register` page
2. System displays registration form with fields:
   - Display Name (required)
   - Email (required)
   - Password (required)
   - Confirm Password (required)
3. User fills in all fields:
   - Display Name: "John Doe"
   - Email: "john@example.com"
   - Password: "SecurePass123"
   - Confirm Password: "SecurePass123"
4. User clicks "Register" button
5. System validates client-side:
   - Display name length: 2-50 chars ✓
   - Email format valid ✓
   - Password length >= 8 chars ✓
   - Passwords match ✓
6. System dispatches `REGISTER_LOADING` action
7. System calls `supabase.auth.signUp(email, password)`
8. Supabase creates `auth.users` record
9. Database trigger creates `user_profiles` record with display_name
10. System dispatches `REGISTER_SUCCESS` with user data
11. System auto-logs in user
12. System redirects to `/rooms`
13. System shows toast: "Welcome to the chat!"

### Alternative Flows

**AF-001-A: User Already Has Account**
- At step 3, user clicks "Already have an account? Login"
- System navigates to `/login`
- Flow ends

**AF-001-B: Password Mismatch**
- At step 5, confirm password doesn't match
- System shows inline error: "Passwords do not match"
- User corrects confirm password field
- Flow resumes at step 4

### Exception Flows

**EF-001-A: Email Already Registered**
- At step 8, Supabase returns error: Email already exists
- System dispatches `REGISTER_ERROR` with message
- System displays: "Email already registered. Try logging in."
- User can retry with different email OR navigate to login
- Flow ends

**EF-001-B: Weak Password**
- At step 8, Supabase rejects password (too weak)
- System shows: "Password must be at least 8 characters"
- User enters stronger password
- Flow resumes at step 4

**EF-001-C: Network Error**
- At step 8, network request fails
- System dispatches `REGISTER_ERROR`
- System shows: "Registration failed. Please check your connection."
- User clicks "Retry"
- Flow resumes at step 4

**EF-001-D: Invalid Email Format**
- At step 5, email format invalid (client-side check)
- System shows inline error: "Please enter a valid email"
- Form submission disabled
- User corrects email
- Flow resumes at step 4

### Postconditions

**Success**:
- New `auth.users` record created
- New `user_profiles` record created
- User authenticated (session created)
- User redirected to rooms page
- AuthContext state updated: `{ user: User, loading: false, error: null }`

**Failure**:
- No database changes
- User remains on registration page
- Error message displayed
- Form data retained (except passwords cleared)

### Business Rules

- BR-001-1: Display name must be 2-50 characters
- BR-001-2: Email must be unique across all users
- BR-001-3: Email must be valid format (RFC 5322)
- BR-001-4: Password must be minimum 8 characters
- BR-001-5: Passwords must match exactly
- BR-001-6: Auto-create profile with display_name on signup
- BR-001-7: Auto-login after successful registration

---

## UC-002: User Login

### Overview
**ID**: UC-002
**Name**: Login to Existing Account
**Actor**: Registered User
**Priority**: P0 (Critical)
**Frequency**: Multiple times per user

### Preconditions
- User has registered account
- User is not currently logged in
- Valid credentials available

### Main Flow (Success Path)

1. User navigates to `/login` page (or redirected from protected route)
2. System displays login form with fields:
   - Email (required)
   - Password (required)
3. User enters credentials:
   - Email: "john@example.com"
   - Password: "SecurePass123"
4. User presses Enter key OR clicks "Login" button
5. System validates client-side:
   - Email not empty ✓
   - Password not empty ✓
6. System dispatches `LOGIN_LOADING` action
7. System calls `supabase.auth.signInWithPassword(email, password)`
8. Supabase validates credentials
9. Supabase returns session + user object
10. System fetches user profile from `user_profiles` table
11. System dispatches `LOGIN_SUCCESS` with merged user data
12. System stores session in localStorage (Supabase automatic)
13. System redirects to `/rooms` (or original destination if redirected from protected route)
14. System starts auth state listener

### Alternative Flows

**AF-002-A: Remember Original Destination**
- User tried to access `/rooms/abc123` while logged out
- System redirected to `/login?redirect=/rooms/abc123`
- After step 13, system redirects to `/rooms/abc123` instead of `/rooms`

**AF-002-B: Already Logged In**
- User navigates to `/login` while authenticated
- System detects active session
- System immediately redirects to `/rooms`
- Flow ends

### Exception Flows

**EF-002-A: Invalid Credentials**
- At step 8, Supabase returns "Invalid login credentials"
- System dispatches `LOGIN_ERROR`
- System displays: "Invalid email or password"
- Password field cleared
- Email field retains value
- User can retry
- Flow resumes at step 3

**EF-002-B: Account Not Found**
- At step 8, email doesn't exist in system
- System shows: "No account found with this email"
- User can click "Register" to create account
- Flow ends

**EF-002-C: Network Error**
- At step 8, network request times out
- System shows: "Login failed. Check your connection."
- User clicks "Retry"
- Flow resumes at step 4

**EF-002-D: Session Expired During Login**
- At step 9, token has expired
- System automatically retries login
- If retry fails, show error
- Flow ends

### Postconditions

**Success**:
- User session created and stored
- AuthContext updated: `{ user: User, loading: false, error: null }`
- User redirected to destination
- Auth state listener active
- Protected routes accessible

**Failure**:
- No session created
- User remains on login page
- Error message displayed
- Password field cleared

### Business Rules

- BR-002-1: Session persists across browser restarts (localStorage)
- BR-002-2: Session auto-refreshes when expired (Supabase handles)
- BR-002-3: Failed login doesn't lock account (no rate limiting in MVP)
- BR-002-4: Redirect to original destination after login
- BR-002-5: Clear password field on error (security)

---

## UC-003: User Logout

### Overview
**ID**: UC-003
**Name**: Logout from Account
**Actor**: Authenticated User
**Priority**: P1 (High)
**Frequency**: Once per session

### Preconditions
- User is logged in
- Valid session exists

### Main Flow (Success Path)

1. User clicks "Logout" button in header (available on all pages)
2. System dispatches `LOGOUT_LOADING` action
3. System calls `supabase.auth.signOut()`
4. Supabase invalidates session token
5. Supabase clears localStorage
6. System dispatches `LOGOUT` action to all contexts:
   - AuthContext → reset to initial state
   - RoomsContext → clear rooms data
   - MessagesContext → clear messages cache
7. System stops all polling intervals
8. System redirects to `/login`
9. System shows toast: "Logged out successfully"

### Alternative Flows

**AF-003-A: Logout from Multiple Tabs**
- User has app open in 3 browser tabs
- User logs out in Tab 1
- Storage event propagates to other tabs
- Tabs 2 and 3 automatically logout
- All tabs redirect to login

### Exception Flows

**EF-003-A: Network Error During Logout**
- At step 4, network request fails
- System force-clears local state anyway (client-side logout)
- System shows: "Logged out (offline mode)"
- System redirects to login
- Session invalidation happens when network restores

**EF-003-B: Already Logged Out**
- User session already expired
- System detects no active session
- System skips API call
- System clears local state
- System redirects to login
- Flow ends

### Postconditions

**Success**:
- Session destroyed (server + client)
- All application state cleared
- Polling intervals stopped
- User redirected to login
- AuthContext: `{ user: null, loading: false, error: null }`

**Failure (Network Error)**:
- Local state cleared (client-side logout)
- Server session invalidated on next network activity
- User still redirected to login

### Business Rules

- BR-003-1: Always clear client state even if API fails
- BR-003-2: Stop all polling to prevent unauthorized requests
- BR-003-3: Propagate logout across browser tabs via storage events
- BR-003-4: No confirmation dialog (instant logout)

---

## UC-004: View Chat Rooms List

### Overview
**ID**: UC-004
**Name**: Browse Available Chat Rooms
**Actor**: Authenticated User
**Priority**: P0 (Critical)
**Frequency**: Multiple times per session

### Preconditions
- User is authenticated
- User has navigated to `/rooms` page

### Main Flow (Success Path)

1. User navigates to `/rooms` (default post-login destination)
2. System dispatches `FETCH_ROOMS_LOADING` action
3. System queries database:
   ```sql
   SELECT * FROM get_rooms_with_metadata()
   ```
4. Database returns rooms sorted by last activity
5. System dispatches `SET_ROOMS` action with data
6. System renders room list showing for each room:
   - Room name (bold)
   - Description (truncated to 100 chars)
   - Member count: "5 members"
   - Last activity: "2 min ago" (relative time)
   - "Join" button (if not member) OR "Open" (if member)
7. System starts polling interval (every 10 seconds)
8. User views list and browses available rooms

**Polling Cycle**:
9. After 10 seconds, system re-fetches rooms
10. System merges updates into state
11. System highlights rooms with new activity (subtle badge)
12. Repeat every 10 seconds while on page

### Alternative Flows

**AF-004-A: No Rooms Exist**
- At step 5, database returns empty array
- System shows empty state:
  - Icon: Chat bubble with "+"
  - Text: "No rooms yet. Create the first one!"
  - Button: "Create Room" (prominent)
- Flow ends

**AF-004-B: User Navigates to Room**
- At step 8, user clicks "Open" on joined room
- System navigates to `/rooms/[roomId]`
- System stops polling interval for room list
- Flow ends (transition to UC-006)

**AF-004-C: User Creates Room**
- At step 8, user clicks "Create Room" button
- System opens create room modal (UC-005)
- Flow pauses

### Exception Flows

**EF-004-A: Initial Load Failure**
- At step 4, database query fails
- System dispatches `FETCH_ROOMS_ERROR`
- System shows: "Failed to load rooms. Retrying..."
- System auto-retries after 3 seconds
- If retry succeeds, resume at step 5
- If retry fails 3 times, show manual "Retry" button

**EF-004-B: Polling Failure**
- At step 10, polling request fails
- System continues showing cached data
- System shows subtle indicator: "Offline - showing cached rooms"
- System retries on next interval
- When connection restores, indicator disappears

**EF-004-C: RLS Policy Violation**
- User's session expired mid-polling
- Database rejects query (RLS: not authenticated)
- System detects auth error
- System logs out user
- System redirects to `/login`

### Postconditions

**Success**:
- RoomsContext state updated: `{ rooms: ChatRoom[], loading: false, error: null }`
- Room list rendered with current data
- Polling active (updates every 10s)
- User can join rooms or create new ones

**Failure**:
- Error message displayed
- Cached data shown if available
- Retry mechanism active

### Business Rules

- BR-004-1: All authenticated users can view all rooms (public rooms)
- BR-004-2: Rooms sorted by last activity (most recent first)
- BR-004-3: Empty rooms sorted by creation date
- BR-004-4: Poll every 10 seconds while on page
- BR-004-5: Stop polling when navigating away
- BR-004-6: Show member count and last activity for context
- BR-004-7: Truncate long descriptions to 100 chars

---

## UC-005: Create Chat Room

### Overview
**ID**: UC-005
**Name**: Create New Chat Room
**Actor**: Authenticated User
**Priority**: P0 (Critical)
**Frequency**: Few times per user

### Preconditions
- User is authenticated
- User is on `/rooms` page

### Main Flow (Success Path)

1. User clicks "Create Room" button (floating action button or header)
2. System opens modal dialog with form:
   - Room Name (required, 3-50 chars)
   - Description (optional, max 200 chars)
3. User fills form:
   - Room Name: "Frontend Developers"
   - Description: "Discuss React, Next.js, and web development"
4. User clicks "Create" button
5. System validates client-side:
   - Room name length: 3-50 chars ✓
   - Description length: <= 200 chars ✓
   - Trim whitespace ✓
6. System dispatches `CREATE_ROOM_LOADING`
7. System generates temporary room ID: `temp-${Date.now()}`
8. System optimistically adds room to state (instant UI update)
9. System calls database:
   ```sql
   INSERT INTO chat_rooms (name, description, created_by)
   VALUES ($1, $2, auth.uid())
   RETURNING *
   ```
10. Database trigger automatically adds creator to `room_members`
11. Database returns new room with real UUID
12. System dispatches `CREATE_ROOM_SUCCESS`
13. System replaces temp ID with real UUID
14. System closes modal
15. System navigates to `/rooms/[newRoomId]` (chat view)
16. System shows toast: "Room created successfully"

### Alternative Flows

**AF-005-A: User Cancels Creation**
- At step 3, user clicks "Cancel" OR clicks outside modal
- System closes modal without changes
- System doesn't dispatch any actions
- Flow ends

**AF-005-B: Description Omitted**
- At step 3, user leaves description empty
- System accepts (description is optional)
- At step 9, description = NULL in database
- Flow continues normally

### Exception Flows

**EF-005-A: Name Too Short**
- At step 5, room name is "AB" (2 chars)
- System shows inline error: "Room name must be at least 3 characters"
- Submit button disabled
- User adds more characters
- Flow resumes at step 4

**EF-005-B: Name Too Long**
- At step 5, room name is 51+ characters
- System shows: "Room name must be 50 characters or less"
- System prevents typing beyond 50 chars (maxLength attribute)
- User shortens name
- Flow resumes at step 4

**EF-005-C: Database Insert Fails**
- At step 10, database returns error
- System dispatches `CREATE_ROOM_ERROR`
- System removes optimistic room from state (rollback)
- System shows: "Failed to create room. Please try again."
- Modal stays open with form data
- User can retry
- Flow resumes at step 4

**EF-005-D: Network Error**
- At step 9, network request times out
- System rollbacks optimistic update
- System shows: "Network error. Room not created."
- User clicks "Retry"
- Flow resumes at step 6

### Postconditions

**Success**:
- New `chat_rooms` record created
- Creator automatically added to `room_members` (via trigger)
- RoomsContext updated with new room
- User navigated to new chat room
- Modal closed

**Failure**:
- No database changes
- Optimistic update rolled back
- Modal remains open with error message
- User can retry

### Business Rules

- BR-005-1: Room name required, 3-50 characters
- BR-005-2: Description optional, max 200 characters
- BR-005-3: Duplicate room names allowed (unique by UUID)
- BR-005-4: Creator automatically becomes room member
- BR-005-5: Creator cannot leave own room (in MVP - no owner enforcement)
- BR-005-6: Optimistic UI for instant feedback
- BR-005-7: Auto-navigate to new room after creation

---

## UC-006: Join Chat Room

### Overview
**ID**: UC-006
**Name**: Join Existing Chat Room
**Actor**: Authenticated User
**Priority**: P0 (Critical)
**Frequency**: Multiple times per user

### Preconditions
- User is authenticated
- User is viewing room list (`/rooms`)
- Target room exists
- User is NOT already a member of target room

### Main Flow (Success Path)

1. User views room list
2. User identifies desired room (e.g., "Frontend Developers")
3. User clicks "Join" button on room card
4. System dispatches `JOIN_ROOM_LOADING` with roomId
5. System optimistically:
   - Changes button to "Opening..." (loading state)
   - Navigates to `/rooms/[roomId]`
6. System calls database:
   ```sql
   INSERT INTO room_members (room_id, user_id)
   VALUES ($1, auth.uid())
   RETURNING *
   ```
7. Database inserts record (RLS policy validates user is authenticated)
8. System dispatches `JOIN_ROOM_SUCCESS`
9. System initializes MessagesContext for room
10. System starts message polling for room
11. Chat view loads and displays messages

### Alternative Flows

**AF-006-A: Already a Member**
- At step 3, button shows "Open" instead of "Join"
- User clicks "Open"
- System skips database insert (step 6-8)
- System directly navigates to room
- Flow resumes at step 9

**AF-006-B: Join from Search/Link**
- User has direct link: `/rooms/[roomId]`
- User accesses link
- System checks if user is member
- If not member, system automatically joins (steps 4-8)
- If member, skip to step 9

### Exception Flows

**EF-006-A: Room Deleted**
- At step 6, database returns error: Room not found
- System dispatches `JOIN_ROOM_ERROR`
- System navigates back to `/rooms`
- System shows toast: "This room no longer exists"
- System refreshes room list
- Flow ends

**EF-006-B: Already Joined (Race Condition)**
- At step 7, UNIQUE constraint violation (user already member)
- Database returns error: "duplicate key value"
- System treats as success (user is member, goal achieved)
- System dispatches `JOIN_ROOM_SUCCESS` anyway
- Flow continues at step 9

**EF-006-C: Network Error**
- At step 6, network request fails
- System reverts optimistic navigation
- System returns to `/rooms`
- System shows: "Failed to join room. Please try again."
- "Join" button shows retry option
- Flow ends

**EF-006-D: RLS Policy Violation**
- User's session expired during join
- Database rejects insert (not authenticated)
- System detects auth error
- System logs out user
- System redirects to `/login`
- Flow ends

### Postconditions

**Success**:
- New `room_members` record created
- User navigated to chat room
- RoomsContext updated (user now member)
- MessagesContext initialized for room
- Message polling started
- User can send messages

**Failure**:
- No database changes
- User returned to room list
- Error message displayed
- Can retry join operation

### Business Rules

- BR-006-1: Users can join any room (no permissions in MVP)
- BR-006-2: Duplicate joins prevented by UNIQUE constraint
- BR-006-3: Optimistic navigation for speed
- BR-006-4: Auto-initialize messages on join
- BR-006-5: Start polling immediately after join

---

## UC-007: Send Text Message

### Overview
**ID**: UC-007
**Name**: Send Text Message in Room
**Actor**: Authenticated User (Room Member)
**Priority**: P0 (Critical)
**Frequency**: Very high (primary app function)

### Preconditions
- User is authenticated
- User is member of current room
- User is viewing room chat (`/rooms/[roomId]`)
- Message input field is focused

### Main Flow (Success Path)

1. User types message in input field: "Hello everyone!"
2. Character count updates: "13 / 2000"
3. Send button enabled (content not empty)
4. User presses Enter key (OR clicks Send button)
5. System validates client-side:
   - Content not empty after trim ✓
   - Content length <= 2000 chars ✓
   - User is room member ✓
6. System sanitizes input (prevent XSS)
7. System dispatches `SEND_MESSAGE_LOADING`
8. System creates optimistic message:
   ```typescript
   {
     id: `temp-${Date.now()}`,
     room_id: currentRoomId,
     content: "Hello everyone!",
     user_id: currentUserId,
     created_at: new Date().toISOString(),
     type: 'text',
     status: 'sending'
   }
   ```
9. System adds optimistic message to MessagesContext
10. System clears input field
11. System auto-scrolls to bottom of message list
12. Message appears immediately with "sending" indicator
13. System calls database:
    ```sql
    INSERT INTO messages (room_id, user_id, content, type)
    VALUES ($1, auth.uid(), $2, 'text')
    RETURNING *
    ```
14. Database inserts record (RLS validates room membership)
15. Database returns message with real UUID
16. System dispatches `SEND_MESSAGE_SUCCESS`
17. System replaces temp ID with real UUID
18. System updates message status to 'sent' (show checkmark)

### Alternative Flows

**AF-007-A: Send with Shift+Enter (New Line)**
- At step 4, user presses Shift+Enter
- System inserts newline character in input
- Message NOT sent
- Flow ends (user continues typing)

**AF-007-B: Send in Reply Mode**
- User previously clicked "Reply" on message (UC-010)
- Reply preview shown above input
- At step 8, optimistic message includes:
   ```typescript
   parent_message_id: replyTarget.id
   ```
- At step 13, database includes parent_message_id
- After step 18, system clears reply target
- Message displays with reply context

**AF-007-C: Empty Message (Whitespace Only)**
- At step 5, content is "   " (whitespace only)
- System trims to empty string
- System blocks send (button disabled)
- Flow ends

### Exception Flows

**EF-007-A: Message Too Long**
- At step 5, content length is 2001+ characters
- System shows warning: "Message too long (2001/2000)"
- Send button disabled
- System prevents typing beyond 2000 chars (client-side)
- User removes characters
- Flow resumes at step 4

**EF-007-B: Not Room Member (RLS Violation)**
- At step 14, database rejects insert (RLS policy)
- System dispatches `SEND_MESSAGE_ERROR`
- System marks optimistic message as 'failed'
- System shows: "You must join the room to send messages"
- Message shows retry button
- User must join room first
- Flow ends

**EF-007-C: Network Error**
- At step 13, network request times out
- System marks message as 'failed' (red indicator)
- System shows retry button on message
- User clicks retry
- Flow resumes at step 13 (re-send attempt)

**EF-007-D: XSS Attack Attempt**
- At step 6, content includes: `<script>alert('xss')</script>`
- System sanitizes to: `&lt;script&gt;alert('xss')&lt;/script&gt;`
- System proceeds with sanitized content
- Message displays as plain text (safe)

### Postconditions

**Success**:
- New `messages` record in database
- Message appears in all room members' views (via polling)
- Input field cleared
- Message list scrolled to bottom
- MessagesContext updated with sent message
- Optimistic message replaced with real data

**Failure**:
- Message marked as failed
- Retry option available
- Input field retains content (for editing)
- No database record created

### Business Rules

- BR-007-1: Content max 2000 characters
- BR-007-2: Content cannot be empty or whitespace only
- BR-007-3: Enter sends, Shift+Enter adds new line
- BR-007-4: Must be room member to send (RLS enforced)
- BR-007-5: XSS prevention via sanitization
- BR-007-6: Optimistic UI for instant feedback
- BR-007-7: Auto-scroll to new message
- BR-007-8: Clear input after send
- BR-007-9: Show sending/sent/failed status

---

## UC-008: Send Emoji Message

### Overview
**ID**: UC-008
**Name**: Send Emoji-Only Message
**Actor**: Authenticated User (Room Member)
**Priority**: P1 (High)
**Frequency**: Moderate

### Preconditions
- User is authenticated
- User is member of current room
- User is viewing room chat

### Main Flow (Success Path)

1. User clicks emoji picker button (next to input field)
2. System opens emoji picker modal/popover
3. System loads recent emojis from localStorage
4. User browses emoji categories (Smileys, Animals, Food, etc.)
5. User clicks desired emoji: "👍"
6. System immediately:
   - Closes emoji picker
   - Creates optimistic message with type='emoji'
   - Dispatches `SEND_MESSAGE_LOADING`
7. System calls database:
   ```sql
   INSERT INTO messages (room_id, user_id, content, type)
   VALUES ($1, auth.uid(), '👍', 'emoji')
   RETURNING *
   ```
8. Database returns message
9. System dispatches `SEND_MESSAGE_SUCCESS`
10. System saves emoji to recent emojis (localStorage)
11. Emoji appears in message list (larger rendering)
12. System auto-scrolls to message

### Alternative Flows

**AF-008-A: Select from Recent Emojis**
- At step 4, user clicks "Recent" tab
- System shows last 20 used emojis
- User clicks recent emoji
- Flow continues at step 6

**AF-008-B: Multiple Emojis Sent**
- User clicks emoji: "👍"
- Message sent (flow completes)
- User immediately clicks emoji picker again
- User clicks another emoji: "🎉"
- Second message sent
- Each emoji is separate message

**AF-008-C: Close Emoji Picker Without Selection**
- At step 5, user clicks outside picker OR presses Escape
- System closes picker
- No message sent
- Flow ends

### Exception Flows

**EF-008-A: Emoji Picker Load Failure**
- At step 2, emoji picker library fails to load
- System falls back to native emoji input
- System shows: "Use device emoji keyboard"
- User can use OS emoji picker instead
- Flow adapts to fallback method

**EF-008-B: Network Error During Send**
- At step 7, network fails
- Same as UC-007 EF-007-C (retry mechanism)
- Emoji message marked as failed
- User can retry send

### Postconditions

**Success**:
- Emoji message in database with type='emoji'
- Emoji rendered larger than text (CSS: text-4xl)
- Emoji added to recent emojis list
- Message appears centered in bubble
- All polling users see emoji message

**Failure**:
- Fallback to alternative emoji input
- Retry mechanism available

### Business Rules

- BR-008-1: Each emoji click sends immediately (no input field)
- BR-008-2: Emoji messages stored with type='emoji'
- BR-008-3: Emojis rendered larger than text emojis
- BR-008-4: Recent emojis stored locally (max 20)
- BR-008-5: Emoji picker closes after selection
- BR-008-6: Native emoji input as fallback

---

## UC-009: Like Message

### Overview
**ID**: UC-009
**Name**: Like/Unlike Message
**Actor**: Authenticated User (Room Member)
**Priority**: P1 (High)
**Frequency**: High

### Preconditions
- User is authenticated
- User is member of room
- User is viewing message in room chat
- Message is not deleted

### Main Flow (Success Path - Like)

1. User hovers over message
2. System shows message actions (like, reply, delete if own)
3. Message currently shows: ♡ 3 (unliked, 3 others liked)
4. User clicks heart icon
5. System optimistically:
   - Fills heart icon: ♥ (red)
   - Increments count: ♥ 4
   - Adds subtle scale animation
6. System dispatches `LIKE_MESSAGE_LOADING`
7. System calls database:
   ```sql
   INSERT INTO message_likes (message_id, user_id)
   VALUES ($1, auth.uid())
   RETURNING *
   ```
8. Database inserts like record (RLS validates room membership)
9. System dispatches `UPDATE_LIKES` with new like data
10. System updates likesCache in MessagesContext
11. Like persists (confirmed)

### Alternative Flows

**AF-009-A: Unlike (Toggle Off)**
- At step 3, message shows: ♥ 4 (user already liked)
- User clicks heart icon
- System optimistically:
  - Unfills heart: ♡ (gray)
  - Decrements count: ♡ 3
- At step 7, system calls DELETE instead:
  ```sql
  DELETE FROM message_likes
  WHERE message_id = $1 AND user_id = auth.uid()
  ```
- Database removes like
- Flow continues similarly

**AF-009-B: Double-Click (Rapid Toggle)**
- User clicks like twice rapidly
- System debounces to prevent spam
- Only final state persists (liked OR unliked)
- One database operation executed

### Exception Flows

**EF-009-A: Network Error**
- At step 7, network fails
- System reverts optimistic update:
  - Unfills heart back to ♡
  - Decrements count back to 3
- System shows subtle error toast: "Like failed"
- User can retry by clicking again
- Flow resumes at step 4

**EF-009-B: RLS Violation (Not Room Member)**
- At step 8, database rejects insert (user left room)
- System reverts optimistic update
- System shows: "You must be a room member to like messages"
- Flow ends

**EF-009-C: Message Deleted During Like**
- At step 8, parent message has been deleted
- Foreign key constraint allows (ON DELETE CASCADE doesn't prevent insert)
- Like still recorded in database
- User doesn't see count update (message shows "[Message deleted]")

### Postconditions

**Success (Liked)**:
- New `message_likes` record in database
- Heart icon filled (red)
- Like count incremented
- likesCache updated
- All room members see updated count (via polling)

**Success (Unliked)**:
- `message_likes` record deleted
- Heart icon unfilled (gray)
- Like count decremented

**Failure**:
- Optimistic update reverted
- Error message shown
- Can retry operation

### Business Rules

- BR-009-1: Users can like any message in their rooms
- BR-009-2: One like per user per message (UNIQUE constraint)
- BR-009-3: Clicking again toggles unlike
- BR-009-4: Like count visible to all room members
- BR-009-5: Deleted messages retain likes (but hidden in UI)
- BR-009-6: Optimistic updates for instant feedback
- BR-009-7: Debounce rapid clicks (prevent spam)

---

## UC-010: Reply to Message

### Overview
**ID**: UC-010
**Name**: Reply to Specific Message
**Actor**: Authenticated User (Room Member)
**Priority**: P1 (High)
**Frequency**: Moderate

### Preconditions
- User is authenticated
- User is member of room
- User is viewing message in chat
- Parent message exists (not deleted OR deleted but preserved)

### Main Flow (Success Path)

1. User hovers over message
2. System shows message actions
3. User clicks "Reply" button
4. System dispatches `SET_REPLY_TARGET` with message data
5. System updates MessagesContext.replyTarget = parentMessage
6. System displays reply preview above input:
   - Parent author: "John Doe"
   - Parent content: "What do you think?" (truncated to 50 chars if longer)
   - Cancel button (X icon)
7. System scrolls to input field
8. System focuses input field
9. User types reply: "I agree with this!"
10. User presses Enter
11. System calls send message (UC-007) WITH parent_message_id
12. System clears reply target after send
13. Reply message appears with visual connection:
    - Indent OR vertical line to parent
    - Shows parent message preview inline
    - Label: "Replying to @John"
14. Clicking parent preview scrolls to original message

### Alternative Flows

**AF-010-A: Cancel Reply**
- At step 9, user clicks X button on reply preview
- System dispatches `CLEAR_REPLY_TARGET`
- System removes reply preview
- Input field remains (can send regular message)
- Flow ends

**AF-010-B: Reply to Reply (Nested)**
- At step 3, user replies to a message that is itself a reply
- System only references direct parent (1 level deep)
- Nested chains shown via UI (not deeply tracked in DB)
- Flow continues normally

**AF-010-C: Switch Reply Target**
- User sets reply target to Message A
- Before sending, user clicks "Reply" on Message B
- System replaces reply target with Message B
- Only one reply target active at a time

### Exception Flows

**EF-010-A: Parent Message Deleted Before Reply Sent**
- At step 11, parent_message_id points to deleted message
- Database allows (foreign key: ON DELETE SET NULL)
- Reply sent successfully
- Reply shows: "Replying to [deleted message]"
- Flow completes normally

**EF-010-B: Parent Message Deleted Before Opening Reply**
- At step 3, user clicks reply on deleted message
- System allows reply (message still in database, just soft deleted)
- Reply preview shows: "[Deleted message]"
- User can still send reply
- Flow continues

### Postconditions

**Success**:
- Reply message sent with parent_message_id
- Reply preview cleared
- Message appears with reply context
- Parent-child relationship visible in UI
- Clicking reply scrolls to parent (if not deleted)

**Cancel**:
- Reply target cleared
- Input field normal state
- No message sent

### Business Rules

- BR-010-1: Only 1 level of reply tracked (parent_message_id)
- BR-010-2: Can reply to deleted messages (preserved in DB)
- BR-010-3: Reply preview shows truncated parent content (50 chars)
- BR-010-4: Visual connection (indent/line) to parent
- BR-010-5: Clicking parent preview scrolls to original
- BR-010-6: Reply target cleared after send
- BR-010-7: Can cancel reply without sending

---

## UC-011: Delete Own Message

### Overview
**ID**: UC-011
**Name**: Delete Own Message (Soft Delete)
**Actor**: Authenticated User (Message Author)
**Priority**: P1 (High)
**Frequency**: Occasional

### Preconditions
- User is authenticated
- User is viewing room chat
- User is author of target message
- Message not already deleted

### Main Flow (Success Path)

1. User hovers over own message
2. System shows message actions (like, reply, delete)
3. User clicks "Delete" button (trash icon)
4. System opens confirmation dialog:
   - Title: "Delete this message?"
   - Body: "This action cannot be undone."
   - Buttons: "Cancel" | "Delete" (red, destructive)
5. User clicks "Delete" button
6. System dispatches `DELETE_MESSAGE_LOADING`
7. System optimistically:
   - Marks message as deleted in state
   - Replaces content with "[Message deleted]"
   - Removes action buttons
   - Grays out message bubble
8. System calls database:
   ```sql
   UPDATE messages
   SET deleted_at = NOW()
   WHERE id = $1 AND user_id = auth.uid()
   RETURNING *
   ```
9. Database soft deletes (sets deleted_at timestamp)
10. RLS policy validates user is author
11. Database returns updated message
12. System dispatches `DELETE_MESSAGE_SUCCESS`
13. System closes confirmation dialog
14. System shows toast: "Message deleted"
15. Message permanently shows as deleted

### Alternative Flows

**AF-011-A: User Cancels Deletion**
- At step 5, user clicks "Cancel" OR clicks outside dialog
- System closes dialog without changes
- Message remains intact
- Flow ends

**AF-011-B: Delete Message with Replies**
- Target message has child replies (parent_message_id references it)
- User confirms deletion (step 5)
- Message deleted (soft delete)
- Child replies preserved with "[Original message deleted]" placeholder
- Reply threads remain intact

### Exception Flows

**EF-011-A: Not Message Author**
- Delete button not visible (filtered client-side)
- If user somehow triggers delete:
  - At step 10, RLS policy blocks update (user_id mismatch)
  - System reverts optimistic update
  - System shows: "You can only delete your own messages"
  - Flow ends

**EF-011-B: Message Already Deleted**
- At step 9, database returns 0 rows updated (message has deleted_at)
- System treats as success (goal achieved)
- Dialog closes
- Message already shows as deleted
- Flow ends

**EF-011-C: Network Error**
- At step 8, network request fails
- System reverts optimistic update
- Message restored to original state
- System shows: "Failed to delete message. Try again."
- Dialog remains open
- User can retry
- Flow resumes at step 6

**EF-011-D: Concurrent Deletion (Race Condition)**
- User has message open in two tabs
- User deletes in Tab 1 (succeeds)
- User tries to delete in Tab 2
- Same as EF-011-B (already deleted)

### Postconditions

**Success**:
- Message `deleted_at` timestamp set in database
- Message content replaced with "[Message deleted]"
- Message actions hidden
- Message grayed out in UI
- Likes hidden (but preserved in DB)
- Reply threads preserved with placeholder
- All room members see deletion (via polling)

**Cancel**:
- No changes to message
- Dialog closed
- Message remains normal

### Business Rules

- BR-011-1: Only message author can delete own messages
- BR-011-2: Soft delete (deleted_at timestamp, not hard delete)
- BR-011-3: Deleted messages show as "[Message deleted]"
- BR-011-4: Reply threads preserved even if parent deleted
- BR-011-5: Likes preserved in database but hidden in UI
- BR-011-6: No restore/undo functionality (MVP)
- BR-011-7: Confirmation dialog prevents accidental deletion
- BR-011-8: Optimistic update for instant feedback

---

## Use Case Dependencies

```
UC-001 (Register) → UC-002 (Login) → UC-004 (View Rooms)
                                          ↓
                                      UC-005 (Create Room)
                                          ↓
                                      UC-006 (Join Room)
                                          ↓
                        ┌─────────────────┴─────────────────┐
                        ↓                                   ↓
                    UC-007 (Send Text)              UC-008 (Send Emoji)
                        ↓                                   ↓
                ┌───────┴────────┬──────────────────────────┘
                ↓                ↓                  ↓
            UC-009 (Like)    UC-010 (Reply)    UC-011 (Delete)

UC-003 (Logout) → UC-002 (Login)
```

---

## Validation Checklist

Before implementation, verify:

- ✅ All 11 use cases documented
- ✅ Success paths clearly defined
- ✅ Alternative flows considered
- ✅ Exception handling comprehensive
- ✅ Business rules extracted
- ✅ Preconditions and postconditions specified
- ✅ Database interactions mapped
- ✅ RLS policies aligned with use cases
- ✅ Optimistic UI patterns defined
- ✅ Error messages user-friendly

---

**End of Use Cases Document**
