# MeccaHub

Community ranking website for **Meccha Chameleon** — submit your best hides, vote on favorites, and compete for weekly rankings.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (PostgreSQL database, auth helper, storage)
- **Tailwind CSS** (dark gaming theme)
- **NextAuth v4** (Steam OpenID login)
- **Netlify** (deployment with `@netlify/plugin-nextjs`)

---

## Setup Instructions

### 1. Clone and install

```bash
git clone <your-repo-url>
cd meccahub
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the values:

| Variable | How to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (service_role key) |
| `NEXTAUTH_URL` | `http://localhost:3000` (dev) or your Netlify URL (prod) |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `STEAM_API_KEY` | https://steamcommunity.com/dev/apikey |

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Storage** → create a bucket called `screenshots` → set it to **Public**

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploying to Netlify

### 1. Install Netlify plugin

```bash
npm install @netlify/plugin-nextjs --save-dev
```

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

### 3. Connect to Netlify

1. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
2. Select your GitHub repo
3. Build settings are auto-detected from `netlify.toml`
4. Go to **Site settings → Environment variables** and add all variables from `.env.example`
5. Set `NEXTAUTH_URL` to your Netlify site URL (e.g. `https://meccahub.netlify.app`)
6. Deploy!

---

## Database Tables

| Table | Description |
|---|---|
| `users` | Steam users (steam_id, username, avatar, profile URL, reputation) |
| `hides` | Submitted hiding spots (title, map, difficulty, category, screenshot, votes) |
| `votes` | Vote records (one per user per hide per day) |
| `comments` | Comments on hides |
| `awards` | Weekly awards (Hide of the Week, etc.) |

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — Hide of the Week, top 5 weekly, recent submissions |
| `/browse` | Searchable/filterable hide database |
| `/submit` | Submit a new hide (requires Steam login) |
| `/rankings` | Weekly + all-time rankings for hides and players |
| `/profile/[steamId]` | Player profile — hides, votes earned, awards |
| `/hide/[id]` | Individual hide — details, voting, comments |

---

## Features

- **Steam OpenID login** — stores only public data (SteamID, username, avatar)
- **Upvote system** — one vote per user per hide per day
- **Weekly rankings** — reset every Monday
- **Search & filter** — by map, difficulty, category, sort order
- **Comments** — on each hide page
- **Categories**: Best Hide, Best Camouflage, Funniest Hide, Best Beginner Hide, Impossible Hide
- **Difficulties**: Easy, Medium, Hard, Impossible
- **Maps**: Map 1, Map 2, Map 3 (configurable in `lib/utils.ts`)

---

## Customizing Maps

Edit `lib/utils.ts`:

```ts
export const MAPS = ['Map 1', 'Map 2', 'Map 3'] as const
```

Replace with your actual map names and rebuild.

---

## License

MIT
