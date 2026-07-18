# AGENTS.md

## Purpose

This file is the high-context handoff note for another model or engineer continuing SkillSync.

Use it as the fast path for understanding:
- what the product is
- what has already been decided
- what is already implemented
- how the codebase is organized
- what styling direction to preserve
- what runtime issues have already appeared locally
- what should be built next

This file should reduce repeated rediscovery work.

## Project Identity

SkillSync is a mock interview matching platform for developers.

The core promise is simple: instead of hunting for practice partners in scattered Discord groups, WhatsApp groups, spreadsheets, and random DMs, a developer should be able to do the whole prep flow in one focused product.

That flow is intended to become:
1. sign in
2. complete a structured prep profile
3. become discoverable
4. find relevant mock interview partners
5. form a private match relationship
6. schedule one or many sessions
7. run the mock interview inside the app
8. leave private notes and feedback

## What The User Explicitly Wanted In This Chat

These decisions were repeatedly reinforced and should be treated as product and design constraints, not casual suggestions.

### Product intent
- build the full application, not just a landing page demo
- keep code well organized
- follow single responsibility as much as possible
- make the project look professional, minimal, and intentional
- use shared architecture and clean boundaries
- support a realistic path from MVP to full product

### Design intent
- dark theme throughout the project
- primary color direction should be black-first
- secondary / accent color should be orange
- restrained glassmorphism for cards and modals
- avoid generic AI-startup visual language
- reduce visual clutter
- fewer sections, stronger purpose per section
- smaller type than the original first pass
- reduce heavy boldness
- avoid obvious white borders
- reduce border radius from the first pass
- the site should feel smooth and polished
- keep visual consistency between landing page and future app pages

### UX / product behavior decisions
- incomplete profiles must not appear in matching history or discovery
- discoverability toggle exists and can be handled in-app
- notes are private by default
- prime-time availability is acceptable for the first pass
- multiple sessions per match are allowed
- reminders can be in-app first instead of email-heavy infrastructure
- deterministic matching first, AI ranking second
- Gemini was preferred over OpenAI for early AI work because of cost sensitivity

## Current High-Level Product Scope

### What exists now
The project currently contains a real foundation, not just mock screens.

Implemented or partially implemented:
- custom landing page
- Google-auth-ready backend flow
- signed session cookie flow
- authenticated route gating
- onboarding/profile form
- dashboard shell
- profile completeness logic
- discoverability support
- deterministic matching route with transparent overlap reasons
- authenticated Discover + Matching Results UI
- match request lifecycle (create, incoming/outgoing, accept/decline/cancel)
- private match list + detail pages
- private chat rooms + message history + Socket.IO delivery
- in-app notification list + unread badge
- metadata routes for structured profile options
- Prisma schema for the larger planned product
- Neon/PostgreSQL-backed persistence setup

### What is planned but not finished yet
- richer notification preferences / email reminders
- scheduling flow
- interview session management
- in-app interview room
- notes and feedback flows
- moderation / reports / admin
- Gemini-powered ranking explanations or enrichment

## What This Product Is Not

Do not accidentally drift the product into these categories.

- It is not a social network.
- It is not a public reputation system.
- It is not a marketplace for paid interviewing.
- It is not just another chat app.
- It is not meant to be a generic community feed.

The strongest framing is: a workflow product for interview preparation coordination.

## Monorepo Layout

```text
SkillSync/
  apps/
    api/        Express backend
    web/        Next.js frontend
  packages/
    shared/     shared schemas/constants/contracts
  prisma/       Prisma schema and migrations
  ARCHITECTURE.md
  README.md
  AGENTS.md
```

## Architecture Overview

### Architecture style
This repo follows a practical monorepo structure with separation across:
- frontend application concerns
- backend API concerns
- shared validation / contract concerns
- database schema concerns

The intended architectural direction is:
- frontend stays thin around data shaping and UI state
- backend owns validation, business logic, and persistence
- shared package owns contracts wherever possible
- Prisma schema remains the domain source of truth for long-term entities

### Separation of responsibilities
- `apps/web` should handle rendering, route composition, auth-aware UX flow, and calling API contracts.
- `apps/api` should handle auth, cookies, validation, profile completion rules, discovery/matching rules, and data persistence.
- `packages/shared` should hold Zod schemas and constants that should not be duplicated.
- `prisma/schema.prisma` should express the long-term domain model even before every screen exists.

## Frontend Architecture

### Stack
- Next.js 15
- React 19
- Tailwind CSS

### Frontend design system direction
Preserve the current visual language when extending the app.

Core rules:
- black-first background system
- orange accent for focus, CTA, and secondary emphasis
- soft glass panels where useful
- restrained transparency, not noisy blur everywhere
- lower radius than trendy pill-heavy startup UIs
- minimal sections and stronger information hierarchy
- avoid white outlines unless extremely subtle
- avoid oversized hero typography
- avoid AI-slop gradients or generic shiny product marketing

### Current landing page structure
The landing page was intentionally simplified after multiple revisions.

Current intent:
- hero focused on the real problem
- how-it-works section
- FAQ section
- concise CTA and footer support

The user explicitly asked to reduce section count and remove unnecessary dividers/lines between sections.

### Important frontend files
- `apps/web/src/app/layout.tsx`
  Root layout and top-level HTML shell.
- `apps/web/src/app/page.tsx`
  Landing page entry.
- `apps/web/src/app/onboarding/page.tsx`
  Auth-protected onboarding form and save flow.
- `apps/web/src/app/dashboard/page.tsx`
  Auth-protected dashboard shell.
- `apps/web/src/components/landing/*`
  Landing page section components.
- `apps/web/src/components/auth/auth-gate.tsx`
  Auth/session gate for protected routes.
- `apps/web/src/components/app-shell/app-shell.tsx`
  Shared authenticated shell.
- `apps/web/src/components/dashboard/profile-status-card.tsx`
  Current dashboard content card.
- `apps/web/src/lib/api.ts`
  Shared frontend fetch wrapper.

### Frontend UX decisions already made
- if auth is missing or expired, show a graceful Google sign-in card instead of infinite loading
- onboarding should explain that incomplete profiles stay out of discovery and history
- profile save UX should be simple and direct
- first-pass availability can be seeded rather than fully configurable
- authenticated pages should feel consistent with landing page styling
- onboarding should now show field-level validation errors instead of only generic failures

## Backend Architecture

### Stack
- Express
- Prisma
- Zod
- Socket.IO scaffold

### Backend module direction
The backend is moving toward module-oriented routing:
- auth
- users
- meta
- matching
- later chat / sessions / notifications / admin

### Important backend files
- `apps/api/src/server.ts`
  Server bootstrap.
- `apps/api/src/config/app.ts`
  Express app creation, middleware registration, health route, global error handler.
- `apps/api/src/config/env.ts`
  Environment parsing and runtime config.
- `apps/api/src/middleware/auth.ts`
  Request auth guard based on signed session cookie.
- `apps/api/src/lib/session.ts`
  Session token signing/verification helper.
- `apps/api/src/lib/cookies.ts`
  Cookie setters/clearers for session and OAuth state.
- `apps/api/src/lib/request.ts`
  Cookie parsing helper.
- `apps/api/src/modules/index.ts`
  API route registration.
- `apps/api/src/modules/auth/auth.routes.ts`
  Google OAuth entry, callback, `/me`, logout.
- `apps/api/src/modules/users/users.routes.ts`
  Profile read/update/discoverability routes.
- `apps/api/src/modules/meta/meta.routes.ts`
  Reference-data endpoints.
- `apps/api/src/modules/matching/matching.routes.ts`
  Deterministic search foundation.
- `apps/api/src/modules/match-requests/match-requests.routes.ts`
  Request create/list/accept/decline/cancel lifecycle.
- `apps/api/src/modules/matches/matches.routes.ts`
  Private match list and detail for accepted relationships.

### Backend behavior already implemented
- cookie-based auth instead of storing tokens in frontend state
- Google user upsert on callback
- session cookie issuance after auth
- auth-aware `/me` endpoint
- protected profile routes
- profile completeness calculation on save
- discoverability persistence
- exclusion of incomplete users from public profile lookup and matching

## Shared Package

### Purpose
`packages/shared` is the contract layer.

It should be the first place to add or modify:
- profile schemas
- matching filter schemas
- shared enums / constants
- validation types used by both frontend and backend

### Important files
- `packages/shared/src/schemas/profile.ts`
- `packages/shared/src/schemas/matching.ts`
- `packages/shared/src/constants/roles.ts`

### Important recent changes
Profile schema handling was hardened so blank optional strings do not break saves unnecessarily.

This matters especially for:
- bio
- targetRole
- preferredLanguage
- timezone
- githubUrl
- linkedinUrl

URL inputs are now also normalized more gracefully so common values like `github.com/username` can be accepted and converted to `https://github.com/username`.

## Database / Prisma Context

### Source of truth
- `prisma/schema.prisma`

### Why the schema is larger than the UI
The schema intentionally models more of the finished product than the current UI exposes. This is expected and should not be treated as inconsistency.

The schema is laying groundwork for:
- user profiles
- structured skill/topic/stack relations
- availability
- match requests
- accepted matches
- chat/messages
- notifications
- interview sessions
- session participants
- notes
- collaborative artifacts
- feedback
- reports
- admin capability

### Important user fields
- `isProfileComplete`
- `isDiscoverable`
- `status`
- role/language/timezone/experience/profile links

## Current User Flow

### Anonymous flow
1. user lands on homepage
2. user clicks Google sign-in CTA
3. auth starts from backend endpoint

### Authenticated flow
1. Google callback upserts user
2. session cookie is set
3. backend redirects to app
4. incomplete user goes to onboarding
5. complete user goes to dashboard

### Onboarding flow
The onboarding form currently saves:
- name
- bio
- years of experience
- target role
- preferred language
- timezone
- github url
- linkedin url
- tech stack list
- skills list
- interview topics list
- discoverability
- seeded availability slots

### Dashboard flow
Current dashboard is still a foundation surface, not the finished product experience.

Its job right now is mostly to:
- confirm session/auth
- show profile readiness state
- provide a shell for next features

## Profile Completeness Rules

A profile is considered complete only if it has:
- bio
- target role
- preferred language
- timezone
- years of experience
- at least one skill
- at least one tech stack item
- at least one interview topic
- at least one availability slot

Business consequences:
- incomplete users must not appear in matching
- incomplete users must not appear in public-style profile lookup paths used for discovery
- onboarding copy should continue reinforcing this rule

## Matching Logic Today

Current matching is intentionally simple.

`apps/api/src/modules/matching/matching.routes.ts` currently does:
- auth check
- current user completeness check
- self exclusion
- incomplete user exclusion
- non-discoverable user exclusion
- structured filtering from shared schema
- simple deterministic scoring using overlap patterns

### Matching strategy direction
Phase 1:
- deterministic filters
- transparent scoring
- reliable and debuggable results

Phase 2:
- Gemini-assisted ranking or explanation
- optional recommendation layer
- AI never becomes the only source of truth

## API Surface Right Now

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

### Chat
- `GET /api/v1/chat/rooms`
- `GET /api/v1/chat/rooms/match/:matchId` (get-or-create for an active match)
- `GET /api/v1/chat/rooms/:roomId`
- `GET /api/v1/chat/rooms/:roomId/messages`
- `POST /api/v1/chat/rooms/:roomId/messages`

### Notifications
- `GET /api/v1/notifications`
- `GET /api/v1/notifications/unread-count`
- `POST /api/v1/notifications/read-all`
- `POST /api/v1/notifications/:id/read`

### Socket.IO events
- auth via session cookie on handshake
- `chat:join` / `chat:leave` (membership-checked)
- `chat:message` (server broadcast after REST send)
- `notification:new` (server push to `user:{id}`)

## Environment And Service Context

### Important env variables
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

### Service choices discussed
- Neon PostgreSQL is being used
- Google OAuth is the sign-in method
- Gemini is the preferred future AI provider due to early-stage cost concerns
- TURN/STUN will matter later for real-time interview room work

### Local runtime caveats discovered in this chat
These are important and should not be rediscovered from scratch.

1. Empty TURN env values caused backend startup instability in local runs.
2. Using placeholder non-empty strings like `disabled` for TURN values was the safest local workaround.
3. The API was at times healthy on `localhost:4000` while the frontend still showed stale behavior because the web process had not picked up changes.
4. A Windows / OneDrive / `.next` issue caused production `next build` trouble involving `readlink`.
5. Because of that, local validation sometimes had to rely on `next dev` instead of `next start`.
6. `Invoke-WebRequest` was occasionally unreliable for local health probing, while `Invoke-RestMethod` or `curl.exe` gave clearer results.
7. The onboarding save route previously suffered Prisma transaction timeout errors (`P2028`) and had to be refactored away from a slower interactive transaction style.

### Current known local URLs
- web: `http://localhost:3000`
- api: `http://localhost:4000`
- api health: `http://localhost:4000/health`
- google auth entry: `http://localhost:4000/api/v1/auth/google`

## Important Changes Made During This Chat

This section captures the project evolution inside this conversation.

### Product and setup work
- the app was moved from concept toward full-product foundation
- environment setup guidance was provided for Neon, JWT, Google auth, and Gemini
- the user populated env values locally

### Landing page work
- landing page was redesigned multiple times
- content was reduced
- font sizes were reduced
- heavy borders were toned down
- white border feel was reduced
- radius was reduced
- excess sections were removed
- section separators/lines were removed
- copy was adjusted away from generic startup wording
- design was pushed toward a more minimal black/orange visual identity

### Auth and onboarding work
- auth gate was updated so protected pages no longer sit forever on loading when auth fails
- onboarding page and dashboard page were rebuilt into a usable authenticated flow
- profile save path was wired to backend update route
- profile completeness gating was reinforced
- onboarding now includes field-level validation styling and messages

### Backend work
- session cookie helpers and middleware were introduced
- auth routes and user routes were expanded
- metadata and matching foundations were added
- environment parsing was hardened
- optional TURN env handling was improved
- profile save logic was refactored to reduce Prisma transaction timeout risk

### Save-failure debugging work
The user encountered multiple save-related failures.

Observed symptoms during the chat:
- loading skeleton on onboarding
- server-side error on save
- failed fetch on save
- 400 bad request on save
- 500 internal server error on save
- backend process instability
- Prisma transaction timeout errors during profile update

What was done:
- verified API health repeatedly
- identified that backend availability was part of the failure pattern
- hardened optional string handling in profile schema
- normalized blank form values before sending save payloads
- improved frontend fetch error messaging when the server cannot be reached
- added field-level validation UX in onboarding
- refactored the backend profile save path away from a slower interactive transaction approach
- restarted local services repeatedly to ensure latest code was live

### Documentation work
- `README.md` was expanded for hackathon submission use
- `AGENTS.md` was created and then expanded further

## Files Most Important To Understand First

If another model is joining midstream, read these first:
- `ARCHITECTURE.md`
- `README.md`
- `AGENTS.md`
- `prisma/schema.prisma`
- `packages/shared/src/schemas/profile.ts`
- `packages/shared/src/schemas/matching.ts`
- `apps/api/src/config/env.ts`
- `apps/api/src/modules/auth/auth.routes.ts`
- `apps/api/src/modules/users/users.routes.ts`
- `apps/api/src/modules/matching/matching.routes.ts`
- `apps/web/src/components/auth/auth-gate.tsx`
- `apps/web/src/app/onboarding/page.tsx`
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/chat/page.tsx`
- `apps/web/src/app/chat/[roomId]/page.tsx`
- `apps/web/src/app/notifications/page.tsx`
- `apps/web/src/lib/socket.ts`
- `apps/web/src/components/landing/*`

## What To Build Next

This section is intentionally explicit.

### Just completed
Private chat + notification surfaces for accepted matches.

A signed-in matched pair can now:
- get a chat room created on match accept (with lazy get-or-create fallback)
- list private rooms at `/chat`
- open a match-scoped conversation at `/chat/:roomId`
- load message history over REST and send new messages
- receive live `chat:message` events over authenticated Socket.IO
- receive in-app notifications for request received, request accepted, and chat messages
- open `/notifications`, mark one/all read, and see unread badges in the app shell
- open chat from match detail / match list

Business rules enforced:
- chat only for members of an ACTIVE match
- no public feed or group chat
- partner payloads still do not expose email
- sockets require a valid session cookie

Current implementation files:
- `packages/shared/src/schemas/chat.ts`
- `packages/shared/src/schemas/notifications.ts`
- `apps/api/src/modules/chat/chat.routes.ts`
- `apps/api/src/modules/notifications/notifications.routes.ts`
- `apps/api/src/lib/notifications.ts`
- `apps/api/src/sockets/index.ts`
- `apps/api/src/sockets/io-registry.ts`
- `apps/api/src/modules/match-requests/match-requests.routes.ts` (room + notification on accept/create)
- `apps/web/src/app/chat/page.tsx`
- `apps/web/src/app/chat/[roomId]/page.tsx`
- `apps/web/src/app/notifications/page.tsx`
- `apps/web/src/lib/socket.ts`
- `apps/web/src/components/app-shell/app-shell.tsx`

### Immediate next product milestone
Build session scheduling for accepted matches.

### What the next slice should include
- create/list/update interview sessions for a match
- basic calendar-style availability awareness
- in-app session reminders via notifications
- match detail entry into scheduled sessions

### Concrete routes and files to add
Expected backend additions:
- `apps/api/src/modules/sessions/*`
- `POST /api/v1/sessions`
- `GET /api/v1/sessions`
- `GET /api/v1/sessions/:id`
- `PATCH /api/v1/sessions/:id`

Expected frontend additions:
- schedule form from match detail
- upcoming sessions list
- session detail shell (pre-interview-room)

### Definition of done for the next milestone
Two matched users can propose and confirm practice sessions with times, see them on both sides, and receive basic in-app reminders.

## Recommended Next Build Order

After private chat + notifications, the broader order should be:
1. fully stabilize auth/session and onboarding save flow in a production-like local run
2. add session scheduling flow
3. add interview room shell with WebRTC preparation
4. add notes and feedback flows
5. add Gemini assistance for ranking/explanations
6. add reporting/admin completion

## Collaboration Guidance For Another Model

When continuing this repo:
- preserve the black/orange minimal design language
- preserve the restrained glass treatment
- do not bloat the landing page again
- avoid adding generic AI-marketing sections
- keep code organized around single responsibility
- prefer shared schemas over duplicated validation
- keep backend business rules centralized
- do not allow incomplete users into discovery results
- do not drift the product toward public social mechanics
- use AI as an assistive layer, not the source of truth
- align major changes with `ARCHITECTURE.md`
- if touching auth or save flow, verify both running processes actually picked up the code
- be careful with Windows/OneDrive runtime quirks in `.next` and local process management
- if touching the save route again, be extra careful about Prisma transaction duration and batching

## Short Status Summary As Of July 18, 2026

SkillSync is a strong foundation-stage product build.

It already has:
- a clear product direction
- a real monorepo structure
- a meaningful Prisma domain model
- Google-auth-ready backend flow
- cookie/session foundations
- onboarding/profile foundations
- dashboard foundation
- metadata and deterministic matching
- Discover + match request lifecycle + private match detail
- private match-scoped chat with Socket.IO
- in-app notifications with unread badge support
- a custom dark landing page aligned to the user's visual direction
- hackathon-oriented documentation
- better onboarding validation UX than earlier revisions

It does not yet have the full end-user workflow.

Biggest remaining product gaps:
- session scheduling
- live interview room
- notes/feedback
- reporting/admin completion
- Gemini ranking assistance

## Final Reminder

Another model should treat this project as a serious product foundation with active implementation, not as a throwaway landing page repo.

The most important things to preserve are:
- product focus
- architecture discipline
- the black/orange visual identity
- the completeness/discoverability business rules
- clean code organization
- momentum toward the full mock interview workflow
