# twintell — AI Agent Operating Instructions & Context

This document provides complete instructions, architecture, rules, and context for any AI coding assistant working on **twintell**.

---

## 1. Project Overview

**twintell** is a B2B Social Network + Business Directory (Phase 1 / POC) where companies share business updates and list products, while standard users browse companies, products, and posts.

### Roles & Access Matrix
| Role | Capabilities | Restrictions |
|---|---|---|
| **USER** (Standard User) | Browse feed, products, companies, directory, search. Like, comment, follow companies, send inquiries ("Contact Supplier"). Edit own user profile. | **NEVER** create, edit, or delete posts or products. |
| **COMPANY** | Everything a USER can, plus: create/edit/delete its **OWN** posts and products, edit company profile, view received inquiries. | Can only edit/delete posts and products belonging to its own company. Subject to subscription plan limits. |

> **CRITICAL RULE**: A `USER` can **NEVER** create posts or products. This MUST be enforced on the **BACKEND** (via `onlyCompany` middleware and database relations), not just hidden in the frontend UI.

---

## 2. Working Methodology & Protocols

When developing features for this project, you must strictly follow this protocol:
1. **Vertical Slice Development**: Build feature-by-feature in the exact sequence outlined in the [Build Order](#6-build-order).
2. **Pre-Step Plan Announcement**: Before writing code for any step, announce the plan and list the exact files that will be created or modified.
3. **Mandatory Checkpoint & STOP**:
   - **STOP** immediately after completing each step.
   - Explain clearly how to test and verify the step.
   - Wait for the user to explicitly say **"continue"** before writing code for the next step.
4. **No Shortcuts**: Never skip validation (Zod), authorization checks, or structured error handling to save time.

---

## 3. Technology Stack & Architecture

### Monorepo Structure
- `/backend`: Express + TypeScript + Prisma ORM + Pino + Zod
- `/frontend`: Next.js (App Router) + TypeScript + Tailwind CSS + TanStack Query + Supabase JS

```
twintell/
├── AGENTS.md                   # This instruction file
├── ARCHITECTURE.md             # In-depth architectural patterns & diagrams
├── API_SPEC.md                 # REST API endpoints & payload contracts
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Single source of truth for DB schema
│   │   └── seed.ts             # Categories, plans, sample companies, products, posts
│   ├── src/
│   │   ├── config/             # Zod-validated environment config
│   │   ├── lib/                # Prisma client, Supabase admin client, Pino logger
│   │   ├── middleware/         # requireAuth, optionalAuth, onlyCompany, errorHandler, rateLimiter
│   │   ├── modules/            # Feature modules (auth, posts, companies, products, inquiries, search, uploads, subscriptions)
│   │   ├── app.ts              # Express application assembly
│   │   └── server.ts           # Server entrypoint
├── frontend/
│   └── src/
│       ├── app/                # Next.js App Router pages & layouts
│       ├── components/         # Base UI primitives & feature components
│       ├── lib/                # Supabase client, API client (Bearer auth), Query client
│       ├── hooks/              # Custom React hooks
│       └── types/              # Shared TypeScript definitions
```

### Modular Monolith Guidelines (Backend)
Every module inside `backend/src/modules/<feature>/` should contain:
- `*.routes.ts`: Express router definitions.
- `*.controller.ts`: Thin HTTP controllers (request parsing, response dispatching).
- `*.service.ts`: Business logic, Prisma queries, and data mutations.
- `*.schema.ts`: Zod validation schemas for request body, query parameters, and route params.

---

## 4. Auth & Role Architecture

1. **Authentication Provider**: Supabase Auth (Google OAuth, LinkedIn OIDC, Email/Password).
2. **Frontend Token Handling**:
   - Central API client [`frontend/src/lib/api-client.ts`](file:///C:/Users/patel/.gemini/antigravity-ide/scratch/twintell/frontend/src/lib/api-client.ts) retrieves Supabase access token via `supabase.auth.getSession()` and injects it into every request: `Authorization: Bearer <token>`.
3. **Backend Middleware**:
   - `requireAuth`: Verifies token via `supabase.auth.getUser(token)`, loads user from `User` table in Prisma, sets `req.user`. Returns 401 if invalid.
   - `optionalAuth`: Does the same if token is present, but allows anonymous requests (sets `req.user = null`). Used on public routes to evaluate `isLiked` or `isFollowing`.
   - `onlyCompany`: Rejects with 403 `FORBIDDEN` if `req.user.role !== 'COMPANY'`.
4. **Onboarding Flow**:
   - First login creates `User` row with `role: null`.
   - If `role === null`, frontend redirects to `/onboarding`.
   - User chooses "USER" or "COMPANY":
     - `USER`: role set to `USER`.
     - `COMPANY`: fills company profile details. In a **single Prisma transaction**, creates `Company` row, creates `Subscription` with `FREE` plan, and sets user role to `COMPANY`.
   - Role is **immutable** once selected.

---

## 5. Performance & Data Rules

- **Cursor Pagination Everywhere**:
  - All paginated endpoints must use cursor pagination (`createdAt` + `id` tiebreaker), 15 items per page.
  - Never use offset pagination (`skip/take`). Never return unbounded arrays.
- **Prevent N+1 Queries**:
  - Fetch posts and related company in **one** query with `select`.
  - Fetch user's likes for the batch in **one** query (`postId: { in: postIds }`) and merge in-memory as `isLiked`.
  - Same pattern for `isFollowing`.
- **Stored Counters & Atomicity**:
  - Always update counters (`likeCount`, `commentCount`, `followerCount`) inside a Prisma transaction with the underlying row.
  - Likes and follows must be idempotent.
- **TanStack Query Caching**:
  - Use `useInfiniteQuery` for lists with `staleTime: 60000` (60s).
  - Use optimistic UI updates for likes and follows.

---

## 6. Build Order

- [x] **Step 1: Foundation**: Monorepo, backend skeleton (Express, config, Prisma, logger, error handler, `/health`), seed script, frontend skeleton (Next.js, Tailwind, design tokens, layout shell, base UI components).
- [ ] **Step 2: Auth**: Supabase client on frontend, login/signup screens, `requireAuth` / `optionalAuth` / `onlyCompany` middleware, `/me`, onboarding API & screen, route protection.
- [ ] **Step 3: Feed**: Posts, likes, comments APIs + `checkPostLimit`; Home Feed & Create Post screens; signed upload URL endpoint.
- [ ] **Step 4: Companies**: Companies, follow, directory APIs; Company Profile & Business Directory screens; edit company profile.
- [ ] **Step 5: Products**: Products APIs + `checkProductLimit`; Product Page & Add/Edit Product screens; inquiries.
- [ ] **Step 6: Discovery**: Search API (ILIKE), Search Results screen, Discover screen, My Profile screen.
- [ ] **Step 7: Deployment Readiness**: Production deployment configurations (Render for backend, Vercel for frontend), security audit, documentation.

---

## 7. Design System & Aesthetics

- **Primary Color**: `#1A5CFF` (Hover: `#0043F0`, Light tint: `#EEF4FF`)
- **Background**: Light/slate `#F8FAFC`, card background `#FFFFFF`
- **Border Radius**: Cards `14px-16px`, buttons `10px-12px`, pill chips `9999px`
- **Typography**: Inter (Google Fonts)
- **Responsive Layout**:
  - Desktop (`≥ 1024px`): Left navigation sidebar (width 256px), centered feed column (max 680px), right trending sidebar (width 320px).
  - Mobile (`< 1024px`): Sticky top navbar + bottom navigation bar (Home, Discover, center `+`, Directory, Profile).
  - **Center `+` Button**: Displayed on mobile navigation **ONLY** for `COMPANY` users.
