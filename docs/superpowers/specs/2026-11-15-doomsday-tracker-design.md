# Doomsday Tracker — Design Spec

**Date:** 2026-11-15  
**Author:** razaalirizvi4

## Overview

A Next.js SSR web app that monitors CUE Cinemas for Avengers: Doomsday showtime availability, collects subscriber emails, and sends email alerts via Resend when sessions go live. Deployable on Vercel with zero external infrastructure beyond Vercel KV.

---

## Architecture

### Stack
- **Framework:** Next.js 14+ App Router (SSR)
- **Styling:** Tailwind CSS
- **Scraping:** `fetch` + `cheerio` (CUE Cinemas uses classic MVC — server-rendered HTML)
- **Email:** Resend
- **Storage:** Vercel KV (Redis)
- **Scheduler:** Vercel Cron Jobs (every 15 minutes)
- **Hosting:** Vercel

### File Structure
```
doomsdayTracker/
├── app/
│   ├── page.tsx                  # SSR page — status + subscription form
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── subscribe/route.ts    # POST — add email to KV
│       ├── unsubscribe/route.ts  # GET ?email=&token= — remove email from KV
│       └── cron/route.ts         # GET — scrape + send alerts (called by Vercel Cron)
├── lib/
│   ├── scraper.ts                # Fetches CUE page, parses showtimes with cheerio
│   ├── email.ts                  # Resend send helpers
│   └── kv.ts                     # Vercel KV helper wrappers
├── components/
│   ├── SubscribeForm.tsx         # Client component — email form
│   └── StatusBadge.tsx           # Shows "Available" / "Not yet"
├── vercel.json                   # Cron schedule config
└── .env.local.example
```

---

## Data Flow

### Subscription
1. User enters email on the page → POST `/api/subscribe`
2. API validates email, checks for duplicate, adds to `doomsday:subscribers` Redis set
3. Returns success/already-subscribed response

### Cron Check (every 15 min)
1. Vercel Cron hits `GET /api/cron` with `Authorization: Bearer CRON_SECRET`
2. Route verifies the secret
3. Calls `scraper.ts` → fetches `https://cuecinemas.com/Browsing/Movies/Details/f-F000001483`
4. Cheerio checks: if the page contains showtime session elements (not "no sessions scheduled"), showtimes are live
5. Checks `GET doomsday:notified` — if already `true`, skip (avoid repeat emails)
6. If showtimes found and not yet notified:
   - Fetches all emails from `SMEMBERS doomsday:subscribers`
   - Sends batch email via Resend with showtime details
   - Sets `doomsday:notified = true`
7. Updates `doomsday:last_check` timestamp and `doomsday:status` (true/false)

### SSR Page
- Server component reads `doomsday:status` and `doomsday:last_check` from KV at request time
- Renders current status, last-checked time, and subscriber form

---

## Scraper Logic

**Detection heuristic:**  
- "No showtimes" state: page contains `"There are currently no sessions scheduled"`  
- "Showtimes available" state: page contains session time elements (`.session-time` or similar)

Scraper returns:
```ts
type ScrapeResult = {
  hasShowtimes: boolean;
  showtimes: { date: string; screen: string; times: string[] }[];
}
```

---

## Vercel KV Schema

| Key | Type | Value |
|-----|------|-------|
| `doomsday:subscribers` | Set | Email addresses |
| `doomsday:notified` | String | `"true"` once alerts sent |
| `doomsday:status` | String | `"true"` / `"false"` |
| `doomsday:last_check` | String | ISO timestamp |

---

## Email

**Service:** Resend  
**From:** Configurable via `FROM_EMAIL` env var (requires verified Resend domain)  
**Template:** HTML email with:
- Doomsday branding
- List of available dates/screens/times
- Link to book on CUE Cinemas
- Unsubscribe link: `/api/unsubscribe?email=<email>&token=<hmac>`

Unsubscribe token = `HMAC-SHA256(email, UNSUBSCRIBE_SECRET)` to prevent arbitrary removals.

---

## Environment Variables

```
RESEND_API_KEY=
FROM_EMAIL=noreply@yourdomain.com
CRON_SECRET=
UNSUBSCRIBE_SECRET=
KV_URL=                    # Provided by Vercel KV
KV_REST_API_URL=           # Provided by Vercel KV
KV_REST_API_TOKEN=         # Provided by Vercel KV
KV_REST_API_READ_ONLY_TOKEN=
```

---

## UI Design

Dark-themed, cinematic aesthetic matching CUE Cinemas' palette (black background, gold/amber accents).

- **Hero section:** Movie title + opening date
- **Status card:** Live badge or "not yet" with last-checked time
- **Subscription form:** Email input + "Notify me" button
- **Subscriber count:** "X people watching"

---

## Cron Config (`vercel.json`)

```json
{
  "crons": [{ "path": "/api/cron", "schedule": "*/15 * * * *" }]
}
```

Vercel Cron is free on the Hobby plan (up to 2 cron jobs).
