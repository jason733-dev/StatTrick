# StaTrick — Bangers Match Tracker (Vercel + Claude + Gemini + Firebase)

Live match stat tracker for the Bangers (Los Gatos United U12). Self-hosted
version: a static page (`index.html`) plus two serverless functions —
`api/storage.js` (Firebase Firestore) and `api/summary.js` (Claude or
Gemini, your choice per game) — so it runs on your own domain, no Claude
account or plan required for viewers.

## What the two API routes do

- **`api/storage.js`** — the app's shared data (roster, games, admin
  passcode) is stored in **Firebase Firestore** through this route, so
  every visitor sees the same live data.
- **`api/summary.js`** — generates the AI game recap. When you tap
  "Generate summary," you pick **Claude** or **Gemini** — whichever you
  choose, it's called with your key, kept server-side only — the browser
  never sees
  it.

Everything else (UI, game logic, admin passcode gate) is unchanged.

## Deploy steps

### 1. Push this folder to a new GitHub repo
```
git init
git add .
git commit -m "StaTrick — initial commit"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

### 2. Create a Firebase project
1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project** (free "Spark" plan is enough for this app).
2. In the new project, go to **Build → Firestore Database → Create database**. Start in **production mode**, pick any region.
3. Go to **Project settings (gear icon) → Service accounts → Generate new private key**. This downloads a JSON file — keep it private, don't commit it to GitHub.
4. Base64-encode that JSON file into a single line (needed because environment variables can't hold raw multi-line JSON cleanly):
   - Mac/Linux: `base64 -i serviceAccountKey.json | tr -d '\n'`
   - Windows (PowerShell): `[Convert]::ToBase64String([IO.File]::ReadAllBytes("serviceAccountKey.json"))`
   Copy the output — you'll paste it into Vercel in step 4.

### 3. Get API keys
- **Gemini**: go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey), sign in, click **Create API key**. Free tier is generous for a team app like this.
- **Claude (Anthropic)**: go to [console.anthropic.com](https://console.anthropic.com) → **API Keys** → **Create Key**. This is a separate account from your Claude.ai subscription — pay-as-you-go billing, add a small amount of credit under **Settings → Billing** before it'll work.

### 4. Import the project into Vercel
Go to [vercel.com/new](https://vercel.com/new), import the GitHub repo. No framework preset needed. Before or after the first deploy, go to **Settings → Environment Variables** and add:
```
FIREBASE_SERVICE_ACCOUNT_B64 = <the base64 string from step 2.4>
GEMINI_API_KEY = <the key from step 3>
ANTHROPIC_API_KEY = <the key from step 3>
```

### 5. Redeploy
Environment variable changes need a redeploy — **Deployments → ⋯ on the latest one → Redeploy**.

### 6. Open the site
Vercel gives you a `*.vercel.app` URL right away; add a custom domain any time from **Settings → Domains**.

## Admin passcode

Defaults to `1234` on first run. Change it from the Roster tab once
unlocked — it's stored in Firestore, so the change applies for everyone
immediately.

## Notes

- The Gemini model used is `gemini-2.5-flash` and the Claude model is
  `claude-sonnet-5`. If either is retired later, check
  [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models)
  or [docs.claude.com](https://docs.claude.com) for the current one and
  swap it into `api/summary.js`.
- **`package.json` has `"type": "module"`** — required because the API
  routes use `import`/`export` syntax. If you ever add more `.js` files
  under `api/` using older `require()`/`module.exports` syntax, rename
  those specific files to `.cjs`, or they'll fail to load.
- There's no login system beyond the shared passcode — anyone who has it
  can log/edit/delete matches. Change the default passcode before
  sharing the link.
- Never commit the Firebase service account JSON file itself to GitHub —
  only the base64 string goes into Vercel's environment variables.
