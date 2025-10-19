# Chat Application - MVP Learning Project

Real-time chat application built with Next.js 15, TypeScript, Supabase, and Flux architecture.

## Implementation Status: 60% Complete

### ✅ Completed (Phases 1-4 + Partial Phase 5)

- **Phase 1-2**: Next.js setup, Database schema, Environment config
- **Phase 3**: Supabase client, Type definitions, Utility functions
- **Phase 4**: Complete Flux implementation (Auth/Rooms/Messages contexts)
- **Phase 5** (Partial): Common components, Layout components, Auth forms

### 🚧 Remaining: Components + Pages

- Rooms components (RoomList, RoomCard, CreateRoomDialog, RoomHeader)
- Chat components (MessageList, MessageBubble, MessageInput, etc.)
- All pages (Login, Register, Rooms, Chat Room)
- Integration testing

## Quick Start

### 1. Database Setup
```bash
# Create Supabase project, then run:
# In Supabase SQL Editor, execute: supabase-migration.sql
```

### 2. Environment
```bash
cp .env.example .env.local
# Add your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Run
```bash
npm install
npm run dev
```

## Tech Stack
Next.js 15 • TypeScript • Tailwind • Supabase • Flux Pattern

## Documentation
See `docs/` directory for complete specifications.
