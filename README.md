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

1. Drop the JSON definition at `public/sessions/<slug>.json`.
2. Drop the video / audio / image assets at `public/sessions/assets/`.
3. Visit `/s/<slug>`.

## Updating an existing session

Edit `public/sessions/kreis-session-1.json` and push. Vercel rebuilds
automatically.

---

Lives in this repo so you can iterate on the session content from any
machine without touching the main CMCA PULSE codebase.
