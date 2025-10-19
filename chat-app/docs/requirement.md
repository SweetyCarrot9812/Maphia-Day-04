# 채팅 애플리케이션 요구사항 정의

## 1. 데이터 정의

### 1.1 User (사용자)
```typescript
interface User {
  id: string              // UUID, Primary Key
  email: string          // 이메일 (unique)
  created_at: string     // 생성 시간
}
```

**설명:** Supabase Auth로 관리되는 사용자 기본 정보

---

### 1.2 ChatRoom (채팅방)
```typescript
interface ChatRoom {
  id: string              // UUID, Primary Key
  name: string           // 채팅방 이름
  description: string    // 채팅방 설명
  created_by: string     // 생성자 user_id (Foreign Key → users.id)
  created_at: string     // 생성 시간
}
```

**관계:**
- `created_by` → `users.id` (Many-to-One)

---

### 1.3 RoomMember (채팅방 참여자)
```typescript
interface RoomMember {
  id: string              // UUID, Primary Key
  room_id: string        // 채팅방 ID (Foreign Key → chat_rooms.id)
  user_id: string        // 사용자 ID (Foreign Key → users.id)
  joined_at: string      // 참여 시간
}
```

**제약조건:**
- `(room_id, user_id)` Unique - 한 사용자는 같은 방에 중복 참여 불가

**관계:**
- `room_id` → `chat_rooms.id` (Many-to-One)
- `user_id` → `users.id` (Many-to-One)

---

### 1.4 Message (메시지)
```typescript
interface Message {
  id: string                    // UUID, Primary Key
  room_id: string              // 채팅방 ID (Foreign Key → chat_rooms.id)
  user_id: string              // 작성자 ID (Foreign Key → users.id)
  content: string              // 메시지 내용
  parent_message_id: string?   // 답장 대상 메시지 ID (Foreign Key → messages.id, nullable)
  deleted_at: string?          // 삭제 시간 (nullable, soft delete)
  created_at: string           // 생성 시간

  // 클라이언트 사이드 추가 필드
  author_name?: string         // 작성자 이름 (UI 표시용)
  parent_content?: string      // 부모 메시지 내용 (답장 UI용)
  parent_author?: string       // 부모 메시지 작성자 (답장 UI용)
}
```

**관계:**
- `room_id` → `chat_rooms.id` (Many-to-One)
- `user_id` → `users.id` (Many-to-One)
- `parent_message_id` → `messages.id` (Self-referencing, nullable)

**Soft Delete:**
- 메시지 삭제 시 실제 삭제하지 않고 `deleted_at` 타임스탬프 기록
- UI에서는 "[Message deleted]"로 표시

---

### 1.5 MessageLike (메시지 좋아요)
```typescript
interface MessageLike {
  id: string              // UUID, Primary Key
  message_id: string     // 메시지 ID (Foreign Key → messages.id)
  user_id: string        // 좋아요 누른 사용자 ID (Foreign Key → users.id)
  created_at: string     // 생성 시간
}
```

**제약조건:**
- `(message_id, user_id)` Unique - 한 사용자는 같은 메시지에 중복 좋아요 불가

**관계:**
- `message_id` → `messages.id` (Many-to-One)
- `user_id` → `users.id` (Many-to-One)

---

## 2. Flux 아키텍처 데이터 흐름

### 2.1 전체 구조
```
View (Component)
    ↓ dispatch action
Actions (authActions, roomActions, messageActions)
    ↓ 비즈니스 로직 실행 (Supabase API 호출)
    ↓ dispatch type + payload
Reducer (authReducer, roomsReducer, messagesReducer)
    ↓ 상태 계산
Context (AuthContext, RoomsContext, MessagesContext)
    ↓ 상태 구독
View (Component) - 리렌더링
```

---

### 2.2 인증 흐름 (Auth Flow)

**로그인:**
```
LoginForm
  → dispatch authActions.login(email, password)
    → Supabase: signInWithPassword()
    → dispatch({ type: 'SET_USER', payload: user })
      → authReducer: state.user = user
        → AuthContext 업데이트
          → 자동 리다이렉트 /rooms
```

**회원가입:**
```
RegisterForm
  → dispatch authActions.register(email, password)
    → Supabase: signUp()
    → dispatch({ type: 'SET_USER', payload: user })
      → authReducer: state.user = user
        → AuthContext 업데이트
          → 자동 리다이렉트 /rooms
```

**로그아웃:**
```
Header
  → dispatch authActions.logout()
    → Supabase: signOut()
    → dispatch({ type: 'LOGOUT' })
      → authReducer: state = { user: null, loading: false }
        → AuthContext 업데이트
          → 자동 리다이렉트 /login
```

---

### 2.3 채팅방 흐름 (Room Flow)

**채팅방 목록 조회:**
```
RoomsPage (useEffect)
  → dispatch roomActions.fetchRooms()
    → Supabase: select * from chat_rooms
    → dispatch({ type: 'SET_ROOMS', payload: rooms })
      → roomsReducer: state.rooms = rooms
        → RoomsContext 업데이트
          → RoomList 컴포넌트 리렌더링
```

**채팅방 생성:**
```
CreateRoomModal
  → dispatch roomActions.createRoom(name, description)
    → Supabase: insert into chat_rooms
    → Supabase: insert into room_members (자동 참여)
    → dispatch({ type: 'ADD_ROOM', payload: newRoom })
      → roomsReducer: state.rooms.unshift(newRoom)
        → RoomsContext 업데이트
          → RoomList에 새 방 표시
```

**채팅방 참여:**
```
RoomList
  → dispatch roomActions.joinRoom(roomId)
    → Supabase: insert into room_members
    → navigate(`/rooms/${roomId}`)
```

---

### 2.4 메시지 흐름 (Message Flow)

**메시지 목록 조회:**
```
ChatRoom (useEffect)
  → dispatch messageActions.fetchMessages(roomId)
    → Supabase: select * from messages where room_id = ?
    → 클라이언트 사이드 처리:
      - 각 답장 메시지의 parent_message_id로 부모 메시지 찾기
      - parent_content, parent_author 필드 추가
    → dispatch({ type: 'SET_MESSAGES', payload: { roomId, messages } })
      → messagesReducer: state.messagesByRoom[roomId] = messages
        → MessagesContext 업데이트
          → MessageList 컴포넌트 리렌더링
```

**메시지 전송:**
```
MessageInput
  → dispatch messageActions.sendMessage(roomId, content, parentMessageId?)
    → Optimistic Update:
      - dispatch({ type: 'ADD_MESSAGE', payload: { roomId, message: tempMessage } })
        → 즉시 UI에 표시 (pending 상태)
    → Supabase: insert into messages
    → 성공 시:
      - dispatch({ type: 'UPDATE_MESSAGE', payload: { roomId, message: savedMessage } })
        → tempMessage를 실제 메시지로 교체
    → 실패 시:
      - dispatch({ type: 'REMOVE_MESSAGE', payload: { roomId, messageId } })
        → tempMessage 제거, 에러 표시
```

**메시지 좋아요:**
```
MessageBubble (좋아요 버튼)
  → dispatch messageActions.toggleLike(roomId, messageId)
    → 현재 좋아요 상태 확인
    → 좋아요 O → Supabase: delete from message_likes
    → 좋아요 X → Supabase: insert into message_likes
    → dispatch fetchMessages(roomId) - 전체 새로고침
      → MessagesContext 업데이트
        → 좋아요 카운트 업데이트
```

**메시지 답장:**
```
MessageBubble (답장 버튼)
  → setReplyingTo(message) - 로컬 상태
    → MessageInput에 답장 UI 표시
      → 사용자가 메시지 입력
        → dispatch messageActions.sendMessage(roomId, content, message.id)
          → parent_message_id 포함하여 메시지 저장
```

**메시지 삭제:**
```
MessageBubble (삭제 버튼)
  → 확인 모달 표시
    → 확인 시:
      → dispatch messageActions.deleteMessage(roomId, messageId)
        → Supabase: update messages set deleted_at = now()
        → dispatch fetchMessages(roomId)
          → MessagesContext 업데이트
            → "[Message deleted]" 표시
```

---

## 3. 상태 관리 전략

### 3.1 상태로 관리되는 것
- **AuthContext:** `{ user, loading }` - 현재 로그인 사용자
- **RoomsContext:** `{ rooms, loading }` - 채팅방 목록
- **MessagesContext:** `{ messagesByRoom: { [roomId]: Message[] }, loading }` - 채팅방별 메시지

### 3.2 상태로 관리되지 않는 것
- Form 입력값 - `useState`로 로컬 관리
- 모달 열림/닫힘 - `useState`로 로컬 관리
- 답장 대상 메시지 - `useState`로 로컬 관리 (일시적)
- UI 전용 데이터 - 컴포넌트 내부에서 계산

### 3.3 최적화
- 메시지는 `messagesByRoom` 객체로 채팅방별 분리 저장
- 불필요한 전역 상태 최소화
- Optimistic Update로 UX 개선

---

## 4. 주요 기능 요구사항

### ✅ 필수 기능
1. **로그인/회원가입** - Supabase Auth 사용
2. **채팅방 개설** - 생성자가 자동으로 참여
3. **채팅방 참여** - room_members 테이블에 추가
4. **메시지 전송** - 텍스트/이모지 지원
5. **좋아요** - 토글 방식 (좋아요/취소)
6. **답장** - parent_message_id로 연결
7. **내 메시지 삭제** - Soft delete (deleted_at)

### ✅ 아키텍처 요구사항
- Flux 패턴 준수 (Actions → Reducers → Context)
- Context API로 비즈니스 로직 중앙화
- 필요한 것만 전역 상태로 관리
- TypeScript 타입 안정성

### ✅ RLS (Row Level Security) 정책
- **간소화된 정책 적용** - 개발 단계에서 무한 재귀 방지
- `SELECT`: `USING (true)` - 인증된 사용자는 모두 조회 가능
- `INSERT`: `WITH CHECK (user_id = auth.uid())` - 본인만 생성 가능
- `UPDATE/DELETE`: 필요시 추가

---

## 5. 데이터베이스 스키마

### ERD (Entity Relationship Diagram)
```
users (Supabase Auth)
  ↓ 1:N
chat_rooms
  ↓ 1:N
room_members ←─ N:1 ─ users

chat_rooms
  ↓ 1:N
messages ←─ N:1 ─ users
  ↓ Self-referencing (parent_message_id)
messages

messages
  ↓ 1:N
message_likes ←─ N:1 ─ users
```

### 주요 제약조건
- `room_members(room_id, user_id)` - UNIQUE
- `message_likes(message_id, user_id)` - UNIQUE
- `messages.deleted_at` - NULL 허용 (soft delete)
- `messages.parent_message_id` - NULL 허용 (답장 아닌 경우)
