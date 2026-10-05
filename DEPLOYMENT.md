# twintell — Production Deployment Guide

This guide details the step-by-step procedure to deploy the **twintell** B2B social network and business directory into production.

---

## 1. Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │             End Users / Buyers         │
                      └───────────────────┬────────────────────┘
                                          │
                        HTTPS             │             HTTPS
               ┌──────────────────────────┴─────────────────────────┐
               ▼                                                    ▼
    ┌──────────────────────┐                             ┌──────────────────────┐
    │       Frontend       │                             │       Backend        │
    │     (Vercel CDN)     │                             │   (Render Web Svc)   │
    │  Next.js 15 App Rtr  │                             │  Express + Prisma    │
    └──────────┬───────────┘                             └──────────┬───────────┘
               │                                                    │
               │ Bearer JWT                                         │ Service Role / Pooler
               ▼                                                    ▼
    ┌───────────────────────────────────────────────────────────────────────────┐
    │                             Supabase Cloud                                │
    │  ├── Auth (OAuth / Email Passwords)                                       │
    │  ├── Postgres DB (PgBouncer Pooler :6543 / Direct :5432)                  │
    │  └── Storage (twintell-uploads bucket + RLS policies)                     │
    └───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Step 1: Supabase Configuration

### 2.1 Database & Connection Strings
1. In your Supabase Dashboard, navigate to **Project Settings > Database**.
2. Locate the **Connection string** tab:
   - **Transaction Pooler (Port 6543)**: Use this for `DATABASE_URL` in production (PgBouncer transaction mode).
     ```
     postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10
     ```
   - **Direct Connection (Port 5432)**: Use this for `DIRECT_URL` during migrations (`prisma migrate deploy`).
     ```
     postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
     ```

### 2.2 Run Migrations & Seed
From your local environment or deployment CI/CD runner:
```bash
cd backend
npx prisma db push
npm run prisma:seed
```

### 2.3 Storage Bucket Setup
1. In Supabase Dashboard, create a public bucket named `twintell-uploads` (or run [`backend/scripts/setup-storage.ts`](file:///c:/Users/patel/OneDrive/Desktop/twintell/backend/scripts/setup-storage.ts)).
2. Confirm RLS policies allow authenticated inserts and public reads.

### 2.4 Auth Redirect URLs
In **Authentication > URL Configuration**:
- **Site URL**: `https://your-twintell-frontend.vercel.app`
- **Redirect URLs**:
  - `https://your-twintell-frontend.vercel.app/**`
  - `http://localhost:3000/**` (for local development)

---

## 3. Step 2: Backend Deployment on Render

### Method A: Infrastructure as Code (Recommended)
1. In the Render Dashboard, click **New > Blueprint**.
2. Select your `twintell` GitHub repository.
3. Render will detect [`render.yaml`](file:///c:/Users/patel/OneDrive/Desktop/twintell/render.yaml) automatically.
4. Fill in the secret environment variables when prompted.

### Method B: Manual Web Service
1. Click **New > Web Service**.
2. Connect your Git repository.
3. Configure the settings:
   - **Name**: `twintell-api`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install --include=dev && npx prisma generate && npm run build`
   - **Start Command**: `npm run start`
   - **Health Check Path**: `/health`
4. Add the following **Environment Variables**:

| Variable | Description | Example / Value |
|---|---|---|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Listening port | `10000` |
| `DATABASE_URL` | Supabase Pooler URL | `postgresql://postgres.ref:pass@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10` |
| `DIRECT_URL` | Supabase Direct DB URL | `postgresql://postgres:pass@db.ref.supabase.co:5432/postgres` |
| `SUPABASE_URL` | Supabase Project URL | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin Secret Key | `sb_secret_...` |
| `FRONTEND_URL` | Production Frontend Origin | `https://your-twintell-frontend.vercel.app` |

---

## 4. Step 3: Frontend Deployment on Vercel

1. In the Vercel Dashboard, click **Add New > Project**.
2. Import the `twintell` repository.
3. In the project setup screen:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click "Edit" and choose `frontend`.
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
4. Add the following **Environment Variables**:

| Variable | Description | Example / Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project API URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Public Anon Key | `eyJhbGciOi...` |
| `NEXT_PUBLIC_API_URL` | Render Backend API URL | `https://twintell-api.onrender.com` |

5. Click **Deploy**. Vercel will build and deploy the Next.js App Router application to its global edge network.

---

## 5. Security & Production Checklist

- [x] **Strict CORS**: `backend/src/app.ts` only allows the configured `FRONTEND_URL` and preview deployments.
- [x] **Rate Limiting**: `express-rate-limit` throttles requests per IP (100 req/min for general API, stricter for sensitive endpoints).
- [x] **Security Headers**: `helmet` is enabled on the backend and comprehensive HTTP security headers are configured in [`frontend/vercel.json`](file:///c:/Users/patel/OneDrive/Desktop/twintell/frontend/vercel.json).
- [x] **Secret Isolation**: All `.env` and secret credentials are excluded in [`.gitignore`](file:///c:/Users/patel/OneDrive/Desktop/twintell/.gitignore). Only `.env.example` templates are tracked.
- [x] **Role Authorization**: `requireAuth` and `onlyCompany` strictly enforce that standard `USER` accounts can never post or create products, enforced directly in Express controllers and Prisma database constraints.

---

## 6. Verification Steps After Deployment

1. **Verify Backend Health**:
   ```bash
   curl -I https://twintell-api.onrender.com/health
   # Expected: HTTP/1.1 200 OK {"status":"ok","environment":"production",...}
   ```
2. **Verify Frontend**:
   - Open `https://your-twintell-frontend.vercel.app`.
   - Check that home feed loads trending posts.
   - Navigate to `/discover` and `/directory` to confirm API communication.
3. **Verify Auth & Role Flow**:
   - Create a new account or log in with Google OAuth.
   - Complete onboarding as a `COMPANY`.
   - Create a product listing and a post with an image upload.
   - Verify that the post and product appear in the feed and search results.
