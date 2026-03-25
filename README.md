# NextUp

This is a [Next.js](https://nextjs.org) project.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

## Deploy on Vercel (production domain)

The project is set up for **Vercel** and a **custom domain** once the env vars match your live URL.

### 1. Environment variables (Project → Settings → Environment Variables)

Set these for **Production** (and Preview if you use auth there too):

| Variable        | Value |
|----------------|--------|
| `DATABASE_URL` | Postgres connection string (e.g. Vercel Postgres, Neon, Supabase). Strip or avoid a trailing `?schema=…` if your host does not expect it—the app normalizes the connection when needed. |
| `AUTH_SECRET`  | Random secret; generate with `openssl rand -base64 32`. |
| `AUTH_URL`     | **Exact public URL** of the site, e.g. `https://your-domain.com` (no trailing slash). Use your **primary custom domain**, not only the `*.vercel.app` URL, so cookies and redirects stay consistent. |
| `ADMIN_EMAIL`  | The user email that should have admin API access. |

`NEXTAUTH_SECRET` / `NEXTAUTH_URL` work as aliases for `AUTH_SECRET` / `AUTH_URL` if you already use those names.

### 2. Custom domain (Project → Settings → Domains)

Add your domain, follow Vercel’s DNS instructions, and set **one deployment URL** as primary. Set `AUTH_URL` to that same **https** origin.

### 3. Database

Use a hosted Postgres reachable from Vercel (connection string in `DATABASE_URL`). Run your schema/migrations against that database before relying on login or ideas in production.

Auth is configured with `trustHost: true` so session and callbacks work behind Vercel’s proxy and on your custom domain.

### 4. Redeploy

After changing env vars, trigger **Redeploy** so the new values are picked up.

Copy from example: `cp .env.example .env.local` and fill values for local development.
