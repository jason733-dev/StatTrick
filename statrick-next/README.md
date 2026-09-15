# StaTrick — Bangers Match Tracker (Next.js + Neon + Firebase + Claude)

Live match stat tracker for the Bangers (Los Gatos United U12). This
version is a real Next.js app (App Router), which fixes the persistent
`/api/*` 404 issue from the earlier plain-static-file + Vercel Functions
setup — Next.js API routes on Vercel are the standard, well-tested path,
and I confirmed this locally: `next build` succeeds and lists both
routes, and a real `next start` server answers both correctly (tested
end-to-end, not just checked in the dashboard).

## Architecture

- **Next.js** (App Router) — hosts everything, deployed to Vercel like
  before, just as a proper Next.js project this time instead of loose
  static files + Vercel Functions.
- **`public/index.html`** — the app itself, unchanged UI/logic. Next.js
  serves it as a static file; `next.config.js` redirects `/` to it so you
  don't need a React rewrite of the frontend.
- **`app/api/storage/route.js`** — durable storage (roster, full game
  history, admin passcode) in **Neon Postgres**. This is the source of
  truth for everything except live-in-progress game state.
- **`app/api/summary/route.js`** — AI game summary via **Claude only**
  (dropped Gemini per your call — better output, and one less moving
  part).
- **Firebase Firestore** — used only for **realtime live viewing**. When
  the admin logs an event in Stat Tracker, the current game state is
  also pushed straight to a single Firestore document from the browser.
  The public Live tab subscribes to that document in real time, so
  viewers see updates instantly instead of waiting for a poll. Neon
  remains authoritative — if the Firestore push ever fails, nothing
  breaks, the Live tab just falls back to the slower Neon-based refresh
  that's still running underneath.

## Setup steps

### 1. Set Firestore rules for the live-broadcast document
In [Firebase console](https://console.firebase.google.com/project/aicollector-8dea9/firestore) → Firestore Database → Rules, add (or merge into your existing rules):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /stat_trick_live/{docId} {
      allow read, write: if true;
    }
  }
}
```
This is the only Firestore collection this version uses — everything
else lives in Neon.

### 2. Push to GitHub
This is a different project structure than before (real Next.js, not
loose files) — replace your repo's contents entirely with this folder's
contents, don't merge.

### 3. Re-import as a new Vercel project (recommended)
Given how much configuration drift the old project accumulated, import
this fresh: [vercel.com/new](https://vercel.com/new) → pick the repo.
Vercel will auto-detect it as Next.js this time (not "Other") — that's
expected and correct.

### 4. Reconnect Neon
Storage tab → Connect Database → your existing Neon project. This
re-adds `DATABASE_URL` / `POSTGRES_URL` automatically.

### 5. Add your Claude API key
Settings → Environment Variables:
```
ANTHROPIC_API_KEY = <from console.anthropic.com>
```
(No `GEMINI_API_KEY` needed anymore.)

### 6. Deploy and test
Push triggers the build. Test: edit a roster player and refresh (Neon),
generate an AI summary on an ended match (Claude), and open Live on two
devices while Stat Tracker logs an event on one — the other should
update within a second or two (Firestore), not after a 5-second delay.

## Admin passcode

Defaults to `1234`. Change it from the Roster tab once unlocked.

## Notes

- The Claude model used is `claude-sonnet-5` — check
  [docs.claude.com](https://docs.claude.com) if it's ever retired.
- `app/api/storage/route.js` checks `DATABASE_URL`, then `POSTGRES_URL`,
  then `POSTGRES_PRISMA_URL`, then `POSTGRES_URL_NON_POOLING`.
- The Firestore document used for live broadcast (`stat_trick_live/current`)
  has the same "anyone with the config can write to it" caveat as before
  — fine for this use case, just don't treat it as secure.
- There's no login system beyond the shared passcode.
