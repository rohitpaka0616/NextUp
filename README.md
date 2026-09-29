<p align="center">
  <img src="docs/brand/readme-banner.png" alt="NextUp — Vote for What Gets Built" width="720" />
</p>

<p align="center">
  <strong>A community product board for pitching software ideas, voting on priorities, and tracking what ships.</strong>
</p>

<p align="center">
  Pitch → Vote → Build → Ship
</p>

<p align="center">
  <a href="https://next-up-gamma.vercel.app">Live site</a>
  ·
  <a href=".env.example">Env example</a>
  ·
  <a href="docs/brand/">Brand assets</a>
</p>

---

## What is NextUp?

NextUp is where builders and users propose software ideas, debate them in the open, and use votes to decide what deserves attention. Instead of a private backlog, everyone can see what is rising, comment, volunteer to help, and follow ideas as they move from concept to reality.

| Step | What happens |
|------|----------------|
| **Pitch ideas** | Share software or product concepts — the problem, who it helps, and why now. |
| **Vote together** | The community upvotes what matters. Rankings stay public. |
| **Build what wins** | Ideas move **Open → Building → Shipped** so momentum is visible, not just hype. |

Site copy and SEO metadata use the same positioning: **“NextUp — Vote for What Gets Built.”**

## Features

- **Ideas board** — submit, browse, filter, and upvote community ideas
- **Status tracking** — Open / Building / Shipped with public status badges
- **Comments & discussion** — threaded feedback on ideas and a community hub
- **Contributor interest** — mark yourself open to help on ideas gaining traction
- **Auth** — email/password plus optional Google OAuth (Auth.js / NextAuth v5)
- **Profiles & notifications** — public profiles, voting history, in-app alerts
- **AI assist** — optional OpenAI-compatible idea drafting
- **Moderation** — optional LocalMod toxicity/NSFW checks on create/update/comment
- **Admin reports** — review and resolve reported content
- **GitHub provisioning** — optional org repo creation from a winning idea

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **PostgreSQL** + `pg`
- **Auth.js** (`next-auth` v5) with `@auth/pg-adapter`
- Optional: **Docker Compose** (Postgres + LocalMod + app), **Nodemailer**, OpenAI-compatible API

## Quick start

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Configure environment

Fill in at least:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | Canonical site URL, e.g. `http://localhost:3000` (no trailing slash) |
| `ADMIN_EMAIL` | Account email with admin API access |

Optional: `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`, `OPENAI_API_KEY`, `LOCALMOD_URL`, `GITHUB_ORG_TOKEN` / `GITHUB_ORG_NAME`. See [`.env.example`](.env.example) for the full list.

`NEXTAUTH_SECRET` / `NEXTAUTH_URL` are accepted as aliases for `AUTH_SECRET` / `AUTH_URL`.

### 3. Database

Start Postgres (local or Docker), then apply the schema:

```bash
# Example: Docker Postgres from this repo
docker compose up -d db

# Apply schema (adjust connection to match DATABASE_URL)
psql "$DATABASE_URL" -f schema.sql
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker

Full stack (app + Postgres + LocalMod):

```bash
docker compose up --build
```

App listens on **3000**, Postgres on **5433** (host), LocalMod on **8000**.

## Deploy on Vercel

1. **Environment variables** (Project → Settings → Environment Variables) for Production (and Preview if you use auth there):

   | Variable | Notes |
   |----------|--------|
   | `DATABASE_URL` | Hosted Postgres (Neon, Supabase, Vercel Postgres, etc.). Avoid a trailing `?schema=…` if your host does not expect it. |
   | `AUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
   | `AUTH_URL` | Exact public `https` origin of the **primary** custom domain (no trailing slash) |
   | `ADMIN_EMAIL` | Admin user email |

2. **Custom domain** — add the domain in Vercel, set one URL as primary, and keep `AUTH_URL` in sync.

3. **Database** — run `schema.sql` (or migrations) against the production database before relying on login or ideas.

4. **Redeploy** after changing env vars.

Auth uses `trustHost: true` so sessions and callbacks work behind Vercel’s proxy and on your custom domain.

For Google OAuth, set the authorized redirect URI to:

```text
{AUTH_URL}/api/auth/callback/google
```

## Project layout

```text
src/app/          # App Router pages & API routes
src/components/   # UI (landing, board, auth, admin)
src/lib/          # db, auth, moderation, GitHub helpers
public/           # static assets (favicon, etc.)
docs/brand/       # README / marketing brand assets
schema.sql        # Postgres schema
docker-compose.yml
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm run lint` | ESLint |

## Brand assets

README and marketing assets live in [`docs/brand/`](docs/brand/). Site UI logos used by the app are in [`src/app/logos/`](src/app/logos/).
