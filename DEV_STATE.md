# DEV_STATE — KREIS Demo Session Player

Last updated: 2026-08-18

---

## Current status

**Platform**: 20 session JSONs across 2 programmes, 116 asset files, deployed on Vercel.

**Language toggle**: EN/ಕನ್ನಡ toggle live on all 3 landing pages (root, KREIS, DOM). Persists via localStorage.

---

## Session inventory

### KREIS (Children's Constitution Club)

| Session | Slides | Assets | KN JSON | EN JSON | Status | Pending |
|---------|--------|--------|---------|---------|--------|---------|
| S1: Welcome | 27 | 25 (0 missing) | ✅ | ✅ | Playable | MC intro video says "Constitution Club" — fine for KREIS |
| S2: Club Naming | 22 | 29 (0 missing) | ✅ | ✅ | Playable | Campaigns slideshow (CapCut), editable club-name field |
| S3: Choices & Integrity | 17 | 18 (0 missing) | ✅ | ✅ | Playable | PDF annexures (locked with Ramya), INTEGRITY word-reveal animation |
| S4: Child Rights & MGS | 16 | 10 (0 missing) | ✅ | ✅ | Playable (placeholder assets) | MC video production, child rights handout, MGS images |
| S5: Active Citizens | 19 | 9 (0 missing) | ✅ | ✅ | Playable (placeholder assets) | MC video production, visualization audio, helpline sheet, complaint letter template |
| S6: Fake News & 4Ws | 21 | 9 (0 missing) | ✅ | ✅ | Playable (placeholder assets) | MC video production (3 parts), roleplay slips, AI fake news image, Preamble KN image, 4Ws handout |

### DOM (Children's Civic Club)

| Session | Slides | Assets | KN JSON | EN JSON | Status | Pending |
|---------|--------|--------|---------|---------|--------|---------|
| S1: Welcome | 27 | 22 (0 missing) | ✅ | ✅ | Playable | MC intro re-record (says "Constitution Club", needs "Civic Club"), Odisha content variants |
| S2: Club Naming | 20 | 16 (0 missing) | ✅ | ✅ | Playable | Editable club-name field |
| S3: Choices & CCB | 20 | 15 (0 missing) | ✅ | ✅ | Playable | — |
| S4: Child Rights | 16 | 8 (0 missing) | ✅ | ✅ | Playable | — |

---

## Shared pending items

| Item | Depends on | Notes |
|------|-----------|-------|
| DOM club logo/seal | CMCA | Using `kreis_seal.png` as placeholder on DOM title slides |
| "Welcome to Namma Club" intro video for DOM | Srivathsa | Currently using KREIS intro (programme-agnostic but says "Constitution Club") |
| Ripple of Change image (S1 slide 24) | CMCA | Not available — using text-only for both KREIS and DOM |
| EN translations for kn_script fields | — | `kn_script` is intentionally Kannada in both EN and KN files (original video script) |

---

## Asset summary

- **Total files**: 116 in `public/sessions/assets/`
- **Video**: ~401MB (MC narrations, Veo-generated, Asfiya story)
- **Images**: ~197MB (illustrations, logos, infographics, photos)
- **Audio**: ~5MB (welcome music, calmers, timers, SFX)
- **Zero missing references** across all 20 JSON files

---

## Recent changes

| Date | What | Commit |
|------|------|--------|
| 2026-08-18 | DOM S4: Child Rights & Responsibilities (from Ashwini PPT V2, 11 Aug) | pending |
| 2026-07-23 | P4: EN/ಕನ್ನಡ language toggle on all landing pages | `4af8725` |
| 2026-07-20 | P3: Image audit — 3 new PPT images + Karnataka Govt logo to DOM | `45a2774` |
| 2026-07-20 | KREIS S3 EN translation + hide question text + clean landing pages | `c40850c` |
| 2026-07-20 | KREIS S2 EN: complete English translation | `d7980dd` |

---

## Corrections applied

| Source PPT | Date | Sessions affected | Status |
|-----------|------|-------------------|--------|
| KREIS Session 1 corrections (AKG & Savitha) | 16 Jul 2026 | KREIS S1, DOM S1 | ✅ Applied |
| Session 2 corrections (Savitha & AKG) | 16 Jul 2026 | KREIS S2, DOM S2 | ✅ Applied |
| Session 3 corrections | 16 Jul 2026 | KREIS S3, DOM S3 | ✅ Applied |

---

## Next chunk

When creating new sessions (S7+) or new programmes, follow the process in `CLAUDE.md`.
For corrections, follow the corrections workflow in `CLAUDE.md`.
