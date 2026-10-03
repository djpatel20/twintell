# Product Rules & Behavioral Guidelines

## 1. Roles & Authorization
- There are two roles in the platform: `USER` and `COMPANY`.
- A `USER` can NEVER create or edit posts or products.
- Authorization must be enforced on the BACKEND using `onlyCompany` middleware and database relations. Never rely only on client-side button hiding.
- For post/product editing and deletion, backend services must verify ownership: the item being modified must belong to `req.user.company.id`.
- Onboarding role selection is permanent and cannot be modified by the user afterwards.

## 2. Data Integrity & Transactions
- Company onboarding: Create `Company` row and `Subscription` (to `FREE` plan) in the SAME Prisma transaction when updating `User.role = 'COMPANY'`.
- Likes & Follows: Update stored counters (`likeCount`, `followerCount`) inside the same Prisma transaction. Make actions idempotent (prevent duplicate likes or negative counts).

## 3. Query Performance
- Cursor pagination everywhere (15 items per page). Do not use `skip`/`take` offsets.
- Prevent N+1 queries by fetching relationships in batch (e.g. `postId: { in: [...] }` to fetch likes) and merging in memory.
- Use Prisma `select` clauses to fetch only fields needed by the UI.
