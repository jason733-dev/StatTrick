# Stat Trick — Bangers Match Tracker (Vercel version)

Live match stat tracker for the Bangers (Los Gatos United U12). This is the
self-hosted version of the app — a single static page (`index.html`) plus
two small serverless functions (`api/storage.js`, `api/summary.js`) so it
runs on your own domain with your own Anthropic API key, no Claude account
or plan required for viewers.

## What the two API routes do

- **`api/storage.js`** — the app's shared data (roster, games, admin
  passcode) is stored in [Vercel KV](https://vercel.com/docs/storage/vercel-kv)
  (a hosted Redis) through this route, so every visitor sees the same live
  data.
- **`api/summary.js`** — generates the AI game recap. It calls Anthropic's
  API with your key, kept server-side only — the browser never sees it.

Everything else (all the UI, the game logic, the admin passcode gate) is
unchanged from the version built in Claude.

## Deploy steps

1. **Push this folder to a new GitHub repo.**
   ```
   git init
   git add .
   git commit -m "Stat Trick — initial commit"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

2. **Import it into Vercel.**
   Go to [vercel.com/new](https://vercel.com/new), pick the repo. No
   framework preset needed — Vercel auto-detects the `api/` folder as
   serverless functions and serves `index.html` as-is. Click Deploy.

3. **Add a Vercel KV database.**
   In the Vercel project → **Storage** tab → **Create Database** → **KV**.
   Attach it to this project. Vercel automatically adds the
   `KV_REST_API_URL` / `KV_REST_API_TOKEN` (etc.) environment variables —
   you don't need to set these by hand.

4. **Add your Anthropic API key.**
   Get one at [console.anthropic.com](https://console.anthropic.com) →
   API Keys. In the Vercel project → **Settings** → **Environment
   Variables**, add:
   ```
   ANTHROPIC_API_KEY = sk-ant-...
   ```

5. **Redeploy.**
   Environment variable changes need a redeploy to take effect —
   Vercel project → **Deployments** → **⋯** on the latest one →
   **Redeploy**.

6. **Open the site.**
   Vercel gives you a `*.vercel.app` URL immediately; add a custom domain
   any time from **Settings → Domains**.

## Admin passcode

Defaults to `1234` on first run (same as the Claude version). Change it
any time from the Roster tab once unlocked — it's stored in KV, so the
change applies for everyone immediately.

## Notes

- The `model` used in `api/summary.js` is `claude-sonnet-5`. If Anthropic
  retires that string later, check
  [docs.claude.com](https://docs.claude.com) for the current one and swap
  it in.
- Vercel KV's free tier is generous for a team app like this (a season of
  games is a tiny amount of data), but check current limits on your
  Vercel plan if you're on a paid tier already for other reasons.
- There's no login system beyond the shared passcode — anyone who has it
  (or guesses it) can log/edit/delete matches. Change the default passcode
  before sharing the link.
