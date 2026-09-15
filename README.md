# StaTrick — Bangers Match Tracker (Vercel + Firebase + Claude/Gemini)

Live match stat tracker for the Bangers (Los Gatos United U12), hosted on
Vercel with storage in your Firebase project (`aicollector-8dea9`).

## How storage works now

`index.html` talks to **Firestore directly from the browser** using the
Firebase Web SDK (loaded from Google's CDN) and the web app config you
registered in the Firebase console. This is different from earlier
versions of this app, which routed storage through a Vercel serverless
function — that's been removed. Firebase's client config (the `apiKey`
etc. you see in `index.html`) is not a secret; it's meant to be public.
Real access control comes from **Firestore Security Rules**, which you
need to set up once (see below).

AI summaries (`api/summary.js`) are unchanged — still a Vercel serverless
function, since the Claude/Gemini API keys must stay server-side.

## Setup steps

### 1. Enable Firestore in your Firebase project
Go to [console.firebase.google.com](https://console.firebase.google.com/project/aicollector-8dea9/firestore) → **Firestore Database** → **Create database** (if you haven't already) → production mode → any region.

### 2. Set Firestore security rules
Still in the Firebase console, go to **Firestore Database → Rules** and paste this in, then click **Publish**:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /stat_trick_storage/{docId} {
      allow read, write: if true;
    }
  }
}
```
This opens read/write **only** on the one collection this app uses (`stat_trick_storage`) — everything else in your Firebase project stays locked down by whatever rules you already have.

**Worth knowing:** this collection has no real access control beyond "you have the link." The app's admin passcode is a UI-level convenience, not a security boundary — anyone who inspects the page could theoretically read or write this collection directly. That's an acceptable tradeoff for a small team app with no sensitive data, but don't store anything here you wouldn't want any visitor to be able to see or change.

### 3. Push to GitHub and let Vercel redeploy
```
git add .
git commit -m "Switch storage to Firestore client SDK"
git push
```
Vercel auto-redeploys on push. No new environment variables needed for storage — `GEMINI_API_KEY` and `ANTHROPIC_API_KEY` (for the AI summary function) stay as they were.

### 4. Test it
Open the app, go to Roster, edit or add a player, then refresh the page. If the change is still there, storage is working.

## Admin passcode

Defaults to `1234` on first run. Change it from the Roster tab once
unlocked — it's stored in Firestore, so the change applies for everyone
immediately.

## Notes

- `api/summary.js` is the only remaining serverless function. If it's
  still returning errors, that's a separate issue from storage — check
  its logic and your `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` env vars in
  Vercel independently.
- The Gemini model used is `gemini-2.5-flash` and the Claude model is
  `claude-sonnet-5`. If either is retired later, check
  [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models)
  or [docs.claude.com](https://docs.claude.com) and swap it into
  `api/summary.js`.
- There's no login system beyond the shared passcode — anyone who has it
  can log/edit/delete matches. Change the default passcode before
  sharing the link.
