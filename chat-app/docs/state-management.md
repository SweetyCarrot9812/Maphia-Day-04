# Context API 상태관리 설계

## 1. 전체 아키텍처

### 1.1 Flux 패턴 구조
```
┌─────────────────────────────────────────────────────────┐
│                    View (Components)                    │
│  - LoginForm, RoomList, ChatRoom, MessageBubble, etc.  │
└────────────────────┬────────────────────────────────────┘
                     │ dispatch action
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  Actions (비즈니스 로직)                 │
│  - authActions, roomActions, messageActions            │
│  - Supabase API 호출, 데이터 검증, 에러 처리            │
└────────────────────┬────────────────────────────────────┘
                     │ dispatch({ type, payload })
                     ↓
┌─────────────────────────────────────────────────────────┐
│              Reducers (상태 계산 순수 함수)              │
│  - authReducer, roomsReducer, messagesReducer          │
│  - 이전 상태 + 액션 → 새로운 상태                        │
└────────────────────┬────────────────────────────────────┘
                     │ newState
                     ↓
┌─────────────────────────────────────────────────────────┐
│              Context (상태 저장 및 배포)                 │
│  - AuthContext, RoomsContext, MessagesContext          │
│  - Provider로 하위 컴포넌트에 상태 제공                  │
└────────────────────┬────────────────────────────────────┘
                     │ subscribe (useContext)
                     ↓
┌─────────────────────────────────────────────────────────┐
│              View (Components) - 리렌더링                │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Context 상세 설계

### 2.1 AuthContext (인증 상태)

**파일 구조:**
```
src/
├── contexts/
│   ├── AuthContext.tsx       # Context 정의 및 Provider
├── reducers/
│   ├── authReducer.ts        # 상태 변환 로직
├── actions/
│   ├── authActions.ts        # 비즈니스 로직 (login, register, logout)
```

**상태 구조:**
```typescript
interface AuthState {
  user: User | null      // 현재 로그인 사용자 (null = 비로그인)
  loading: boolean       // 로딩 상태
}
```

**초기 상태:**
```typescript
const initialState: AuthState = {
  user: null,
  loading: true  // 초기 로딩 상태 (세션 확인 중)
}
```

**액션 타입:**
```typescript
type AuthAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
```

**Reducer 로직:**
```typescript
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false }

    case 'LOGOUT':
      return { user: null, loading: false }

    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    default:
      return state
  }
}
```

**Provider 구현:**
```typescript
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    // 세션 복원 로직
    authActions.initAuth(dispatch)
  }, [])

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  )
}
```

**사용 예시:**
```typescript
// 컴포넌트에서
function LoginForm() {
  const { state, dispatch } = useContext(AuthContext)

  const handleLogin = async (email: string, password: string) => {
    await authActions.login(email, password, dispatch)
  }

  if (state.loading) return <div>Loading...</div>
  if (state.user) return <Navigate to="/rooms" />

  return <form onSubmit={handleLogin}>...</form>
}
```

---

### 2.2 RoomsContext (채팅방 목록)

**상태 구조:**
```typescript
interface RoomsState {
  rooms: ChatRoom[]      // 채팅방 목록
  loading: boolean       // 로딩 상태
}
```

**초기 상태:**
```typescript
const initialState: RoomsState = {
  rooms: [],
  loading: false
}
```

**액션 타입:**
```typescript
type RoomsAction =
  | { type: 'SET_ROOMS'; payload: ChatRoom[] }
  | { type: 'ADD_ROOM'; payload: ChatRoom }
  | { type: 'SET_LOADING'; payload: boolean }
```

**Reducer 로직:**
```typescript
function roomsReducer(state: RoomsState, action: RoomsAction): RoomsState {
  switch (action.type) {
    case 'SET_ROOMS':
      return { ...state, rooms: action.payload, loading: false }

    case 'ADD_ROOM':
      // 최신 방이 위에 오도록 unshift
      return {
        ...state,
        rooms: [action.payload, ...state.rooms],
        loading: false
      }

    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    default:
      return state
  }
}
```

**왜 배열인가?**
- 채팅방 목록은 전체를 한 번에 렌더링하므로 배열이 적합
- `rooms.map()`으로 간편하게 리스트 렌더링
- 새로운 방 추가 시 `unshift`로 최상단 배치

---

### 2.3 MessagesContext (메시지 관리)

**상태 구조:**
```typescript
interface MessagesState {
  messagesByRoom: {
    [roomId: string]: Message[]  // 채팅방 ID별 메시지 배열
  }
  loading: boolean
}
```

**왜 객체로 관리하는가?**
- 각 채팅방의 메시지를 독립적으로 관리
- 다른 채팅방으로 이동해도 이전 메시지 유지 (캐싱)
- `messagesByRoom[roomId]`로 O(1) 접근

**초기 상태:**
```typescript
const initialState: MessagesState = {
  messagesByRoom: {},
  loading: false
}
```

**액션 타입:**
```typescript
type MessagesAction =
  | { type: 'SET_MESSAGES'; payload: { roomId: string; messages: Message[] } }
  | { type: 'ADD_MESSAGE'; payload: { roomId: string; message: Message } }
  | { type: 'UPDATE_MESSAGE'; payload: { roomId: string; message: Message } }
  | { type: 'REMOVE_MESSAGE'; payload: { roomId: string; messageId: string } }
  | { type: 'APPEND_MESSAGES'; payload: { roomId: string; messages: Message[] } }
  | { type: 'SET_LOADING'; payload: boolean }
```

**Reducer 로직:**
```typescript
function messagesReducer(state: MessagesState, action: MessagesAction): MessagesState {
  switch (action.type) {
    case 'SET_MESSAGES':
      // 특정 채팅방의 메시지 전체 교체
      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [action.payload.roomId]: action.payload.messages
        },
        loading: false
      }

    case 'ADD_MESSAGE':
      // 새 메시지 추가 (Optimistic Update)
      const currentMessages = state.messagesByRoom[action.payload.roomId] || []
      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [action.payload.roomId]: [...currentMessages, action.payload.message]
        }
      }

    case 'UPDATE_MESSAGE':
      // 임시 메시지를 실제 메시지로 교체
      const messages = state.messagesByRoom[action.payload.roomId] || []
      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [action.payload.roomId]: messages.map(msg =>
            msg.id === action.payload.message.id ? action.payload.message : msg
          )
        }
      }

    case 'REMOVE_MESSAGE':
      // 메시지 제거 (Optimistic Update 실패 시)
      const msgs = state.messagesByRoom[action.payload.roomId] || []
      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [action.payload.roomId]: msgs.filter(msg => msg.id !== action.payload.messageId)
        }
      }

    case 'APPEND_MESSAGES':
      // 실시간 새 메시지 추가 (폴링/실시간 구독)
      const existing = state.messagesByRoom[action.payload.roomId] || []
      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [action.payload.roomId]: [...existing, ...action.payload.messages]
        }
      }

    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    default:
      return state
  }
}
```

---

## 3. Actions (비즈니스 로직)

### 3.1 Actions의 역할
- **API 호출:** Supabase와 통신
- **데이터 검증:** 입력값 유효성 검사
- **에러 처리:** try-catch로 에러 핸들링
- **상태 업데이트:** dispatch로 Reducer에 액션 전달

### 3.2 authActions 예시

```typescript
// src/actions/authActions.ts

export const authActions = {
  // 세션 초기화
  async initAuth(dispatch: Dispatch<AuthAction>) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        dispatch({ type: 'SET_USER', payload: session.user })
      } else {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    } catch (error) {
      console.error('Session restore failed:', error)
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  },

  // 로그인
  async login(email: string, password: string, dispatch: Dispatch<AuthAction>) {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      if (data.user) {
        dispatch({ type: 'SET_USER', payload: data.user })
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false })
      throw error  // 컴포넌트에서 에러 처리
    }
  },

  // 회원가입
  async register(email: string, password: string, dispatch: Dispatch<AuthAction>) {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })

      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) throw error
      if (data.user) {
        dispatch({ type: 'SET_USER', payload: data.user })
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false })
      throw error
    }
  },

  // 로그아웃
  async logout(dispatch: Dispatch<AuthAction>) {
    try {
      await supabase.auth.signOut()
      dispatch({ type: 'LOGOUT' })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }
}
```

### 3.3 messageActions 핵심 로직

```typescript
// src/actions/messageActions.ts

export const messageActions = {
  // 메시지 조회 (부모 메시지 정보 포함)
  async fetchMessages(roomId: string, dispatch?: Dispatch<MessagesAction>) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // 클라이언트 사이드에서 부모 메시지 정보 추가
      const messages = (data || []).map(msg => {
        let parent_content = null
        let parent_author = null

        if (msg.parent_message_id) {
          const parentMsg = data.find(m => m.id === msg.parent_message_id)
          if (parentMsg) {
            parent_content = parentMsg.deleted_at
              ? '[Deleted message]'
              : parentMsg.content
            parent_author = 'User'
          }
        }

        return {
          ...msg,
          author_name: 'User',
          parent_content,
          parent_author
        }
      })

      if (dispatch) {
        dispatch({ type: 'SET_MESSAGES', payload: { roomId, messages } })
      }

      return messages
    } catch (error) {
      console.error('Fetch messages failed:', error)
      if (dispatch) {
        dispatch({ type: 'SET_MESSAGES', payload: { roomId, messages: [] } })
      }
    }
  },

  // 메시지 전송 (Optimistic Update)
  async sendMessage(
    roomId: string,
    content: string,
    userId: string,
    dispatch: Dispatch<MessagesAction>,
    parentMessageId?: string
  ) {
    // 1. Optimistic Update - 임시 메시지 즉시 표시
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      room_id: roomId,
      user_id: userId,
      content,
      parent_message_id: parentMessageId || null,
      created_at: new Date().toISOString(),
      deleted_at: null,
      author_name: 'User'
    }

    dispatch({ type: 'ADD_MESSAGE', payload: { roomId, message: tempMessage } })

    try {
      // 2. 서버에 실제 저장
      const { data, error } = await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          user_id: userId,
          content,
          parent_message_id: parentMessageId || null
        })
        .select()
        .single()

      if (error) throw error

      // 3. 임시 메시지를 실제 메시지로 교체
      if (data) {
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            roomId,
            message: { ...data, author_name: 'User' }
          }
        })
      }
    } catch (error) {
      // 4. 실패 시 임시 메시지 제거
      console.error('Send message failed:', error)
      dispatch({
        type: 'REMOVE_MESSAGE',
        payload: { roomId, messageId: tempMessage.id }
      })
      throw error
    }
  },

  // 메시지 삭제 (Soft Delete)
  async deleteMessage(
    roomId: string,
    messageId: string,
    dispatch: Dispatch<MessagesAction>
  ) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId)

      if (error) throw error

      // 전체 메시지 다시 조회하여 UI 업데이트
      await messageActions.fetchMessages(roomId, dispatch)
    } catch (error) {
      console.error('Delete message failed:', error)
      throw error
    }
  },

  // 좋아요 토글
  async toggleLike(
    roomId: string,
    messageId: string,
    userId: string,
    dispatch: Dispatch<MessagesAction>
  ) {
    try {
      // 현재 좋아요 상태 확인
      const { data: existingLike } = await supabase
        .from('message_likes')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .single()

      if (existingLike) {
        // 좋아요 취소
        await supabase
          .from('message_likes')
          .delete()
          .eq('id', existingLike.id)
      } else {
        // 좋아요 추가
        await supabase
          .from('message_likes')
          .insert({ message_id: messageId, user_id: userId })
      }

      // 전체 메시지 다시 조회하여 좋아요 카운트 업데이트
      await messageActions.fetchMessages(roomId, dispatch)
    } catch (error) {
      console.error('Toggle like failed:', error)
      throw error
    }
  }
}
```

---

## 4. 상태 관리 원칙

### 4.1 무엇을 전역 상태로 관리하는가?

**✅ 전역 상태로 관리:**
- **AuthContext:** 사용자 인증 정보 (모든 페이지에서 필요)
- **RoomsContext:** 채팅방 목록 (여러 컴포넌트에서 공유)
- **MessagesContext:** 메시지 데이터 (MessageList, MessageBubble에서 공유)

**❌ 전역 상태로 관리하지 않음:**
- Form 입력값 (`useState` 로컬 관리)
- 모달 열림/닫힘 상태 (`useState` 로컬 관리)
- 답장 대상 메시지 (`useState` 로컬 관리 - 일시적 UI 상태)
- 파생 데이터 (계산으로 얻을 수 있는 값)

### 4.2 왜 Context + Reducer인가?

**Redux 대신 Context API를 선택한 이유:**
- ✅ 보일러플레이트 코드 최소화
- ✅ Next.js App Router와 자연스러운 통합
- ✅ 학습 곡선이 낮음
- ✅ 이 프로젝트 규모에 적합

**왜 useReducer를 사용하는가?**
- ✅ 복잡한 상태 변환 로직을 순수 함수로 분리
- ✅ 상태 변화 예측 가능 (같은 입력 → 같은 출력)
- ✅ 테스트 용이성
- ✅ 디버깅 편의성 (액션 타입으로 상태 변화 추적)

### 4.3 Optimistic Update 전략

**적용 대상:**
- 메시지 전송 - 즉시 UI에 표시, 서버 응답 후 ID 업데이트

**왜 사용하는가?**
- ✅ 체감 속도 향상 (네트워크 지연 숨김)
- ✅ 더 나은 UX (즉각적 피드백)

**구현 방법:**
1. 임시 메시지 생성 (`temp-${Date.now()}`)
2. `ADD_MESSAGE` 액션으로 즉시 UI 표시
3. 서버 저장 성공 시 `UPDATE_MESSAGE`로 실제 ID로 교체
4. 실패 시 `REMOVE_MESSAGE`로 임시 메시지 제거

---

## 5. 디렉토리 구조

```
src/
├── actions/
│   ├── authActions.ts          # 인증 비즈니스 로직
│   ├── roomActions.ts          # 채팅방 비즈니스 로직
│   └── messageActions.ts       # 메시지 비즈니스 로직
│
├── reducers/
│   ├── authReducer.ts          # 인증 상태 변환
│   ├── roomsReducer.ts         # 채팅방 상태 변환
│   └── messagesReducer.ts      # 메시지 상태 변환
│
├── contexts/
│   ├── AuthContext.tsx         # 인증 Context + Provider
│   ├── RoomsContext.tsx        # 채팅방 Context + Provider
│   └── MessagesContext.tsx     # 메시지 Context + Provider
│
├── types/
│   └── index.ts                # TypeScript 타입 정의
│
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx       # useContext(AuthContext)
│   │   └── RegisterForm.tsx    # useContext(AuthContext)
│   │
│   ├── rooms/
│   │   ├── RoomList.tsx        # useContext(RoomsContext)
│   │   └── CreateRoomModal.tsx # useContext(RoomsContext)
│   │
│   └── chat/
│       ├── MessageList.tsx     # useContext(MessagesContext)
│       ├── MessageBubble.tsx   # useContext(MessagesContext)
│       └── MessageInput.tsx    # useContext(MessagesContext)
│
└── app/
    └── layout.tsx              # Providers 중첩
```

---

## 6. Provider 계층 구조

```tsx
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>           {/* 최상위 - 모든 페이지에서 필요 */}
          <RoomsProvider>        {/* 중간 - 로그인 후 필요 */}
            <MessagesProvider>   {/* 하위 - 채팅방 진입 후 필요 */}
              {children}
            </MessagesProvider>
  </RoomsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
```

**왜 이런 순서인가?**
- `AuthProvider` 최상위: 모든 페이지에서 로그인 상태 확인 필요
- `RoomsProvider` 중간: 로그인 후 채팅방 목록 접근
- `MessagesProvider` 하위: 특정 채팅방 진입 시에만 필요

---

## 7. 타입 안정성

### 7.1 TypeScript 타입 정의

```typescript
// src/types/index.ts

// Supabase 데이터베이스 타입
export interface User {
  id: string
  email: string
  created_at: string
}

export interface ChatRoom {
  id: string
  name: string
  description: string
  created_by: string
  created_at: string
}

export interface Message {
  id: string
  room_id: string
  user_id: string
  content: string
  parent_message_id: string | null
  deleted_at: string | null
  created_at: string

  // 클라이언트 사이드 추가 필드
  author_name?: string
  parent_content?: string
  parent_author?: string
  likes_count?: number
  user_has_liked?: boolean
}

// 상태 타입
export interface AuthState {
  user: User | null
  loading: boolean
}

export interface RoomsState {
  rooms: ChatRoom[]
  loading: boolean
}

export interface MessagesState {
  messagesByRoom: { [roomId: string]: Message[] }
  loading: boolean
}

// 액션 타입
export type AuthAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }

export type RoomsAction =
  | { type: 'SET_ROOMS'; payload: ChatRoom[] }
  | { type: 'ADD_ROOM'; payload: ChatRoom }
  | { type: 'SET_LOADING'; payload: boolean }

export type MessagesAction =
  | { type: 'SET_MESSAGES'; payload: { roomId: string; messages: Message[] } }
  | { type: 'ADD_MESSAGE'; payload: { roomId: string; message: Message } }
  | { type: 'UPDATE_MESSAGE'; payload: { roomId: string; message: Message } }
  | { type: 'REMOVE_MESSAGE'; payload: { roomId: string; messageId: string } }
  | { type: 'APPEND_MESSAGES'; payload: { roomId: string; messages: Message[] } }
  | { type: 'SET_LOADING'; payload: boolean }
```

---

## 8. 성능 최적화

### 8.1 불필요한 리렌더링 방지

```tsx
// MessageBubble.tsx - React.memo로 최적화
export const MessageBubble = React.memo(({ message }: { message: Message }) => {
  // message 객체가 변경되지 않으면 리렌더링 안 함
  return <div>...</div>
}, (prevProps, nextProps) => {
  // 얕은 비교로 불필요한 리렌더링 방지
  return prevProps.message.id === nextProps.message.id
})
```

### 8.2 Context 분리 전략

**왜 3개의 Context로 분리했는가?**
- AuthContext 변경 시 → RoomsContext, MessagesContext는 리렌더링 안 됨
- RoomsContext 변경 시 → MessagesContext는 리렌더링 안 됨
- MessagesContext 변경 시 → AuthContext, RoomsContext는 리렌더링 안 됨

**단일 Context였다면?**
- 메시지 하나 추가 시 → 전체 앱 리렌더링 (성능 저하)

---

## 9. 에러 처리 및 로딩 상태

### 9.1 로딩 상태 관리

```typescript
// 각 Context마다 loading 상태 보유
interface AuthState {
  user: User | null
  loading: boolean  // 초기 세션 복원 중
}

interface RoomsState {
  rooms: ChatRoom[]
  loading: boolean  // 채팅방 목록 로딩 중
}

interface MessagesState {
  messagesByRoom: { [roomId: string]: Message[] }
  loading: boolean  // 메시지 로딩 중
}
```

### 9.2 에러 처리 패턴

```typescript
// Actions에서 에러를 throw하고 컴포넌트에서 처리
async function handleLogin() {
  try {
    await authActions.login(email, password, dispatch)
    // 성공 시 리다이렉트는 자동 (AuthContext 변경 감지)
  } catch (error) {
    // 컴포넌트 레벨에서 에러 메시지 표시
    alert('로그인 실패: ' + error.message)
  }
}
```

---

## 10. 요약

### ✅ Flux 패턴 준수
- **단방향 데이터 흐름:** View → Actions → Reducers → Context → View
- **예측 가능한 상태 관리:** Reducer는 순수 함수
- **중앙화된 비즈니스 로직:** Actions에 모든 로직 집중

### ✅ Context API 활용
- **3개의 분리된 Context:** Auth, Rooms, Messages
- **성능 최적화:** Context 분리로 불필요한 리렌더링 방지
- **타입 안정성:** TypeScript로 모든 상태/액션 타입 정의

### ✅ 상태 최소화
- **필요한 것만 전역 상태로 관리**
- **UI 전용 상태는 로컬 관리 (useState)**
- **파생 데이터는 계산으로 처리**

### ✅ 사용자 경험 최적화
- **Optimistic Update:** 메시지 전송 시 즉시 UI 반영
- **로딩 상태 표시:** 각 Context별 독립적 로딩 관리
- **에러 처리:** 사용자에게 명확한 에러 피드백
