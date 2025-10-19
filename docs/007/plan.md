# Implementation Plan
# Chat Application - MVP Learning Project

**Document Version:** 1.0
**Created:** 2025-10-19
**Based on:** PRD v1.0, Userflow v1.0, Tech Stack v1.0, Database v1.0, Use Cases v1.0, State Management v1.0, Flux Pattern v1.0, Context Spec v1.0

---

## Table of Contents
1. [Setup Phase](#phase-1-setup)
2. [Database Phase](#phase-2-database)
3. [Infrastructure Phase](#phase-3-infrastructure)
4. [Contexts Phase](#phase-4-contexts)
5. [Components Phase](#phase-5-components)
6. [Pages Phase](#phase-6-pages)
7. [Integration Phase](#phase-7-integration)
8. [Testing Phase](#phase-8-testing)

---

## Phase 1: Setup (Week 1, Day 1)

### 1.1 Initialize Next.js Project
**File**: `package.json` (root directory)
**Dependencies**: All required npm packages
**Estimated Time**: 30 minutes

**Tasks**:
1. Run `npx create-next-app@latest chat-app --typescript --tailwind --app`
2. Install dependencies:
   ```bash
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
   npm install date-fns
   npm install -D @types/node
   ```

**Acceptance Criteria**:
- ✅ Next.js 15 with App Router initialized
- ✅ TypeScript strict mode enabled
- ✅ Tailwind CSS configured
- ✅ All dependencies installed
- ✅ Project builds without errors (`npm run build`)

---

### 1.2 Configure TypeScript
**File**: `tsconfig.json`
**Dependencies**: None
**Estimated Time**: 15 minutes

**Tasks**:
1. Update `tsconfig.json` with strict configuration
2. Configure path aliases (`@/*` for `./src/*`)
3. Enable necessary compiler options

**Configuration**:
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "incremental": true,
    "esModuleInterop": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Acceptance Criteria**:
- ✅ Strict mode enabled
- ✅ Path aliases working
- ✅ No TypeScript errors

---

### 1.3 Setup Tailwind CSS
**File**: `tailwind.config.ts`
**Dependencies**: Tailwind CSS (already installed)
**Estimated Time**: 15 minutes

**Tasks**:
1. Configure Tailwind content paths
2. Extend theme with custom colors
3. Add Tailwind directives to `globals.css`

**Configuration**:
```typescript
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#4b5563',
        success: '#10b981',
        error: '#ef4444',
      },
    },
  },
  plugins: [],
}
```

**Acceptance Criteria**:
- ✅ Tailwind classes work in components
- ✅ Custom colors available
- ✅ No CSS conflicts

---

### 1.4 Environment Variables Setup
**File**: `.env.local` and `.env.example`
**Dependencies**: None
**Estimated Time**: 10 minutes

**Tasks**:
1. Create `.env.example` with template
2. Create `.env.local` (gitignored) with actual values
3. Validate environment variables at runtime

**.env.example**:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Acceptance Criteria**:
- ✅ `.env.example` created with placeholders
- ✅ `.env.local` in `.gitignore`
- ✅ Environment variables accessible via `process.env`

---

### 1.5 Create Directory Structure
**Files**: Multiple directories
**Dependencies**: None
**Estimated Time**: 10 minutes

**Tasks**:
1. Create all required directories following codebase structure spec
2. Add placeholder `.gitkeep` files where needed

**Structure**:
```
src/
├── app/
├── components/
│   ├── auth/
│   ├── rooms/
│   ├── chat/
│   ├── common/
│   └── layout/
├── contexts/
├── actions/
├── reducers/
├── lib/
│   └── supabase/
├── hooks/
├── types/
└── utils/
    ├── date/
    ├── string/
    └── validation/
```

**Acceptance Criteria**:
- ✅ All directories created
- ✅ Structure matches codebase-structure.md
- ✅ Clean and organized

---

## Phase 2: Database (Week 1, Day 2)

### 2.1 Create Supabase Project
**Platform**: Supabase Cloud
**Dependencies**: None
**Estimated Time**: 20 minutes

**Tasks**:
1. Sign up/login to Supabase
2. Create new project
3. Wait for project provisioning
4. Copy URL and anon key to `.env.local`

**Acceptance Criteria**:
- ✅ Supabase project created
- ✅ Connection credentials saved
- ✅ Project dashboard accessible

---

### 2.2 Run Database Migration
**File**: Database schema SQL (from database.md)
**Dependencies**: Supabase project
**Estimated Time**: 30 minutes

**Tasks**:
1. Open Supabase SQL Editor
2. Execute complete schema migration (from docs/004/database.md)
3. Verify all tables created
4. Verify indexes created
5. Verify triggers created

**SQL Script**: Use complete migration SQL from database.md (lines 614-836)

**Acceptance Criteria**:
- ✅ All tables created: user_profiles, chat_rooms, room_members, messages, message_likes
- ✅ All indexes created
- ✅ All triggers created (handle_new_user, handle_new_room, update_updated_at)
- ✅ Helper function created: get_rooms_with_metadata()

---

### 2.3 Enable Row-Level Security (RLS)
**File**: RLS policies SQL (from database.md)
**Dependencies**: Tables created
**Estimated Time**: 20 minutes

**Tasks**:
1. Enable RLS on all tables
2. Create policies for user_profiles
3. Create policies for chat_rooms
4. Create policies for room_members
5. Create policies for messages
6. Create policies for message_likes

**SQL Script**: Use RLS policies from database.md (lines 754-798)

**Acceptance Criteria**:
- ✅ RLS enabled on all tables
- ✅ All policies created
- ✅ Policies tested (users can only access their own data)

---

### 2.4 Configure Supabase Auth
**Platform**: Supabase Dashboard
**Dependencies**: Supabase project
**Estimated Time**: 15 minutes

**Tasks**:
1. Navigate to Authentication settings
2. Enable Email provider
3. Disable email confirmation (for MVP testing)
4. Configure site URL
5. Configure redirect URLs

**Settings**:
- Email provider: Enabled
- Confirm email: Disabled (MVP)
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/**`

**Acceptance Criteria**:
- ✅ Email auth enabled
- ✅ Auth settings configured
- ✅ Ready for user registration

---

### 2.5 Seed Test Data (Optional)
**File**: Seed SQL script
**Dependencies**: Tables created
**Estimated Time**: 15 minutes

**Tasks**:
1. Create test user
2. Create sample chat rooms
3. Add sample messages

**Sample Data**:
```sql
-- Test user created via Supabase Auth UI
-- Or create rooms after auth implementation
```

**Acceptance Criteria**:
- ✅ (Optional) Test data created
- ✅ Can query data via SQL editor

---

## Phase 3: Infrastructure (Week 1, Day 3)

### 3.1 Supabase Client Setup
**File**: `src/lib/supabase/client.ts`
**Dependencies**: Environment variables, Supabase SDK
**Estimated Time**: 20 minutes

**Content**:
```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

**Acceptance Criteria**:
- ✅ Supabase client created
- ✅ Environment variables validated
- ✅ TypeScript types applied
- ✅ Client can be imported

---

### 3.2 Generate Database Types
**File**: `src/types/database.ts`
**Dependencies**: Supabase CLI
**Estimated Time**: 25 minutes

**Tasks**:
1. Install Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Generate types:
   ```bash
   supabase gen types typescript --project-id [PROJECT_ID] > src/types/database.ts
   ```
4. Verify types generated

**Acceptance Criteria**:
- ✅ Database types generated
- ✅ Types match database schema
- ✅ No TypeScript errors
- ✅ Types imported successfully

---

### 3.3 Create Type Definitions
**Files**: `src/types/auth.ts`, `src/types/room.ts`, `src/types/message.ts`
**Dependencies**: None
**Estimated Time**: 30 minutes

**3.3.1 auth.ts**:
```typescript
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

export interface RegisterData {
  email: string
  password: string
  displayName: string
}
```

**3.3.2 room.ts**:
```typescript
export interface ChatRoom {
  id: string
  name: string
  description: string | null
  created_by: string
  created_at: string
  member_count?: number
  last_message_at?: string | null
}

export interface RoomMember {
  room_id: string
  user_id: string
  joined_at: string
}
```

**3.3.3 message.ts**:
```typescript
export interface Message {
  id: string
  room_id: string
  user_id: string
  content: string
  type: 'text' | 'emoji'
  parent_message_id: string | null
  created_at: string
  deleted_at: string | null
  status?: 'sending' | 'sent' | 'failed'
  tempId?: string
  author_name?: string
  parent_content?: string
  parent_author?: string
}

export interface MessageLike {
  message_id: string
  user_id: string
  created_at: string
}
```

**Acceptance Criteria**:
- ✅ All type files created
- ✅ Types match database schema
- ✅ No TypeScript errors

---

### 3.4 Create Utility Functions
**Files**: Various utility files
**Dependencies**: None
**Estimated Time**: 40 minutes

**3.4.1 src/utils/date/formatDate.ts**:
```typescript
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

**3.4.2 src/utils/string/truncate.ts**:
```typescript
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}
```

**3.4.3 src/utils/string/sanitize.ts**:
```typescript
export function sanitizeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}
```

**3.4.4 src/utils/validation/email.ts**:
```typescript
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
```

**3.4.5 src/utils/validation/password.ts**:
```typescript
export function isValidPassword(password: string): boolean {
  return password.length >= 8
}

export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 8) return 'weak'
  if (password.length < 12) return 'medium'
  return 'strong'
}
```

**3.4.6 src/utils/constants.ts**:
```typescript
export const POLLING_INTERVAL = {
  MESSAGES: 3000,  // 3 seconds
  ROOMS: 10000     // 10 seconds
}

export const MAX_MESSAGE_LENGTH = 2000
export const MAX_ROOM_NAME_LENGTH = 50
export const MAX_ROOM_DESCRIPTION_LENGTH = 200
export const MIN_ROOM_NAME_LENGTH = 3
export const MIN_DISPLAY_NAME_LENGTH = 2
export const MAX_DISPLAY_NAME_LENGTH = 50
```

**Acceptance Criteria**:
- ✅ All utility functions created
- ✅ Functions are pure (no side effects)
- ✅ All functions exported
- ✅ TypeScript types correct

---

## Phase 4: Contexts (Week 1-2)

### 4.1 AuthContext Implementation
**Files**: `src/reducers/authReducer.ts`, `src/actions/authActions.ts`, `src/contexts/AuthContext.tsx`
**Dependencies**: Supabase client, types
**Estimated Time**: 2-3 hours

**4.1.1 Create authReducer.ts**:
- Use complete code from context-spec.md lines 60-152
- Define AuthState interface
- Define AuthAction discriminated union
- Create initialAuthState
- Implement authReducer function

**4.1.2 Create authActions.ts**:
- Use complete code from context-spec.md lines 160-332
- Implement login action
- Implement register action
- Implement logout action
- Implement refreshSession action
- Implement clearError action

**4.1.3 Create AuthContext.tsx**:
- Use complete code from context-spec.md lines 340-428
- Create AuthContext with createContext
- Implement AuthProvider component
- Use useReducer for state management
- Memoize all action functions
- Memoize context value
- Implement useAuth custom hook
- Add auth state listener

**Acceptance Criteria**:
- ✅ All files created
- ✅ No TypeScript errors
- ✅ Reducer is pure function
- ✅ Actions are async and dispatch correctly
- ✅ Context provides all necessary functions
- ✅ Session persistence works

---

### 4.2 RoomsContext Implementation
**Files**: `src/reducers/roomsReducer.ts`, `src/actions/roomActions.ts`, `src/contexts/RoomsContext.tsx`
**Dependencies**: Supabase client, types, AuthContext
**Estimated Time**: 2-3 hours

**4.2.1 Create roomsReducer.ts**:
- Use complete code from context-spec.md lines 462-562
- Define RoomsState interface
- Define RoomsAction discriminated union
- Create initialRoomsState
- Implement roomsReducer function

**4.2.2 Create roomActions.ts**:
- Use complete code from context-spec.md lines 570-722
- Implement fetchRooms action
- Implement createRoom action (with optimistic update)
- Implement joinRoom action
- Implement leaveRoom action
- Implement setActiveRoom action
- Implement clearError action

**4.2.3 Create RoomsContext.tsx**:
- Use complete code from context-spec.md lines 730-798
- Create RoomsContext
- Implement RoomsProvider component
- Memoize action functions
- Memoize context value
- Implement useRooms custom hook

**Acceptance Criteria**:
- ✅ All files created
- ✅ No TypeScript errors
- ✅ Optimistic updates work
- ✅ Room list fetching works
- ✅ Room creation works

---

### 4.3 MessagesContext Implementation
**Files**: `src/reducers/messagesReducer.ts`, `src/actions/messageActions.ts`, `src/contexts/MessagesContext.tsx`
**Dependencies**: Supabase client, types, AuthContext
**Estimated Time**: 3-4 hours

**4.3.1 Create messagesReducer.ts**:
- Use complete code from context-spec.md lines 840-1019
- Define MessagesState interface
- Define MessagesAction discriminated union
- Create initialMessagesState
- Implement messagesReducer function
- Handle optimistic updates
- Handle likes cache

**4.3.2 Create messageActions.ts**:
- Use complete code from context-spec.md lines 1027-1281
- Implement fetchMessages action
- Implement sendMessage action (with optimistic update)
- Implement deleteMessage action (soft delete)
- Implement likeMessage action (with optimistic update)
- Implement unlikeMessage action (with optimistic update)
- Implement setReplyTarget action
- Implement clearReplyTarget action
- Implement fetchLikesForMessages helper

**4.3.3 Create MessagesContext.tsx**:
- Use complete code from context-spec.md lines 1289-1395
- Create MessagesContext
- Implement MessagesProvider component
- Use AuthContext for user ID
- Memoize action functions
- Memoize context value
- Implement useMessages custom hook

**Acceptance Criteria**:
- ✅ All files created
- ✅ No TypeScript errors
- ✅ Optimistic message sending works
- ✅ Message deletion works
- ✅ Likes work with optimistic updates
- ✅ Reply target management works

---

### 4.4 Context Provider Composition
**File**: `src/contexts/ContextProvider.tsx`
**Dependencies**: All contexts
**Estimated Time**: 15 minutes

**Content**:
```typescript
'use client'

import { ReactNode } from 'react'
import { AuthProvider } from './AuthContext'
import { RoomsProvider } from './RoomsContext'
import { MessagesProvider } from './MessagesContext'

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

**Acceptance Criteria**:
- ✅ All contexts properly nested
- ✅ No circular dependencies
- ✅ Ready to wrap application

---

## Phase 5: Components (Week 2-3)

### 5.1 Common Components
**Directory**: `src/components/common/`
**Dependencies**: Tailwind CSS
**Estimated Time**: 2-3 hours

**5.1.1 Button.tsx**:
```typescript
'use client'

import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  fullWidth?: boolean
}

export function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  className,
  ...props
}: ButtonProps) {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-error text-white hover:bg-red-600'
  }

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
```

**5.1.2 Input.tsx**:
```typescript
'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary',
            error ? 'border-error' : 'border-gray-300',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
```

**5.1.3 Modal.tsx**:
```typescript
'use client'

import { ReactNode, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {title && (
          <h2 className="text-xl font-bold mb-4">{title}</h2>
        )}
        {children}
      </div>
    </div>
  )
}
```

**5.1.4 LoadingSpinner.tsx**:
```typescript
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )
}
```

**5.1.5 ErrorMessage.tsx**:
```typescript
interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-error rounded-lg p-4">
      <p className="text-error text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-sm text-primary hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  )
}
```

**5.1.6 Toast.tsx**:
```typescript
'use client'

import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  }

  return (
    <div
      className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg text-white shadow-lg transition-opacity duration-300 ${
        bgColors[type]
      } ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      {message}
    </div>
  )
}
```

**5.1.7 Add utility function**:

Create `src/lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Then install dependencies:
```bash
npm install clsx tailwind-merge
```

**Acceptance Criteria**:
- ✅ All common components created
- ✅ Components are reusable
- ✅ Tailwind classes work
- ✅ TypeScript types correct
- ✅ Components exported

---

### 5.2 Layout Components
**Directory**: `src/components/layout/`
**Dependencies**: Common components, AuthContext
**Estimated Time**: 1-2 hours

**5.2.1 Header.tsx**:
```typescript
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/common/Button'
import { useRouter } from 'next/navigation'

export function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  if (!user) return null

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">Chat App</h1>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user.display_name}
          </span>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
```

**5.2.2 Container.tsx**:
```typescript
import { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
}

export function Container({ children }: ContainerProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {children}
    </div>
  )
}
```

**Acceptance Criteria**:
- ✅ Header shows user info
- ✅ Logout button works
- ✅ Container provides consistent layout

---

### 5.3 Auth Components
**Directory**: `src/components/auth/`
**Dependencies**: Common components, AuthContext
**Estimated Time**: 2-3 hours

**5.3.1 LoginForm.tsx**:
```typescript
'use client'

import { FormEvent, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { isValidEmail } from '@/utils/validation/email'
import Link from 'next/link'

export function LoginForm() {
  const { login, loading, error } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Validation
    const errors: Record<string, string> = {}
    if (!email) errors.email = 'Email is required'
    else if (!isValidEmail(email)) errors.email = 'Invalid email format'
    if (!password) errors.password = 'Password is required'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors({})
    await login(email, password)

    if (!error) {
      router.push('/rooms')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        label="Email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        error={formErrors.email}
        required
      />

      <Input
        type="password"
        label="Password"
        placeholder="Your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        error={formErrors.password}
        required
      />

      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      <Button type="submit" disabled={loading} fullWidth>
        {loading ? 'Logging in...' : 'Login'}
      </Button>

      <p className="text-sm text-center text-gray-600">
        Don't have an account?{' '}
        <Link href="/register" className="text-primary hover:underline">
          Register
        </Link>
      </p>
    </form>
  )
}
```

**5.3.2 RegisterForm.tsx**:
```typescript
'use client'

import { FormEvent, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { isValidEmail } from '@/utils/validation/email'
import { isValidPassword } from '@/utils/validation/password'
import Link from 'next/link'

export function RegisterForm() {
  const { register, loading, error } = useAuth()
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Validation
    const errors: Record<string, string> = {}
    if (!displayName) errors.displayName = 'Display name is required'
    else if (displayName.length < 2) errors.displayName = 'Display name too short'
    if (!email) errors.email = 'Email is required'
    else if (!isValidEmail(email)) errors.email = 'Invalid email format'
    if (!password) errors.password = 'Password is required'
    else if (!isValidPassword(password)) errors.password = 'Password must be at least 8 characters'
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors({})
    await register(email, password, displayName)

    if (!error) {
      router.push('/rooms')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="text"
        label="Display Name"
        placeholder="John Doe"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        disabled={loading}
        error={formErrors.displayName}
        required
      />

      <Input
        type="email"
        label="Email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        error={formErrors.email}
        required
      />

      <Input
        type="password"
        label="Password"
        placeholder="Min 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        error={formErrors.password}
        required
      />

      <Input
        type="password"
        label="Confirm Password"
        placeholder="Repeat password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={loading}
        error={formErrors.confirmPassword}
        required
      />

      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      <Button type="submit" disabled={loading} fullWidth>
        {loading ? 'Creating account...' : 'Register'}
      </Button>

      <p className="text-sm text-center text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Login
        </Link>
      </p>
    </form>
  )
}
```

**Acceptance Criteria**:
- ✅ Login form validates input
- ✅ Register form validates input
- ✅ Forms show loading states
- ✅ Error messages displayed
- ✅ Forms redirect on success

---

### 5.4 Rooms Components
**Directory**: `src/components/rooms/`
**Dependencies**: Common components, RoomsContext
**Estimated Time**: 3-4 hours

**5.4.1 RoomList.tsx**:
```typescript
'use client'

import { useRooms } from '@/contexts/RoomsContext'
import { RoomCard } from './RoomCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { useEffect } from 'react'

export function RoomList() {
  const { rooms, loading, error, fetchRooms } = useRooms()

  useEffect(() => {
    fetchRooms()

    // Poll every 10 seconds
    const interval = setInterval(fetchRooms, 10000)
    return () => clearInterval(interval)
  }, [fetchRooms])

  if (loading && rooms.length === 0) {
    return <LoadingSpinner />
  }

  if (error && rooms.length === 0) {
    return <ErrorMessage message={error} onRetry={fetchRooms} />
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No rooms yet. Create the first one!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map(room => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  )
}
```

**5.4.2 RoomCard.tsx**:
```typescript
'use client'

import { ChatRoom } from '@/types/room'
import { formatRelativeTime } from '@/utils/date/formatDate'
import { truncateString } from '@/utils/string/truncate'
import { Button } from '@/components/common/Button'
import { useRooms } from '@/contexts/RoomsContext'
import { useRouter } from 'next/navigation'

interface RoomCardProps {
  room: ChatRoom
}

export function RoomCard({ room }: RoomCardProps) {
  const { joinRoom } = useRooms()
  const router = useRouter()

  const handleJoin = async () => {
    await joinRoom(room.id)
    router.push(`/rooms/${room.id}`)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <h3 className="font-bold text-lg mb-2">{room.name}</h3>

      {room.description && (
        <p className="text-sm text-gray-600 mb-3">
          {truncateString(room.description, 100)}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span>{room.member_count || 0} members</span>
        {room.last_message_at && (
          <span>{formatRelativeTime(room.last_message_at)}</span>
        )}
      </div>

      <Button onClick={handleJoin} fullWidth>
        Join Room
      </Button>
    </div>
  )
}
```

**5.4.3 CreateRoomDialog.tsx**:
```typescript
'use client'

import { useState, FormEvent } from 'react'
import { useRooms } from '@/contexts/RoomsContext'
import { Modal } from '@/components/common/Modal'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { useRouter } from 'next/navigation'
import { MAX_ROOM_NAME_LENGTH, MAX_ROOM_DESCRIPTION_LENGTH, MIN_ROOM_NAME_LENGTH } from '@/utils/constants'

interface CreateRoomDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateRoomDialog({ isOpen, onClose }: CreateRoomDialogProps) {
  const { createRoom, loading } = useRooms()
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Validation
    const errors: Record<string, string> = {}
    if (!name.trim()) errors.name = 'Room name is required'
    else if (name.trim().length < MIN_ROOM_NAME_LENGTH) errors.name = `Name must be at least ${MIN_ROOM_NAME_LENGTH} characters`
    else if (name.length > MAX_ROOM_NAME_LENGTH) errors.name = `Name must be max ${MAX_ROOM_NAME_LENGTH} characters`

    if (description.length > MAX_ROOM_DESCRIPTION_LENGTH) {
      errors.description = `Description must be max ${MAX_ROOM_DESCRIPTION_LENGTH} characters`
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors({})
    const newRoom = await createRoom(name.trim(), description.trim() || undefined)

    if (newRoom) {
      setName('')
      setDescription('')
      onClose()
      router.push(`/rooms/${newRoom.id}`)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setFormErrors({})
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Room">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          label="Room Name"
          placeholder="e.g., General Discussion"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          error={formErrors.name}
          maxLength={MAX_ROOM_NAME_LENGTH}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            placeholder="Brief description of this room..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            maxLength={MAX_ROOM_DESCRIPTION_LENGTH}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
          />
          {formErrors.description && (
            <p className="mt-1 text-sm text-error">{formErrors.description}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {description.length}/{MAX_ROOM_DESCRIPTION_LENGTH}
          </p>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={handleClose} fullWidth>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} fullWidth>
            {loading ? 'Creating...' : 'Create Room'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
```

**5.4.4 RoomHeader.tsx**:
```typescript
'use client'

import { Button } from '@/components/common/Button'
import { useRouter } from 'next/navigation'
import { ChatRoom } from '@/types/room'

interface RoomHeaderProps {
  room: ChatRoom
}

export function RoomHeader({ room }: RoomHeaderProps) {
  const router = useRouter()

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{room.name}</h2>
          {room.description && (
            <p className="text-sm text-gray-600">{room.description}</p>
          )}
        </div>

        <Button variant="secondary" onClick={() => router.push('/rooms')}>
          Back to Rooms
        </Button>
      </div>
    </div>
  )
}
```

**Acceptance Criteria**:
- ✅ Room list displays all rooms
- ✅ Polling updates room list
- ✅ Room cards show metadata
- ✅ Create room dialog validates input
- ✅ Room creation works with optimistic UI
- ✅ Navigation works correctly

---

### 5.5 Chat Components
**Directory**: `src/components/chat/`
**Dependencies**: Common components, MessagesContext, RoomsContext
**Estimated Time**: 5-6 hours

**5.5.1 MessageList.tsx**:
```typescript
'use client'

import { useMessages } from '@/contexts/MessagesContext'
import { useAuth } from '@/contexts/AuthContext'
import { MessageBubble } from './MessageBubble'
import { DateSeparator } from './DateSeparator'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { useEffect, useRef } from 'react'

interface MessageListProps {
  roomId: string
}

export function MessageList({ roomId }: MessageListProps) {
  const { messagesByRoom, fetchMessages, loading, error } = useMessages()
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messages = messagesByRoom[roomId] || []

  useEffect(() => {
    // Initial fetch
    fetchMessages(roomId)

    // Poll every 3 seconds
    const interval = setInterval(() => {
      const lastMessage = messages[messages.length - 1]
      const since = lastMessage?.created_at || new Date(0).toISOString()
      fetchMessages(roomId, since)
    }, 3000)

    return () => clearInterval(interval)
  }, [roomId, fetchMessages])

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    )
  }

  if (error && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <ErrorMessage message={error} onRetry={() => fetchMessages(roomId)} />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No messages yet. Start the conversation!
      </div>
    )
  }

  // Group messages by date
  const messagesByDate = messages.reduce((acc, message) => {
    const date = new Date(message.created_at).toDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(message)
    return acc
  }, {} as Record<string, typeof messages>)

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {Object.entries(messagesByDate).map(([date, msgs]) => (
        <div key={date}>
          <DateSeparator date={new Date(date)} />
          <div className="space-y-2">
            {msgs.map(message => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.user_id === user?.id}
                roomId={roomId}
              />
            ))}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
```

**5.5.2 MessageBubble.tsx**:
```typescript
'use client'

import { Message } from '@/types/message'
import { formatRelativeTime } from '@/utils/date/formatDate'
import { MessageActions } from './MessageActions'
import { DeletedMessage } from './DeletedMessage'

interface MessageBubbleProps {
  message: Message
  isOwnMessage: boolean
  roomId: string
}

export function MessageBubble({ message, isOwnMessage, roomId }: MessageBubbleProps) {
  if (message.deleted_at) {
    return <DeletedMessage />
  }

  const bubbleClass = isOwnMessage
    ? 'bg-primary text-white ml-auto'
    : 'bg-gray-100 text-gray-900'

  const emojiClass = message.type === 'emoji' ? 'text-4xl text-center' : ''

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-md rounded-lg px-4 py-2 ${bubbleClass}`}>
        {/* Author name (if not own message) */}
        {!isOwnMessage && (
          <p className="text-xs font-medium mb-1">{message.author_name || 'Unknown'}</p>
        )}

        {/* Reply preview */}
        {message.parent_message_id && (
          <div className="mb-2 p-2 bg-black/10 rounded text-xs">
            <p className="font-medium">Replying to {message.parent_author}</p>
            <p className="opacity-75 truncate">{message.parent_content || '[Deleted message]'}</p>
          </div>
        )}

        {/* Message content */}
        <p className={emojiClass}>{message.content}</p>

        {/* Timestamp and status */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <p className="text-xs opacity-75">
            {formatRelativeTime(message.created_at)}
          </p>
          {message.status === 'sending' && (
            <span className="text-xs opacity-75">Sending...</span>
          )}
          {message.status === 'failed' && (
            <span className="text-xs text-red-300">Failed</span>
          )}
        </div>

        {/* Message actions */}
        <MessageActions message={message} isOwnMessage={isOwnMessage} roomId={roomId} />
      </div>
    </div>
  )
}
```

**5.5.3 MessageActions.tsx**:
```typescript
'use client'

import { Message } from '@/types/message'
import { useMessages } from '@/contexts/MessagesContext'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

interface MessageActionsProps {
  message: Message
  isOwnMessage: boolean
  roomId: string
}

export function MessageActions({ message, isOwnMessage, roomId }: MessageActionsProps) {
  const { likeMessage, unlikeMessage, setReplyTarget, deleteMessage, likesCache } = useMessages()
  const { user } = useAuth()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const likes = likesCache[message.id] || []
  const hasLiked = likes.some(like => like.user_id === user?.id)
  const likeCount = likes.length

  const handleLike = () => {
    if (hasLiked) {
      unlikeMessage(message.id)
    } else {
      likeMessage(message.id)
    }
  }

  const handleReply = () => {
    setReplyTarget(message)
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    deleteMessage(message.id, roomId)
    setShowDeleteConfirm(false)
  }

  return (
    <div className="flex items-center gap-3 mt-2">
      {/* Like button */}
      <button
        onClick={handleLike}
        className="flex items-center gap-1 text-xs opacity-75 hover:opacity-100"
      >
        <span>{hasLiked ? '♥' : '♡'}</span>
        {likeCount > 0 && <span>{likeCount}</span>}
      </button>

      {/* Reply button */}
      <button
        onClick={handleReply}
        className="text-xs opacity-75 hover:opacity-100"
      >
        Reply
      </button>

      {/* Delete button (own messages only) */}
      {isOwnMessage && (
        <>
          <button
            onClick={handleDelete}
            className="text-xs opacity-75 hover:opacity-100"
          >
            Delete
          </button>

          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white p-6 rounded-lg shadow-xl">
                <h3 className="font-bold mb-2">Delete this message?</h3>
                <p className="text-sm text-gray-600 mb-4">This action cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-error text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
```

**5.5.4 MessageInput.tsx**:
```typescript
'use client'

import { useState, FormEvent, KeyboardEvent } from 'react'
import { useMessages } from '@/contexts/MessagesContext'
import { Button } from '@/components/common/Button'
import { ReplyPreview } from './ReplyPreview'
import { MAX_MESSAGE_LENGTH } from '@/utils/constants'

interface MessageInputProps {
  roomId: string
}

export function MessageInput({ roomId }: MessageInputProps) {
  const { sendMessage, replyTarget, clearReplyTarget } = useMessages()
  const [content, setContent] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const trimmed = content.trim()
    if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) return

    await sendMessage(roomId, trimmed, 'text')
    setContent('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <div className="border-t border-gray-200 p-4">
      {replyTarget && <ReplyPreview />}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          rows={2}
          maxLength={MAX_MESSAGE_LENGTH}
        />

        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={!content.trim()}>
            Send
          </Button>
          <p className="text-xs text-gray-500 text-center">
            {content.length}/{MAX_MESSAGE_LENGTH}
          </p>
        </div>
      </form>
    </div>
  )
}
```

**5.5.5 ReplyPreview.tsx**:
```typescript
'use client'

import { useMessages } from '@/contexts/MessagesContext'
import { truncateString } from '@/utils/string/truncate'

export function ReplyPreview() {
  const { replyTarget, clearReplyTarget } = useMessages()

  if (!replyTarget) return null

  return (
    <div className="mb-2 p-3 bg-gray-100 rounded-lg flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-700">
          Replying to {replyTarget.author_name}
        </p>
        <p className="text-sm text-gray-600">
          {truncateString(replyTarget.content, 50)}
        </p>
      </div>
      <button
        onClick={clearReplyTarget}
        className="text-gray-500 hover:text-gray-700"
      >
        ✕
      </button>
    </div>
  )
}
```

**5.5.6 DateSeparator.tsx**:
```typescript
interface DateSeparatorProps {
  date: Date
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let label = date.toLocaleDateString()
  if (date.toDateString() === today.toDateString()) {
    label = 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    label = 'Yesterday'
  }

  return (
    <div className="flex items-center justify-center my-4">
      <div className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
        {label}
      </div>
    </div>
  )
}
```

**5.5.7 DeletedMessage.tsx**:
```typescript
export function DeletedMessage() {
  return (
    <div className="flex justify-start">
      <div className="max-w-md rounded-lg px-4 py-2 bg-gray-50 border border-gray-200">
        <p className="text-sm text-gray-500 italic">[Message deleted]</p>
      </div>
    </div>
  )
}
```

**Acceptance Criteria**:
- ✅ Messages display correctly
- ✅ Polling fetches new messages
- ✅ Auto-scroll works
- ✅ Sending messages works
- ✅ Optimistic UI updates
- ✅ Likes work
- ✅ Replies work
- ✅ Delete works
- ✅ Emoji type messages render larger
- ✅ Date separators show correctly

---

## Phase 6: Pages (Week 3)

### 6.1 Root Layout
**File**: `src/app/layout.tsx`
**Dependencies**: ContextProvider
**Estimated Time**: 30 minutes

**Content**:
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ContextProvider } from '@/contexts/ContextProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Chat App',
  description: 'Real-time chat application with Next.js and Supabase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ContextProvider>
          {children}
        </ContextProvider>
      </body>
    </html>
  )
}
```

**Acceptance Criteria**:
- ✅ All contexts wrap application
- ✅ Font loaded
- ✅ Metadata set

---

### 6.2 Landing Page (Root)
**File**: `src/app/page.tsx`
**Dependencies**: None
**Estimated Time**: 20 minutes

**Content**:
```typescript
import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to login
  redirect('/login')
}
```

**Acceptance Criteria**:
- ✅ Redirects to /login

---

### 6.3 Login Page
**File**: `src/app/(auth)/login/page.tsx`
**Dependencies**: LoginForm component
**Estimated Time**: 30 minutes

**Content**:
```typescript
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

**Acceptance Criteria**:
- ✅ Login form renders
- ✅ Centered layout
- ✅ Login functionality works

---

### 6.4 Register Page
**File**: `src/app/(auth)/register/page.tsx`
**Dependencies**: RegisterForm component
**Estimated Time**: 30 minutes

**Content**:
```typescript
import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Create Account
        </h1>
        <RegisterForm />
      </div>
    </div>
  )
}
```

**Acceptance Criteria**:
- ✅ Register form renders
- ✅ Centered layout
- ✅ Registration works

---

### 6.5 Protected Layout
**File**: `src/app/(protected)/layout.tsx`
**Dependencies**: Header component, auth middleware
**Estimated Time**: 1 hour

**Content**:
```typescript
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {children}
    </div>
  )
}
```

**Acceptance Criteria**:
- ✅ Redirects if not authenticated
- ✅ Shows loading state
- ✅ Header displayed on all protected pages

---

### 6.6 Rooms List Page
**File**: `src/app/(protected)/rooms/page.tsx`
**Dependencies**: RoomList, CreateRoomDialog
**Estimated Time**: 1 hour

**Content**:
```typescript
'use client'

import { useState } from 'react'
import { RoomList } from '@/components/rooms/RoomList'
import { CreateRoomDialog } from '@/components/rooms/CreateRoomDialog'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/common/Button'

export default function RoomsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Chat Rooms</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          Create Room
        </Button>
      </div>

      <RoomList />

      <CreateRoomDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </Container>
  )
}
```

**Acceptance Criteria**:
- ✅ Room list displays
- ✅ Create room button works
- ✅ Create room dialog functional

---

### 6.7 Chat Room Page
**File**: `src/app/(protected)/rooms/[roomId]/page.tsx`
**Dependencies**: RoomHeader, MessageList, MessageInput
**Estimated Time**: 1-2 hours

**Content**:
```typescript
'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useRooms } from '@/contexts/RoomsContext'
import { RoomHeader } from '@/components/rooms/RoomHeader'
import { MessageList } from '@/components/chat/MessageList'
import { MessageInput } from '@/components/chat/MessageInput'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorMessage } from '@/components/common/ErrorMessage'

export default function ChatRoomPage() {
  const params = useParams()
  const roomId = params.roomId as string
  const { rooms, fetchRooms, setActiveRoom } = useRooms()
  const [room, setRoom] = useState(rooms.find(r => r.id === roomId))

  useEffect(() => {
    setActiveRoom(roomId)

    // Fetch rooms if not loaded
    if (rooms.length === 0) {
      fetchRooms()
    }

    return () => {
      setActiveRoom(null)
    }
  }, [roomId, setActiveRoom, fetchRooms])

  useEffect(() => {
    setRoom(rooms.find(r => r.id === roomId))
  }, [rooms, roomId])

  if (!room && rooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center h-screen">
        <ErrorMessage message="Room not found" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <RoomHeader room={room} />
      <MessageList roomId={roomId} />
      <MessageInput roomId={roomId} />
    </div>
  )
}
```

**Acceptance Criteria**:
- ✅ Room loads correctly
- ✅ Messages display
- ✅ Can send messages
- ✅ Polling works
- ✅ All interactions work (like, reply, delete)

---

## Phase 7: Integration (Week 4)

### 7.1 Test Complete User Flow
**Tasks**: Manual testing
**Dependencies**: All features implemented
**Estimated Time**: 2-3 hours

**Test Scenarios**:
1. Register new user
2. Login with created user
3. Create new room
4. Join existing room
5. Send text messages
6. Send emoji messages
7. Like messages
8. Reply to messages
9. Delete own messages
10. See real-time updates (polling)
11. Logout and login again

**Acceptance Criteria**:
- ✅ All user flows work end-to-end
- ✅ No errors in console
- ✅ Data persists correctly

---

### 7.2 Fix Bugs and Issues
**Tasks**: Debug and resolve issues found during testing
**Estimated Time**: 3-5 hours

**Common Issues to Check**:
- ✅ Race conditions in polling
- ✅ Optimistic updates reverting
- ✅ Memory leaks from intervals
- ✅ TypeScript errors
- ✅ RLS policy violations
- ✅ UI glitches

**Acceptance Criteria**:
- ✅ All known bugs fixed
- ✅ Application stable
- ✅ No console errors

---

### 7.3 Performance Optimization
**Tasks**: Optimize performance
**Estimated Time**: 2-3 hours

**Optimizations**:
1. Add React.memo to expensive components
2. Verify all useCallback/useMemo usage
3. Check for unnecessary re-renders
4. Optimize database queries
5. Check bundle size

**Acceptance Criteria**:
- ✅ No unnecessary re-renders
- ✅ Polling efficient
- ✅ Page load < 2s

---

### 7.4 Accessibility Improvements
**Tasks**: Add ARIA labels and keyboard navigation
**Estimated Time**: 2 hours

**Tasks**:
1. Add ARIA labels to buttons
2. Ensure keyboard navigation works
3. Add focus styles
4. Check color contrast

**Acceptance Criteria**:
- ✅ Can navigate with keyboard
- ✅ Screen reader friendly
- ✅ WCAG 2.1 AA compliant

---

### 7.5 Deployment Setup
**Platform**: Vercel
**Estimated Time**: 1-2 hours

**Tasks**:
1. Create Vercel account
2. Connect GitHub repository
3. Configure environment variables
4. Deploy application
5. Test production deployment

**Acceptance Criteria**:
- ✅ Application deployed
- ✅ Production URL accessible
- ✅ All features work in production
- ✅ Environment variables set

---

## Phase 8: Testing (Week 4-5)

### 8.1 Manual Testing
**Estimated Time**: 3-4 hours

**Test Cases**:

**Authentication**:
- [ ] Register with valid data
- [ ] Register with duplicate email (should fail)
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Session persists on refresh
- [ ] Logout works

**Room Management**:
- [ ] Create room with valid name
- [ ] Create room with invalid name (should fail)
- [ ] Room appears in list immediately
- [ ] Join room works
- [ ] Room list updates via polling

**Messaging**:
- [ ] Send text message
- [ ] Message appears immediately (optimistic)
- [ ] Other users see message via polling
- [ ] Send emoji message
- [ ] Emoji renders larger
- [ ] Delete own message
- [ ] Deleted message shows placeholder
- [ ] Cannot delete others' messages

**Interactions**:
- [ ] Like message
- [ ] Unlike message
- [ ] Like count updates
- [ ] Reply to message
- [ ] Reply preview shows
- [ ] Reply thread displays correctly
- [ ] Cancel reply works

**UI/UX**:
- [ ] Responsive on mobile
- [ ] Auto-scroll on new message
- [ ] Loading states show
- [ ] Error messages display
- [ ] Forms validate input

**Acceptance Criteria**:
- ✅ All test cases pass
- ✅ No critical bugs

---

### 8.2 Browser Compatibility Testing
**Estimated Time**: 1-2 hours

**Browsers to Test**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Android

**Acceptance Criteria**:
- ✅ Works in all major browsers
- ✅ Mobile responsive

---

### 8.3 Documentation
**Estimated Time**: 2-3 hours

**Documents to Create**:
1. README.md with setup instructions
2. .env.example with all variables
3. Deployment guide
4. Architecture overview

**Acceptance Criteria**:
- ✅ README complete
- ✅ Setup instructions clear
- ✅ Environment variables documented

---

## Summary

### Total Estimated Time
- **Phase 1 (Setup)**: 1-2 hours
- **Phase 2 (Database)**: 2-3 hours
- **Phase 3 (Infrastructure)**: 3-4 hours
- **Phase 4 (Contexts)**: 7-10 hours
- **Phase 5 (Components)**: 15-20 hours
- **Phase 6 (Pages)**: 4-6 hours
- **Phase 7 (Integration)**: 8-12 hours
- **Phase 8 (Testing)**: 6-9 hours

**Total**: 46-66 hours (approximately 1-2 weeks of full-time work)

---

### Critical Path
1. Setup → Database → Infrastructure → AuthContext → Auth Components → Auth Pages → Test Auth Flow
2. RoomsContext → Rooms Components → Rooms Page → Test Room Management
3. MessagesContext → Chat Components → Chat Page → Test Messaging
4. Integration → Testing → Deployment

---

### Success Criteria

**Technical**:
- ✅ All Flux patterns implemented correctly
- ✅ TypeScript strict mode, no errors
- ✅ Optimistic UI works
- ✅ Polling updates work
- ✅ RLS policies secure
- ✅ No console errors

**Functional**:
- ✅ All 11 use cases working
- ✅ Authentication complete
- ✅ Room management complete
- ✅ Messaging complete
- ✅ Interactions complete (likes, replies, delete)

**Quality**:
- ✅ Responsive design
- ✅ Accessibility compliant
- ✅ Performance acceptable
- ✅ Clean codebase
- ✅ Production deployed

---

**End of Implementation Plan**
