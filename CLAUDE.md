# KREIS Demo — Session Player (CLAUDE.md)

Interactive session player for CMCA India's school programmes. Standalone
Next.js 14 (App Router) deployed to Vercel. No backend, no auth — static
JSON + assets drive everything.

**Read this file fully on every new conversation.**

GitHub: `hestia-madhav/Kreis-Demo` · Auto-deploys to Vercel on push to `main`.

---

## Repository layout

```
kreis-demo/
├── app/
│   ├── page.tsx              Programme picker (root landing)
│   ├── layout.tsx            Root layout + font preloads
│   ├── globals.css           Global styles
│   ├── kreis/page.tsx        KREIS session list
│   ├── dom/page.tsx          DOM session list
│   └── s/[id]/page.tsx       Session player route (loads JSON by id)
├── components/
│   ├── SessionRunner.tsx     The player — renders all slide kinds (2200+ lines)
│   ├── LanguageToggle.tsx    EN/ಕನ್ನಡ toggle button
│   └── useLanguage.ts       localStorage-backed language hook
├── public/sessions/
│   ├── <session-id>.<lang>.json   Session definitions (18 files)
│   └── assets/                    All media: images, video, audio (116 files)
├── CLAUDE.md                 ← this file
├── DEV_STATE.md              Live status of every session
└── README.md                 Setup + deploy instructions
```

---

## Two programmes, one player

| Programme | ID | Club name (EN) | Club name (KN) | Sessions | Colour |
|-----------|-----|----------------|----------------|----------|--------|
| KREIS | `kreis` | Children's Constitution Club | ಮಕ್ಕಳ ಸಂವಿಧಾನ ಕ್ಲಬ್ | 6 (S1–S6) | `#F39C1F` (orange) |
| DOM | `dom` | Children's Civic Club | ಪೌರ ಕ್ಲಬ್ | 3 (S1–S3) | `#0EA5E9` (blue) |

DOM sessions are structurally based on KREIS sessions with naming/branding
changes + corrections from CMCA's 16th July 2026 PPT inputs.

---

## Session JSON schema

Every session is a pair of files:

```
public/sessions/<programme>-session-<N>.en.json   (English)
public/sessions/<programme>-session-<N>.kn.json   (Kannada — primary)
```

### Top-level envelope

```json
{
  "id": "kreis-session-1",
  "_language": "kn",
  "_revision": "2026-07-20-corrections",
  "title": "ಮಕ್ಕಳ ಸಂವಿಧಾನ ಕ್ಲಬ್‌ಗೆ ಸ್ವಾಗತ!",
  "programme": "KREIS",
  "duration_estimate_minutes": 60,
  "sections": [
    { "id": "introduce", "label": "ಪರಿಚಯ", "slides": [1, 2, 3] },
    { "id": "calmers", "label": "ಶಾಂತಗೊಳ್ಳೋಣ", "slides": [4, 5] }
  ],
  "slides": [ ... ]
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | Matches the filename slug: `kreis-session-1`, `dom-session-2` |
| `_language` | yes | `"en"` or `"kn"` |
| `_revision` | no | Version tag for tracking corrections |
| `title` | yes | Session title in the file's language |
| `programme` | yes | `"KREIS"` or `"DOM"` |
| `duration_estimate_minutes` | yes | Typically `60` |
| `sections` | yes | Ordered array grouping slides into labelled sections (drives the section nav bar) |
| `slides` | yes | Ordered array of slide objects |

### Sections

Each section has `id` (snake_case slug), `label` (human-readable in the file's language), and `slides` (array of slide `n` values). Every slide `n` must appear in exactly one section.

---

## Slide kinds — the complete reference

Every slide has `n` (1-indexed position), `kind`, `title`, and `tip` (teacher instruction). Additional fields depend on the kind.

### 1. `title`

Welcome/closing branded slide with programme seal + CMCA logo.

```json
{
  "n": 1, "kind": "title",
  "title": "Welcome to the Children's Constitution Club!",
  "subtitle": "KREIS × CMCA",
  "audio": "/sessions/assets/welcome_music.mp3",
  "centered": true,
  "tip": "Play welcome music as children enter.",
  "thank_you": true,
  "closing_line": "See you in the next session.",
  "image": "/sessions/assets/kreis_seal.png"
}
```

| Field | Description |
|-------|-------------|
| `subtitle` | Small text under title |
| `audio` | Background music file |
| `centered` | Always `true` for title slides |
| `thank_you` | If true, shows "Thank You" text (closing slide) |
| `closing_line` | Farewell text below title |
| `image` | Hero image (e.g. programme seal) |

### 2. `static`

The workhorse — text, optional image(s), optional audio.

```json
{
  "n": 6, "kind": "static",
  "title": "Form Groups",
  "body": ["Let's form groups!", "Every voice matters."],
  "bullets_large": true,
  "image": "/sessions/assets/group_work_1.jpg",
  "image_layout": "side",
  "callout": "Teachers, add the rule: treat everyone with respect.",
  "audio": "/sessions/assets/vo_calmer_intro.kn.mp3",
  "tip": "Use a counting method to form mixed-gender groups."
}
```

| Field | Description |
|-------|-------------|
| `body` | Array of text lines (rendered as paragraphs or bullets) |
| `bullets_large` | If true, body renders as large-font bullet list |
| `centered` | If true, title only, no body — centered on screen |
| `image` | Single image path |
| `images` | Array of `{ src, alt, caption }` for multiple images |
| `image_layout` | `"side"` = text left + image right; `"stack"` (default) = image below text |
| `callout` | Highlighted tip box (prefixed with lightbulb) |
| `audio` | Audio file to play |

### 3. `mc_narration`

Master Change video with expandable transcript.

```json
{
  "n": 3, "kind": "mc_narration",
  "title": "Master Change introduces himself",
  "video": "/sessions/assets/mc_intro.kn.mp4",
  "transcript": "Hello little citizens! I am Master Change...",
  "kn_script": ["ಹಲೋ ಚಿಕ್ಕ ನಾಗರಿಕರೇ! ನಾನು ಮಾಸ್ಟರ್ ಚೇಂಜ್..."],
  "tip": "Play the full MC video.",
  "images": [{ "src": "...", "alt": "...", "caption": "..." }]
}
```

| Field | Description |
|-------|-------------|
| `video` | MC video file path |
| `transcript` | English transcript (collapsible) |
| `kn_script` | Kannada transcript lines (shown when lang=kn) |
| `images` | Optional logo strip below video (partner logos) |

### 4. `video`

Standalone video with optional pause points and post-video text.

```json
{
  "n": 8, "kind": "video",
  "title": "Now let's see who's the winner",
  "video": "/sessions/assets/mc_questions_combined.kn.mp4",
  "pause_at": [8, 16, 24, 32, 40],
  "pause_duration": 8,
  "loop": false,
  "duration_seconds": 63,
  "intro_text": "Time to make Club rules.",
  "post_video_text": ["Raising his hand to speak."],
  "reveal_on_click": true,
  "transcript": "Master Change asks 7 questions...",
  "kn_script": ["..."],
  "body": ["Watch the video carefully."],
  "tip": "Watch the video. It will auto-pause after each question."
}
```

| Field | Description |
|-------|-------------|
| `video` | Video file path |
| `pause_at` | Array of seconds where video auto-pauses |
| `pause_duration` | Seconds to pause at each point (default 5) |
| `loop` | If true, video loops (teacher clicks Next) |
| `duration_seconds` | Display hint for video length |
| `intro_text` | Text shown before video plays |
| `post_video_text` | Array of lines shown after video ends |
| `reveal_on_click` | If true, post-video text hidden behind "Reveal" button |
| `body` | Instruction lines shown above the video |

### 5. `video_question_series`

Multi-clip video with teacher-controlled pacing. Each item plays a short clip then shows a discussion question. Teacher clicks "Next question" to advance.

```json
{
  "n": 12, "kind": "video_question_series",
  "title": "ಆದರ್ಶ ಪ್ರತಿನಿಧಿ",
  "items": [
    { "video": "/sessions/assets/s2_qualities_q1.kn.mp4", "question": "ಒಬ್ಬ ಆದರ್ಶ ಪ್ರತಿನಿಧಿಗೆ ಇರಬೇಕಾದ ಗುಣಗಳೇನು?" },
    { "video": "/sessions/assets/s2_qualities_q2.kn.mp4", "question": "ಯಾರಿಗೆ ಮತ ಹಾಕುತ್ತೀರಿ?" }
  ],
  "kn_script": ["...", "..."],
  "transcript": "Before we vote — what qualities...",
  "tip": "Allow discussion time after each question. Press Next Question to advance."
}
```

| Field | Description |
|-------|-------------|
| `items` | Array of `{ video, question }` — one clip per question |
| `kn_script` | Kannada script lines (expandable transcript) |
| `transcript` | English transcript |

### 6. `mcq`

Multiple-choice question with tap-to-answer and instant feedback.

```json
{
  "n": 11, "kind": "mcq",
  "title": "Civic Connect Question",
  "scenario": "You are doing a school team project with 8 classmates...",
  "options": ["Try to convince all members...", "Accept others' decisions...", "Think keeping all members' wellbeing in mind.", "Argue among yourselves..."],
  "correct_index": 2,
  "tip": "Read the scenario aloud. Correct answer: c)"
}
```

| Field | Description |
|-------|-------------|
| `scenario` | Question/scenario text |
| `options` | Array of answer strings |
| `correct_index` | 0-indexed position of correct answer |

### 7. `click_reveal`

Progressive reveal — questions shown one at a time on tap/click.

```json
{
  "n": 13, "kind": "click_reveal",
  "title": "Make rules together — Think & Share",
  "intro": "Teacher will listen with you.",
  "prompts": ["Imagine you are going to play a new game...", "If everyone starts playing however they want..."],
  "video": "/sessions/assets/mc_raising_hand_loop.mp4",
  "tip": "Show one question at a time (click to reveal next)."
}
```

| Field | Description |
|-------|-------------|
| `intro` | Introduction text before reveal items |
| `prompts` | Array of strings revealed one by one |
| `video` | Optional companion video |

### 8. `reflect_share`

Open-ended reflection prompt — no right answer.

```json
{
  "n": 9, "kind": "reflect_share",
  "title": "Think & Share",
  "prompt": "From this group activity — what did you learn?",
  "image": "/sessions/assets/smartboard_icon.svg",
  "callout": "Write children's answers on the board",
  "tip": "Take answers from 3–4 children."
}
```

| Field | Description |
|-------|-------------|
| `prompt` | The reflection question (rendered as a blockquote) |

### 9. `group_activity_timer`

Timed group activity with countdown ring, reminder chime, and end popup.

```json
{
  "n": 15, "kind": "group_activity_timer",
  "title": "Write rules in your group",
  "brief": "Using paper, write 1 rule for yourself and 1 for your teacher.",
  "timer_seconds": 180,
  "reminder_at": 60,
  "reminder_chime": "/sessions/assets/timer_2min_warning.mp3",
  "images": [{ "src": "...", "alt": "...", "caption": "..." }],
  "image": "/sessions/assets/some_reference.jpg",
  "tip": "Distribute paper before starting timer."
}
```

| Field | Description |
|-------|-------------|
| `brief` | Activity instructions shown beside the timer |
| `timer_seconds` | Total countdown in seconds |
| `reminder_at` | Seconds remaining when reminder chime plays |
| `reminder_chime` | Audio file for the reminder alert |
| `images` | Reference images shown with the brief |
| `image` | Single reference image |

### 10. `preamble_pair`

Side-by-side English + Kannada Preamble images.

```json
{
  "n": 26, "kind": "preamble_pair",
  "title": "Let's read the Preamble of India together",
  "preamble_en": "/sessions/assets/preamble_en.png",
  "preamble_kn": "/sessions/assets/preamble_kn.png",
  "tip": "Stand up. Read together. Slowly, clearly."
}
```

### 11. `preamble`

Single preamble image (legacy — use `preamble_pair` for new sessions).

---

## Asset naming conventions

All assets live in `public/sessions/assets/`. Use these rules for new files:

### Pattern

```
<prefix>_<descriptive_slug>.<lang>.<ext>
```

### Prefixes by type

| Type | Prefix | Example |
|------|--------|---------|
| Session-specific image | `s<N>_` | `s2_naming_of_club.png` |
| Session-specific video (MC) | `s<N>_mc_` | `s3_mc_traffic_signal.kn.mp4` |
| Split video clip | `s<N>_<topic>_q<N>` | `s2_qualities_q1.kn.mp4` |
| Master Change video (shared) | `mc_` | `mc_intro.kn.mp4` |
| Voice-over audio | `vo_` | `vo_eyes_on_you.kn.mp3` |
| Timer/SFX audio | `timer_` | `timer_2min_warning.mp3` |
| Music/atmosphere | descriptive | `welcome_music.mp3`, `applause_short.mp3` |
| Partner logo | `partner_` | `partner_karnataka_govt.jpeg` |
| Programme branding | programme name | `kreis_seal.png`, `cmca_logo.png` |
| Preamble images | `preamble_` | `preamble_en.png` |
| Shared illustrations | descriptive | `flat_tyre.jpg`, `group_work_1.jpg` |

### Language suffix

- Videos/audio with Kannada narration: `.kn.mp4`, `.kn.mp3`
- Language-agnostic media (no speech): no suffix — `asfiya_story.mp4`
- Kannada-specific images: `_kn` suffix — `s2_democracy_levels_kn.png`

### Rules

1. **snake_case always.** No spaces, no capital letters in filenames.
2. **Session prefix** (`s2_`, `s3_`) for anything used by only one session.
3. **No session prefix** for shared assets (logos, preamble, welcome music).
4. **Keep extensions consistent**: `.mp4` for video, `.mp3` for audio, `.png`/`.jpg`/`.jpeg` for images.
5. **Don't rename existing files** — update JSON references if you must, but renaming breaks the offline bundle.

---

## How to create a new session

### Pre-requisites

Before you start, you need:

1. **Source PPT** from CMCA — the session content deck (usually Kannada first)
2. **Access to this repo** — clone from `hestia-madhav/Kreis-Demo`
3. **Node.js 18+** installed
4. **The player running locally**: `npm install && npm run dev`

### Step-by-step process

#### Step 1: Analyse the source PPT

Read the PPT slide by slide. For each slide, decide:
- Which **slide kind** it maps to (see reference above)
- What **assets** it needs (video, audio, image)
- What **text** goes into `title`, `body`, `tip`

Create a mapping table:

| PPT slide | Kind | Title | Assets needed | Notes |
|-----------|------|-------|---------------|-------|
| 1 | title | Welcome | welcome_music.mp3, seal | Opening slide |
| 2 | static | Today's topic | — | Centered title only |
| 3 | mc_narration | MC introduces | mc_intro.kn.mp4 | Need Veo video |
| ... | ... | ... | ... | ... |

#### Step 2: Create the asset requirements document

From the mapping table, extract a list of all assets needed. For each:
- **Type**: image / video / audio
- **Description**: what it shows/says
- **Source**: PPT (extract it), stock image, Veo generation, VO recording
- **Who produces it**: Srivathsa (Veo/VO), CMCA (content images), us (extraction/sourcing)
- **Filename**: following the naming conventions above

Send this document to Srivathsa for video/audio production.

#### Step 3: Build the Kannada JSON first

Kannada is the primary delivery language. Create:

```
public/sessions/<programme>-session-<N>.kn.json
```

1. Start from the envelope: `id`, `_language: "kn"`, `title`, `programme`, `sections`
2. Build each slide object following the kind schemas above
3. For videos not yet produced, set the `video` field to the expected filename — the player shows a placeholder
4. Group slides into logical sections

**Use an existing session as your template.** Copy a similar session's JSON and modify it — don't build from scratch.

#### Step 4: Build the English JSON

Copy the KN JSON to `.en.json` and translate:
- `_language` → `"en"`
- `title` (envelope and every slide)
- `body` arrays
- `tip` fields
- `scenario`, `options`, `prompt` (for interactive slides)
- `transcript` (use the English version; `kn_script` stays in KN)
- Section `label` values

**Do NOT translate**: asset paths, `id`, `kind`, `n`, `correct_index`, timer values.

If English translations aren't available yet, use `[EN translation pending]` as placeholder text — the player renders it normally and it's easy to grep for later.

#### Step 5: Drop assets into place

Copy produced assets (videos, images, audio) to `public/sessions/assets/` using the naming conventions.

For images from the PPT: extract using python-pptx or save from PowerPoint directly.

#### Step 6: Add to the landing page

Edit the programme's landing page (`app/kreis/page.tsx` or `app/dom/page.tsx`):
- Add a new entry to the `SESSIONS` array
- Include both `en` and `kn` titles and subtitles
- Set `status` to `"in_progress"`
- List production progress items

#### Step 7: Test locally

```bash
npm run dev
```

1. Navigate to the programme landing page — verify the new card appears
2. Click into the session — verify all slides render
3. Check every slide kind works (timer starts, MCQ answers, videos play)
4. Check both EN and KN languages via the player's toggle
5. Verify no console errors

#### Step 8: Commit and push

```bash
git add public/sessions/<session>.en.json public/sessions/<session>.kn.json
git add public/sessions/assets/<new-assets>
git add app/<programme>/page.tsx
git commit -m "Add <programme> session <N>: <session title>"
git push origin main
```

Vercel auto-deploys on push to `main`.

---

## How to process corrections

Corrections come as a PPT from CMCA (Ashwini/Savitha/AKG).

### Rules

1. **Corrections must come as a PPT** with specific slide references. WhatsApp messages or verbal notes are not accepted as formal change requests.
2. **One corrections PPT per session** — if corrections span multiple sessions, each gets its own PPT.

### Process

1. **Read the corrections PPT** — use markitdown or open in PowerPoint
2. **Map each correction to JSON slides** — the PPT slide numbers may not match JSON slide `n` values. Match by content/title.
3. **Extract any new images** from the corrections PPT using python-pptx:
   ```python
   from pptx import Presentation
   prs = Presentation('corrections.pptx')
   for i, slide in enumerate(prs.slides):
       for shape in slide.shapes:
           if shape.shape_type == 13:  # Picture
               img = shape.image
               with open(f'extracted_{i}_{shape.name}.{img.content_type.split("/")[1]}', 'wb') as f:
                   f.write(img.blob)
   ```
4. **Apply changes to both .en.json and .kn.json** — every content change must be mirrored
5. **Update `_revision`** with the date of corrections
6. **Test locally** before pushing

---

## What the player handles automatically

You don't need to build these — `SessionRunner.tsx` does it:

- Section nav bar (from `sections` array)
- Slide number + progress indicator
- EN/KN language toggle (loads the sibling JSON)
- Teacher tip panel (from `tip` field)
- Video placeholder when file is missing
- Timer with countdown ring, chime, and popup
- MCQ answer checking + feedback
- Click-to-reveal progressive disclosure
- Keyboard shortcuts (T = timer toggle, R = reveal, arrow keys = navigate)

---

## Never-do list

1. **Never edit `SessionRunner.tsx` for content changes.** Content lives in JSON files. The player is programme-agnostic.
2. **Never hardcode programme-specific text in the player.** It reads `programme` from the JSON.
3. **Never commit assets over 50MB.** Vercel has a 100MB per-file limit; Git slows dramatically. Compress videos first.
4. **Never delete an existing asset** without checking all 18 JSON files for references to it. Assets are shared across sessions.
5. **Never use spaces in filenames.** snake_case only.
6. **Never invent session content.** Every line of text must come from the source PPT or explicit CMCA direction. If something is unclear, mark it `[PENDING — clarify with CMCA]`.

---

## Deployment

- **Host**: Vercel (auto-deploy from GitHub `main` branch)
- **Build**: `next build` (static export)
- **Total size**: ~600MB (mostly video/audio assets)
- **Capacity**: CDN-served static site — handles 100+ concurrent users easily
- **No env vars needed**

---

## Team

| Person | Role |
|--------|------|
| Madhav (A2Z Antifragility) | Project lead, JSON creation, integration, QA |
| Srivathsa | Veo video prompts + generation, VO generation (Google AI Studio) |
| Ashwini / Savitha / AKG (CMCA) | Source PPTs, corrections PPTs, content sign-off |
| Irfan (CMCA) | Session content authoring (S4–S6 Kannada decks) |

---

## Local dev

```bash
npm install
npm run dev        # starts on http://localhost:3000
```

Visit `http://localhost:3000` → pick a programme → pick a session.

Direct session URL: `http://localhost:3000/s/kreis-session-1`
