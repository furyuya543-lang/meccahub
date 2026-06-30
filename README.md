# MecchaChameleonHub

Community ranking website for **Meccha Chameleon** — discover, share, and vote on the best hides.

## Tech Stack

- **Next.js 14** (App Router)
- **Supabase** — database, auth helper, file storage
- **Tailwind CSS** — dark gaming aesthetic
- **next-auth** — Steam OpenID login
- **Netlify** — deployment via `@netlify/plugin-nextjs`

---

## Project Structure

```
meccahub/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── browse/page.tsx             # Browse & filter hides
│   ├── submit/page.tsx             # Submit a hide
│   ├── rankings/page.tsx           # Weekly & all-time rankings
│   ├── profile/[userId]/page.tsx   # Player profile
│   ├── hide/[hideId]/page.tsx      # Individual hide detail
│   └── api/                        # API routes
├── components/                     # Shared UI components
├── lib/                            # Supabase client, auth config, Steam provider
├── types/                          # TypeScript types
└── supabase/schema.sql             # Full DB schema with RLS + RPC functions
```

---

## Setup

### 1. Clone & install

```bash
git clone <repo>
cd meccahub
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In **SQL Editor**, paste and run the contents of `supabase/schema.sql`.
3. Go to **Storage → New bucket**, create a bucket named `screenshots`, and enable **Public** access.

### 3. Get a Steam API key

Register at [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey).

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random 32+ char string>
STEAM_API_KEY=<your steam api key>
```

Generate a secret:
```bash
openssl rand -base64 32
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Steam Auth Notes

Steam uses **OpenID 2.0**, not OAuth 2.0. The custom provider in `lib/steam-provider.ts` handles:

1. Redirecting to `https://steamcommunity.com/openid/login`
2. Verifying the signed assertion on callback
3. Fetching user data from the Steam Web API

`NEXTAUTH_URL` **must** match the exact URL Steam redirects back to (including protocol). For local development use `http://localhost:3000`. For production use your Netlify URL.

---

## Deploying to Netlify

1. Push to GitHub.
2. Create a new Netlify site from your repo.
3. Set all environment variables from `.env.local` in Netlify → Site settings → Environment variables. Set `NEXTAUTH_URL` to your Netlify domain (e.g. `https://meccahub.netlify.app`).
4. Netlify auto-detects `netlify.toml` and installs `@netlify/plugin-nextjs`.

---

## Adding Maps

Maps are defined in `types/index.ts`:

```ts
export const MAPS = ['Map 1', 'Map 2', 'Map 3'] as const;
```

Add new map names to this array and they will appear everywhere (submit form, browse filters, etc.).

---

## Weekly Rankings Reset

Rankings are not deleted — they are calculated dynamically based on `hides.created_at` filtered to the current ISO week (Monday → Sunday). No cron job needed.

**Hide of the Week** is manually awarded by inserting a row into the `awards` table. You can do this from the Supabase dashboard.

---

## Database Tables

| Table | Description |
|-------|-------------|
| `users` | Steam users (created on first login) |
| `hides` | Submitted hide spots |
| `votes` | One vote per user per hide per day |
| `comments` | Comments on hides |
| `awards` | Weekly awards assigned manually |

---

## License

MIT
