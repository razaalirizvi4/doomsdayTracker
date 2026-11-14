# Doomsday Tracker

Monitors [CUE Cinemas](https://cuecinemas.com/Browsing/Movies/Details/f-F000001483) for Avengers: Doomsday showtime availability and emails subscribers the moment sessions go live.

## Stack

- **Next.js 15** App Router (SSR, deployable on Vercel)
- **Vercel KV** (Redis) for subscriber storage
- **Resend** for transactional email
- **Cheerio** for HTML scraping
- **Vercel Cron** for checking every 15 minutes

## Setup

### 1. Clone & install

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in:
- `RESEND_API_KEY` — from [resend.com/api-keys](https://resend.com/api-keys)
- `FROM_EMAIL` — must be from a [Resend-verified domain](https://resend.com/docs/dashboard/domains/introduction)
- `CRON_SECRET` — any random string (e.g. `openssl rand -hex 32`)
- `UNSUBSCRIBE_SECRET` — any random string
- `NEXT_PUBLIC_BASE_URL` — your deployed URL (e.g. `https://doomsday-tracker.vercel.app`)

Vercel KV variables (`KV_URL`, `KV_REST_API_URL`, etc.) are auto-injected when you link a KV store in the Vercel dashboard.

### 3. Run locally

```bash
npm run dev
```

**Note:** KV won't work locally without the Vercel KV env vars. You can use the Vercel CLI (`vercel dev`) to pull them automatically.

### 4. Deploy to Vercel

```bash
npx vercel
```

Then in the Vercel dashboard:
1. Go to **Storage** → **Create KV Store** → link to this project
2. Add the other env vars under **Settings → Environment Variables**
3. Vercel Cron will auto-activate from `vercel.json` (checks every 15 min)

## How it works

1. **Cron job** hits `/api/cron` every 15 minutes (authenticated via `CRON_SECRET`)
2. It fetches the CUE Cinemas movie page and checks for session availability
3. If sessions appear and no alert has been sent yet, it emails all subscribers via Resend
4. The home page (SSR) reads live status from KV and shows a "Sessions Available" / "Not Yet Available" badge
5. Subscribers sign up via the email form; unsubscribe links are HMAC-signed to prevent abuse

## Manual trigger

You can trigger a check manually from the Vercel dashboard under **Cron Jobs**, or by calling:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron
```
