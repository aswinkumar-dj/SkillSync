# SkillSync

SkillSync is a mock interview matching platform for developers.

It helps users:
- sign in with Google
- create a structured interview-prep profile
- control discoverability
- get matched later with relevant practice partners
- move toward private mock interview sessions inside one product flow

This repository is a monorepo with a Next.js frontend, an Express API, shared schemas, and a Prisma/PostgreSQL data model.

## Hackathon Summary

### Problem
Developers preparing for interviews usually depend on scattered Discord groups, WhatsApp groups, LinkedIn posts, spreadsheets, and random DMs to find practice partners. That creates noise, low commitment, and weak follow-through.

### Solution
SkillSync replaces that fragmented flow with one focused product:
- structured developer profiles
- discoverability controls
- partner matching
- private match relationships
- session scheduling
- future in-app interview room with video, editor, timer, notes, and feedback

### What is built now
- landing page with custom dark visual direction
- Google-auth-ready backend flow
- signed session cookie support
- onboarding/profile form
- dashboard shell
- profile completeness gate
- discoverability toggle support
- deterministic matching + Discover UI
- match request lifecycle (send / accept / decline / cancel)
- private match list + detail pages
- private match-scoped chat (REST + Socket.IO)
- in-app notifications with unread badges
- Prisma schema for the full planned platform
- Neon PostgreSQL migration applied

### Current product status
This is an active in-progress hackathon build.

The current usable slice is:
- landing page
- auth foundation
- onboarding flow
- dashboard foundation
- Discover + match requests + private matches
- private chat + notifications
- backend profile/meta/matching/request/chat scaffolding

Sessions, WebRTC room, notes, feedback, moderation, and admin surfaces are planned in the schema and architecture but are not fully implemented yet.

## Tech Stack

### Frontend
- Next.js 15
- React 19
- Tailwind CSS

### Backend
- Express
- Prisma
- PostgreSQL
- Socket.IO scaffold
- Zod

### Infra / services
- Neon PostgreSQL
- Google OAuth
- Gemini API configured for future AI ranking work

## Monorepo Layout

```text
SkillSync/
  apps/
    web/        Next.js frontend
    api/        Express API
  packages/
    shared/     shared schemas and constants
  prisma/       Prisma schema + migrations
  ARCHITECTURE.md
  README.md
  AGENTS.md
```

## App Structure

### `apps/web`
Main user-facing application.

Important files:
- `src/app/page.tsx`: landing page entry
- `src/app/onboarding/page.tsx`: onboarding form flow
- `src/app/dashboard/page.tsx`: dashboard entry
- `src/components/landing/*`: landing page sections
- `src/components/auth/auth-gate.tsx`: signed-in gate logic
- `src/components/app-shell/app-shell.tsx`: authenticated layout shell
- `src/lib/api.ts`: frontend API helper

### `apps/api`
Main backend application.

Important files:
- `src/server.ts`: API server entry
- `src/config/env.ts`: runtime env parsing
- `src/config/app.ts`: Express app setup
- `src/modules/auth/auth.routes.ts`: Google auth + session endpoints
- `src/modules/users/users.routes.ts`: onboarding/profile endpoints
- `src/modules/meta/meta.routes.ts`: reference metadata endpoints
- `src/modules/matching/matching.routes.ts`: deterministic search foundation
- `src/middleware/auth.ts`: cookie auth guard
- `src/lib/session.ts`: signed session token logic
- `src/lib/cookies.ts`: session cookie helpers
- `src/lib/prisma.ts`: Prisma client singleton

### `packages/shared`
Shared schemas used by frontend and backend.

Important files:
- `src/schemas/profile.ts`
- `src/schemas/matching.ts`

### `prisma`
Database source of truth.

Important files:
- `schema.prisma`
- `migrations/*`

## Environment Variables

Main variables used by the current build:
- `DATABASE_URL`
- `DIRECT_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `GEMINI_API_KEY`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `SESSION_COOKIE_NAME`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_URL`
- `STUN_SERVER_URL`
- `TURN_SERVER_URL`
- `TURN_SERVER_USERNAME`
- `TURN_SERVER_CREDENTIAL`

Notes:
- `.env` must never be committed.
- `.env.example` is safe to commit and should contain placeholders only.
- For local runs right now, empty TURN values can be awkward depending on how the API is launched. Using placeholder strings like `disabled` is the safest local setup until TURN config is hardened further.

## Local Setup

### 1. Install dependencies
```powershell
npm install
```

### 2. Generate Prisma client
```powershell
npm run db:generate
```

### 3. Run migrations
```powershell
npx prisma migrate dev --name init
```

### 4. Start the frontend
```powershell
cd apps/web
npm run build
npm run start
```

### 5. Start the API
```powershell
cd apps/api
$env:TURN_SERVER_URL='disabled'
$env:TURN_SERVER_USERNAME='disabled'
$env:TURN_SERVER_CREDENTIAL='disabled'
npx tsx src/server.ts
```

## Local URLs

- Web: `http://localhost:3000`
- API health: `http://localhost:4000/health`
- Google auth entry: `http://localhost:4000/api/v1/auth/google`

## Current API Surface

### Auth
- `GET /api/v1/auth/google`
- `GET /api/v1/auth/google/callback`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

### Users
- `GET /api/v1/users/me`
- `GET /api/v1/users/me/profile-completeness`
- `PATCH /api/v1/users/me`
- `PATCH /api/v1/users/me/discoverability`
- `GET /api/v1/users/:id`

### Meta
- `GET /api/v1/meta/roles`
- `GET /api/v1/meta/languages`
- `GET /api/v1/meta/skills`
- `GET /api/v1/meta/tech-stack`
- `GET /api/v1/meta/interview-topics`

### Matching / Matches
- `POST /api/v1/matches/search`
- `GET /api/v1/matches`
- `GET /api/v1/matches/:id`

### Match requests
- `POST /api/v1/match-requests`
- `GET /api/v1/match-requests/incoming`
- `GET /api/v1/match-requests/outgoing`
- `POST /api/v1/match-requests/:id/accept`
- `POST /api/v1/match-requests/:id/decline`
- `POST /api/v1/match-requests/:id/cancel`

## Product Rules Implemented So Far

- incomplete profiles should not appear in matching
- profile completeness depends on core identity + role + language + timezone + experience + skills + tech stack + interview topics + availability
- discoverability is separate from account status
- multiple sessions per match are part of the future model
- notes are intended to be private by default
- matching is deterministic first, AI later

## Design Direction

The visual language currently aims for:
- dark theme
- black-first palette
- orange as accent/secondary emphasis
- restrained glassmorphism on cards and shells
- minimal section count
- less "generic AI startup" feel

## Known Gaps / Next Build Targets

Recommended next implementation sequence:
1. finish reliable auth/session runtime flow
2. build session scheduling
3. build interview room shell
4. add Gemini-powered ranking explanations
5. add feedback/reporting/admin flows

## Submission Notes

This project is strongest as a hackathon submission when pitched as:
- a workflow product, not a community product
- an interview-prep coordination tool, not another chat app
- a focused developer utility that turns scattered prep into committed practice sessions

## Important Note For Judges / Teammates

The Prisma schema and architecture already define a much larger product than the currently exposed UI. That is intentional.

The repo contains:
- implemented foundation code
- production-minded schema design
- clear architecture for the next slices
- a realistic path from landing page to full interview platform
