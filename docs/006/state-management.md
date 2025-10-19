# State Management Design
# Chat Application - MVP Learning Project

**Document Version:** 1.0
**Last Updated:** 2025-10-19
**Based on:** PRD v1.0, Userflow v1.0, Use Cases v1.0
**Pattern:** Flux Architecture with React Context API

---

## State Management Philosophy

### Core Principles

1. **Single Source of Truth**: Each piece of data lives in exactly one place
2. **Unidirectional Data Flow**: Data flows in one direction (Action → Reducer → State → View)
3. **Minimal State**: Only store what cannot be derived
4. **Separation of Concerns**: UI state vs Application state vs Server state
5. **Optimistic Updates**: Update UI immediately, confirm server-side
6. **Predictable State**: Same actions produce same state changes

---

## State Classification

### What Goes Into Global State (Context)

**Store ONLY**:
- ✅ **Server Data**: Data from database that needs sharing across components
- ✅ **Authentication State**: Current user, session status
- ✅ **Shared Application State**: Data needed by multiple unrelated components
- ✅ **Polling Data**: Real-time-ish data that updates periodically

**Examples**:
```typescript
// ✅ GOOD: Shared server data
AuthContext: { user, loading, error }
RoomsContext: { rooms, activeRoomId }
MessagesContext: { messagesByRoom }

// ❌ BAD: Derived data
MessagesContext: { totalMessageCount } // Can be calculated
RoomsContext: { roomsSortedByName } // Can be derived with useMemo
```

---

### What DOES NOT Go Into Global State

**Keep in LOCAL STATE (useState)**:
- ❌ **UI-Only State**: Modal open/closed, dropdown expanded
- ❌ **Form State**: Input values, validation errors
- ❌ **Derived Data**: Calculations based on existing state
- ❌ **Temporary UI State**: Hover effects, focus state
- ❌ **Component-Specific Data**: Data only one component needs

**Examples**:
```typescript
// ✅ GOOD: Local component state
function CreateRoomModal() {
  const [isOpen, setIsOpen] = useState(false) // UI state
  const [roomName, setRoomName] = useState('') // Form state
  const [error, setError] = useState<string | null>(null) // Local error
}

// ✅ GOOD: Derived data with useMemo
function RoomList() {
  const { rooms } = useRooms()

  // Derived - don't store in context
  const sortedRooms = useMemo(
    () => [...rooms].sort((a, b) => a.name.localeCompare(b.name)),
    [rooms]
  )
}

// ❌ BAD: Storing derived data in context
interface RoomsState {
  rooms: ChatRoom[]
  sortedRooms: ChatRoom[] // DON'T DO THIS
  filteredRooms: ChatRoom[] // DON'T DO THIS
}
```

---

### What NEVER Goes Into State

**Use CONSTANTS or DIRECT VALUES**:
- ❌ Static configuration (API URLs, constants)
- ❌ Hardcoded lists (countries, timezones)
- ❌ Environment variables

**Use REFS (useRef)**:
- ❌ DOM references
- ❌ Mutable values that don't trigger re-renders
- ❌ Previous values for comparison

**Examples**:
```typescript
// ✅ GOOD: Constants file
// utils/constants.ts
export const POLLING_INTERVAL = {
  MESSAGES: 3000,
  ROOMS: 10000
}
export const MAX_MESSAGE_LENGTH = 2000

// ✅ GOOD: Refs for non-reactive values
function MessageList() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastMessageIdRef = useRef<string | null>(null)
}

// ❌ BAD: Storing in state
const [pollingInterval, setPollingInterval] = useState(3000) // Don't do this
```

---

## Context Structure

### Context Separation Strategy

**AuthContext** - Authentication & User Identity
- **Responsibility**: Who is the current user?
- **Scope**: Application-wide
- **Lifetime**: Entire session
- **Data**:
  - Current authenticated user
  - Loading state (checking session)
  - Authentication errors
- **Actions**:
  - Login
  - Register
  - Logout
  - Refresh session

**RoomsContext** - Chat Rooms Management
- **Responsibility**: What rooms exist and which is active?
- **Scope**: Application-wide (shared across views)
- **Lifetime**: While authenticated
- **Data**:
  - List of available rooms
  - Active/current room ID
  - Loading state
  - Errors
- **Actions**:
  - Fetch rooms
  - Create room
  - Join room
  - Leave room
  - Set active room

**MessagesContext** - Messages & Interactions
- **Responsibility**: What messages exist in rooms and interactions?
- **Scope**: Per-room (but managed globally for caching)
- **Lifetime**: While in rooms
- **Data**:
  - Messages indexed by room ID
  - Likes cache (per message)
  - Reply target (current reply context)
  - Loading state
  - Errors
- **Actions**:
  - Fetch messages
  - Send message
  - Delete message
  - Like/unlike message
  - Set/clear reply target

---

### Why This Separation?

**AuthContext Separate**:
- Authentication is orthogonal to chat functionality
- Used by all parts of app (header, protected routes, etc.)
- Different lifetime (persists across route changes)
- Can be used independently in other apps

**RoomsContext Separate from MessagesContext**:
- Room list can be viewed without loading messages
- Room metadata (name, member count) independent of message content
- Different polling intervals (rooms: 10s, messages: 3s)
- Different data volumes (100 rooms vs 10,000 messages)

**MessagesContext for All Rooms**:
- Cache messages across room navigation
- Share likes cache efficiently
- Single reply target (can't reply in two rooms simultaneously)
- Unified loading/error states

---

## State Shape Definitions

### 1. AuthContext State

```typescript
interface AuthState {
  // Core user data
  user: User | null

  // Loading states
  loading: boolean

  // Error handling
  error: string | null
}

interface User {
  id: string              // UUID from auth.users
  email: string           // User's email
  display_name: string    // From user_profiles
  created_at: string      // ISO timestamp
}

interface AuthContextType extends AuthState {
  // Actions (functions)
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}
```

**Why This Shape**:
- `user: null` clearly indicates logged out state
- Single `loading` flag (not separate per action - keep simple)
- Single `error` string (latest error, cleared on success)
- Actions return `Promise<void>` (errors handled via state)

**What's NOT Included**:
- ❌ Session token (Supabase handles internally)
- ❌ User preferences (add in V2 if needed)
- ❌ User profile picture (out of MVP scope)

---

### 2. RoomsContext State

```typescript
interface RoomsState {
  // Core room data
  rooms: ChatRoom[]

  // UI state (which room is active/open)
  activeRoomId: string | null

  // Loading states
  loading: boolean

  // Error handling
  error: string | null
}

interface ChatRoom {
  id: string                    // UUID
  name: string                  // 3-50 chars
  description: string | null    // Optional, max 200 chars
  created_by: string            // UUID of creator
  created_at: string            // ISO timestamp

  // Metadata (from database query, not separate calls)
  member_count?: number         // Number of members
  last_message_at?: string      // ISO timestamp of last message
}

interface RoomsContextType extends RoomsState {
  // Actions
  fetchRooms: () => Promise<void>
  createRoom: (name: string, description?: string) => Promise<ChatRoom>
  joinRoom: (roomId: string) => Promise<void>
  leaveRoom: (roomId: string) => Promise<void>
  setActiveRoom: (roomId: string | null) => void
}
```

**Why This Shape**:
- Array of rooms (ordered by last activity server-side)
- Metadata included in room object (fetched together)
- `activeRoomId` separate (UI concern, not server data)
- Single loading flag (room list operations are sequential)

**What's NOT Included**:
- ❌ `userRooms` separate array (filter from `rooms` client-side)
- ❌ `sortOrder` (derive with useMemo in component)
- ❌ Per-room member lists (fetch on-demand if needed)

---

### 3. MessagesContext State

```typescript
interface MessagesState {
  // Messages indexed by room ID for efficient lookup
  messagesByRoom: Record<string, Message[]>

  // Likes cache (avoid separate DB calls)
  likesCache: Record<string, MessageLike[]> // messageId → likes

  // Reply state (UI concern but needs global state)
  replyTarget: Message | null

  // Loading states
  loading: boolean

  // Error handling
  error: string | null
}

interface Message {
  id: string                        // UUID
  room_id: string                   // FK to chat_rooms
  user_id: string                   // FK to auth.users
  content: string                   // Message text (max 2000)
  type: 'text' | 'emoji'            // Message type
  parent_message_id: string | null  // For replies
  created_at: string                // ISO timestamp
  deleted_at: string | null         // Soft delete timestamp

  // Optimistic UI fields (client-only)
  status?: 'sending' | 'sent' | 'failed' // Not in DB
  tempId?: string                        // Temporary ID during send

  // Joined data (from query, not separate)
  author_name?: string              // From user_profiles join
  parent_content?: string           // From parent message join
  parent_author?: string            // From parent message author
}

interface MessageLike {
  message_id: string
  user_id: string
  created_at: string
}

interface MessagesContextType extends MessagesState {
  // Message actions
  fetchMessages: (roomId: string, since?: string) => Promise<void>
  sendMessage: (roomId: string, content: string, type?: 'text' | 'emoji') => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>

  // Like actions
  likeMessage: (messageId: string) => Promise<void>
  unlikeMessage: (messageId: string) => Promise<void>

  // Reply actions
  setReplyTarget: (message: Message | null) => void
  clearReplyTarget: () => void
}
```

**Why This Shape**:
- `messagesByRoom` record for O(1) lookup by room ID
- Likes cached to avoid repeated queries
- Reply target global (can only reply in one place at a time)
- Optimistic fields (`status`, `tempId`) for instant UI feedback
- Joined data included (fetched together, not separate queries)

**What's NOT Included**:
- ❌ `currentRoomMessages` (derive from `messagesByRoom[activeRoomId]`)
- ❌ `unreadCount` (add in V2 if needed)
- ❌ `typingUsers` (out of MVP scope - no presence)

---

## State Access Patterns

### How Components Access State

**Via Custom Hooks** (Recommended):
```typescript
// hooks/useAuth.ts
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// Component usage
function LoginForm() {
  const { user, login, loading, error } = useAuth()
  // Only re-renders when AuthContext state changes
}
```

**Selective Access** (Performance Optimization):
```typescript
// ✅ GOOD: Only subscribe to what you need
function UserName() {
  const { user } = useAuth() // Only user, not loading/error
  return <span>{user?.display_name}</span>
}

// ❌ BAD: Subscribing to entire context
function UserName() {
  const auth = useAuth() // Re-renders on loading/error changes too
  return <span>{auth.user?.display_name}</span>
}
```

**Memoization** (Prevent Unnecessary Re-renders):
```typescript
// Provider memoizes action functions
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Memoize actions to prevent new references on every render
  const login = useCallback(async (email: string, password: string) => {
    await authActions.login(email, password, dispatch)
  }, [])

  const logout = useCallback(async () => {
    await authActions.logout(dispatch)
  }, [])

  // Memoize context value
  const value = useMemo(
    () => ({ ...state, login, logout }),
    [state, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
```

---

## State Update Patterns

### 1. Optimistic Updates (Instant UI)

**Pattern**: Update state immediately, confirm server-side
```typescript
// Example: Send message optimistically
async function sendMessage(roomId: string, content: string, dispatch: Dispatch) {
  const tempId = `temp-${Date.now()}`

  // 1. Optimistic update (instant UI)
  dispatch({
    type: 'ADD_MESSAGE_OPTIMISTIC',
    payload: {
      roomId,
      message: {
        id: tempId,
        content,
        created_at: new Date().toISOString(),
        status: 'sending'
      }
    }
  })

  try {
    // 2. Server call
    const { data, error } = await supabase.from('messages').insert(...)

    if (error) throw error

    // 3. Replace temp with real data
    dispatch({
      type: 'REPLACE_MESSAGE',
      payload: { tempId, message: data }
    })
  } catch (error) {
    // 4. Mark as failed (don't remove - allow retry)
    dispatch({
      type: 'MESSAGE_SEND_FAILED',
      payload: { tempId, error: error.message }
    })
  }
}
```

**When to Use**:
- ✅ Sending messages
- ✅ Creating rooms
- ✅ Toggling likes
- ✅ Joining rooms

**When NOT to Use**:
- ❌ Fetching data (no optimistic read)
- ❌ Deleting (confirmation dialog delays anyway)
- ❌ Login/logout (authentication must be confirmed)

---

### 2. Polling Updates (Real-time-ish)

**Pattern**: Periodically fetch new data
```typescript
// Example: Poll for new messages
function ChatRoom({ roomId }: { roomId: string }) {
  const { messagesByRoom, fetchMessages } = useMessages()

  useEffect(() => {
    // Initial fetch
    fetchMessages(roomId)

    // Poll every 3 seconds
    const interval = setInterval(() => {
      const messages = messagesByRoom[roomId] || []
      const lastMessage = messages[messages.length - 1]
      const since = lastMessage?.created_at || new Date(0).toISOString()

      fetchMessages(roomId, since) // Only fetch new messages
    }, 3000)

    // Cleanup on unmount
    return () => clearInterval(interval)
  }, [roomId, fetchMessages])

  const messages = messagesByRoom[roomId] || []
  return <MessageList messages={messages} />
}
```

**Polling Intervals**:
- Messages: 3 seconds (active room only)
- Room list: 10 seconds (when viewing room list)
- Likes: Included in message polling (no separate poll)

**Optimization**:
- Only poll when component mounted
- Use `since` timestamp to fetch only new data
- Clear interval on unmount to prevent memory leaks

---

### 3. Derived State (Computed Values)

**Pattern**: Calculate from existing state, don't store
```typescript
// ✅ GOOD: Derive in component with useMemo
function RoomList() {
  const { rooms } = useRooms()
  const { user } = useAuth()

  // Derive user's joined rooms
  const joinedRooms = useMemo(
    () => rooms.filter(room => isUserMember(room, user?.id)),
    [rooms, user?.id]
  )

  // Derive sorted rooms
  const sortedRooms = useMemo(
    () => [...joinedRooms].sort((a, b) =>
      (b.last_message_at || b.created_at).localeCompare(
        a.last_message_at || a.created_at
      )
    ),
    [joinedRooms]
  )

  return <div>{sortedRooms.map(room => <RoomCard key={room.id} room={room} />)}</div>
}

// ❌ BAD: Storing derived data in context
interface RoomsState {
  rooms: ChatRoom[]
  joinedRooms: ChatRoom[] // Don't do this - derive it
  sortedRooms: ChatRoom[] // Don't do this - derive it
}
```

**Benefits**:
- Less state to manage
- No synchronization issues
- Simpler reducers
- Clear data flow

---

## State Persistence Strategy

### What to Persist (localStorage)

**Persist**:
- ✅ Authentication session (Supabase handles automatically)
- ✅ Recent emojis (localStorage, max 20)
- ✅ User preferences (future: theme, notification settings)

**Do NOT Persist**:
- ❌ Messages cache (too large, fetch on demand)
- ❌ Rooms list (can change, fetch on load)
- ❌ Likes cache (small enough to fetch quickly)

```typescript
// Example: Persist recent emojis
function saveRecentEmoji(emoji: string) {
  const recent = JSON.parse(localStorage.getItem('recent_emojis') || '[]')
  const updated = [emoji, ...recent.filter(e => e !== emoji)].slice(0, 20)
  localStorage.setItem('recent_emojis', JSON.stringify(updated))
}

function getRecentEmojis(): string[] {
  return JSON.parse(localStorage.getItem('recent_emojis') || '[]')
}
```

---

## Error Handling in State

### Error State Strategy

**Pattern**: Single error string per context
```typescript
interface State {
  data: DataType
  loading: boolean
  error: string | null // Single error, latest issue
}

// Clear error on success
case 'ACTION_SUCCESS':
  return { ...state, loading: false, error: null }

// Set error on failure
case 'ACTION_ERROR':
  return { ...state, loading: false, error: action.payload }
```

**Error Display**:
```typescript
// Component renders error
function MyComponent() {
  const { data, loading, error } = useMyContext()

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={() => retryAction()} />

  return <DataDisplay data={data} />
}
```

**Error Types**:
- Network errors: "Failed to connect. Please try again."
- Validation errors: "Email already registered. Try logging in."
- Permission errors: "You don't have access to this room."
- Generic errors: "Something went wrong. Please try again."

---

## Performance Considerations

### Preventing Unnecessary Re-renders

**1. Memoize Context Value**:
```typescript
const value = useMemo(
  () => ({ ...state, action1, action2 }),
  [state, action1, action2]
)
```

**2. Memoize Action Functions**:
```typescript
const login = useCallback(async (email, password) => {
  await authActions.login(email, password, dispatch)
}, []) // Empty deps - function never changes
```

**3. Split Large Contexts**:
```typescript
// ❌ BAD: One giant context
AppContext: { user, rooms, messages, likes, settings, ... }

// ✅ GOOD: Separate concerns
AuthContext: { user }
RoomsContext: { rooms }
MessagesContext: { messages, likes }
```

**4. Selective Subscriptions**:
```typescript
// ✅ GOOD: Only subscribe to needed values
const { user } = useAuth() // Only user

// ❌ BAD: Subscribe to everything
const auth = useAuth() // Entire context
```

---

## State Management Anti-Patterns

### What to AVOID

**❌ Anti-Pattern 1: Over-Normalizing**
```typescript
// BAD: Too normalized, complex lookups
interface State {
  messagesById: Record<string, Message>
  messageIdsByRoom: Record<string, string[]>
  likesById: Record<string, Like>
  likeIdsByMessage: Record<string, string[]>
}

// GOOD: Simple structure for small app
interface State {
  messagesByRoom: Record<string, Message[]>
  likesCache: Record<string, Like[]>
}
```

**❌ Anti-Pattern 2: Storing Derived Data**
```typescript
// BAD: Storing computed values
interface State {
  rooms: ChatRoom[]
  sortedRooms: ChatRoom[] // Derived - don't store
  filteredRooms: ChatRoom[] // Derived - don't store
}

// GOOD: Compute on demand
const sortedRooms = useMemo(() => [...rooms].sort(...), [rooms])
```

**❌ Anti-Pattern 3: Too Many Contexts**
```typescript
// BAD: Over-splitting
<AuthProvider>
  <UserProfileProvider>
    <SessionProvider>
      <PermissionsProvider>
        {/* Too many providers */}
      </PermissionsProvider>
    </SessionProvider>
  </UserProfileProvider>
</AuthProvider>

// GOOD: Combine related state
<AuthProvider> {/* user, session, profile together */}
  <App />
</AuthProvider>
```

**❌ Anti-Pattern 4: Context for Every Component**
```typescript
// BAD: Creating context for component state
const ModalContext = createContext() // Just for modal open/close

// GOOD: Use local state
function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false)
}
```

---

## Validation Checklist

Before implementation, verify:

- ✅ Each context has clear single responsibility
- ✅ State shape is minimal (no derived data)
- ✅ Actions are memoized (prevent re-renders)
- ✅ Context values are memoized
- ✅ Optimistic updates for user actions
- ✅ Polling intervals defined
- ✅ Error handling strategy consistent
- ✅ No over-normalization
- ✅ Local state used for UI concerns
- ✅ Derived data computed with useMemo

---

**End of State Management Document**
