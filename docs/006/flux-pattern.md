# Flux Pattern Implementation
# Chat Application - MVP Learning Project

**Document Version:** 1.0
**Last Updated:** 2025-10-19
**Based on:** State Management v1.0, PRD v1.0
**Architecture**: Flux Pattern with React Context API

---

## Flux Architecture Overview

### Classic Flux Pattern

```
┌──────────────────────────────────────────────────────────┐
│                     Flux Data Flow                       │
│                  (Unidirectional)                        │
└──────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │    View     │  ← Renders UI based on state
    │ (Component) │
    └──────┬──────┘
           │
           │ 1. User Action (e.g., click button)
           ▼
    ┌─────────────┐
    │   Action    │  ← Function that dispatches
    │ (Function)  │
    └──────┬──────┘
           │
           │ 2. Dispatch action object
           ▼
    ┌──────────────┐
    │  Dispatcher  │  ← Reducer function
    │  (Reducer)   │
    └──────┬───────┘
           │
           │ 3. Update state immutably
           ▼
    ┌──────────────┐
    │    Store     │  ← Context state
    │  (Context)   │
    └──────┬───────┘
           │
           │ 4. State change triggers re-render
           ▼
    ┌─────────────┐
    │    View     │  ← Cycle completes
    │ (Component) │
    └─────────────┘
```

---

## Implementation Pattern

### File Structure for Each Context

```
contexts/
├── AuthContext.tsx         # Store + Provider
actions/
├── authActions.ts          # Action creators (business logic)
reducers/
├── authReducer.ts          # Dispatcher (state updates)
types/
├── auth.ts                 # Type definitions
```

---

## Flux Components Breakdown

### 1. Action (Business Logic)

**Purpose**: Encapsulate business logic, side effects, API calls

**Pattern**:
```typescript
// actions/authActions.ts
import { supabase } from '@/lib/supabase/client'
import { Dispatch } from 'react'
import { AuthAction } from '@/reducers/authReducer'
import { User } from '@/types/auth'

// Action creator: login
export async function login(
  email: string,
  password: string,
  dispatch: Dispatch<AuthAction>
): Promise<void> {
  // 1. Start loading
  dispatch({ type: 'LOGIN_LOADING' })

  try {
    // 2. Business logic: Call infrastructure
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    // 3. Fetch related data
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    // 4. Success: Dispatch with payload
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: {
        id: data.user.id,
        email: data.user.email!,
        display_name: profile?.display_name || 'User',
        created_at: data.user.created_at
      }
    })
  } catch (error) {
    // 5. Error: Dispatch with error message
    dispatch({
      type: 'LOGIN_ERROR',
      payload: error instanceof Error ? error.message : 'Login failed'
    })
  }
}

// Action creator: logout
export async function logout(dispatch: Dispatch<AuthAction>): Promise<void> {
  dispatch({ type: 'LOGOUT_LOADING' })

  try {
    await supabase.auth.signOut()
    dispatch({ type: 'LOGOUT_SUCCESS' })
  } catch (error) {
    // Force logout even on error (clear client state)
    dispatch({ type: 'LOGOUT_SUCCESS' })
  }
}

// Action creator: register
export async function register(
  email: string,
  password: string,
  displayName: string,
  dispatch: Dispatch<AuthAction>
): Promise<void> {
  dispatch({ type: 'REGISTER_LOADING' })

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    })

    if (authError) throw authError

    // Create profile (trigger handles this automatically, but we'll verify)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: authData.user!.id,
        display_name: displayName
      })

    if (profileError) throw profileError

    dispatch({
      type: 'REGISTER_SUCCESS',
      payload: {
        id: authData.user!.id,
        email: authData.user!.email!,
        display_name: displayName,
        created_at: authData.user!.created_at
      }
    })
  } catch (error) {
    dispatch({
      type: 'REGISTER_ERROR',
      payload: error instanceof Error ? error.message : 'Registration failed'
    })
  }
}
```

**Key Principles**:
- Actions are async functions
- Always dispatch loading/success/error
- Handle all errors gracefully
- Return `Promise<void>` (errors via state)
- No direct state manipulation (only dispatch)

---

### 2. Reducer (Dispatcher)

**Purpose**: Pure function that updates state based on action type

**Pattern**:
```typescript
// reducers/authReducer.ts
import { User } from '@/types/auth'

// State shape
export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

// Action types (discriminated union)
export type AuthAction =
  | { type: 'LOGIN_LOADING' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'REGISTER_LOADING' }
  | { type: 'REGISTER_SUCCESS'; payload: User }
  | { type: 'REGISTER_ERROR'; payload: string }
  | { type: 'LOGOUT_LOADING' }
  | { type: 'LOGOUT_SUCCESS' }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'CLEAR_ERROR' }

// Initial state
export const initialAuthState: AuthState = {
  user: null,
  loading: false,
  error: null
}

// Reducer function (pure, no side effects)
export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    // Login flow
    case 'LOGIN_LOADING':
    case 'REGISTER_LOADING':
    case 'LOGOUT_LOADING':
      return {
        ...state,
        loading: true,
        error: null // Clear previous errors
      }

    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        user: action.payload,
        loading: false,
        error: null
      }

    case 'LOGIN_ERROR':
    case 'REGISTER_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      }

    case 'LOGOUT_SUCCESS':
      return initialAuthState // Reset to initial state

    case 'SET_USER':
      return {
        ...state,
        user: action.payload
      }

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }

    default:
      return state
  }
}
```

**Key Principles**:
- Pure function (no side effects)
- Immutable state updates (always return new object)
- Use discriminated union for type safety
- Handle all action types
- Default case returns unchanged state

---

### 3. Store (Context Provider)

**Purpose**: Manage state, provide actions to components

**Pattern**:
```typescript
// contexts/AuthContext.tsx
'use client'

import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from 'react'
import { authReducer, initialAuthState, AuthState, AuthAction } from '@/reducers/authReducer'
import * as authActions from '@/actions/authActions'

// Context type (state + actions)
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState)

  // Memoize action functions (prevent re-renders)
  const login = useCallback(async (email: string, password: string) => {
    await authActions.login(email, password, dispatch)
  }, [])

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      await authActions.register(email, password, displayName, dispatch)
    },
    []
  )

  const logout = useCallback(async () => {
    await authActions.logout(dispatch)
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  // Memoize context value (prevent unnecessary re-renders)
  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      clearError
    }),
    [state, login, register, logout, clearError]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook for consuming context
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

**Key Principles**:
- Use `useReducer` for state management
- Memoize action functions with `useCallback`
- Memoize context value with `useMemo`
- Provide custom hook for easy consumption
- Throw error if used outside provider

---

### 4. View (Component)

**Purpose**: Render UI, dispatch actions on user interaction

**Pattern**:
```typescript
// components/auth/LoginForm.tsx
'use client'

import { FormEvent, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'

export function LoginForm() {
  // Access state and actions from context
  const { user, login, loading, error } = useAuth()
  const router = useRouter()

  // Local form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Event handler dispatches action
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await login(email, password)

    // Redirect on success
    if (!error && user) {
      router.push('/rooms')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        required
      />

      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        required
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" disabled={loading} fullWidth>
        {loading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  )
}
```

**Key Principles**:
- Component has NO business logic
- Uses custom hook to access context
- Local state for UI only (form values)
- Calls action functions on events
- Renders based on context state

---

## Complete Flux Examples

### Example 1: AuthContext (Complete Implementation)

See sections above for:
- `actions/authActions.ts`
- `reducers/authReducer.ts`
- `contexts/AuthContext.tsx`
- `components/auth/LoginForm.tsx`

---

### Example 2: RoomsContext (Complete Implementation)

**actions/roomActions.ts**:
```typescript
import { supabase } from '@/lib/supabase/client'
import { Dispatch } from 'react'
import { RoomsAction } from '@/reducers/roomsReducer'
import { ChatRoom } from '@/types/room'

export async function fetchRooms(dispatch: Dispatch<RoomsAction>): Promise<void> {
  dispatch({ type: 'FETCH_ROOMS_LOADING' })

  try {
    const { data, error } = await supabase.rpc('get_rooms_with_metadata')

    if (error) throw error

    dispatch({
      type: 'SET_ROOMS',
      payload: data as ChatRoom[]
    })
  } catch (error) {
    dispatch({
      type: 'FETCH_ROOMS_ERROR',
      payload: error instanceof Error ? error.message : 'Failed to fetch rooms'
    })
  }
}

export async function createRoom(
  name: string,
  description: string | undefined,
  dispatch: Dispatch<RoomsAction>
): Promise<ChatRoom | null> {
  dispatch({ type: 'CREATE_ROOM_LOADING' })

  // Optimistic update
  const tempId = `temp-${Date.now()}`
  const optimisticRoom: ChatRoom = {
    id: tempId,
    name,
    description: description || null,
    created_by: '', // Will be set by database
    created_at: new Date().toISOString(),
    member_count: 1
  }

  dispatch({
    type: 'ADD_ROOM_OPTIMISTIC',
    payload: optimisticRoom
  })

  try {
    const { data, error } = await supabase
      .from('chat_rooms')
      .insert({ name, description })
      .select()
      .single()

    if (error) throw error

    // Replace optimistic with real data
    dispatch({
      type: 'REPLACE_ROOM',
      payload: { tempId, room: data as ChatRoom }
    })

    return data as ChatRoom
  } catch (error) {
    // Remove optimistic room on error
    dispatch({
      type: 'REMOVE_ROOM',
      payload: tempId
    })

    dispatch({
      type: 'CREATE_ROOM_ERROR',
      payload: error instanceof Error ? error.message : 'Failed to create room'
    })

    return null
  }
}

export async function joinRoom(
  roomId: string,
  dispatch: Dispatch<RoomsAction>
): Promise<void> {
  dispatch({ type: 'JOIN_ROOM_LOADING', payload: roomId })

  try {
    const { error } = await supabase
      .from('room_members')
      .insert({ room_id: roomId })

    if (error && !error.message.includes('duplicate')) {
      throw error
    }

    dispatch({ type: 'JOIN_ROOM_SUCCESS', payload: roomId })
  } catch (error) {
    dispatch({
      type: 'JOIN_ROOM_ERROR',
      payload: error instanceof Error ? error.message : 'Failed to join room'
    })
  }
}

export function setActiveRoom(
  roomId: string | null,
  dispatch: Dispatch<RoomsAction>
): void {
  dispatch({ type: 'SET_ACTIVE_ROOM', payload: roomId })
}
```

**reducers/roomsReducer.ts**:
```typescript
import { ChatRoom } from '@/types/room'

export interface RoomsState {
  rooms: ChatRoom[]
  activeRoomId: string | null
  loading: boolean
  error: string | null
}

export type RoomsAction =
  | { type: 'FETCH_ROOMS_LOADING' }
  | { type: 'SET_ROOMS'; payload: ChatRoom[] }
  | { type: 'FETCH_ROOMS_ERROR'; payload: string }
  | { type: 'CREATE_ROOM_LOADING' }
  | { type: 'ADD_ROOM_OPTIMISTIC'; payload: ChatRoom }
  | { type: 'REPLACE_ROOM'; payload: { tempId: string; room: ChatRoom } }
  | { type: 'REMOVE_ROOM'; payload: string }
  | { type: 'CREATE_ROOM_ERROR'; payload: string }
  | { type: 'JOIN_ROOM_LOADING'; payload: string }
  | { type: 'JOIN_ROOM_SUCCESS'; payload: string }
  | { type: 'JOIN_ROOM_ERROR'; payload: string }
  | { type: 'SET_ACTIVE_ROOM'; payload: string | null }

export const initialRoomsState: RoomsState = {
  rooms: [],
  activeRoomId: null,
  loading: false,
  error: null
}

export function roomsReducer(state: RoomsState, action: RoomsAction): RoomsState {
  switch (action.type) {
    case 'FETCH_ROOMS_LOADING':
    case 'CREATE_ROOM_LOADING':
      return { ...state, loading: true, error: null }

    case 'SET_ROOMS':
      return { ...state, rooms: action.payload, loading: false, error: null }

    case 'ADD_ROOM_OPTIMISTIC':
      return { ...state, rooms: [action.payload, ...state.rooms] }

    case 'REPLACE_ROOM':
      return {
        ...state,
        rooms: state.rooms.map(room =>
          room.id === action.payload.tempId ? action.payload.room : room
        ),
        loading: false
      }

    case 'REMOVE_ROOM':
      return {
        ...state,
        rooms: state.rooms.filter(room => room.id !== action.payload)
      }

    case 'FETCH_ROOMS_ERROR':
    case 'CREATE_ROOM_ERROR':
    case 'JOIN_ROOM_ERROR':
      return { ...state, loading: false, error: action.payload }

    case 'JOIN_ROOM_SUCCESS':
      return { ...state, loading: false, error: null }

    case 'SET_ACTIVE_ROOM':
      return { ...state, activeRoomId: action.payload }

    default:
      return state
  }
}
```

**contexts/RoomsContext.tsx**:
```typescript
'use client'

import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from 'react'
import { roomsReducer, initialRoomsState, RoomsState } from '@/reducers/roomsReducer'
import * as roomActions from '@/actions/roomActions'
import { ChatRoom } from '@/types/room'

interface RoomsContextType extends RoomsState {
  fetchRooms: () => Promise<void>
  createRoom: (name: string, description?: string) => Promise<ChatRoom | null>
  joinRoom: (roomId: string) => Promise<void>
  setActiveRoom: (roomId: string | null) => void
}

const RoomsContext = createContext<RoomsContextType | undefined>(undefined)

export function RoomsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(roomsReducer, initialRoomsState)

  const fetchRooms = useCallback(async () => {
    await roomActions.fetchRooms(dispatch)
  }, [])

  const createRoom = useCallback(async (name: string, description?: string) => {
    return await roomActions.createRoom(name, description, dispatch)
  }, [])

  const joinRoom = useCallback(async (roomId: string) => {
    await roomActions.joinRoom(roomId, dispatch)
  }, [])

  const setActiveRoom = useCallback((roomId: string | null) => {
    roomActions.setActiveRoom(roomId, dispatch)
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      fetchRooms,
      createRoom,
      joinRoom,
      setActiveRoom
    }),
    [state, fetchRooms, createRoom, joinRoom, setActiveRoom]
  )

  return <RoomsContext.Provider value={value}>{children}</RoomsContext.Provider>
}

export function useRooms() {
  const context = useContext(RoomsContext)
  if (!context) {
    throw new Error('useRooms must be used within RoomsProvider')
  }
  return context
}
```

---

### Example 3: MessagesContext (Partial - Full in context-spec.md)

**Key Differences**:
- Messages indexed by room ID: `messagesByRoom: Record<string, Message[]>`
- Optimistic updates with temporary IDs
- Likes cache for efficiency
- Reply target management

---

## Flux Patterns & Best Practices

### Pattern 1: Optimistic Updates

```typescript
// Action
export async function sendMessage(...) {
  const tempId = `temp-${Date.now()}`

  // 1. Optimistic update
  dispatch({ type: 'ADD_MESSAGE_OPTIMISTIC', payload: { tempId, ... } })

  try {
    // 2. Server call
    const { data } = await supabase.from('messages').insert(...)

    // 3. Replace temp with real
    dispatch({ type: 'REPLACE_MESSAGE', payload: { tempId, message: data } })
  } catch (error) {
    // 4. Mark as failed (keep for retry)
    dispatch({ type: 'MESSAGE_FAILED', payload: { tempId, error } })
  }
}

// Reducer
case 'ADD_MESSAGE_OPTIMISTIC':
  return {
    ...state,
    messagesByRoom: {
      ...state.messagesByRoom,
      [roomId]: [...(state.messagesByRoom[roomId] || []), optimisticMessage]
    }
  }

case 'REPLACE_MESSAGE':
  return {
    ...state,
    messagesByRoom: {
      ...state.messagesByRoom,
      [roomId]: state.messagesByRoom[roomId].map(m =>
        m.id === tempId ? realMessage : m
      )
    }
  }
```

---

### Pattern 2: Polling

```typescript
// Component
function ChatRoom({ roomId }: { roomId: string }) {
  const { fetchMessages } = useMessages()

  useEffect(() => {
    fetchMessages(roomId) // Initial fetch

    const interval = setInterval(() => {
      fetchMessages(roomId, lastTimestamp) // Incremental fetch
    }, 3000)

    return () => clearInterval(interval)
  }, [roomId, fetchMessages])
}

// Action
export async function fetchMessages(
  roomId: string,
  since?: string, // Only fetch new messages
  dispatch: Dispatch
) {
  const query = supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .is('deleted_at', null)

  if (since) {
    query.gt('created_at', since)
  }

  const { data } = await query

  if (since) {
    dispatch({ type: 'APPEND_MESSAGES', payload: { roomId, messages: data } })
  } else {
    dispatch({ type: 'SET_MESSAGES', payload: { roomId, messages: data } })
  }
}
```

---

### Pattern 3: Error Recovery

```typescript
// Action with retry logic
export async function sendMessageWithRetry(
  roomId: string,
  content: string,
  dispatch: Dispatch,
  retries = 3
): Promise<void> {
  let attempt = 0

  while (attempt < retries) {
    try {
      await sendMessage(roomId, content, dispatch)
      return // Success
    } catch (error) {
      attempt++
      if (attempt >= retries) {
        dispatch({ type: 'MESSAGE_FAILED_PERMANENT', payload: error.message })
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Backoff
    }
  }
}
```

---

## Testing Flux Components

### Testing Reducers

```typescript
// reducers/authReducer.test.ts
import { authReducer, initialAuthState } from './authReducer'

describe('authReducer', () => {
  it('handles LOGIN_SUCCESS', () => {
    const user = { id: '123', email: 'test@example.com', display_name: 'Test' }
    const nextState = authReducer(initialAuthState, {
      type: 'LOGIN_SUCCESS',
      payload: user
    })

    expect(nextState).toEqual({
      user,
      loading: false,
      error: null
    })
  })

  it('handles LOGIN_ERROR', () => {
    const error = 'Invalid credentials'
    const nextState = authReducer(initialAuthState, {
      type: 'LOGIN_ERROR',
      payload: error
    })

    expect(nextState).toEqual({
      user: null,
      loading: false,
      error
    })
  })
})
```

### Testing Actions

```typescript
// actions/authActions.test.ts
import { login } from './authActions'
import { supabase } from '@/lib/supabase/client'

jest.mock('@/lib/supabase/client')

describe('authActions', () => {
  it('dispatches LOGIN_SUCCESS on valid credentials', async () => {
    const dispatch = jest.fn()
    const mockUser = { id: '123', email: 'test@example.com' }

    ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    await login('test@example.com', 'password', dispatch)

    expect(dispatch).toHaveBeenCalledWith({ type: 'LOGIN_LOADING' })
    expect(dispatch).toHaveBeenCalledWith({
      type: 'LOGIN_SUCCESS',
      payload: expect.objectContaining({ id: '123' })
    })
  })
})
```

---

## Validation Checklist

Before implementation, verify:

- ✅ Actions are async functions with dispatch parameter
- ✅ Reducers are pure functions (no side effects)
- ✅ Action types are discriminated unions (TypeScript)
- ✅ Initial state defined for each context
- ✅ Context provider memoizes value
- ✅ Action functions memoized with useCallback
- ✅ Custom hook throws error if used outside provider
- ✅ Components dispatch actions, don't contain business logic
- ✅ Optimistic updates rollback on error
- ✅ Error messages user-friendly

---

**End of Flux Pattern Document**
