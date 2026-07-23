# KREIS Demo — Interactive Session Player

Standalone Next.js app that runs CMCA's school programme sessions in a
browser. Two programmes — KREIS (Children's Constitution Club, 6 sessions)
and DOM (Children's Civic Club, 3 sessions). No backend, no auth — static
JSON + media assets drive everything.

Deployed on Vercel. Auto-deploys on push to `main`.

## Local dev

```bash
npm install
npm run dev
# open http://localhost:3000
```

Root URL shows a programme picker. Pick KREIS or DOM, then a session.

Direct session URL: `http://localhost:3000/s/kreis-session-1`

## Deploy to Vercel

1. Push this repo to GitHub.
2. Go to https://vercel.com/new → import the repo → click Deploy.
3. Done. No env vars, no build args.

## Session structure

Each session is a pair of JSON files:

```
public/sessions/<programme>-session-<N>.en.json   (English)
public/sessions/<programme>-session-<N>.kn.json   (Kannada)
```

Media assets (video, audio, images) live in `public/sessions/assets/`.

The player (`components/SessionRunner.tsx`) renders 11 slide kinds: title,
static, mc_narration, video, video_question_series, mcq, click_reveal,
reflect_share, group_activity_timer, preamble_pair, preamble.

## Adding a new session

1. Create the JSON pair (`.en.json` + `.kn.json`) in `public/sessions/`
2. Drop media assets into `public/sessions/assets/`
3. Add a card to the programme landing page (`app/kreis/page.tsx` or `app/dom/page.tsx`)
4. Push to `main`

See `CLAUDE.md` for the full schema reference and step-by-step process.

## Working with Claude Code

This repo has a `CLAUDE.md` that covers the JSON schema, asset conventions,
and session creation process. Clone the repo, start a Claude Code session,
and it will pick up the context automatically.

For current status of every session, see `DEV_STATE.md`.

---

A2Z Antifragility × CMCA India
