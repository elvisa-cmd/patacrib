# PataKrib — Kenya Real Estate (Next.js 14)

Find your home in Kenya. Built with Next.js 14 App Router, Supabase PostgreSQL, Prisma, and NextAuth.

---

## Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) account

---

## Setup — Step by Step

### Step 1 — Install dependencies

```bash
npm install
```

---

### Step 2 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Wait for the project to finish provisioning (~1 min).
3. Open **Settings → Database → Connection String** and copy the **URI** (not the pooler, unless you're on a serverless platform).
4. Open **Settings → API** and copy:
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **anon/public** key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role** key (`SUPABASE_SERVICE_ROLE_KEY`) — keep this secret
5. Create two **Storage buckets** (Storage → New bucket):
   - `property-images` — set to **Public**
   - `property-videos` — set to **Public**

Fill in `.env.local` with the values you just copied:

```env
NEXTAUTH_SECRET=any-long-random-string
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
```

---

### Step 3 — Generate Prisma client

```bash
npx prisma generate
```

This reads `prisma/schema.prisma` and generates type-safe DB client code into `node_modules/@prisma/client`.

---

### Step 4 — Push schema to Supabase

```bash
npx prisma db push
```

Creates all tables in your Supabase PostgreSQL database. Safe to re-run — it's idempotent in dev.

---

### Step 5 — Seed the database

```bash
npx prisma db seed
```

Creates:
- `admin@patacrib.co.ke` / `admin123` (ADMIN)
- `seeker@patacrib.co.ke` / `seeker123` (SEEKER)
- 6 sample properties across Westlands, Kilimani, South B, Karen, Lavington, Upperhill

You can verify the seed data in **Supabase Dashboard → Table Editor**.

---

### Step 6 — Start the dev server

```bash
npm run dev
```

---

### Step 7 — Open the app

```
http://localhost:3000
```

- Homepage → `/`
- Login → `/login`
- Signup → `/signup`
- Dashboard → `/dashboard` (requires auth)
- Browse → `/browse`
- Prisma Studio (DB GUI) → `npm run db:studio`

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/properties` | public | List/search properties |
| POST | `/api/properties` | ADMIN | Create property |
| GET | `/api/properties/:id` | public | Get property + track view |
| PATCH | `/api/properties/:id` | ADMIN (owner) | Update property |
| DELETE | `/api/properties/:id` | ADMIN (owner) | Delete property |
| POST | `/api/auth/signup` | public | Register new user |
| POST | `/api/upload` | any auth | Upload image/video |
| GET | `/api/route/calculate` | public | GPS distance calc |

### Search params for `GET /api/properties`

```
?q=westlands&city=Nairobi&estate=Kilimani
&minPrice=20000&maxPrice=60000
&propertyType=2br&bedrooms=2
&lat=-1.286&lng=36.817&maxDistance=5
```

### Distance API

```
GET /api/route/calculate?startLat=-1.286&startLon=36.817&endLat=-1.2641&endLon=36.8031
```

Returns `{ distanceKm, estimatedMinutes, startCoords, endCoords }`.

---

## Project Structure

```
patakrib/
├── app/
│   ├── (auth)/login/        # /login  — functional sign-in form
│   ├── (auth)/signup/       # /signup — functional registration form
│   ├── browse/              # /browse — placeholder
│   ├── property/[id]/       # /property/:id — placeholder
│   ├── dashboard/           # /dashboard — protected, session-aware
│   │   ├── add/             # /dashboard/add — placeholder
│   │   └── messages/        # /dashboard/messages — placeholder
│   ├── api/
│   │   ├── auth/[...nextauth]/  # NextAuth handler
│   │   ├── auth/signup/         # POST — register user
│   │   ├── properties/          # GET list, POST create
│   │   ├── properties/[id]/     # GET, PATCH, DELETE
│   │   ├── upload/              # POST — file or base64 upload
│   │   └── route/calculate/     # GET — GPS distance
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
├── lib/
│   ├── auth.ts         # NextAuth options
│   ├── db.ts           # Singleton Prisma client
│   ├── geo.ts          # calculateDistance, findNearbyProperties
│   ├── price.ts        # formatPrice
│   ├── upload.ts       # uploadToSupabase, uploadBase64Image
│   └── validations.ts  # Zod schemas for all inputs
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── types/
│   └── next-auth.d.ts  # Session type augmentation
├── middleware.ts        # Protects /dashboard routes
├── .env.local          # Fill in — never commit
└── .env.example        # Template with descriptions
```

---

## Troubleshooting

### `@prisma/client did not initialize yet`
Run `npx prisma generate` — the client is regenerated from the schema.

### `Environment variable not found: DATABASE_URL`
Make sure `.env.local` exists and `DATABASE_URL` is set. Restart `npm run dev` after editing env files.

### `prisma db push` fails with SSL error
Add `?sslmode=require` to the end of your `DATABASE_URL`:
```
DATABASE_URL=postgresql://...supabase.co:5432/postgres?sslmode=require
```

### `Error: Supabase env vars missing`
The upload endpoint needs `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

### Login always fails
1. Check that seed ran: `npx prisma db seed`
2. Verify the user exists in Supabase → Table Editor → `User` table
3. Confirm `NEXTAUTH_SECRET` is set in `.env.local`

### Port 3000 already in use
```bash
npm run dev -- -p 3001
```

---

## Design Tokens (Tailwind)

| Token | Value | Usage |
|-------|-------|-------|
| `accent` | `#c8f064` | CTAs, highlights |
| `ink` | `#0c0c0b` | Dark text on light bg |
| `surface` | `#131312` | Page background |
| `surface2` | `#1a1a18` | Cards, inputs |
| `gold` | `#e8a020` | Premium badges |
| `blue` | `#3b7fff` | Links, info |
| `green` | `#52b788` | Available status |
| `red` | `#ff4d4d` | Errors, taken status |

Fonts: **Archivo** (body) · **Libre Baskerville** (headings)
