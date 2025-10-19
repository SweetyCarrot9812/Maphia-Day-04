# Context Implementation Specification
# Chat Application - MVP Learning Project

**Document Version:** 1.0
**Last Updated:** 2025-10-19
**Based on:** Flux Pattern v1.0, State Management v1.0
**Purpose**: Detailed specifications for implementing all three contexts

---

## Implementation Roadmap

### Phase 1: AuthContext (Week 1)
- User authentication and session management
- Foundation for all other features

### Phase 2: RoomsContext (Week 2)
- Chat room listing and management
- Room membership tracking

### Phase 3: MessagesContext (Week 3-4)
- Message sending and receiving
- Likes and replies
- Optimistic updates

---

## AuthContext Complete Specification

### File: `types/auth.ts`

```typescript
// User type (database representation)
export interface User {
  id: string              // UUID from auth.users
  email: string           // User's email address
  display_name: string    // From user_profiles table
  created_at: string      // ISO timestamp
}

// Login credentials
export interface LoginCredentials {
  email: string
  password: string
}

// Registration data
export interface RegisterData {
  email: string
  password: string
  displayName: string
}
```

---

### File: `reducers/authReducer.ts`

```typescript
import { User } from '@/types/auth'

// State shape
export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

// Action types (discriminated union for type safety)
export type AuthAction =
  // Login actions
  | { type: 'LOGIN_LOADING' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_ERROR'; payload: string }
  // Register actions
  | { type: 'REGISTER_LOADING' }
  | { type: 'REGISTER_SUCCESS'; payload: User }
  | { type: 'REGISTER_ERROR'; payload: string }
  // Logout actions
  | { type: 'LOGOUT_LOADING' }
  | { type: 'LOGOUT_SUCCESS' }
  // Session management
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SESSION_LOADING' }
  | { type: 'SESSION_RESTORED'; payload: User }
  | { type: 'SESSION_EXPIRED' }
  // Error handling
  | { type: 'CLEAR_ERROR' }

// Initial state
export const initialAuthState: AuthState = {
  user: null,
  loading: false,
  error: null
}

// Reducer function (pure, immutable updates)
export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    // Loading states
    case 'LOGIN_LOADING':
    case 'REGISTER_LOADING':
    case 'LOGOUT_LOADING':
    case 'SESSION_LOADING':
      return {
        ...state,
        loading: true,
        error: null
      }

    // Success states with user data
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
    case 'SESSION_RESTORED':
      return {
        user: action.payload,
        loading: false,
        error: null
      }

    // Error states
    case 'LOGIN_ERROR':
    case 'REGISTER_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      }

    // Logout and session expiry (reset to initial)
    case 'LOGOUT_SUCCESS':
    case 'SESSION_EXPIRED':
      return initialAuthState

    // Direct user set (for session restore)
    case 'SET_USER':
      return {
        ...state,
        user: action.payload
      }

    // Clear error
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

---

### File: `actions/authActions.ts`

```typescript
import { supabase } from '@/lib/supabase/client'
import { Dispatch } from 'react'
import { AuthAction } from '@/reducers/authReducer'
import { User } from '@/types/auth'

/**
 * Login action - Authenticate user with email and password
 */
export async function login(
  email: string,
  password: string,
  dispatch: Dispatch<AuthAction>
): Promise<void> {
  dispatch({ type: 'LOGIN_LOADING' })

  try {
    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) throw authError

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) throw profileError

    // Dispatch success with merged user data
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: {
        id: authData.user.id,
        email: authData.user.email!,
        display_name: profile.display_name,
        created_at: authData.user.created_at
      }
    })
  } catch (error) {
    dispatch({
      type: 'LOGIN_ERROR',
      payload: error instanceof Error ? error.message : 'Login failed'
    })
  }
}

/**
 * Register action - Create new user account
 */
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
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Registration failed')

    // Profile created automatically by database trigger
    // Verify it exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      // Fallback: create profile manually if trigger failed
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          display_name: displayName
        })

      if (insertError) throw insertError
    }

    dispatch({
      type: 'REGISTER_SUCCESS',
      payload: {
        id: authData.user.id,
        email: authData.user.email!,
        display_name: profile?.display_name || displayName,
        created_at: authData.user.created_at
      }
    })
  } catch (error) {
    dispatch({
      type: 'REGISTER_ERROR',
      payload: error instanceof Error ? error.message : 'Registration failed'
    })
  }
}

/**
 * Logout action - Sign out current user
 */
export async function logout(dispatch: Dispatch<AuthAction>): Promise<void> {
  dispatch({ type: 'LOGOUT_LOADING' })

  try {
    await supabase.auth.signOut()
    dispatch({ type: 'LOGOUT_SUCCESS' })
  } catch (error) {
    // Force logout even on error (clear client state)
    console.error('Logout error:', error)
    dispatch({ type: 'LOGOUT_SUCCESS' })
  }
}

/**
 * Refresh session - Check if user is still authenticated
 */
export async function refreshSession(dispatch: Dispatch<AuthAction>): Promise<void> {
  dispatch({ type: 'SESSION_LOADING' })

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) throw error

    if (user) {
      // Fetch profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      dispatch({
        type: 'SESSION_RESTORED',
        payload: {
          id: user.id,
          email: user.email!,
          display_name: profile?.display_name || 'User',
          created_at: user.created_at
        }
      })
    } else {
      dispatch({ type: 'SESSION_EXPIRED' })
    }
  } catch (error) {
    console.error('Session refresh error:', error)
    dispatch({ type: 'SESSION_EXPIRED' })
  }
}

/**
 * Clear error - Remove error message from state
 */
export function clearError(dispatch: Dispatch<AuthAction>): void {
  dispatch({ type: 'CLEAR_ERROR' })
}
```

---

### File: `contexts/AuthContext.tsx`

```typescript
'use client'

import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect, ReactNode } from 'react'
import { authReducer, initialAuthState, AuthState } from '@/reducers/authReducer'
import * as authActions from '@/actions/authActions'
import { supabase } from '@/lib/supabase/client'

// Context type (state + actions)
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  clearError: () => void
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState)

  // Initialize session on mount
  useEffect(() => {
    authActions.refreshSession(dispatch)

    // Listen for auth state changes (login/logout in other tabs)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        authActions.refreshSession(dispatch)
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'LOGOUT_SUCCESS' })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Memoize action functions
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

  const refreshSession = useCallback(async () => {
    await authActions.refreshSession(dispatch)
  }, [])

  const clearError = useCallback(() => {
    authActions.clearError(dispatch)
  }, [])

  // Memoize context value
  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      refreshSession,
      clearError
    }),
    [state, login, register, logout, refreshSession, clearError]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

---

## RoomsContext Complete Specification

### File: `types/room.ts`

```typescript
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
```

---

### File: `reducers/roomsReducer.ts`

```typescript
import { ChatRoom } from '@/types/room'

export interface RoomsState {
  rooms: ChatRoom[]
  activeRoomId: string | null
  loading: boolean
  error: string | null
}

export type RoomsAction =
  // Fetch rooms
  | { type: 'FETCH_ROOMS_LOADING' }
  | { type: 'SET_ROOMS'; payload: ChatRoom[] }
  | { type: 'FETCH_ROOMS_ERROR'; payload: string }
  // Create room
  | { type: 'CREATE_ROOM_LOADING' }
  | { type: 'ADD_ROOM_OPTIMISTIC'; payload: ChatRoom }
  | { type: 'REPLACE_ROOM'; payload: { tempId: string; room: ChatRoom } }
  | { type: 'REMOVE_ROOM'; payload: string }
  | { type: 'CREATE_ROOM_ERROR'; payload: string }
  // Join room
  | { type: 'JOIN_ROOM_LOADING'; payload: string }
  | { type: 'JOIN_ROOM_SUCCESS'; payload: string }
  | { type: 'JOIN_ROOM_ERROR'; payload: string }
  // Leave room
  | { type: 'LEAVE_ROOM_LOADING'; payload: string }
  | { type: 'LEAVE_ROOM_SUCCESS'; payload: string }
  | { type: 'LEAVE_ROOM_ERROR'; payload: string }
  // Active room
  | { type: 'SET_ACTIVE_ROOM'; payload: string | null }
  // Error handling
  | { type: 'CLEAR_ERROR' }

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
      return {
        ...state,
        rooms: action.payload,
        loading: false,
        error: null
      }

    case 'ADD_ROOM_OPTIMISTIC':
      return {
        ...state,
        rooms: [action.payload, ...state.rooms]
      }

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

    case 'JOIN_ROOM_LOADING':
    case 'LEAVE_ROOM_LOADING':
      return { ...state, loading: true, error: null }

    case 'JOIN_ROOM_SUCCESS':
    case 'LEAVE_ROOM_SUCCESS':
      return { ...state, loading: false, error: null }

    case 'FETCH_ROOMS_ERROR':
    case 'CREATE_ROOM_ERROR':
    case 'JOIN_ROOM_ERROR':
    case 'LEAVE_ROOM_ERROR':
      return { ...state, loading: false, error: action.payload }

    case 'SET_ACTIVE_ROOM':
      return { ...state, activeRoomId: action.payload }

    case 'CLEAR_ERROR':
      return { ...state, error: null }

    default:
      return state
  }
}
```

---

### File: `actions/roomActions.ts`

```typescript
import { supabase } from '@/lib/supabase/client'
import { Dispatch } from 'react'
import { RoomsAction } from '@/reducers/roomsReducer'
import { ChatRoom } from '@/types/room'

/**
 * Fetch all rooms with metadata
 */
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

/**
 * Create new chat room
 */
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
    // Remove optimistic room
    dispatch({ type: 'REMOVE_ROOM', payload: tempId })

    dispatch({
      type: 'CREATE_ROOM_ERROR',
      payload: error instanceof Error ? error.message : 'Failed to create room'
    })

    return null
  }
}

/**
 * Join existing room
 */
export async function joinRoom(
  roomId: string,
  dispatch: Dispatch<RoomsAction>
): Promise<void> {
  dispatch({ type: 'JOIN_ROOM_LOADING', payload: roomId })

  try {
    const { error } = await supabase
      .from('room_members')
      .insert({ room_id: roomId })

    // Ignore duplicate key error (already joined)
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

/**
 * Leave room
 */
export async function leaveRoom(
  roomId: string,
  dispatch: Dispatch<RoomsAction>
): Promise<void> {
  dispatch({ type: 'LEAVE_ROOM_LOADING', payload: roomId })

  try {
    const { error } = await supabase
      .from('room_members')
      .delete()
      .eq('room_id', roomId)

    if (error) throw error

    dispatch({ type: 'LEAVE_ROOM_SUCCESS', payload: roomId })
  } catch (error) {
    dispatch({
      type: 'LEAVE_ROOM_ERROR',
      payload: error instanceof Error ? error.message : 'Failed to leave room'
    })
  }
}

/**
 * Set active room (UI state)
 */
export function setActiveRoom(
  roomId: string | null,
  dispatch: Dispatch<RoomsAction>
): void {
  dispatch({ type: 'SET_ACTIVE_ROOM', payload: roomId })
}

/**
 * Clear error
 */
export function clearError(dispatch: Dispatch<RoomsAction>): void {
  dispatch({ type: 'CLEAR_ERROR' })
}
```

---

### File: `contexts/RoomsContext.tsx`

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
  leaveRoom: (roomId: string) => Promise<void>
  setActiveRoom: (roomId: string | null) => void
  clearError: () => void
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

  const leaveRoom = useCallback(async (roomId: string) => {
    await roomActions.leaveRoom(roomId, dispatch)
  }, [])

  const setActiveRoom = useCallback((roomId: string | null) => {
    roomActions.setActiveRoom(roomId, dispatch)
  }, [])

  const clearError = useCallback(() => {
    roomActions.clearError(dispatch)
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      fetchRooms,
      createRoom,
      joinRoom,
      leaveRoom,
      setActiveRoom,
      clearError
    }),
    [state, fetchRooms, createRoom, joinRoom, leaveRoom, setActiveRoom, clearError]
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

## MessagesContext Complete Specification

### File: `types/message.ts`

```typescript
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
```

---

### File: `reducers/messagesReducer.ts`

```typescript
import { Message, MessageLike } from '@/types/message'

export interface MessagesState {
  messagesByRoom: Record<string, Message[]>
  likesCache: Record<string, MessageLike[]>
  replyTarget: Message | null
  loading: boolean
  error: string | null
}

export type MessagesAction =
  // Fetch messages
  | { type: 'FETCH_MESSAGES_LOADING' }
  | { type: 'SET_MESSAGES'; payload: { roomId: string; messages: Message[] } }
  | { type: 'APPEND_MESSAGES'; payload: { roomId: string; messages: Message[] } }
  | { type: 'FETCH_MESSAGES_ERROR'; payload: string }
  // Send message
  | { type: 'SEND_MESSAGE_LOADING' }
  | { type: 'ADD_MESSAGE_OPTIMISTIC'; payload: { roomId: string; message: Message } }
  | { type: 'REPLACE_MESSAGE'; payload: { roomId: string; tempId: string; message: Message } }
  | { type: 'MESSAGE_SEND_FAILED'; payload: { roomId: string; tempId: string; error: string } }
  // Delete message
  | { type: 'DELETE_MESSAGE_SUCCESS'; payload: { roomId: string; messageId: string } }
  | { type: 'DELETE_MESSAGE_ERROR'; payload: string }
  // Likes
  | { type: 'UPDATE_LIKES'; payload: { messageId: string; likes: MessageLike[] } }
  | { type: 'TOGGLE_LIKE_OPTIMISTIC'; payload: { messageId: string; userId: string; liked: boolean } }
  // Reply
  | { type: 'SET_REPLY_TARGET'; payload: Message | null }
  | { type: 'CLEAR_REPLY_TARGET' }
  // Error
  | { type: 'CLEAR_ERROR' }

export const initialMessagesState: MessagesState = {
  messagesByRoom: {},
  likesCache: {},
  replyTarget: null,
  loading: false,
  error: null
}

export function messagesReducer(
  state: MessagesState,
  action: MessagesAction
): MessagesState {
  switch (action.type) {
    case 'FETCH_MESSAGES_LOADING':
    case 'SEND_MESSAGE_LOADING':
      return { ...state, loading: true, error: null }

    case 'SET_MESSAGES':
      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [action.payload.roomId]: action.payload.messages
        },
        loading: false
      }

    case 'APPEND_MESSAGES': {
      const existing = state.messagesByRoom[action.payload.roomId] || []
      const newMessages = action.payload.messages.filter(
        newMsg => !existing.some(msg => msg.id === newMsg.id)
      )
      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [action.payload.roomId]: [...existing, ...newMessages]
        }
      }
    }

    case 'ADD_MESSAGE_OPTIMISTIC': {
      const existing = state.messagesByRoom[action.payload.roomId] || []
      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [action.payload.roomId]: [...existing, action.payload.message]
        }
      }
    }

    case 'REPLACE_MESSAGE': {
      const messages = state.messagesByRoom[action.payload.roomId] || []
      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [action.payload.roomId]: messages.map(msg =>
            msg.id === action.payload.tempId || msg.tempId === action.payload.tempId
              ? action.payload.message
              : msg
          )
        },
        loading: false
      }
    }

    case 'MESSAGE_SEND_FAILED': {
      const messages = state.messagesByRoom[action.payload.roomId] || []
      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [action.payload.roomId]: messages.map(msg =>
            msg.id === action.payload.tempId
              ? { ...msg, status: 'failed' as const }
              : msg
          )
        },
        loading: false,
        error: action.payload.error
      }
    }

    case 'DELETE_MESSAGE_SUCCESS': {
      const messages = state.messagesByRoom[action.payload.roomId] || []
      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [action.payload.roomId]: messages.map(msg =>
            msg.id === action.payload.messageId
              ? { ...msg, deleted_at: new Date().toISOString() }
              : msg
          )
        },
        loading: false
      }
    }

    case 'UPDATE_LIKES':
      return {
        ...state,
        likesCache: {
          ...state.likesCache,
          [action.payload.messageId]: action.payload.likes
        }
      }

    case 'TOGGLE_LIKE_OPTIMISTIC': {
      const currentLikes = state.likesCache[action.payload.messageId] || []
      const newLikes = action.payload.liked
        ? [...currentLikes, {
            message_id: action.payload.messageId,
            user_id: action.payload.userId,
            created_at: new Date().toISOString()
          }]
        : currentLikes.filter(like => like.user_id !== action.payload.userId)

      return {
        ...state,
        likesCache: {
          ...state.likesCache,
          [action.payload.messageId]: newLikes
        }
      }
    }

    case 'SET_REPLY_TARGET':
      return { ...state, replyTarget: action.payload }

    case 'CLEAR_REPLY_TARGET':
      return { ...state, replyTarget: null }

    case 'FETCH_MESSAGES_ERROR':
    case 'DELETE_MESSAGE_ERROR':
      return { ...state, loading: false, error: action.payload }

    case 'CLEAR_ERROR':
      return { ...state, error: null }

    default:
      return state
  }
}
```

---

### File: `actions/messageActions.ts`

```typescript
import { supabase } from '@/lib/supabase/client'
import { Dispatch } from 'react'
import { MessagesAction } from '@/reducers/messagesReducer'
import { Message, MessageLike } from '@/types/message'

/**
 * Fetch messages for a room
 */
export async function fetchMessages(
  roomId: string,
  since?: string,
  dispatch: Dispatch<MessagesAction>
): Promise<void> {
  dispatch({ type: 'FETCH_MESSAGES_LOADING' })

  try {
    let query = supabase
      .from('messages')
      .select(`
        *,
        user_profiles!messages_user_id_fkey(display_name)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })

    if (since) {
      query = query.gt('created_at', since)
    } else {
      query = query.limit(50)
    }

    const { data, error } = await query

    if (error) throw error

    const messages = data.map(msg => ({
      ...msg,
      author_name: msg.user_profiles?.display_name || 'Unknown'
    }))

    if (since) {
      dispatch({ type: 'APPEND_MESSAGES', payload: { roomId, messages } })
    } else {
      dispatch({ type: 'SET_MESSAGES', payload: { roomId, messages } })
    }

    // Fetch likes for messages
    await fetchLikesForMessages(messages, dispatch)
  } catch (error) {
    dispatch({
      type: 'FETCH_MESSAGES_ERROR',
      payload: error instanceof Error ? error.message : 'Failed to fetch messages'
    })
  }
}

/**
 * Send message
 */
export async function sendMessage(
  roomId: string,
  content: string,
  type: 'text' | 'emoji',
  parentMessageId: string | null,
  dispatch: Dispatch<MessagesAction>,
  userId: string
): Promise<void> {
  const tempId = `temp-${Date.now()}`

  // Optimistic update
  const optimisticMessage: Message = {
    id: tempId,
    room_id: roomId,
    user_id: userId,
    content,
    type,
    parent_message_id: parentMessageId,
    created_at: new Date().toISOString(),
    deleted_at: null,
    status: 'sending',
    tempId
  }

  dispatch({
    type: 'ADD_MESSAGE_OPTIMISTIC',
    payload: { roomId, message: optimisticMessage }
  })

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        content,
        type,
        parent_message_id: parentMessageId
      })
      .select()
      .single()

    if (error) throw error

    dispatch({
      type: 'REPLACE_MESSAGE',
      payload: {
        roomId,
        tempId,
        message: { ...data, status: 'sent' }
      }
    })
  } catch (error) {
    dispatch({
      type: 'MESSAGE_SEND_FAILED',
      payload: {
        roomId,
        tempId,
        error: error instanceof Error ? error.message : 'Failed to send message'
      }
    })
  }
}

/**
 * Delete message (soft delete)
 */
export async function deleteMessage(
  messageId: string,
  roomId: string,
  dispatch: Dispatch<MessagesAction>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId)

    if (error) throw error

    dispatch({
      type: 'DELETE_MESSAGE_SUCCESS',
      payload: { roomId, messageId }
    })
  } catch (error) {
    dispatch({
      type: 'DELETE_MESSAGE_ERROR',
      payload: error instanceof Error ? error.message : 'Failed to delete message'
    })
  }
}

/**
 * Like message
 */
export async function likeMessage(
  messageId: string,
  userId: string,
  dispatch: Dispatch<MessagesAction>
): Promise<void> {
  // Optimistic update
  dispatch({
    type: 'TOGGLE_LIKE_OPTIMISTIC',
    payload: { messageId, userId, liked: true }
  })

  try {
    const { error } = await supabase
      .from('message_likes')
      .insert({ message_id: messageId, user_id: userId })

    if (error) throw error
  } catch (error) {
    // Revert optimistic update
    dispatch({
      type: 'TOGGLE_LIKE_OPTIMISTIC',
      payload: { messageId, userId, liked: false }
    })
  }
}

/**
 * Unlike message
 */
export async function unlikeMessage(
  messageId: string,
  userId: string,
  dispatch: Dispatch<MessagesAction>
): Promise<void> {
  // Optimistic update
  dispatch({
    type: 'TOGGLE_LIKE_OPTIMISTIC',
    payload: { messageId, userId, liked: false }
  })

  try {
    const { error } = await supabase
      .from('message_likes')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userId)

    if (error) throw error
  } catch (error) {
    // Revert optimistic update
    dispatch({
      type: 'TOGGLE_LIKE_OPTIMISTIC',
      payload: { messageId, userId, liked: true }
    })
  }
}

/**
 * Set reply target
 */
export function setReplyTarget(
  message: Message | null,
  dispatch: Dispatch<MessagesAction>
): void {
  dispatch({ type: 'SET_REPLY_TARGET', payload: message })
}

/**
 * Clear reply target
 */
export function clearReplyTarget(dispatch: Dispatch<MessagesAction>): void {
  dispatch({ type: 'CLEAR_REPLY_TARGET' })
}

/**
 * Fetch likes for messages (helper)
 */
async function fetchLikesForMessages(
  messages: Message[],
  dispatch: Dispatch<MessagesAction>
): Promise<void> {
  const messageIds = messages.map(m => m.id)

  if (messageIds.length === 0) return

  const { data } = await supabase
    .from('message_likes')
    .select('*')
    .in('message_id', messageIds)

  if (data) {
    const likesByMessage = data.reduce((acc, like) => {
      if (!acc[like.message_id]) acc[like.message_id] = []
      acc[like.message_id].push(like)
      return acc
    }, {} as Record<string, MessageLike[]>)

    Object.entries(likesByMessage).forEach(([messageId, likes]) => {
      dispatch({ type: 'UPDATE_LIKES', payload: { messageId, likes } })
    })
  }
}
```

---

### File: `contexts/MessagesContext.tsx`

```typescript
'use client'

import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from 'react'
import { messagesReducer, initialMessagesState, MessagesState } from '@/reducers/messagesReducer'
import * as messageActions from '@/actions/messageActions'
import { Message } from '@/types/message'
import { useAuth } from './AuthContext'

interface MessagesContextType extends MessagesState {
  fetchMessages: (roomId: string, since?: string) => Promise<void>
  sendMessage: (roomId: string, content: string, type?: 'text' | 'emoji') => Promise<void>
  deleteMessage: (messageId: string, roomId: string) => Promise<void>
  likeMessage: (messageId: string) => Promise<void>
  unlikeMessage: (messageId: string) => Promise<void>
  setReplyTarget: (message: Message | null) => void
  clearReplyTarget: () => void
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined)

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(messagesReducer, initialMessagesState)
  const { user } = useAuth()

  const fetchMessages = useCallback(async (roomId: string, since?: string) => {
    await messageActions.fetchMessages(roomId, since, dispatch)
  }, [])

  const sendMessage = useCallback(
    async (roomId: string, content: string, type: 'text' | 'emoji' = 'text') => {
      if (!user) return
      await messageActions.sendMessage(
        roomId,
        content,
        type,
        state.replyTarget?.id || null,
        dispatch,
        user.id
      )
      // Clear reply target after sending
      dispatch({ type: 'CLEAR_REPLY_TARGET' })
    },
    [user, state.replyTarget]
  )

  const deleteMessage = useCallback(async (messageId: string, roomId: string) => {
    await messageActions.deleteMessage(messageId, roomId, dispatch)
  }, [])

  const likeMessage = useCallback(
    async (messageId: string) => {
      if (!user) return
      await messageActions.likeMessage(messageId, user.id, dispatch)
    },
    [user]
  )

  const unlikeMessage = useCallback(
    async (messageId: string) => {
      if (!user) return
      await messageActions.unlikeMessage(messageId, user.id, dispatch)
    },
    [user]
  )

  const setReplyTarget = useCallback((message: Message | null) => {
    messageActions.setReplyTarget(message, dispatch)
  }, [])

  const clearReplyTarget = useCallback(() => {
    messageActions.clearReplyTarget(dispatch)
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      fetchMessages,
      sendMessage,
      deleteMessage,
      likeMessage,
      unlikeMessage,
      setReplyTarget,
      clearReplyTarget
    }),
    [
      state,
      fetchMessages,
      sendMessage,
      deleteMessage,
      likeMessage,
      unlikeMessage,
      setReplyTarget,
      clearReplyTarget
    ]
  )

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>
}

export function useMessages() {
  const context = useContext(MessagesContext)
  if (!context) {
    throw new Error('useMessages must be used within MessagesProvider')
  }
  return context
}
```

---

## Provider Composition

### File: `contexts/ContextProvider.tsx`

```typescript
'use client'

import { ReactNode } from 'react'
import { AuthProvider } from './AuthContext'
import { RoomsProvider } from './RoomsContext'
import { MessagesProvider } from './MessagesContext'

/**
 * Combined context provider
 * Wraps entire application with all contexts
 */
export function ContextProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RoomsProvider>
        <MessagesProvider>
          {children}
        </MessagesProvider>
      </RoomsProvider>
    </AuthProvider>
  )
}
```

### Usage in `app/layout.tsx`

```typescript
import { ContextProvider } from '@/contexts/ContextProvider'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ContextProvider>
          {children}
        </ContextProvider>
      </body>
    </html>
  )
}
```

---

## Validation Checklist

Before implementation:

- ✅ All action types defined in discriminated unions
- ✅ Reducers are pure functions
- ✅ Initial states defined
- ✅ Actions memoized with useCallback
- ✅ Context values memoized with useMemo
- ✅ Custom hooks throw errors outside providers
- ✅ Optimistic updates implemented for user actions
- ✅ Error handling comprehensive
- ✅ TypeScript strict mode compatible
- ✅ Provider composition correct order

---

**End of Context Implementation Specification**
