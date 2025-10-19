# Codebase Structure Specification
# Chat Application - MVP Learning Project

**Document Version:** 1.0
**Last Updated:** 2025-10-19
**Based on:** Tech Stack v1.0, PRD v1.0, Userflow v1.0
**Architecture Pattern:** Layered Architecture + Flux Pattern

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [Layer Definitions](#layer-definitions)
4. [Dependency Rules](#dependency-rules)
5. [Flux Implementation](#flux-implementation)
6. [Code Examples](#code-examples)
7. [Module Guidelines](#module-guidelines)
8. [Testing Strategy](#testing-strategy)
9. [Common Pitfalls](#common-pitfalls)

---

## Architecture Overview

### Chosen Pattern: Layered Architecture with Flux

**Why Layered Architecture**:
- **Learning Focus**: Clear separation teaches architectural principles
- **Scalability**: Easy to understand and extend
- **Team Friendly**: Intuitive for developers at all levels
- **Flux Compatible**: Aligns with unidirectional data flow

**Architecture Diagram**:
```
┌─────────────────────────────────────────────────────┐
│  Presentation Layer (UI Components + Pages)         │
│  - React Components                                 │
│  - Next.js Pages/Routes                             │
│  - UI Logic Only                                    │
└─────────────────┬───────────────────────────────────┘
                  │ (dispatches actions)
                  ▼
┌─────────────────────────────────────────────────────┐
│  Application Layer (Flux Actions + Context)         │
│  - Actions (Business Logic Entry)                   │
│  - Context Providers (State Management)             │
│  - Reducers (State Updates)                         │
└─────────────────┬───────────────────────────────────┘
                  │ (uses)
                  ▼
┌─────────────────────────────────────────────────────┐
│  Infrastructure Layer (External Services)           │
│  - Supabase Client                                  │
│  - API Calls                                        │
│  - Browser APIs (localStorage, etc.)                │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│  Shared Layer (Utilities + Types)                   │
│  - TypeScript Types                                 │
│  - Helper Functions                                 │
│  - Constants                                        │
└─────────────────────────────────────────────────────┘
```

### Simplified for MVP
- **No Domain Layer**: Business logic in Actions (not complex enough to separate)
- **No Repository Pattern**: Supabase client is abstraction enough
- **Pragmatic Approach**: Clean but not over-engineered

---

## Directory Structure

### Complete Project Structure

```
chat-app/
├── src/
│   ├── app/                          # [PRESENTATION] Next.js App Router
│   │   ├── (auth)/                   # Route Group: Authentication Pages
│   │   │   ├── login/
│   │   │   │   └── page.tsx         # Login page
│   │   │   └── register/
│   │   │       └── page.tsx         # Register page
│   │   │
│   │   ├── (protected)/              # Route Group: Protected Pages
│   │   │   ├── rooms/
│   │   │   │   ├── page.tsx         # Room list page
│   │   │   │   └── [roomId]/
│   │   │   │       └── page.tsx     # Chat room page
│   │   │   └── layout.tsx           # Protected layout (auth check)
│   │   │
│   │   ├── api/                      # API Routes (if needed)
│   │   │   └── health/
│   │   │       └── route.ts         # Health check endpoint
│   │   │
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page (redirect)
│   │   └── globals.css               # Global styles + Tailwind directives
│   │
│   ├── components/                   # [PRESENTATION] UI Components
│   │   ├── auth/                     # Authentication Components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── AuthLayout.tsx
│   │   │
│   │   ├── rooms/                    # Room Management Components
│   │   │   ├── RoomList.tsx
│   │   │   ├── RoomCard.tsx
│   │   │   ├── CreateRoomDialog.tsx
│   │   │   └── RoomHeader.tsx
│   │   │
│   │   ├── chat/                     # Chat Components
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── MessageActions.tsx
│   │   │   ├── EmojiPicker.tsx
│   │   │   ├── ReplyPreview.tsx
│   │   │   ├── DateSeparator.tsx
│   │   │   └── DeletedMessage.tsx
│   │   │
│   │   ├── common/                   # Reusable UI Components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   └── Toast.tsx
│   │   │
│   │   └── layout/                   # Layout Components
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── Container.tsx
│   │
│   ├── contexts/                     # [APPLICATION] Flux State Management
│   │   ├── AuthContext.tsx           # Auth state + actions
│   │   ├── RoomsContext.tsx          # Rooms state + actions
│   │   ├── MessagesContext.tsx       # Messages state + actions
│   │   └── ContextProvider.tsx       # Combined provider wrapper
│   │
│   ├── actions/                      # [APPLICATION] Flux Actions (Business Logic)
│   │   ├── authActions.ts            # Login, register, logout
│   │   ├── roomActions.ts            # Create, join, leave rooms
│   │   └── messageActions.ts         # Send, delete, like messages
│   │
│   ├── reducers/                     # [APPLICATION] Flux Reducers
│   │   ├── authReducer.ts            # Auth state updates
│   │   ├── roomsReducer.ts           # Rooms state updates
│   │   └── messagesReducer.ts        # Messages state updates
│   │
│   ├── lib/                          # [INFRASTRUCTURE] External Services
│   │   ├── supabase/
│   │   │   ├── client.ts            # Supabase client instance
│   │   │   ├── auth.ts              # Auth helpers
│   │   │   ├── database.ts          # Database helpers
│   │   │   └── types.ts             # Auto-generated DB types
│   │   │
│   │   └── polling/
│   │       ├── messagePolling.ts    # Message polling logic
│   │       └── roomPolling.ts       # Room polling logic
│   │
│   ├── hooks/                        # [PRESENTATION] Custom React Hooks
│   │   ├── useAuth.ts               # Access AuthContext
│   │   ├── useRooms.ts              # Access RoomsContext
│   │   ├── useMessages.ts           # Access MessagesContext
│   │   ├── usePolling.ts            # Generic polling hook
│   │   ├── useOptimistic.ts         # Optimistic UI helper
│   │   └── useForm.ts               # Form state management
│   │
│   ├── types/                        # [SHARED] TypeScript Types
│   │   ├── auth.ts                  # User, Session types
│   │   ├── room.ts                  # ChatRoom, RoomMember types
│   │   ├── message.ts               # Message, Like types
│   │   ├── database.ts              # Supabase generated types
│   │   └── common.ts                # Shared utility types
│   │
│   ├── utils/                        # [SHARED] Utility Functions
│   │   ├── date/
│   │   │   ├── formatDate.ts        # Date formatting utilities
│   │   │   └── relativeTime.ts      # "2 min ago" formatting
│   │   ├── string/
│   │   │   ├── truncate.ts          # String truncation
│   │   │   └── sanitize.ts          # XSS prevention
│   │   ├── validation/
│   │   │   ├── email.ts             # Email validation
│   │   │   └── password.ts          # Password validation
│   │   └── constants.ts             # App-wide constants
│   │
│   ├── middleware.ts                 # Next.js middleware (auth check)
│   └── env.ts                        # Environment variables validation
│
├── public/                           # Static Assets
│   ├── images/
│   ├── fonts/
│   └── favicon.ico
│
├── docs/                             # Documentation
│   ├── 001/
│   │   └── prd.md
│   ├── 002/
│   │   └── userflow.md
│   └── 003/
│       ├── tech-stack.md
│       └── codebase-structure.md
│
├── .env.local                        # Environment variables (gitignored)
├── .env.example                      # Environment variables template
├── .gitignore
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json
├── package-lock.json
└── README.md
```

---

## Layer Definitions

### 1. Presentation Layer

**Location**: `/src/app`, `/src/components`, `/src/hooks`

**Responsibility**: User interface and user interactions

**What Belongs Here**:
- ✅ React components (UI rendering)
- ✅ Next.js pages and layouts
- ✅ User input handling (form events)
- ✅ UI state (modals open/closed, form values)
- ✅ Custom hooks for UI logic

**What DOES NOT Belong Here**:
- ❌ Business logic (calculations, validations)
- ❌ Direct database calls
- ❌ Direct Supabase client usage
- ❌ Complex state transformations

**Key Principle**: Components should be "dumb" - they receive data and dispatch actions, nothing more.

**Example**:
```typescript
// ✅ GOOD: Component dispatches action
export function LoginForm() {
  const { login, loading, error } = useAuth()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    login(email, password) // Calls action from context
  }

  return <form onSubmit={handleSubmit}>...</form>
}

// ❌ BAD: Component has business logic
export function LoginForm() {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.auth.signInWithPassword(...)
    if (error) { /* handle error */ }
    // Business logic in component!
  }
}
```

---

### 2. Application Layer (Flux Implementation)

**Location**: `/src/contexts`, `/src/actions`, `/src/reducers`

**Responsibility**: Application state management and business logic orchestration

**What Belongs Here**:
- ✅ Context Providers (state containers)
- ✅ Actions (business logic functions)
- ✅ Reducers (state update logic)
- ✅ State shape definitions
- ✅ Business rules and validations

**What DOES NOT Belong Here**:
- ❌ UI rendering logic
- ❌ Direct infrastructure implementation details
- ❌ Framework-specific code (beyond React Context)

**Flux Pattern Components**:

1. **Store (Context)**:
```typescript
// contexts/AuthContext.tsx
interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
}
```

2. **Actions** (Business Logic):
```typescript
// actions/authActions.ts
export const login = async (
  email: string,
  password: string,
  dispatch: Dispatch<AuthAction>
) => {
  dispatch({ type: 'LOGIN_LOADING' })

  try {
    // Call infrastructure layer
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) throw error

    dispatch({ type: 'LOGIN_SUCCESS', payload: data.user })
  } catch (error) {
    dispatch({ type: 'LOGIN_ERROR', payload: error.message })
  }
}
```

3. **Reducer** (State Updates):
```typescript
// reducers/authReducer.ts
export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_LOADING':
      return { ...state, loading: true, error: null }
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.payload, loading: false, error: null }
    case 'LOGIN_ERROR':
      return { ...state, loading: false, error: action.payload }
    case 'LOGOUT':
      return { user: null, loading: false, error: null }
    default:
      return state
  }
}
```

---

### 3. Infrastructure Layer

**Location**: `/src/lib`

**Responsibility**: External service integration

**What Belongs Here**:
- ✅ Supabase client configuration
- ✅ API call wrappers
- ✅ Third-party service integrations
- ✅ Browser API wrappers (localStorage, etc.)

**What DOES NOT Belong Here**:
- ❌ Business logic
- ❌ UI components
- ❌ State management

**Example**:
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// lib/supabase/auth.ts
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}
```

---

### 4. Shared Layer

**Location**: `/src/types`, `/src/utils`

**Responsibility**: Common code used across all layers

**What Belongs Here**:
- ✅ TypeScript type definitions
- ✅ Pure utility functions (no side effects)
- ✅ Constants
- ✅ Helper functions (date formatting, string manipulation)

**What DOES NOT Belong Here**:
- ❌ Business logic
- ❌ UI components
- ❌ State management
- ❌ External service calls

**Key Principle**: Utilities should be PURE functions - same input always produces same output, no side effects.

**Example**:
```typescript
// ✅ GOOD: Pure utility function
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  // ... etc
}

// ❌ BAD: Utility with side effects
export function saveToLocalStorage(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value))
  // Side effect! Should be in infrastructure layer
}
```

---

## Dependency Rules

### Layered Dependency Flow

```
┌─────────────────────┐
│  Presentation       │
│  (Components)       │
└──────────┬──────────┘
           │ (can import)
           ▼
┌─────────────────────┐
│  Application        │
│  (Contexts/Actions) │
└──────────┬──────────┘
           │ (can import)
           ▼
┌─────────────────────┐      ┌─────────────────────┐
│  Infrastructure     │◄─────│  Shared             │
│  (Supabase/API)    │      │  (Types/Utils)      │
└─────────────────────┘      └─────────────────────┘

Legend:
→  Allowed dependency
╳  Forbidden dependency
```

### Import Rules

**Presentation Layer CAN Import**:
- ✅ Application Layer (contexts, hooks)
- ✅ Shared Layer (types, utils)
- ❌ Infrastructure Layer (NO direct Supabase calls)

**Application Layer CAN Import**:
- ✅ Infrastructure Layer (to make API calls)
- ✅ Shared Layer (types, utils)
- ❌ Presentation Layer (NO component imports)

**Infrastructure Layer CAN Import**:
- ✅ Shared Layer (types, constants)
- ❌ Application Layer
- ❌ Presentation Layer

**Shared Layer CAN Import**:
- ❌ Nothing (must be isolated)

### Validation with ESLint

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        // Presentation cannot import Infrastructure
        {
          group: ['**/lib/**'],
          importNames: ['supabase'],
          message: 'Components should not directly use Supabase. Use Context actions instead.'
        },
        // Infrastructure cannot import Application
        {
          group: ['**/lib/**'],
          importNamePattern: '**/contexts/**',
          message: 'Infrastructure layer cannot import Application layer.'
        }
      ]
    }]
  }
}
```

---

## Flux Implementation

### Flux Data Flow

```
┌──────────────┐
│  Component   │
│  (View)      │
└──────┬───────┘
       │ 1. User clicks button
       │
       ▼
┌──────────────┐
│  Action      │
│  (Function)  │──┐
└──────────────┘  │ 2. Action calls Supabase
                  │
        ┌─────────▼──────────┐
        │  Infrastructure    │
        │  (Supabase API)    │
        └─────────┬──────────┘
                  │ 3. Returns data/error
       ┌──────────▼──────────┐
       │  Dispatcher          │
       │  (Reducer)           │
       └──────────┬───────────┘
                  │ 4. Updates state
       ┌──────────▼──────────┐
       │  Store               │
       │  (Context State)     │
       └──────────┬───────────┘
                  │ 5. State change triggers re-render
       ┌──────────▼──────────┐
       │  Component           │
       │  (View)              │
       └──────────────────────┘
```

### Context Structure

**AuthContext** (User Authentication):
```typescript
interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}
```

**RoomsContext** (Chat Rooms):
```typescript
interface RoomsState {
  rooms: ChatRoom[]
  activeRoomId: string | null
  loading: boolean
  error: string | null
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

**MessagesContext** (Messages):
```typescript
interface MessagesState {
  messagesByRoom: Record<string, Message[]>
  likesCache: Record<string, Like[]>
  replyTarget: Message | null
  loading: boolean
  error: string | null
}

interface MessagesContextType extends MessagesState {
  // Actions
  fetchMessages: (roomId: string) => Promise<void>
  sendMessage: (roomId: string, content: string, type: 'text' | 'emoji') => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  likeMessage: (messageId: string) => Promise<void>
  unlikeMessage: (messageId: string) => Promise<void>
  setReplyTarget: (message: Message | null) => void
}
```

### Optimistic Updates Pattern

```typescript
// Example: Send message with optimistic UI
export const sendMessage = async (
  roomId: string,
  content: string,
  dispatch: Dispatch<MessageAction>
) => {
  const tempId = `temp-${Date.now()}`
  const optimisticMessage = {
    id: tempId,
    room_id: roomId,
    content,
    created_at: new Date().toISOString(),
    user_id: currentUserId,
    status: 'sending' as const
  }

  // 1. Optimistically add to state
  dispatch({
    type: 'ADD_MESSAGE_OPTIMISTIC',
    payload: { roomId, message: optimisticMessage }
  })

  try {
    // 2. Send to server
    const { data, error } = await supabase
      .from('messages')
      .insert({ room_id: roomId, content })
      .select()
      .single()

    if (error) throw error

    // 3. Replace temp with real data
    dispatch({
      type: 'REPLACE_MESSAGE',
      payload: { tempId, message: data }
    })
  } catch (error) {
    // 4. Mark as failed on error
    dispatch({
      type: 'MESSAGE_SEND_FAILED',
      payload: { tempId, error: error.message }
    })
  }
}
```

---

## Code Examples

### Example 1: Complete User Login Flow

#### 1) Type Definitions
```typescript
// types/auth.ts
export interface User {
  id: string
  email: string
  display_name: string
  created_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}
```

#### 2) Action (Business Logic)
```typescript
// actions/authActions.ts
import { supabase } from '@/lib/supabase/client'
import { Dispatch } from 'react'
import { AuthAction } from '@/reducers/authReducer'

export async function login(
  email: string,
  password: string,
  dispatch: Dispatch<AuthAction>
): Promise<void> {
  // Start loading
  dispatch({ type: 'LOGIN_LOADING' })

  try {
    // Call infrastructure
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    // Fetch user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    // Success
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
    // Error
    dispatch({
      type: 'LOGIN_ERROR',
      payload: error instanceof Error ? error.message : 'Login failed'
    })
  }
}
```

#### 3) Reducer (State Updates)
```typescript
// reducers/authReducer.ts
import { User } from '@/types/auth'

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export type AuthAction =
  | { type: 'LOGIN_LOADING' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User | null }

export const initialAuthState: AuthState = {
  user: null,
  loading: false,
  error: null
}

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_LOADING':
      return { ...state, loading: true, error: null }

    case 'LOGIN_SUCCESS':
      return {
        user: action.payload,
        loading: false,
        error: null
      }

    case 'LOGIN_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      }

    case 'LOGOUT':
      return initialAuthState

    case 'SET_USER':
      return { ...state, user: action.payload }

    default:
      return state
  }
}
```

#### 4) Context Provider
```typescript
// contexts/AuthContext.tsx
'use client'

import { createContext, useReducer, useContext, useCallback, ReactNode } from 'react'
import { authReducer, initialAuthState, AuthState } from '@/reducers/authReducer'
import * as authActions from '@/actions/authActions'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState)

  const login = useCallback(async (email: string, password: string) => {
    await authActions.login(email, password, dispatch)
  }, [])

  const logout = useCallback(async () => {
    await authActions.logout(dispatch)
  }, [])

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    await authActions.register(email, password, displayName, dispatch)
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

#### 5) UI Component
```typescript
// components/auth/LoginForm.tsx
'use client'

import { FormEvent, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'

export function LoginForm() {
  const { login, loading, error } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await login(email, password)

    // Redirect on success (error handled by context)
    if (!error) {
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

#### 6) Page Integration
```typescript
// app/(auth)/login/page.tsx
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Login to Chat App
        </h1>
        <LoginForm />
      </div>
    </div>
  )
}
```

### Flow Summary
```
User fills form → LoginForm.handleSubmit()
                    ↓
                useAuth().login(email, password)
                    ↓
                authActions.login() → dispatch('LOGIN_LOADING')
                    ↓
                Supabase API call
                    ↓
            Success → dispatch('LOGIN_SUCCESS', user)
            Error → dispatch('LOGIN_ERROR', message)
                    ↓
                authReducer updates state
                    ↓
                LoginForm re-renders with new state
                    ↓
                Redirect to /rooms
```

---

## Module Guidelines

### Component Guidelines

**File Naming**:
- PascalCase for components: `MessageBubble.tsx`
- camelCase for utilities: `formatDate.ts`
- kebab-case for routes: `[room-id]/page.tsx`

**Component Structure**:
```typescript
// 1. Imports
import { useState } from 'react'
import { useMessages } from '@/contexts/MessagesContext'
import { Button } from '@/components/common/Button'

// 2. Types (if not in separate file)
interface MessageBubbleProps {
  message: Message
  isOwnMessage: boolean
}

// 3. Component
export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  // Hooks first
  const { deleteMessage, likeMessage } = useMessages()
  const [showActions, setShowActions] = useState(false)

  // Event handlers
  const handleDelete = () => {
    deleteMessage(message.id)
  }

  // Render
  return (
    <div className={/* ... */}>
      {/* JSX */}
    </div>
  )
}
```

**Component Principles**:
- One component per file
- Export component as named export
- Props interface above component
- Use TypeScript strict mode
- Keep components small (<200 lines)

---

### Context Guidelines

**Context File Structure**:
```typescript
// 1. Imports
import { createContext, useReducer, useContext } from 'react'

// 2. Types
interface State { /* ... */ }
interface ContextType extends State { /* actions */ }

// 3. Context creation
const Context = createContext<ContextType | undefined>(undefined)

// 4. Provider component
export function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Actions defined as callbacks
  const action = useCallback(async () => {
    // Call action function from /actions
  }, [])

  return <Context.Provider value={{ ...state, action }}>{children}</Context.Provider>
}

// 5. Hook for consuming context
export function useHook() {
  const context = useContext(Context)
  if (!context) throw new Error('Must be used within Provider')
  return context
}
```

---

### Action Guidelines

**Action File Structure**:
```typescript
// actions/messageActions.ts
import { supabase } from '@/lib/supabase/client'
import { Dispatch } from 'react'
import { MessageAction } from '@/reducers/messagesReducer'

// Each action is an async function
export async function sendMessage(
  roomId: string,
  content: string,
  dispatch: Dispatch<MessageAction>
) {
  dispatch({ type: 'SEND_MESSAGE_LOADING' })

  try {
    // Business logic here
    const { data, error } = await supabase.from('messages').insert(...)

    if (error) throw error

    dispatch({ type: 'SEND_MESSAGE_SUCCESS', payload: data })
  } catch (error) {
    dispatch({ type: 'SEND_MESSAGE_ERROR', payload: error.message })
  }
}
```

**Action Principles**:
- Pure business logic (no UI concerns)
- Always dispatch loading/success/error
- Handle errors gracefully
- Return Promise for async operations

---

### Utility Guidelines

**Utility Principles**:
- Pure functions only (no side effects)
- Single responsibility
- Well-typed inputs and outputs
- Include JSDoc comments

**Example**:
```typescript
// utils/date/formatDate.ts

/**
 * Formats a date as a relative time string (e.g., "2 min ago")
 * @param date - The date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

  return dateObj.toLocaleDateString()
}
```

---

## Testing Strategy

### Testing Layers

**Unit Tests** (Optional for MVP):
- **Utilities**: Test all pure functions
- **Reducers**: Test state transitions
- **Actions**: Mock Supabase, test business logic

**Integration Tests** (Future):
- Test Context + Actions + Components together
- Mock Supabase at infrastructure boundary

**E2E Tests** (Future):
- Test complete user flows
- Use Playwright for browser testing

### Example Unit Test
```typescript
// __tests__/utils/formatDate.test.ts
import { formatRelativeTime } from '@/utils/date/formatDate'

describe('formatRelativeTime', () => {
  it('returns "Just now" for times less than 1 minute ago', () => {
    const now = new Date()
    const result = formatRelativeTime(now)
    expect(result).toBe('Just now')
  })

  it('returns "X min ago" for times less than 1 hour ago', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
    const result = formatRelativeTime(date)
    expect(result).toBe('5 min ago')
  })
})
```

---

## Common Pitfalls

### ❌ Anti-Pattern 1: Business Logic in Components

**BAD**:
```typescript
// Component with business logic
function MessageBubble({ message }) {
  const handleLike = async () => {
    // Business logic in component!
    const { data } = await supabase.from('message_likes').insert(...)
    setLikes(likes + 1)
  }
}
```

**GOOD**:
```typescript
// Component dispatches action
function MessageBubble({ message }) {
  const { likeMessage } = useMessages()

  const handleLike = () => {
    likeMessage(message.id) // Action handles business logic
  }
}
```

---

### ❌ Anti-Pattern 2: Direct Supabase Calls from Components

**BAD**:
```typescript
// Component imports Supabase
import { supabase } from '@/lib/supabase/client'

function LoginForm() {
  const handleLogin = async () => {
    const { data } = await supabase.auth.signInWithPassword(...)
  }
}
```

**GOOD**:
```typescript
// Component uses Context
import { useAuth } from '@/contexts/AuthContext'

function LoginForm() {
  const { login } = useAuth()

  const handleLogin = async () => {
    await login(email, password)
  }
}
```

---

### ❌ Anti-Pattern 3: Prop Drilling

**BAD**:
```typescript
// Passing props through many components
<App user={user}>
  <Header user={user}>
    <UserMenu user={user} />
  </Header>
</App>
```

**GOOD**:
```typescript
// Use Context to avoid prop drilling
function UserMenu() {
  const { user } = useAuth() // Access from Context
}
```

---

### ❌ Anti-Pattern 4: Not Using Optimistic Updates

**BAD**:
```typescript
// Wait for server response before updating UI
const handleSend = async () => {
  const { data } = await supabase.from('messages').insert(...)
  setMessages([...messages, data]) // Slow UI update
}
```

**GOOD**:
```typescript
// Update UI immediately, confirm later
const handleSend = async () => {
  const tempMessage = { id: 'temp', content, status: 'sending' }
  setMessages([...messages, tempMessage]) // Instant UI update

  const { data } = await supabase.from('messages').insert(...)
  setMessages(msgs => msgs.map(m => m.id === 'temp' ? data : m)) // Replace temp
}
```

---

## Validation Checklist

Before finalizing structure, ensure:

- ✅ **Separation of Concerns**: UI, Business Logic, Infrastructure clearly separated
- ✅ **Dependency Direction**: Layers depend only on inner layers
- ✅ **Flux Adherence**: Unidirectional data flow (View → Action → Reducer → Store → View)
- ✅ **No Business Logic in Components**: All logic in Actions
- ✅ **No Direct Supabase in Components**: All DB calls via Context
- ✅ **Type Safety**: All functions and components fully typed
- ✅ **Single Responsibility**: Each file has one clear purpose
- ✅ **Testability**: Pure functions, mockable dependencies

---

## Next Steps

1. ✅ **Read Codebase Structure** (this document)
2. → **Initialize Next.js Project** (follow structure)
3. → **Setup TypeScript** (strict mode)
4. → **Create Context Providers** (AuthContext first)
5. → **Implement First Feature** (Authentication)

---

**End of Codebase Structure Document**
