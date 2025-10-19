# Tech Stack Specification
# Chat Application - MVP Learning Project

**Document Version:** 1.0
**Last Updated:** 2025-10-19
**Based on:** PRD v1.0, Userflow v1.0
**Project Type:** Learning Project (Flux Architecture Focus)

---

## Executive Summary

### Pre-Decided Tech Stack
This project uses a carefully selected stack optimized for learning Flux architecture patterns while building a production-ready chat application.

**Stack Name**: "Next.js Flux BaaS Stack"

```
Next.js 15 App Router ← HTTP/Realtime → Supabase PostgreSQL
    ↓                                         ↓
React 19 + TypeScript                    Auth + Storage
    ↓
Tailwind CSS + Flux Context API
    ↓
Vercel Edge Network
```

### Stack Rationale
- **AI Friendly**: Extensive documentation, large code corpus, active community
- **Learning Focus**: Pure Context API implementation without abstraction layers
- **Production Ready**: Battle-tested stack used by thousands of applications
- **Zero DevOps**: Fully managed infrastructure (Vercel + Supabase)
- **Cost Effective**: Free tier supports MVP requirements

---

## Core Technology Stack

### Frontend Framework

#### 🥇 Next.js 15 (App Router)
**Version**: 15.x (Latest stable with App Router)

**🤖 AI Friendliness**: ⭐⭐⭐⭐⭐ (5/5)
- GitHub Stars: 120k+
- npm Weekly Downloads: 5M+
- Stack Overflow Questions: 80k+
- Documentation Quality: Comprehensive with interactive examples
- Vercel Official Support: First-class documentation and tooling

**🔧 Maintainability**: ⭐⭐⭐⭐⭐ (5/5)
- Sponsor: Vercel (well-funded, stable company)
- Release Cycle: Predictable quarterly releases
- Security Response: Average 1-2 days for critical issues
- LTS Support: 18 months for major versions
- Community: 2,500+ active contributors

**📊 Stability**: ⭐⭐⭐⭐⭐ (5/5)
- Backward Compatibility: Excellent with codemods
- Breaking Changes: Annual major version (v14→v15)
- Production History: 7+ years (Pages Router), 2+ years (App Router)
- TypeScript Support: First-class, built-in types
- Enterprise Adoption: Netflix, Twitch, Nike, Notion

**Key Advantages**:
- **Server Components (RSC)**: Automatic code splitting, reduced bundle size
- **App Router**: File-based routing with layouts and nested routes
- **API Routes**: Built-in backend endpoints (no separate server needed)
- **Optimized Images**: Automatic image optimization and lazy loading
- **SEO Friendly**: Server-side rendering out of the box
- **Developer Experience**: Fast refresh, helpful error messages

**Considerations**:
- App Router learning curve (different from Pages Router)
- Server vs Client component mental model
- Caching behavior can be complex initially

**Ecosystem**:
- **UI Libraries**: shadcn/ui, Radix UI, Headless UI
- **State Management**: React Context API (Flux pattern)
- **Styling**: Tailwind CSS integration
- **Deployment**: Vercel (zero-config), Netlify, AWS Amplify
- **Testing**: Jest, React Testing Library, Playwright

---

### Language

#### 🥇 TypeScript 5
**Version**: 5.x (Latest)

**🤖 AI Friendliness**: ⭐⭐⭐⭐⭐ (5/5)
- Massive documentation corpus
- AI models trained extensively on TypeScript
- Excellent IntelliSense support
- Clear error messages for debugging

**🔧 Maintainability**: ⭐⭐⭐⭐⭐ (5/5)
- Sponsor: Microsoft
- Release Cycle: Quarterly updates
- Industry Standard: De facto for modern React development
- Long-term Support: Excellent

**📊 Stability**: ⭐⭐⭐⭐⭐ (5/5)
- Backward Compatibility: Strong commitment
- Breaking Changes: Rare, well-documented
- Production Ready: Used by virtually all major web apps
- Type Safety: Catches 80%+ of runtime errors at compile time

**Key Advantages**:
- **Type Safety**: Catch errors before runtime
- **Better IntelliSense**: Auto-completion for everything
- **Refactoring Confidence**: Rename, move files safely
- **Documentation**: Types serve as inline documentation
- **Team Collaboration**: Shared contracts between developers
- **AI Code Generation**: Better results with type hints

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

---

### Styling

#### 🥇 Tailwind CSS 3
**Version**: 3.x (Latest)

**🤖 AI Friendliness**: ⭐⭐⭐⭐⭐ (5/5)
- Most popular utility-first framework
- AI models generate Tailwind classes accurately
- Predictable class names
- Extensive examples online

**🔧 Maintainability**: ⭐⭐⭐⭐⭐ (5/5)
- Sponsor: Tailwind Labs
- Regular updates
- Strong community
- Excellent documentation

**📊 Stability**: ⭐⭐⭐⭐⭐ (5/5)
- v3 is mature and stable
- Rarely breaking changes
- Wide enterprise adoption

**Key Advantages**:
- **Rapid Development**: No context switching between HTML/CSS
- **Consistent Design**: Design system built-in
- **Bundle Optimization**: PurgeCSS removes unused styles
- **Responsive Design**: Mobile-first utilities
- **Dark Mode**: Built-in dark mode support
- **JIT Compiler**: Generate only used classes

**Configuration**:
```javascript
// tailwind.config.ts
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb', // blue-600
        secondary: '#4b5563', // gray-600
      },
    },
  },
  plugins: [],
}
```

---

### State Management

#### 🥇 React Context API (Flux Pattern)
**Version**: Built into React 19

**🤖 AI Friendliness**: ⭐⭐⭐⭐⭐ (5/5)
- Core React API - extensively documented
- Flux pattern well understood by AI
- Clear unidirectional data flow
- Predictable state updates

**🔧 Maintainability**: ⭐⭐⭐⭐ (4/5)
- Built into React - no external dependency
- Requires proper structure (more boilerplate)
- Manual optimization needed (memoization)
- Clear separation of concerns

**📊 Stability**: ⭐⭐⭐⭐⭐ (5/5)
- Core React feature - won't be removed
- Stable API since React 16.3
- No breaking changes expected

**Why Context API Over Redux/Zustand**:
1. **Learning Objective**: Understand Flux without abstraction
2. **Zero Dependencies**: No external state library
3. **Sufficient for Scope**: App complexity fits Context well
4. **Better Performance**: With proper memoization
5. **Direct Control**: Full understanding of state flow

**Flux Architecture Implementation**:
```
View (Component)
    ↓ (user action)
Action (Function)
    ↓ (dispatch)
Dispatcher (Reducer)
    ↓ (update)
Store (Context State)
    ↓ (re-render)
View (Component)
```

**Context Structure**:
- **AuthContext**: User authentication state
- **RoomsContext**: Chat rooms data
- **MessagesContext**: Messages per room

---

## Backend Stack

### Backend-as-a-Service (BaaS)

#### 🥇 Supabase
**Version**: Latest (SaaS platform)

**🤖 AI Friendliness**: ⭐⭐⭐⭐⭐ (5/5)
- Excellent documentation
- PostgreSQL SQL queries (widely known)
- Simple JavaScript client API
- Abundant tutorials and examples

**🔧 Maintainability**: ⭐⭐⭐⭐⭐ (5/5)
- Sponsor: Supabase Inc (Y Combinator backed)
- Active development
- Open source (self-hostable)
- Excellent dashboard UI

**📊 Stability**: ⭐⭐⭐⭐ (4/5)
- Production-grade infrastructure
- 99.9% uptime SLA
- Built on proven technologies (PostgreSQL)
- Growing rapidly, stable API

**Key Advantages**:
- **PostgreSQL Database**: Industry-standard relational DB
- **Built-in Auth**: JWT-based authentication
- **Row-Level Security (RLS)**: Database-level access control
- **Realtime Subscriptions**: WebSocket support (optional)
- **Storage**: File/image uploads (if needed later)
- **Auto-generated API**: REST + GraphQL endpoints
- **Dashboard**: Visual database management
- **Free Tier**: Generous limits for MVP

**Why Supabase Over Firebase**:
- **Open Source**: Can self-host if needed
- **PostgreSQL**: Standard SQL vs Firestore's limitations
- **Better TypeScript**: Auto-generated types from schema
- **RLS**: More granular security than Firebase rules
- **Learning Value**: PostgreSQL skills transferable

**Supabase Features Used**:
- **Auth**: Email/password authentication
- **Database**: PostgreSQL with RLS policies
- **Client Library**: `@supabase/supabase-js`
- **Type Generation**: Auto-generate TypeScript types

**Configuration**:
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

---

### Database

#### 🥇 PostgreSQL 15+
**Version**: 15+ (via Supabase)

**🤖 AI Friendliness**: ⭐⭐⭐⭐⭐ (5/5)
- Most documented database system
- SQL is universal knowledge
- AI generates accurate queries
- Vast learning resources

**🔧 Maintainability**: ⭐⭐⭐⭐⭐ (5/5)
- 30+ years of development
- Enterprise-grade reliability
- Active community
- Long-term support

**📊 Stability**: ⭐⭐⭐⭐⭐ (5/5)
- Battle-tested for decades
- ACID compliance
- Mature ecosystem
- Backward compatibility

**Key Advantages**:
- **ACID Transactions**: Data integrity guaranteed
- **Rich Data Types**: JSON, arrays, UUIDs built-in
- **Full-Text Search**: Built-in search capabilities
- **Indexing**: Excellent query performance
- **Triggers & Functions**: Business logic at DB level
- **RLS Policies**: Row-level access control

**Schema Design Principles**:
- Normalized structure (3NF)
- UUIDs for primary keys
- Timestamps for audit trail
- Soft deletes (deleted_at)
- Foreign key constraints

---

## Infrastructure & DevOps

### Hosting Platform

#### 🥇 Vercel
**Platform**: Serverless Edge Network

**🤖 AI Friendliness**: ⭐⭐⭐⭐⭐ (5/5)
- Next.js creators - perfect integration
- Simple deployment process
- Excellent documentation
- Zero configuration needed

**🔧 Maintainability**: ⭐⭐⭐⭐⭐ (5/5)
- Auto-scaling infrastructure
- Zero maintenance required
- Automatic HTTPS
- Preview deployments

**📊 Stability**: ⭐⭐⭐⭐⭐ (5/5)
- 99.99% uptime
- Global CDN
- Serverless reliability
- Enterprise customers

**Key Advantages**:
- **Zero Config**: Push to GitHub → Auto deploy
- **Edge Network**: Global CDN, fast everywhere
- **Preview Deployments**: Every PR gets unique URL
- **Environment Variables**: Secure config management
- **Analytics**: Built-in performance monitoring
- **Free Tier**: Generous for personal/hobby projects
- **Next.js Optimization**: Automatic caching, image optimization

**Deployment Flow**:
```
Git Push → GitHub → Vercel Webhook → Build → Deploy → Live URL
```

**Why Vercel Over Alternatives**:
- **Netlify**: Vercel has better Next.js integration
- **AWS Amplify**: Vercel is simpler, less configuration
- **Railway/Render**: Vercel's Next.js optimizations superior
- **Self-hosted**: No server management needed

---

## Development Tools

### Package Manager

#### 🥇 npm
**Version**: 10+ (comes with Node.js)

**Why npm Over pnpm/yarn**:
- Default Node.js package manager
- Widest compatibility
- Simplest for learning
- Vercel auto-detects

---

### Version Control

#### 🥇 Git + GitHub
**Standard industry tooling**

**Features Used**:
- Version control
- Collaboration
- CI/CD via Vercel integration
- Issue tracking (optional)

---

## Complete Stack Overview

### 🎯 Recommended Stack: "Next.js Flux BaaS"

```
┌─────────────────────────────────────────────┐
│           Vercel Edge Network               │
│  (Global CDN + Automatic HTTPS + SSL)       │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│         Next.js 15 App Router               │
│  - React 19 Server Components               │
│  - TypeScript 5 Strict Mode                 │
│  - Tailwind CSS 3 Styling                   │
│  - Flux Pattern with Context API            │
└─────────────────┬───────────────────────────┘
                  │
                  │ HTTP REST API
                  │
┌─────────────────▼───────────────────────────┐
│              Supabase BaaS                  │
│  - PostgreSQL 15+ Database                  │
│  - JWT Authentication                       │
│  - Row-Level Security (RLS)                 │
│  - Auto-generated API                       │
└─────────────────────────────────────────────┘
```

### Selected Rationale

**Interoperability**:
- Next.js + Vercel: Built by same team, perfect integration
- Supabase + PostgreSQL: Industry-standard SQL
- TypeScript everywhere: End-to-end type safety
- Tailwind + React: Designed for component-based UIs

**Development Productivity**:
- Hot Module Replacement: Instant feedback
- TypeScript IntelliSense: Fewer bugs, faster coding
- Tailwind Utilities: Rapid UI development
- Supabase Dashboard: Visual DB management

**Learning Curve**:
- **Week 1**: Next.js basics + TypeScript fundamentals
- **Week 2**: Flux pattern + Context API
- **Week 3**: Supabase integration + PostgreSQL
- **Week 4**: Production deployment + optimization

**Total Cost** (Monthly):

| Stage | Vercel | Supabase | Total |
|-------|--------|----------|-------|
| Development | $0 | $0 | **$0** |
| MVP Launch | $0 | $0 | **$0** |
| 100 Users | $0 | $0 | **$0** |
| 1000 Users | $0 - $20 | $0 - $25 | **$0 - $45** |

**Note**: Free tiers cover MVP requirements entirely.

---

## Technology-Specific Details

### Next.js 15 Features Used

**App Router**:
- File-based routing: `/app/(auth)/login/page.tsx`
- Route groups: `(auth)`, `(protected)`
- Layouts: Nested layouts for auth wrapper
- Loading states: `loading.tsx` automatic
- Error boundaries: `error.tsx` automatic

**Server Components**:
- Default server-side rendering
- Client components: `'use client'` directive
- Streaming: Suspense boundaries
- Metadata API: SEO optimization

**API Routes**:
- `/app/api/` directory
- Route handlers: `route.ts`
- Server-only code: No client bundle bloat

**Optimization**:
- Automatic code splitting
- Image optimization: `<Image>` component
- Font optimization: Built-in Google Fonts
- Bundle analysis: `@next/bundle-analyzer`

---

### TypeScript Configuration

**Strict Mode Enabled**:
```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitAny": true,
  "strictNullChecks": true
}
```

**Type Generation from Supabase**:
```bash
# Generate types from Supabase schema
npx supabase gen types typescript --project-id [PROJECT_ID] > types/database.ts
```

**Type Safety Benefits**:
- Compile-time error detection
- Autocomplete for database queries
- Refactoring safety
- Better documentation

---

### Tailwind CSS Setup

**JIT Compiler**:
- On-demand CSS generation
- Arbitrary values: `w-[137px]`
- Variant modifiers: `hover:`, `focus:`, `lg:`

**Design System**:
```javascript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      primary: 'blue-600',
      secondary: 'gray-600',
      success: 'green-600',
      error: 'red-600',
    },
    spacing: {
      'chat-input': '4rem',
    },
  },
}
```

**Plugins Used**:
- `@tailwindcss/forms`: Better form styling
- `@tailwindcss/typography`: Rich text rendering (optional)

---

### Supabase Configuration

**Client Setup**:
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**Auth Helpers** (Next.js integration):
```typescript
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
```

**RLS Policies**:
- Applied at database level
- Automatic security enforcement
- No manual permission checks needed

---

## Dependencies

### Required Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/auth-helpers-nextjs": "^0.9.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^15.0.0"
  }
}
```

### Optional Dependencies (Phase 2+)

```json
{
  "emoji-mart": "^5.5.0",           // Emoji picker UI
  "react-window": "^1.8.0",         // Virtual scrolling for large lists
  "@headlessui/react": "^1.7.0",    // Accessible UI primitives
  "clsx": "^2.0.0",                 // Conditional class names
  "zod": "^3.22.0"                  // Runtime validation (optional)
}
```

---

## Migration Strategy

### If Tech Stack Needs Change

**From Context API → Redux Toolkit**:
- **Difficulty**: Medium
- **Duration**: 2-3 days
- **Tasks**:
  - Install Redux Toolkit
  - Convert Context providers to Redux slices
  - Replace useContext with useSelector/useDispatch
- **Risk**: Low - state logic remains similar

**From Supabase → Firebase**:
- **Difficulty**: Hard
- **Duration**: 1-2 weeks
- **Tasks**:
  - Migrate PostgreSQL schema to Firestore
  - Rewrite RLS policies as Firebase rules
  - Update all database queries
  - Change auth implementation
- **Risk**: High - data model differences

**From Polling → WebSocket (Supabase Realtime)**:
- **Difficulty**: Easy
- **Duration**: 1 day
- **Tasks**:
  - Enable Supabase Realtime
  - Replace setInterval with subscriptions
  - Handle connection management
- **Risk**: Low - Supabase provides realtime API

---

## Learning Resources

### Next.js
- 🎓 Official Tutorial: https://nextjs.org/learn
- 📚 App Router Docs: https://nextjs.org/docs/app
- 💻 Example Apps: https://github.com/vercel/next.js/tree/canary/examples
- 👥 Community: Next.js Discord

### TypeScript
- 🎓 Official Handbook: https://www.typescriptlang.org/docs/handbook/
- 📚 React + TypeScript: https://react-typescript-cheatsheet.netlify.app/
- 💻 Type Challenges: https://github.com/type-challenges/type-challenges

### Tailwind CSS
- 🎓 Official Docs: https://tailwindcss.com/docs
- 📚 UI Components: https://tailwindui.com (paid), https://ui.shadcn.com (free)
- 💻 Playground: https://play.tailwindcss.com/

### Supabase
- 🎓 Quick Start: https://supabase.com/docs/guides/getting-started
- 📚 Auth Guide: https://supabase.com/docs/guides/auth
- 💻 Examples: https://github.com/supabase/supabase/tree/master/examples
- 👥 Community: Supabase Discord

### Flux Architecture
- 🎓 Official Docs: https://facebook.github.io/flux/docs/in-depth-overview/
- 📚 React Context: https://react.dev/reference/react/createContext
- 💻 Flux Examples: https://github.com/facebook/flux/tree/main/examples

---

## Decision Checklist

Before finalizing this stack, confirm:

- ✅ **Learning Goal**: Context API teaches Flux principles
- ✅ **Team Experience**: Can learn in 3 weeks
- ✅ **Budget**: Free tier covers MVP completely
- ✅ **3-Year Maintenance**: All technologies will be supported
- ✅ **Community Active**: Large, helpful communities for all tools
- ✅ **Breaking Changes**: Manageable update cycles
- ✅ **Production Ready**: Thousands of apps use this exact stack
- ✅ **Hiring**: TypeScript + React skills widely available
- ✅ **AI Assistance**: Excellent AI code generation support

---

## Next Steps

1. ✅ **Read Tech Stack** (this document)
2. → **Review Codebase Structure** (`/docs/003/codebase-structure.md`)
3. → **Setup Development Environment**
4. → **Initialize Next.js Project**
5. → **Create Supabase Project**
6. → **Implement Authentication**

---

**End of Tech Stack Document**
