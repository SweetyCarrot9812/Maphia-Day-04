# 채팅 애플리케이션 요구사항 정의

## 프로젝트 개요

Next.js 기반 실시간 채팅 애플리케이션
- **아키텍처**: Flux Pattern + React Context API
- **백엔드**: Supabase (PostgreSQL + Auth + RLS)
- **실시간 업데이트**: Polling 방식 (메시지 3초, 채팅방 10초)
- **타입 안정성**: TypeScript Strict Mode

---

## 데이터 정의

### 1. User (사용자)

```typescript
interface User {
  id: string                    // UUID (Supabase auth.users)
  email: string                 // 이메일 (unique)
  display_name: string          // 표시 이름
  created_at: Date             // 생성 시각
}
```

**제약 조건:**
- `email`: 유효한 이메일 형식, unique
- `display_name`: 2~50자

---

### 2. ChatRoom (채팅방)

```typescript
interface ChatRoom {
  id: string                    // UUID
  name: string                  // 채팅방 이름 (3~50자)
  description: string           // 설명 (최대 200자)
  created_by: string            // 생성자 ID
  created_at: Date             // 생성 시각
  member_count: number         // 멤버 수 (파생 데이터)
  last_message_at: Date        // 마지막 메시지 시각 (파생 데이터)
}
```

**제약 조건:**
- `name`: 3~50자, 중복 불가
- `description`: 최대 200자

---

### 3. Message (메시지)

```typescript
interface Message {
  id: string                    // UUID
  room_id: string               // 채팅방 ID
  user_id: string               // 발신자 ID
  content: string               // 메시지 내용 (1~2000자)
  type: 'text' | 'emoji'       // 메시지 타입
  parent_message_id?: string    // 답장 대상 메시지 ID
  created_at: Date             // 생성 시각
  deleted_at?: Date            // 삭제 시각 (soft delete)
  likes: string[]              // 좋아요한 사용자 ID 목록 (파생)
}
```

**제약 조건:**
- `content`: 1~2000자
- `type`: 'text' 또는 'emoji'만 허용
- `deleted_at`: NULL이면 정상, 값이 있으면 삭제됨

---

## 데이터 흐름 정의

### Flux 아키텍처 패턴

```
┌─────────────┐
│    View     │ (React Components)
│             │ - 사용자 인터랙션 발생
└──────┬──────┘
       │
       │ 1. Action 호출
       ▼
┌─────────────┐
│  Actions    │ (비동기 비즈니스 로직)
│             │ - Supabase API 호출
│             │ - 데이터 검증
└──────┬──────┘
       │
       │ 2. Dispatch
       ▼
┌─────────────┐
│  Reducer    │ (순수 함수)
│             │ - 상태 업데이트 로직
│             │ - 불변성 유지
└──────┬──────┘
       │
       │ 3. State 업데이트
       ▼
┌─────────────┐
│   Store     │ (Context State)
│             │ - AuthContext
│             │ - RoomsContext
│             │ - MessagesContext
└──────┬──────┘
       │
       │ 4. 리렌더링
       ▼
┌─────────────┐
│    View     │ (새로운 상태로 UI 업데이트)
└─────────────┘
```

---

## 핵심 기능 요구사항

### 1. 인증 (Authentication)

#### 1.1 회원가입
- **입력**: email, password, display_name
- **검증**: 이메일 형식, 비밀번호 6자 이상, 이름 2자 이상
- **처리**: Supabase Auth 회원가입 → user_profiles 자동 생성 (트리거)
- **출력**: 자동 로그인 → /rooms 리다이렉트

#### 1.2 로그인
- **입력**: email, password
- **검증**: 이메일/비밀번호 일치 확인
- **처리**: Supabase Auth 로그인 → 세션 생성
- **출력**: /rooms 리다이렉트

#### 1.3 로그아웃
- **처리**: 세션 삭제 → Context 상태 초기화
- **출력**: / 리다이렉트

---

### 2. 채팅방 관리

#### 2.1 채팅방 목록 조회
- **입력**: 없음 (자동 로딩)
- **처리**:
  - 10초 간격 polling
  - `get_rooms_with_metadata()` 함수 호출
  - member_count, last_message_at 포함
- **출력**: 채팅방 카드 리스트

#### 2.2 채팅방 생성
- **입력**: name, description
- **검증**: 이름 3자 이상
- **처리**:
  - chat_rooms INSERT
  - 자동으로 생성자를 멤버로 추가 (트리거)
- **출력**: 생성된 채팅방으로 이동

#### 2.3 채팅방 참여
- **입력**: room_id
- **처리**: room_members INSERT
- **출력**: /rooms/[roomId] 이동

---

### 3. 메시지 관리

#### 3.1 메시지 전송 (텍스트)
- **입력**: content (string)
- **검증**: 1~2000자
- **처리**:
  - Optimistic UI 업데이트 (즉시 화면 표시)
  - messages INSERT
  - 성공 시 임시 메시지를 실제 메시지로 교체
- **출력**: 메시지 목록에 추가

#### 3.2 메시지 전송 (이모지)
- **입력**: content (emoji string)
- **검증**: 이모지 선택
- **처리**: 동일 (type='emoji')
- **출력**: 큰 크기로 표시

#### 3.3 메시지 좋아요
- **입력**: message_id
- **처리**:
  - 이미 좋아요 → message_likes DELETE
  - 좋아요 안 함 → message_likes INSERT
  - Optimistic UI
- **출력**: 좋아요 카운트 업데이트

#### 3.4 메시지 답장
- **입력**: parent_message_id
- **처리**: replyTarget Context에 저장
- **출력**:
  - 답장 UI 표시 (원본 메시지 미리보기)
  - 메시지 전송 시 parent_message_id 포함

#### 3.5 메시지 삭제
- **입력**: message_id
- **검증**: 본인 메시지만 삭제 가능
- **처리**:
  - Soft delete (deleted_at = NOW())
  - messages UPDATE
- **출력**: "[삭제된 메시지입니다]" 표시

---

## 상태 관리 정의

### ✅ 전역 상태 (Context)

#### AuthContext
```typescript
{
  user: User | null
  loading: boolean
  error: string | null
}
```

#### RoomsContext
```typescript
{
  rooms: ChatRoom[]
  currentRoom: ChatRoom | null
  loading: boolean
  error: string | null
}
```

#### MessagesContext
```typescript
{
  messages: Message[]
  replyTarget: Message | null
  loading: boolean
  error: string | null
}
```

### ❌ 로컬 상태 (컴포넌트 useState)

- 입력 필드 값 (input text)
- 모달 열림/닫힘
- 드롭다운 메뉴 상태
- 호버 상태
- 폼 유효성 검사 에러

---

## 실시간 업데이트 (Polling)

### 채팅방 목록
- **간격**: 10초
- **조건**: 로그인 상태일 때만
- **중지**: 로그아웃, 컴포넌트 unmount

### 메시지 목록
- **간격**: 3초
- **조건**: 채팅방 입장 상태일 때만
- **중지**: 채팅방 이탈, 컴포넌트 unmount

---

## 보안 요구사항

### Row-Level Security (RLS)

1. **user_profiles**: 모두 읽기, 본인만 수정
2. **chat_rooms**: 모두 읽기, 생성자만 수정/삭제
3. **room_members**: 멤버만 읽기, 본인만 참여/탈퇴
4. **messages**: 방 멤버만 읽기/쓰기, 본인만 삭제
5. **message_likes**: 방 멤버만 읽기/쓰기, 본인만 삭제

---

## 성능 요구사항

- 메시지 목록 로딩: 1초 이내
- 채팅방 목록 로딩: 1초 이내
- 메시지 전송 (Optimistic UI): 즉시 표시
- 폴링 오버헤드: 최소화 (조건부 실행)

---

## 접근성 요구사항

- ARIA 레이블 적용
- 키보드 네비게이션 (Enter로 전송)
- 색상 대비 WCAG AA 준수
- 스크린 리더 호환성

---

## 기술 제약사항

- ✅ Next.js App Router 사용
- ✅ TypeScript Strict Mode
- ✅ Context API (Redux/Zustand 사용 금지)
- ✅ Flux 패턴 필수
- ✅ Polling (WebSocket 사용 금지)
- ✅ Supabase 백엔드

---

## 완료 기준

- [x] 로그인/회원가입 기능
- [x] 채팅방 생성/참여 기능
- [x] 텍스트 메시지 전송
- [x] 이모지 메시지 전송
- [x] 좋아요 기능
- [x] 답장 기능
- [x] 메시지 삭제 기능
- [x] Flux 아키텍처 적용
- [x] Context API 중앙화
- [x] 적절한 상태 관리 (전역 vs 로컬)
- [x] Polling 실시간 업데이트
- [x] RLS 보안 정책
- [x] TypeScript 타입 안전성
