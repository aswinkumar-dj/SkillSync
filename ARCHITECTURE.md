# SkillSync Architecture Specification

## 1. Product Analysis

### What the product is
SkillSync is a focused peer-to-peer interview practice platform for developers. Its core loop is:

1. A developer creates a structured profile.
2. They ask for a mock interview partner.
3. The system finds strong matches.
4. Users request, accept, and schedule sessions.
5. The interview runs inside the platform.
6. Users leave private feedback or moderation reports.

### What makes it distinct
- It is not a social network.
- It is not a freelance marketplace.
- It is not a generic chat community.
- It is a workflow product optimized for interview preparation.

### Core product constraints
- Google Sign-In only
- No public popularity mechanics
- AI augments matching, not core business logic
- Communication unlocks only after request acceptance
- Interviews happen inside the platform

## 2. Missing Requirements And Recommended Clarifications

These should be agreed before implementation.

### User/account rules
- Can a user pause discoverability without deactivating their account?
- Can a user be matched while already in an active scheduled session?
- Should incomplete profiles be blocked from using matching?
- Can users edit profile fields after matches are created?
- Is email shown to other users? Recommendation: no.

### Matching rules
- Is matching one-to-one only? Recommendation: yes for V1.
- Should users be able to filter by language, timezone overlap, role, or seniority manually before AI ranking?
- How many candidates should OpenAI rank at once? Recommendation: top 20 filtered candidates max.
- Should users be prevented from sending duplicate requests to the same person? Recommendation: yes.
- Should users be able to rematch with prior partners? Recommendation: yes, with chat/session history preserved.

### Request/chat rules
- Does chat open only after acceptance, or should a limited request message be allowed before acceptance?
  Recommendation: allow a short optional request note, but no full chat until accepted.
- Can either user unmatch later? Recommendation: yes.
- Can users block another user? Recommendation: yes.

### Scheduling rules
- Can either matched user propose changes?
- Are multiple sessions allowed per match? Recommendation: yes.
- What happens on no-show or cancellation?
- Should reminders be sent by email, in-app, or both?

### Interview room rules
- Is the shared editor collaborative for both users or interviewer-led?
  Recommendation: fully collaborative with presence indicators.
- Should notes be shared or private?
  Recommendation: private notes by default for V1.
- Should the room support question templates? Recommendation: later phase.
- Should sessions be recorded? Recommendation: no for V1 due to privacy/compliance overhead.

### Moderation/privacy rules
- What categories of reports exist?
- What admin workflow resolves reports?
- How long should chat, notes, and session metadata be retained?
- Do users need account deletion/export support? Recommendation: yes.

### Business rules
- Is this free-only in V1? Recommendation: yes.
- Are admins/moderators required in the first release? Recommendation: lightweight admin console yes.

## 3. Product Improvements

Recommended additions that fit the vision without turning the product into a social platform:

- Profile completeness gate before using matching
- Discoverability toggle
- Availability presets plus weekly time windows
- Match request note with interview goal
- Session status timeline: requested, accepted, scheduled, completed, cancelled
- Re-match button after completed sessions
- Private post-session feedback form
- Private moderation reporting flow
- Basic admin moderation dashboard
- Notification center with unread counts
- Session reminders
- Presence indicators for online/offline/in-room

## 4. Recommended System Architecture

### High-level architecture
- Frontend: Next.js app router application
- API server: Node.js + Express
- Database: PostgreSQL via Prisma
- Real-time gateway: Socket.IO on the backend server
- AI service layer: backend-only wrapper around OpenAI API
- Video/signaling: WebRTC peer connections with Socket.IO signaling
- Shared editor sync: Socket.IO operational events for room documents
- Object storage: optional future addition for attachments; not needed for V1

### Why split Next.js and Express
- Keeps UI delivery independent from real-time/business backend
- Makes Socket.IO and WebRTC signaling easier to isolate
- Avoids overloading Next.js server runtime with stateful real-time concerns

### Suggested services
- `web`: Next.js frontend
- `api`: Express REST + Socket.IO
- `db`: PostgreSQL
- `ai`: logical module inside `api`, not a separate deployed service in V1

### Core bounded contexts
- Identity and onboarding
- Profiles and discoverability
- Matching and recommendations
- Requests and relationships
- Chat and notifications
- Scheduling and sessions
- Interview room
- Moderation and admin

## 5. Data Model / Database Schema

### Main entities

#### User
- `id` UUID
- `googleId` string unique
- `email` string unique
- `name` string
- `avatarUrl` string nullable
- `bio` text nullable
- `yearsOfExperience` integer nullable
- `targetRole` enum/string nullable
- `preferredLanguage` string nullable
- `timezone` string nullable
- `githubUrl` string nullable
- `linkedinUrl` string nullable
- `isProfileComplete` boolean
- `isDiscoverable` boolean default true
- `status` enum: `active | suspended | deleted`
- `createdAt`
- `updatedAt`
- `lastActiveAt`

#### Skill
- `id` UUID
- `name` string unique
- `category` string nullable

#### UserSkill
- `id` UUID
- `userId` FK
- `skillId` FK
- `level` enum nullable: `beginner | intermediate | advanced`

#### TechStackItem
- `id` UUID
- `name` string unique

#### UserTechStackItem
- `id` UUID
- `userId` FK
- `techStackItemId` FK

#### InterviewTopic
- `id` UUID
- `name` string unique

#### UserInterviewTopic
- `id` UUID
- `userId` FK
- `interviewTopicId` FK

#### AvailabilitySlot
- `id` UUID
- `userId` FK
- `dayOfWeek` integer
- `startMinute` integer
- `endMinute` integer
- `isActive` boolean

Store recurring weekly windows in the user's local timezone.

#### MatchRequest
- `id` UUID
- `senderId` FK
- `receiverId` FK
- `message` varchar(300) nullable
- `requestedRole` string nullable
- `requestedTopics` jsonb nullable
- `status` enum: `pending | accepted | declined | cancelled | expired`
- `createdAt`
- `respondedAt` nullable

Unique partial rule recommendation:
- only one active pending request per sender/receiver pair

#### Match
- `id` UUID
- `userAId` FK
- `userBId` FK
- `createdFromRequestId` FK unique
- `status` enum: `active | blocked | closed`
- `createdAt`
- `updatedAt`

#### ChatRoom
- `id` UUID
- `matchId` FK unique
- `createdAt`

#### ChatMessage
- `id` UUID
- `roomId` FK
- `senderId` FK
- `type` enum: `text | system`
- `content` text
- `createdAt`
- `editedAt` nullable

#### Notification
- `id` UUID
- `userId` FK
- `type` enum
- `title` string
- `body` string
- `data` jsonb nullable
- `isRead` boolean
- `createdAt`

#### InterviewSession
- `id` UUID
- `matchId` FK
- `scheduledByUserId` FK
- `startsAt` timestamptz
- `endsAt` timestamptz
- `durationMinutes` integer
- `status` enum: `scheduled | ongoing | completed | cancelled | no_show`
- `agenda` text nullable
- `roomCode` string unique
- `createdAt`
- `updatedAt`

#### SessionParticipant
- `id` UUID
- `sessionId` FK
- `userId` FK
- `role` enum: `interviewer | candidate | peer`
- `joinedAt` nullable
- `leftAt` nullable

#### SessionNote
- `id` UUID
- `sessionId` FK
- `userId` FK
- `content` text
- `isPrivate` boolean default true
- `updatedAt`

#### CollaborativeDocument
- `id` UUID
- `sessionId` FK unique
- `language` string
- `initialContent` text
- `currentSnapshot` text
- `version` integer
- `updatedAt`

#### SessionFeedback
- `id` UUID
- `sessionId` FK
- `submittedByUserId` FK
- `partnerUserId` FK
- `ratingPrivate` integer nullable
- `whatWentWell` text nullable
- `improvements` text nullable
- `wouldPracticeAgain` boolean nullable
- `createdAt`

Private only; never surfaced as public reputation.

#### UserReport
- `id` UUID
- `reporterUserId` FK
- `reportedUserId` FK
- `sessionId` FK nullable
- `matchId` FK nullable
- `category` enum
- `details` text
- `status` enum: `open | reviewing | resolved | dismissed`
- `createdAt`
- `resolvedAt` nullable

#### AdminUser
- `id` UUID
- `userId` FK unique
- `role` enum: `moderator | admin`

### Important indexes
- `User(isDiscoverable, isProfileComplete, timezone, targetRole)`
- join tables on `userId`
- `MatchRequest(senderId, receiverId, status)`
- `Match(userAId, userBId, status)`
- `ChatMessage(roomId, createdAt)`
- `Notification(userId, isRead, createdAt desc)`
- `InterviewSession(matchId, startsAt)`

## 6. Matching Architecture

### Matching pipeline
1. User submits a natural language request.
2. Backend parses explicit filters from structured UI plus free text.
3. PostgreSQL performs deterministic filtering:
   - discoverable users only
   - complete profiles only
   - not self
   - not blocked
   - matching role/topics/skills/experience/timezone/availability overlap
4. Backend narrows to top candidate pool using SQL scoring heuristics.
5. Only the narrowed pool is sent to OpenAI.
6. OpenAI returns ranked candidates with short explanations.
7. Backend validates candidate IDs and explanation shape.
8. Frontend displays ranked cards.

### Why this design
- Keeps eligibility deterministic and auditable
- Controls token costs
- Prevents AI hallucinating nonexistent users
- Allows fallback ranking if AI is unavailable

### Recommended deterministic pre-score
- Skill overlap score
- Target role exact match score
- Interview topic overlap score
- Experience delta penalty
- Availability overlap score
- Timezone proximity score
- Recent interaction penalty to diversify matches

## 7. REST API Design

Base path: `/api/v1`

### Auth
- `POST /auth/google`
  Exchange Google ID token or auth code for app session
- `POST /auth/logout`
- `GET /auth/me`

Recommendation:
- frontend uses Google OAuth flow
- backend validates Google token and creates session/JWT

### Users / profile
- `GET /users/me`
- `PATCH /users/me`
- `PATCH /users/me/discoverability`
- `GET /users/me/profile-completeness`
- `GET /users/:id`

### Reference data
- `GET /meta/skills`
- `GET /meta/tech-stack`
- `GET /meta/interview-topics`
- `GET /meta/roles`
- `GET /meta/languages`
- `GET /meta/timezones`

### Availability
- `GET /users/me/availability`
- `PUT /users/me/availability`

### Matching
- `POST /matches/search`
  Input: free text + optional structured filters
  Output: ranked candidate cards with AI explanation
- `GET /matches`
  Active accepted relationships for current user
- `DELETE /matches/:matchId`
  Close/unmatch

### Requests
- `POST /match-requests`
- `GET /match-requests/incoming`
- `GET /match-requests/outgoing`
- `POST /match-requests/:id/accept`
- `POST /match-requests/:id/decline`
- `POST /match-requests/:id/cancel`

### Chat
- `GET /chat/rooms`
- `GET /chat/rooms/:roomId/messages?cursor=`
- `POST /chat/rooms/:roomId/messages`

REST is useful for history fetch and fallback posting; real-time send/receive should use sockets.

### Notifications
- `GET /notifications`
- `POST /notifications/:id/read`
- `POST /notifications/read-all`

### Scheduling / sessions
- `POST /sessions`
- `GET /sessions`
- `GET /sessions/:id`
- `PATCH /sessions/:id`
- `POST /sessions/:id/cancel`
- `POST /sessions/:id/start`
- `POST /sessions/:id/complete`

### Interview room
- `GET /sessions/:id/room`
  Returns room metadata, permissions, TURN config, collaborative document snapshot
- `PUT /sessions/:id/notes`
- `GET /sessions/:id/notes/me`
- `GET /sessions/:id/document`

### Feedback and reports
- `POST /sessions/:id/feedback`
- `POST /reports`

### Admin
- `GET /admin/reports`
- `GET /admin/reports/:id`
- `PATCH /admin/reports/:id`
- `PATCH /admin/users/:id/status`

## 8. Socket.IO Event Design

Namespace recommendation: single authenticated namespace with room-level authorization.

### Connection/auth
- `connection`
- `disconnect`
- `auth:error`
- `presence:update`

### Notifications
- server emits `notification:new`
- client emits `notification:read`

### Chat
- client emits `chat:join`
- server emits `chat:joined`
- client emits `chat:message:send`
- server emits `chat:message:new`
- client emits `chat:typing:start`
- client emits `chat:typing:stop`
- server emits `chat:typing:update`

### Match/request lifecycle
- server emits `match-request:new`
- server emits `match-request:updated`
- server emits `match:new`

### Session lifecycle
- client emits `session:join`
- server emits `session:state`
- server emits `session:updated`
- server emits `session:timer`

### Collaborative editor
- client emits `editor:join`
- client emits `editor:operation`
- server emits `editor:operation`
- server emits `editor:snapshot`
- server emits `editor:presence`

For V1, use ordered operation messages with version numbers. If conflicts become hard, move to CRDT/Yjs later.

### WebRTC signaling
- client emits `webrtc:join`
- client emits `webrtc:offer`
- client emits `webrtc:answer`
- client emits `webrtc:ice-candidate`
- server emits `webrtc:peer-joined`
- server emits `webrtc:peer-left`
- server relays `webrtc:offer`
- server relays `webrtc:answer`
- server relays `webrtc:ice-candidate`

## 9. Folder Structure

### Monorepo recommendation
Use a monorepo from day one.

```text
skillsync/
  apps/
    web/
      src/
        app/
        components/
        features/
        lib/
        hooks/
        styles/
    api/
      src/
        modules/
          auth/
          users/
          matching/
          match-requests/
          matches/
          chat/
          notifications/
          sessions/
          interview-room/
          reports/
          admin/
        lib/
        middleware/
        sockets/
        config/
        server.ts
  packages/
    shared/
      src/
        types/
        constants/
        schemas/
    ui/
      src/
    config/
      eslint/
      typescript/
  prisma/
    schema.prisma
    migrations/
  docs/
    architecture.md
    api-contracts.md
  .env.example
  package.json
  turbo.json
```

### Why monorepo
- Shared TypeScript types and validation schemas
- Easier coordinated development between frontend and backend
- Clean separation between app surfaces and shared packages

## 10. Authentication Flow

### Recommended auth model
- Google OAuth on frontend
- backend verifies Google token
- backend creates local user if first login
- backend issues secure app session

### Session strategy
Recommendation for web:
- short-lived access token
- long-lived refresh token in httpOnly secure cookie

Alternative:
- server-side session cookie

Preferred for this stack:
- JWT access token + refresh token cookie, if you want separate web/api deploys

### Login flow
1. User clicks `Continue with Google`.
2. Google returns auth credential.
3. Frontend sends credential to backend.
4. Backend verifies credential with Google.
5. Backend upserts local user.
6. Backend returns authenticated session.
7. If profile incomplete, frontend routes to onboarding.
8. Otherwise frontend routes to dashboard.

### Authorization rules
- Only authenticated users can access dashboard routes
- Only profile-complete users can search/send requests/schedule
- Only matched users can access their chat room
- Only session participants can access the interview room
- Only admins can access moderation APIs

## 11. OpenAI Integration

### Valid AI use cases in V1
- Profile summary generation from user-entered profile
- Match ranking among prefiltered candidates
- Match explanation generation
- Suggested interview topics based on both profiles

### Invalid AI use cases
- Raw SQL generation
- Access control decisions
- Session state transitions
- Moderation final decisions

### Backend AI module design
- `MatchingService` does DB filtering
- `AIService` formats safe candidate payload
- `AIService` returns structured JSON only
- `MatchingService` validates and merges results

### Input sent to OpenAI
Only send the minimum:
- request text
- current user structured profile
- filtered candidate structured summaries

Do not send:
- email
- raw chat history
- private reports
- sensitive internal metadata

### Reliability design
- Use strict JSON schema response parsing
- Set hard timeout
- Fallback to deterministic ranking if AI fails
- Log token usage and latency
- Cache repeated searches briefly if needed

## 12. WebRTC Architecture

### V1 topology
Use peer-to-peer WebRTC for two-person sessions.

### Required supporting infrastructure
- Socket.IO for signaling
- STUN servers for NAT discovery
- TURN servers for relay fallback

Important:
WebRTC without TURN will fail for a meaningful percentage of users. TURN is required for production readiness.

### Session join flow
1. User opens session room.
2. Backend verifies they belong to the session.
3. Frontend connects to Socket.IO and joins session room.
4. First participant waits.
5. Second participant joins.
6. Clients exchange SDP offer/answer.
7. Clients exchange ICE candidates.
8. Direct media connection is established, or TURN relay is used.

### Room components
- video/audio panel
- collaborative code editor
- timer synced by server
- private notes panel

### V1 limitations
- two participants only
- no recording
- no screen share unless explicitly added
- no observer mode

## 13. Security Concerns

### Authentication/security
- Verify Google tokens server-side only
- Store refresh tokens securely
- Use CSRF protection if cookie-based auth is used
- Enforce HTTPS everywhere
- Rotate secrets

### Authorization
- Validate room, chat, and session membership on every request and socket join
- Never trust client-provided user IDs

### Data protection
- Sanitize user bios and chat content
- Escape rendered content
- Rate-limit request creation, chat sends, and search
- Encrypt sensitive secrets

### Abuse prevention
- Block spammy match requests
- Prevent duplicate active requests
- Add report and block features
- Add audit logs for moderation actions

### AI security
- Never let prompts control DB queries
- Strip PII from AI prompts where unnecessary
- Validate AI output against schema

## 14. Scalability Concerns

### V1 should handle
- hundreds to low thousands of users
- low concurrent room count
- moderate socket load

### Likely bottlenecks later
- availability overlap queries
- match search performance
- socket fan-out
- collaborative editor conflict resolution
- TURN bandwidth costs

### Scale-ready recommendations
- add Redis for socket adapter and ephemeral presence state
- cache metadata/reference lists
- use background jobs for non-blocking notifications
- materialize search-friendly profile attributes if matching queries get heavy
- move collaborative editor to CRDT if multi-step conflicts increase

## 15. Development Order

Recommended implementation sequence:

1. Monorepo setup, shared tooling, CI basics
2. Prisma schema and PostgreSQL setup
3. Google auth and session management
4. Profile onboarding and discoverability
5. Reference data and availability management
6. Deterministic matching search
7. OpenAI ranking on filtered candidates
8. Match requests and acceptance flow
9. Private chat and notifications
10. Session scheduling
11. Interview room shell
12. WebRTC video calling
13. Collaborative editor
14. Notes/timer
15. Feedback/reporting
16. Admin moderation
17. Hardening, analytics, performance, accessibility

## 16. MVP Scope Recommendation

To ship faster, define V1 MVP as:
- Google login
- onboarding profile
- discoverability toggle
- availability
- AI-assisted match search
- request/accept/decline
- private chat
- scheduling
- interview room with video + timer + shared editor
- private feedback/reporting

Exclude from MVP:
- advanced admin dashboards
- screen sharing
- recording
- mobile apps
- complex recommendation history
- public portfolios beyond GitHub/LinkedIn links

## 17. Key Architectural Decisions To Approve

Please approve or change these before implementation:

1. Monorepo with `apps/web` and `apps/api`
2. Google OAuth as the only login method
3. PostgreSQL + Prisma as source of truth
4. Express backend for REST + Socket.IO
5. AI used only after deterministic DB filtering
6. Chat unlocked only after request acceptance
7. Weekly recurring availability slots in user timezone
8. Peer-to-peer WebRTC with TURN support
9. Private-only feedback and moderation data
10. Two-person interview sessions only in V1

## 18. Recommended Next Step

Before coding, the next best step is to confirm:
- missing product rules from section 2
- the 10 architectural decisions from section 17
- whether you want me to turn this into:
  - a formal PRD
  - an ER diagram + API contract doc
  - or begin implementation after your approval
