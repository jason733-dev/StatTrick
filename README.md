# StaTrick — Bangers Match Tracker (Vercel + Neon + Claude/Gemini)

Live match stat tracker for the Bangers (Los Gatos United U12). Storage
is back to routing through a Vercel serverless function
(`api/storage.js`) backed by your connected Neon Postgres database.

## ⚠️ Known unresolved issue

Both `api/storage.js` and `api/summary.js` have been returning a hard
`404 Not Found` at the edge — not a JSON error from inside the function,
a platform-level "route not found." This happened even though:
- The files are confirmed present at the repo root on GitHub
- The functions show up as built under the deployment's **Resources** tab
- No `vercel.json` is overriding routing

This points at a **Vercel project-level setting**, most likely
**Settings → General → Root Directory**. If that's set to anything other
than blank (e.g. a leftover `vercel-project` from an earlier setup
attempt), Vercel would build correctly but fail to route `/api/*`
requests. Check and clear that before assuming anything in this code is
wrong — this storage rewrite won't fix the 404 if that's the actual
cause, since both functions share the same routing layer.

## What the two API routes do

- **`api/storage.js`** — the app's shared data (roster, games, admin
  passcode) is stored in **Neon Postgres**. The table is created
  automatically on first use.
- **`api/summary.js`** — generates the AI game recap via Claude or
  Gemini, your choice per game, key kept server-side only.

## Setup steps

### 1. Push to GitHub
Make sure `api/storage.js`, `api/summary.js`, `package.json`, and
`index.html` all match this zip — especially confirm the old Firebase
CDN script tags are gone from `index.html` (they should be, this version
has them removed).

### 2. Confirm Neon is connected
Vercel project → **Storage** tab → should show your Neon database
connected, with `POSTGRES_URL` (or similar) auto-added to environment
variables.

### 3. Confirm API keys are set
**Settings → Environment Variables** should have `GEMINI_API_KEY` and
`ANTHROPIC_API_KEY`.

### 4. Check Root Directory (see warning above)
**Settings → General → Root Directory** — should be blank.

### 5. Redeploy and test
Push triggers auto-deploy. Test by editing a roster name and refreshing,
and by generating an AI summary on an ended match.

## Admin passcode

Defaults to `1234`. Change it from the Roster tab once unlocked.

## Notes

- `api/storage.js` checks `POSTGRES_URL`, then `DATABASE_URL`, then
  `POSTGRES_PRISMA_URL`, then `POSTGRES_URL_NON_POOLING` — whichever your
  Neon/Vercel integration actually named it.
- `package.json` has `"type": "module"` — required for the `import`/
  `export` syntax in both API routes.
- The Gemini model used is `gemini-2.5-flash` and the Claude model is
  `claude-sonnet-5` — check current docs if either is ever retired.
- There's no login system beyond the shared passcode — change the
  default before sharing the link.
