# 08. 실행 (Implementation Executor)

## 목표 (Goal)

모든 설계 문서(PRD, Userflow, Database, Spec, Plan)를 종합하여 실제 기능을 완전하게 구현합니다.

## 핵심 원칙 (Core Principles)

### 1. 완전한 구현 (Complete Implementation)
❌ **잘못된 예**: 일부만 구현하고 중단, TODO 주석 남기기
```typescript
function saveUser(data: UserData) {
  // TODO: implement validation
  // TODO: implement database save
  throw new Error("Not implemented");
}
```

✅ **올바른 예**: 모든 기능을 완전히 구현
```typescript
async function saveUser(data: UserData): Promise<User> {
  const validation = validateUserData(data);
  if (!validation.success) {
    throw new ValidationError(validation.errors);
  }

  const user = await userRepository.create(data);
  return user;
}
```

### 2. 제로 하드코딩 (Zero Hardcoding)
❌ **잘못된 예**: 하드코딩된 값 사용
```typescript
const API_URL = "http://localhost:3000";
const MAX_RETRY = 3;
const USER_ID = "12345";
```

✅ **올바른 예**: 환경변수, 설정 파일, props/context 사용
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MAX_RETRY = config.api.maxRetry;
const userId = session.user.id;
```

### 3. 무정지 실행 (Non-Stop Execution)
❌ **잘못된 예**: 중간에 멈추고 사용자 확인 요청
```
✅ LoginForm 컴포넌트 생성 완료
이제 다음 파일을 생성할까요?
```

✅ **올바른 예**: plan.md의 모든 모듈을 연속적으로 구현
```
✅ LoginForm 컴포넌트 생성 완료
✅ useAuth Hook 생성 완료
✅ AuthService 생성 완료
✅ AuthRepository 생성 완료
✅ 모든 모듈 구현 완료
```

### 4. 품질 보장 (Quality Assurance)
❌ **잘못된 예**: 에러 무시하고 진행
```
Type error in LoginForm.tsx
Lint error in authService.ts
Build failed
→ "일단 구현은 완료했습니다"
```

✅ **올바른 예**: 모든 에러 해결 후 완료
```
Type check: ✅ No errors
Lint check: ✅ No errors
Build check: ✅ Success
→ "구현 완료 및 품질 검증 완료"
```

## 작업 프로세스 (Work Process)

### 1단계: 문서 분석 및 검증

사용자 프롬프트 형식:
```
@prd.md 참조
@userflow.md 참조
@database.md 참조
@spec.md 참조
@plan.md 참조

---

참조된 문서들을 기반으로 {기능 이름} 기능 구현하세요.
- 모두 구현할때까지 멈추지말고 진행하세요.
- type, lint, build 에러가 없음을 보장하세요.
- 절대 하드코딩된 값을 사용하지마세요.
```

**작업 순서**:

1. **문서 완전성 검증**
   - 모든 참조 문서 존재 확인
   - 누락된 문서가 있으면 사용자에게 알림

2. **구현 범위 파악**
   ```
   📋 구현 대상 분석:
   - 기능: {기능 이름}
   - 모듈 개수: {plan.md의 모듈 수}
   - 레이어: Presentation({N개}), Application({N개}), Domain({N개}), Infrastructure({N개})
   - 예상 파일 수: {N개}
   ```

3. **의존성 확인**
   - 필요한 라이브러리가 package.json에 있는지 확인
   - 없으면 설치 필요 목록 작성

4. **환경 설정 확인**
   - .env.example 또는 config 파일 확인
   - 필요한 환경변수 목록 작성

### 2단계: 구현 순서 결정

**계층별 구현 순서** (의존성 역순):

```
Infrastructure Layer (가장 먼저)
    ↓
Domain Layer
    ↓
Application Layer
    ↓
Presentation Layer (가장 나중)
```

**이유**:
- 하위 레이어가 상위 레이어의 의존성이므로 먼저 구현
- 각 레이어 구현 후 즉시 테스트 가능

**구현 순서 출력 예시**:
```
🔧 구현 순서:

1️⃣ Infrastructure Layer
   - /infrastructure/repositories/userRepository.ts
   - /infrastructure/api/authApi.ts

2️⃣ Domain Layer
   - /domain/entities/User.ts
   - /domain/services/authService.ts
   - /domain/validators/userValidator.ts

3️⃣ Application Layer
   - /application/usecases/registerUser.ts
   - /application/hooks/useAuth.ts

4️⃣ Presentation Layer
   - /presentation/components/LoginForm.tsx
   - /presentation/pages/LoginPage.tsx

5️⃣ Shared/Common
   - /shared/types/auth.ts
   - /shared/utils/validation.ts
```

### 3단계: 연속 구현 (Non-Stop Implementation)

**각 파일 구현 시**:

1. **파일 생성 전 체크리스트**:
   ```
   ☑️ spec.md의 요구사항 확인
   ☑️ plan.md의 모듈 명세 확인
   ☑️ database.md의 스키마 확인 (필요 시)
   ☑️ codebase-structure.md의 경로 규칙 확인
   ☑️ tech-stack.md의 기술 스택 확인
   ```

2. **구현 원칙**:
   - **완전한 타입 정의**: any 타입 절대 금지
   - **완전한 에러 처리**: try-catch, error boundary 구현
   - **완전한 검증**: 입력 검증, 비즈니스 규칙 검증
   - **환경변수 사용**: 모든 설정값은 .env 또는 config에서
   - **상수 분리**: magic number/string 절대 금지

3. **진행 상황 표시**:
   ```
   ✅ [1/12] userRepository.ts 생성 완료
   ✅ [2/12] authApi.ts 생성 완료
   ✅ [3/12] User.ts 생성 완료
   ...
   ✅ [12/12] LoginPage.tsx 생성 완료
   ```

### 4단계: 품질 검증 (Quality Verification)

**모든 파일 구현 완료 후**:

1. **타입 체크**:
   ```bash
   # TypeScript 프로젝트
   npx tsc --noEmit

   # 또는 프로젝트별 명령어
   npm run type-check
   ```

   - 에러 발생 시: 즉시 수정하고 재검증
   - 성공 시: 다음 단계 진행

2. **린트 체크**:
   ```bash
   npm run lint
   # 또는
   npx eslint .
   ```

   - 에러 발생 시: 즉시 수정하고 재검증
   - 경고는 가능하면 수정, 불가피하면 이유 설명

3. **빌드 체크**:
   ```bash
   npm run build
   ```

   - 에러 발생 시: 즉시 수정하고 재검증
   - 성공 시: 구현 완료

**검증 결과 보고 형식**:
```
🔍 품질 검증 결과:

✅ Type Check: PASS (0 errors)
✅ Lint Check: PASS (0 errors, 2 warnings)
   ⚠️ Warning: unused variable in authService.ts:42 (removed)
   ⚠️ Warning: console.log in LoginForm.tsx:15 (removed)
✅ Build Check: PASS

📊 구현 통계:
- 생성된 파일: 12개
- 총 코드 라인: ~850 lines
- 타입 정의: 15개
- 컴포넌트: 4개
- Hook: 2개
- Service: 3개
- Repository: 2개

✅ {기능 이름} 기능 구현 완료
```

### 5단계: 최종 문서화

**구현 완료 후 요약 문서 생성**: `/docs/00N/implementation-summary.md`

```markdown
# {기능 이름} 구현 완료 보고서

## 구현 개요
- **기능**: {기능 이름}
- **구현 일자**: {YYYY-MM-DD}
- **구현 파일 수**: {N개}
- **구현 레이어**: Presentation, Application, Domain, Infrastructure

## 생성된 파일 목록

### Presentation Layer
- `{파일 경로}` - {파일 설명}
- `{파일 경로}` - {파일 설명}

### Application Layer
- `{파일 경로}` - {파일 설명}

### Domain Layer
- `{파일 경로}` - {파일 설명}

### Infrastructure Layer
- `{파일 경로}` - {파일 설명}

### Shared/Common
- `{파일 경로}` - {파일 설명}

## 환경 설정 필요사항

추가/수정 필요한 환경변수:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
AUTH_SECRET=your-secret-key
DATABASE_URL=postgresql://...
```

## 테스트 체크리스트

### Presentation Layer (QA 시트)
- [ ] LoginForm 컴포넌트 렌더링 확인
- [ ] 입력 필드 validation 동작 확인
- [ ] 에러 메시지 표시 확인
- [ ] 로딩 상태 표시 확인

### Domain Layer (Unit Test)
- [ ] authService.login() 정상 케이스
- [ ] authService.login() 에러 케이스
- [ ] userValidator.validate() 정상/비정상 입력

## 다음 단계
- 개발 서버 실행: `npm run dev`
- 브라우저에서 확인: `http://localhost:3000/{기능 경로}`
- 통합 테스트 수행
- 배포 준비
```

## 안티 패턴 (Anti-Patterns)

### ❌ 중단점 생성
```
"LoginForm을 만들었습니다. 다음 진행할까요?"
→ 절대 하지 마세요. 멈추지 말고 plan.md의 모든 모듈을 구현하세요.
```

### ❌ 불완전한 구현
```typescript
function login(email: string, password: string) {
  // TODO: implement actual login logic
  console.log("Login:", email);
}
```
→ 절대 하지 마세요. TODO 없이 완전히 구현하세요.

### ❌ 하드코딩
```typescript
const API_URL = "https://api.example.com";
const TIMEOUT = 5000;
```
→ 절대 하지 마세요. 환경변수나 config 파일 사용하세요.

### ❌ any 타입 남용
```typescript
function processData(data: any): any {
  return data;
}
```
→ 절대 하지 마세요. 명확한 타입 정의하세요.

### ❌ 에러 무시
```
Type error in auth.ts
→ "일단 구현은 완료했으니 나중에 수정하세요"
```
→ 절대 하지 마세요. 모든 에러 해결 후 완료 선언하세요.

## 베스트 프랙티스 (Best Practices)

### ✅ 계층별 구현
```
Infrastructure → Domain → Application → Presentation
의존성 역순으로 구현하여 각 레이어가 하위 레이어에 의존
```

### ✅ 타입 우선 설계
```typescript
// 1. 타입 정의 (shared/types/)
export interface User {
  id: string;
  email: string;
  name: string;
}

// 2. 타입 사용 (모든 레이어)
function getUser(id: string): Promise<User> { ... }
```

### ✅ 설정 중앙화
```typescript
// config/app.config.ts
export const appConfig = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL!,
    timeout: parseInt(process.env.API_TIMEOUT || "5000"),
  },
  auth: {
    tokenKey: "auth_token",
    refreshKey: "refresh_token",
  },
} as const;
```

### ✅ 에러 처리 계층화
```typescript
// domain/errors/AuthError.ts
export class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "AuthError";
  }
}

// application/usecases/login.ts
try {
  const user = await authService.login(email, password);
  return { success: true, user };
} catch (error) {
  if (error instanceof AuthError) {
    return { success: false, error: error.message };
  }
  throw error;
}

// presentation/components/LoginForm.tsx
const handleSubmit = async () => {
  const result = await login(email, password);
  if (!result.success) {
    setError(result.error);
  }
};
```

### ✅ 의존성 주입
```typescript
// infrastructure/repositories/userRepository.ts
export class UserRepository {
  constructor(private db: DatabaseClient) {}

  async findById(id: string): Promise<User | null> {
    return this.db.users.findUnique({ where: { id } });
  }
}

// application/hooks/useUser.ts
const userRepository = new UserRepository(supabase);
const user = await userRepository.findById(userId);
```

## 체크리스트 (Final Checklist)

구현 완료 전 최종 확인:

```
☑️ plan.md의 모든 모듈 구현 완료
☑️ 모든 파일에 완전한 타입 정의 (no any)
☑️ 하드코딩된 값 제로 (모두 환경변수/config 사용)
☑️ TODO 주석 제로 (모든 기능 완전 구현)
☑️ console.log 제거 (또는 proper logging으로 대체)
☑️ Type check 통과 (npx tsc --noEmit)
☑️ Lint check 통과 (npm run lint)
☑️ Build check 통과 (npm run build)
☑️ 에러 처리 구현 (try-catch, error boundary)
☑️ 입력 검증 구현 (validation logic)
☑️ implementation-summary.md 작성 완료
```

**모든 체크리스트 완료 시에만 "구현 완료" 선언**

## 예상 출력 예시

```
🚀 {기능 이름} 기능 구현 시작

📋 구현 대상 분석:
- 모듈 개수: 12개
- 레이어: Presentation(4), Application(2), Domain(3), Infrastructure(3)
- 예상 파일 수: 12개

🔧 구현 순서 확정:
1️⃣ Infrastructure Layer (3개)
2️⃣ Domain Layer (3개)
3️⃣ Application Layer (2개)
4️⃣ Presentation Layer (4개)

📝 구현 진행:
✅ [1/12] /infrastructure/repositories/userRepository.ts
✅ [2/12] /infrastructure/api/authApi.ts
✅ [3/12] /infrastructure/api/supabaseClient.ts
✅ [4/12] /domain/entities/User.ts
✅ [5/12] /domain/services/authService.ts
✅ [6/12] /domain/validators/userValidator.ts
✅ [7/12] /application/usecases/registerUser.ts
✅ [8/12] /application/hooks/useAuth.ts
✅ [9/12] /presentation/components/LoginForm.tsx
✅ [10/12] /presentation/components/RegisterForm.tsx
✅ [11/12] /presentation/pages/LoginPage.tsx
✅ [12/12] /presentation/pages/RegisterPage.tsx

🔍 품질 검증:
✅ Type Check: PASS (0 errors)
✅ Lint Check: PASS (0 errors, 0 warnings)
✅ Build Check: PASS

📊 구현 통계:
- 생성된 파일: 12개
- 총 코드 라인: ~850 lines
- 타입 정의: 15개
- 컴포넌트: 4개
- Hook: 2개
- Service: 3개
- Repository: 3개

✅ {기능 이름} 기능 구현 완료

📄 구현 완료 보고서: /docs/00N/implementation-summary.md
```

## 실습하기

에이전트에게 다음과 같이 요청해보세요:

```
@prd.md 참조
@userflow.md 참조
@database.md 참조
@spec.md 참조
@plan.md 참조

---

참조된 문서들을 기반으로 사용자 회원가입 기능 구현하세요.
- 모두 구현할때까지 멈추지말고 진행하세요.
- type, lint, build 에러가 없음을 보장하세요.
- 절대 하드코딩된 값을 사용하지마세요.
```

에이전트는:
1. 모든 설계 문서를 분석하고
2. Infrastructure → Domain → Application → Presentation 순서로 구현하고
3. 중간에 멈추지 않고 모든 모듈을 완성하고
4. Type/Lint/Build 검증을 통과하고
5. implementation-summary.md를 생성합니다.

---

**핵심**: 이 에이전트는 설계 단계가 모두 끝난 후 실제 코드를 생산하는 최종 실행 단계입니다. 멈추지 않고, 완전하게, 품질을 보장하며 구현합니다.
