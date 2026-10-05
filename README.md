# twintell 🌐

> **B2B Social Network & Business Directory Platform (Phase 1 / POC)**

twintell connects manufacturers, suppliers, and B2B buyers in a unified professional ecosystem. Companies share updates, list wholesale product catalogues, and receive quotation inquiries, while verified buyers discover suppliers, browse products, and follow industry leaders.

---

## 🚀 Key Features & Capabilities

### 👥 Role-Based Access Matrix
- **Standard User (`USER`)**: Browse feeds, explore companies & product catalogues, search across the directory, like & comment on posts, follow verified suppliers, and submit quotation inquiries via **Contact Supplier**.
- **Company Account (`COMPANY`)**: Everything a standard user can do, plus: publish business updates (with photo attachments), manage a dedicated Company Profile, list products in a wholesale catalog, and manage prospective buyer inquiries in a private dashboard.
- *Strict Security*: Enforced at both API controller and database levels (`onlyCompany` middleware). Standard users are strictly prevented from posting or listing products.

### 📰 Dynamic Business Feed
- Filter updates by **Trending**, **Recent**, or **Following**.
- Filter by industry topics (*Manufacturing*, *Textiles*, *Packaging*, *Electronics*, *Wholesale*, etc.).
- Cloud-hosted image uploads via signed Supabase Storage URLs.
- Optimistic likes, instant comments, and shareable post links.

### 🏢 Business Directory & Verified Profiles
- Search companies by sector, city, state, or keywords.
- Company profiles with cover banners, company overview, follower counts, product showcases, and recent activity.
- Follow / Unfollow suppliers with instant feed integration.

### 📦 Product Catalogues & Buyer Inquiries
- Complete product listing with images, pricing, unit specifications, minimum order quantity (MOQ), and material specifications.
- **Contact Supplier**: Contextual buyer inquiry modal linking prospective inquiries directly to specific products and notifying the company.

### 🔍 Discovery Hub & Multi-Entity Search
- Unified search engine indexing companies, catalog products, and business posts.
- Industry Sector discovery cards with direct category navigation.
- Trending verified suppliers showcase.

---

## 🛠️ Technology Stack

```
twintell/
├── backend/                  # Express REST API (Modular Monolith)
│   ├── prisma/               # Prisma ORM schema & seed script
│   └── src/
│       ├── config/           # Environment validation (Zod)
│       ├── lib/              # Prisma client, Supabase client, Pino logger
│       ├── middleware/       # Auth, RateLimiter, ErrorHandler, Role Guards
│       └── modules/          # Auth, Feed, Posts, Companies, Products, Inquiries, Search, Uploads
├── frontend/                 # Next.js 15 App Router Frontend
│   └── src/
│       ├── app/              # App Router pages (Feed, Discover, Directory, Profile, Search, etc.)
│       ├── components/       # Reusable UI primitives, Layout, and Feature modules
│       ├── context/          # Supabase Auth Context
│       └── lib/              # API Client (Bearer token injection) & Query Client
├── DEPLOYMENT.md             # Production deployment manual (Render + Vercel + Supabase)
├── render.yaml               # Render Infrastructure-as-Code blueprint
└── frontend/vercel.json      # Vercel deployment configuration & security headers
```

---

## 🏁 Getting Started Locally

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Supabase Account**: Free project for PostgreSQL, Auth, and Storage

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/twintell.git
cd twintell

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 3. Environment Variables Configuration

#### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and update values:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"
DIRECT_URL="postgresql://postgres:[PASS]@db.[REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
FRONTEND_URL="http://localhost:3000"
```

#### Frontend (`frontend/.env.local`)
Copy `frontend/.env.example` to `frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

### 4. Database Setup & Seeding
```bash
cd backend
# Push schema to database
npx prisma db push

# Seed categories, plans, test companies, posts, and products
npm run prisma:seed

# Configure Supabase Storage bucket & policies
npx ts-node scripts/setup-storage.ts
```

### 5. Run the Application
In one terminal (Backend):
```bash
cd backend
npm run dev
# Server running at http://localhost:5000 (Health check: http://localhost:5000/health)
```

In a second terminal (Frontend):
```bash
cd frontend
npm run dev
# Frontend running at http://localhost:3000
```

---

## 🧪 Testing & Verification

- **Backend TypeScript Compilation**:
  ```bash
  cd backend && npx tsc --noEmit
  ```
- **Frontend TypeScript & Production Build**:
  ```bash
  cd frontend && npm run build
  ```
- **API Health Check**:
  ```bash
  curl http://localhost:5000/health
  ```

---

## 🚢 Production Deployment

Detailed deployment guides are available in [DEPLOYMENT.md](./DEPLOYMENT.md):
- **Backend API**: Deployed to [Render](https://render.com) using [`render.yaml`](./render.yaml).
- **Frontend App**: Deployed to [Vercel](https://vercel.com) using [`frontend/vercel.json`](./frontend/vercel.json).
- **Database & Storage**: Managed on [Supabase](https://supabase.com).

---

## 📜 License
This project is licensed under the MIT License.
