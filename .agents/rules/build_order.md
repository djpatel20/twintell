# Build Order & Checkpoint Rules

## Mandatory Checkpoint Rules
1. Build feature by feature (vertical slices) in the exact order below.
2. Before writing code for any step:
   - Announce the plan.
   - List all files that will be created or modified.
3. STOP immediately after completing each step.
4. Explain clearly how to test and verify the step.
5. Wait for the user to explicitly say "continue" before starting the next step.

---

## The 7 Vertical Slices

1. **Step 1: Foundation (COMPLETED)**
   - Monorepo structure, Express backend skeleton, Prisma setup, seed script, Next.js frontend skeleton, Tailwind design tokens, responsive layout shell, base UI components.
2. **Step 2: Auth**
   - Supabase client on frontend, login/signup screens (Google, LinkedIn, email/password), `requireAuth` / `optionalAuth` / `onlyCompany` middleware, `/me`, onboarding API and screen, route protection.
3. **Step 3: Feed**
   - Posts, likes, comments APIs + `checkPostLimit`; Home Feed and Create Post screens; signed upload URL endpoint.
4. **Step 4: Companies**
   - Companies, follow, directory APIs; Company Profile and Business Directory screens; edit company profile.
5. **Step 5: Products**
   - Products APIs + `checkProductLimit`; Product Page and Add/Edit Product screens; inquiries.
6. **Step 6: Discovery**
   - Search API, Search Results, Discover, My Profile.
7. **Step 7: Deployment Readiness**
   - README (local setup, Supabase setup, OAuth setup), Render config for backend, Vercel config for frontend, final security review checklist.
