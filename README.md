# KREIS Demo — Interactive Session Player

Standalone Next.js app that runs the CMCA KREIS Session 1 in a browser. No
backend, no auth — just a static-asset-driven slide player. Deployable to
Vercel free tier in one click.

## Local dev

```bash
npm install
npm run dev
# open http://localhost:3000
```

Root URL redirects to `/s/kreis-session-1`.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Go to https://vercel.com/new → import the repo → click Deploy.
3. Done. The session is live at `https://<your-project>.vercel.app`.

No env vars, no build args, nothing else.

## Adding a new session

1. Drop the JSON definition at `public/sessions/<slug>.en.json` (English).
2. Drop the video / audio / image assets at `public/sessions/assets/`.
3. Visit `/s/<slug>`.

## Adding a language

The player supports per-session translations via sibling JSON files:

```
public/sessions/<slug>.en.json   ← English (required)
public/sessions/<slug>.kn.json   ← Kannada (optional)
```

To add Kannada to an existing session:

1. Copy `<slug>.en.json` → `<slug>.kn.json`.
2. Translate every human-readable field (`title`, `body`, `intro`,
   `tip`, `transcript`, `options`, etc.) in place.
3. If Kannada gets its own audio/video tracks, replace the asset paths
   inside the `.kn.json` (English file still points at English assets).
4. Once the file is filled in, set `"_translation_status": "ready"` at
   the top (or just delete the field). While it's `"pending"` the player
   shows a yellow banner over Kannada slides so demo viewers know.

The language toggle in the topbar is automatically disabled (`ಕನ್ನಡ` greyed
out) when the `.kn.json` file is missing. Drop it in and the toggle goes
live on next reload — no code change.

Share a Kannada-only link by appending `?lang=kn` to the URL.

## Updating an existing session

Edit `public/sessions/kreis-session-1.json` and push. Vercel rebuilds
automatically.

---

Lives in this repo so you can iterate on the session content from any
machine without touching the main CMCA PULSE codebase.
