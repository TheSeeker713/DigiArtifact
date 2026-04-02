# KAIA (Keep At It, Always)

KAIA is a **multi-user home-operations and momentum app** built for consistent execution, not generic note taking.
It combines a structured household checklist with routines, coaching prompts, and lightweight gamification so users can convert "overwhelm" into visible daily progress.

This project lives in the DigiArtifact monorepo as `kaia/` and runs on Next.js with Cloudflare D1 through OpenNext.

## True Purpose of This Sub-App

KAIA exists to help users:

- turn home maintenance into a repeatable system (lists, sections, and checkoffs),
- maintain momentum through small wins (XP, level, momentum, routine starts),
- reduce decision friction with coaching prompts and personalization suggestions,
- support account-based usage with per-user data ownership,
- stay synchronized when list data changes (collab event stream + polling).

In practical terms, this is a **household execution dashboard** with behavior-shaping feedback loops.

## What KAIA Currently Includes

### 1) Authenticated workspace

- Email/password sign up and sign in.
- Secure HTTP-only session cookie (`kaia_session`) with server-side session table.
- Per-user bootstrap on first login:
  - creates a personal "Home Checklist" list,
  - seeds starter checklist items from archive set (`seed_v1`),
  - creates and links a starter routine,
  - initializes gamification state.

### 2) Checklist and list management

- Multiple lists per user.
- Create, rename, archive lists.
- CRUD item actions:
  - create,
  - edit label,
  - check/uncheck,
  - reorder,
  - soft delete.
- Default home checklist supports section-based organization:
  - Bathroom
  - Kitchen
  - Living Room
  - Main Bedroom

### 3) Routine engine

- Fetch active routines for the authenticated user.
- Create routines with ordered steps and step durations.
- Start routine runs and persist run history for daily progress views.

### 4) Gamification and daily progress

- Stores and serves user state:
  - XP
  - level
  - momentum
  - streak days
  - freeze tokens
- Awards XP events (for example on item completion).
- Calculates "today" counters:
  - total checklist items,
  - checked checklist items,
  - routines started today.

### 5) KAIA coach + personalization

- KAIA message endpoint with phase-aware responses:
  - pre-task
  - during-task
  - post-task
- Prompt/response logging in D1 (`kaia_messages`).
- Personalization endpoint:
  - detects highest-completion section,
  - suggests where to start for quickest win.

### 6) Collaboration + event telemetry

- List-scoped collab events are written for item/list mutations.
- Client polls collab events to refresh state in near real time.
- Analytics and gamification event ledgers are stored in D1.
- Collab event retention includes rolling cleanup.

## Technical Stack

- **Frontend:** Next.js App Router (`app/page.tsx`), React 19.
- **Backend:** Next.js route handlers under `app/api`.
- **Database:** Cloudflare D1 (`schema.sql`).
- **Runtime/deploy path:** OpenNext + Cloudflare Worker (`wrangler.toml`).
- **Current configured custom domain:** `kaia.digiartifact.com`.

## Data Model (High-level)

Core tables and intent:

- `app_users`, `app_sessions`: account identity + sessions.
- `todo_lists`, `todo_items`, `todo_list_members`: user-owned checklist and list membership.
- `routines`, `routine_steps`, `routine_runs`, `user_routines`, `user_routine_runs`: routine definitions and executions.
- `gamification_state`, `gamification_events`: progression state + XP event ledger.
- `kaia_messages`: coaching prompt/response history.
- `analytics_events`: product interaction telemetry.
- `collab_events`: mutation event stream for sync.
- `checklist_archive_sets`, `checklist_archive_items`: immutable source archive for bootstrap seeding.

## Local Development

```bash
cd kaia
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful commands:

```bash
npm run lint
npm run build
npm run cf:build
npm run preview
npm run db:local
```

Remote D1 schema apply (use with care):

```bash
npm run db:remote
```

Admin schedule migration + seed:

```bash
export KAIA_ADMIN_DIGI_PASSWORD="replace-with-temp-password"
export KAIA_ADMIN_PARTNER_PASSWORD="replace-with-temp-password"
npm run db:migrate:local
npm run seed:admins:local
```

Remote admin seed flow (CI or guarded operator session):

```bash
export KAIA_ADMIN_DIGI_PASSWORD="replace-with-temp-password"
export KAIA_ADMIN_PARTNER_PASSWORD="replace-with-temp-password"
npm run db:migrate:remote
npm run seed:admins:remote
```

## API Surface (Current)

- Auth:
  - `POST /api/auth/signup`
  - `POST /api/auth/signin`
  - `POST /api/auth/signout`
  - `GET /api/auth/me`
- Lists/items:
  - `GET|POST /api/lists`
  - `PATCH|DELETE /api/lists/:id`
  - `GET|POST /api/lists/:id/items`
  - `PATCH|DELETE /api/items/:id`
- Routines:
  - `GET|POST /api/routines`
  - `POST /api/routines/:id/start`
- Dashboard:
  - `GET /api/gamification`
  - `GET /api/progress/today`
  - `GET /api/progress/weekly`
  - `GET /api/personalization`
- Coach/collab:
  - `POST /api/kaia/message`
  - `GET /api/collab/:listId/events`

## Project Progress Log

This log reflects what has been implemented in the codebase and schema to date.

### Phase 0 - Original single-checklist baseline

- Initial `checklist_items` model and seeded home tasks.
- Room-based checklist workflow established.

### Phase 1 - Data durability and migration safety

- Added immutable archive seed (`checklist_archive_sets`, `checklist_archive_items`).
- Preserved source checklist for future user bootstrap and migrations.

### Phase 2 - Multi-user foundation

- Added `app_users` and `app_sessions`.
- Added tenant mapping tables (`todo_list_members`, `user_routines`, `user_routine_runs`).
- Enforced auth checks on API routes.
- Shifted behavior from shared checklist toward per-user workspaces.

### Phase A - Collaboration event stream

- Added `collab_events` store and indexing.
- Implemented publish/read path for list and item mutations.
- Added client polling loop for near-real-time updates.

### Phase B1 - Routine engine primitives

- Added routines, routine steps, and routine run persistence.
- Added user-routine ownership mappings.
- Added routine start flow in API and UI integration.

### Phase B2 - Gamification core

- Added gamification state and event ledger tables.
- Added XP/momentum updates on completion events.
- Exposed gamification state to dashboard cards.

### Phase B3 - KAIA coach service

- Added KAIA message endpoint with phase-aware guidance.
- Persisted prompt/response history to `kaia_messages`.

### Phase B4 - Analytics and personalization

- Added analytics event stream table and tracking calls.
- Added personalization endpoint to suggest highest-probability starting section.

### Product UX progress

- Added account gate and authenticated workspace shell.
- Added list management controls (create, rename, archive).
- Added routine cards, dashboard counters, and KAIA coach panel.
- Added voice input capability checks and transcript-to-input flow for supported browsers.

## Roadmap

### Near-term roadmap (next implementation window)

1. Weekly insights completion
   - Expand `GET /api/progress/weekly` into a richer summary:
     - completion trend by day,
     - routine consistency,
     - section-level throughput.
2. Routine completion lifecycle
   - Add explicit routine run completion endpoint and status transitions.
   - Surface completed/abandoned runs in UI.
3. Stronger multiplayer semantics
   - Add list invite/share model beyond owner-only default membership.
   - Add role controls (`owner`, `editor`, `viewer`) in UI + API checks.
4. Smarter coach responses
   - Add context-aware coach prompts using recent progress and active list state.
   - Add "next best action" recommendation endpoint.

### Mid-term roadmap

1. Real-time transport upgrade
   - Move from polling-first sync toward SSE/WebSocket-based delivery.
2. Reliability and observability
   - Add structured error reporting, route-level metrics, and dashboards.
3. Data quality hardening
   - Add stricter validation around list/routine naming and event payload schemas.
4. Offline-friendly UX
   - Queue local mutations and reconcile on reconnect.

### Product direction roadmap

1. Household operations intelligence
   - Predictive scheduling suggestions from completion history.
2. Deeper habit architecture
   - streak protection logic, milestone rewards, and adaptive momentum mechanics.
3. Multi-context expansion
   - support project/work checklists in parallel with home operations while preserving KAIA focus.

## Notes

- `kaia-schedule-app.jsx` remains as a historical/pattern reference from the earlier schedule-centric iteration.
- Current production code path is the Next.js app in `app/` backed by D1 and route handlers in `app/api/`.

## Admin Schedule Module

The private schedule dashboard is isolated from public KAIA routes.

- Admin UI routes: `/admin/*`
- Admin auth and data APIs: `/api/admin/*`
- Public auth/checklist routes remain under existing `/api/auth/*`, `/api/lists/*`, `/api/items/*`, etc.

### Auth model

- Admin cookie: `kaia-admin-session` (`HttpOnly`, `Secure`, `SameSite=Strict`)
- Admin users are seed-only (`digi`, `partner`) from `scripts/seed-admins.ts`
- First login requires password rotation (`must_change_password = 1`)
- Login rate limit: 5 attempts/minute per IP hash

### Shared schedule data model

- `schedule_daily`: daily check-ins + block completion flags
- `schedule_streak`: shared streak/xp/sprint state
- `schedule_chores`: shared Monday/Thursday/Friday chore boards
- `schedule_plan`: shared weekly top-3 + notes

### Real-time sync

- Polling endpoint: `GET /api/admin/sync`
- Client hooks poll every ~5 seconds and selectively refetch changed categories
