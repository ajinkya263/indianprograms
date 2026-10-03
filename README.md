# IndianPrograms — Indian Cultural Events Across America

A platform for discovering and publishing Indian cultural events across the United States. Built with Next.js 14, Supabase, TypeScript, and Tailwind CSS.

## Features

- **Browse Events**: Search, filter by city (15 cities), category (10 types), and price (Free/Paid)
- **10 Event Categories**: Festival, Dance, Vocal, Instrumental, Movies, Competition, Stand-up, Workshop, Play, Poetry
- **Publisher Accounts**: Register as a publisher, submit events (moderated), manage your events
- **Admin Panel**: Approve/reject events, manage publishers (suspend/reinstate)
- **Short URLs**: Each event gets a short URL format `/e/xxxxxxx`
- **QR Codes**: Auto-generated QR codes for each event
- **Publisher Profiles**: Public profile pages at `/p/your-slug`

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **Icons**: Lucide React

## Getting Started

### 1. Clone and Install

```bash
cd icatuac
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste the contents of `supabase-schema.sql`, then run it
3. Go to **Settings > API** and copy your project URL and anon key

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Configure Supabase Auth

In your Supabase dashboard:

1. Go to **Authentication > URL Configuration**
2. Set **Site URL** to `http://localhost:3000`
3. Add `http://localhost:3000/auth/callback` to **Redirect URLs**
4. Under **Auth Providers**, ensure **Email** is enabled

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Create an Admin User

1. Register a new account at `/register`
2. Confirm your email
3. In Supabase dashboard, go to **Table Editor > profiles**
4. Find your user and change the `role` column from `publisher` to `admin`

## Deployment (Vercel)

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add these environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (set to your production URL, e.g. `https://indianprograms.com`)
4. Deploy

### Custom Domain

In Vercel, go to **Settings > Domains** and add your domain (e.g., `indianprograms.com`). Update `NEXT_PUBLIC_SITE_URL` to match.

Update Supabase auth settings:
- **Site URL**: `https://indianprograms.com`
- **Redirect URLs**: add `https://indianprograms.com/auth/callback`

## Project Structure

```
src/
  app/
    page.tsx              # Homepage with search, filters, event grid
    layout.tsx            # Root layout with fonts and theme
    login/page.tsx        # Login page
    register/page.tsx     # Publisher registration
    settings/page.tsx     # Profile settings
    dashboard/page.tsx    # Publisher dashboard (submit/manage events)
    admin/page.tsx        # Admin panel (approvals, publishers)
    e/[shortId]/page.tsx  # Event detail page
    p/[slug]/page.tsx     # Publisher public profile
    auth/callback/route.ts # Supabase auth callback
  components/
    Navbar.tsx            # Navigation bar with auth
    Footer.tsx            # Site footer
    EventCard.tsx         # Event card for grid display
    CategoryPills.tsx     # Category filter pills
    CityTabs.tsx          # City filter tabs
    QRCode.tsx            # QR code SVG generator
    EventDetailClient.tsx # Client-side event detail interactions
  lib/
    constants.ts          # Cities, categories, helpers
    types.ts              # TypeScript interfaces
    supabase/
      client.ts           # Browser Supabase client
      server.ts           # Server Supabase client
      middleware.ts        # Middleware session handler
  middleware.ts           # Next.js middleware for auth sessions
supabase-schema.sql       # Database schema (paste into Supabase SQL Editor)
```

## User Roles

| Role | Capabilities |
|------|-------------|
| **Visitor** | Browse and search published events |
| **Publisher** | Submit events (pending approval), manage own events, public profile |
| **Admin** | Approve/reject events, manage publishers, view all events |
