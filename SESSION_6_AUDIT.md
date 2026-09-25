# Session 6 Audit — Full Rule Check
**Date:** 2026-09-25
**Auditor:** Claude (requested by Ashwini's feedback)

## Rules Applied

1. Two JSON files per session (.en.json + .kn.json) -- same structure
2. Slides numbered 1..N, no gaps, sections cover all slides
3. Only supported slide kinds used
4. Media paths follow `/sessions/assets/s{N}_descriptive_name.ext` convention
5. mc_narration slides have `video`, `kn_script` (Kannada), and optionally `transcript` (English)
6. group_activity_timer slides have `timer_seconds`, `reminder_at`, `reminder_chime`
7. EN and KN JSONs have identical structure (same slide count, same kinds, same sections)
8. All referenced assets must exist on disk
9. kn_script must be in Kannada (not English)
10. Quiz-style slides should use `mcq` kind when the player supports it
11. Images from the PPT must be extracted and placed in assets

---

## Findings

### BUG-1: `kn_script` had English text instead of Kannada (FIXED)
**Severity:** High
**Slides:** 10, 21 (both mc_narration slides in EN JSON)
**Problem:** The `kn_script` arrays in `kreis-session-6.en.json` contained English text, not Kannada. This means the video production team would get English scripts when they read the EN file.
**Status:** FIXED in this session — copied correct Kannada text from the KN JSON.

### BUG-2: Slide 11 has empty title
**Severity:** Low
**Slide:** 11 in both EN and KN
**Problem:** `"title": ""` — the Scientific Temper answer reveal slide has no title. The player will show a blank header area.
**Recommendation:** Set title to "Scientific Temper!" / "ವೈಜ್ಞಾನಿಕ ಮನೋಭಾವನೆ!" — or confirm this is intentional (the video carries the reveal).

### BUG-3: Slide 20 is a quiz but uses `static` kind instead of `mcq`
**Severity:** Medium
**Slide:** 20 — "Constitution Connection — Quiz"
**Problem:** This is an MCQ with 4 options (A-D) and a correct answer. It's currently a `static` slide, which means:
- No interactivity — students can't select an answer
- The answer is visible in the same body text, spoiling the reveal
**Recommendation:** Convert to `mcq` kind with `options` array and `correct` index. The `mcq` kind is supported by the player.

### BUG-4: Unreferenced video on disk — `s6_mc_scientific_temper_p2.kn.mp4`
**Severity:** Medium
**Problem:** There's a 16MB video `s6_mc_scientific_temper_p2.kn.mp4` on disk that isn't referenced by any slide. It may be a part-2 of the Scientific Temper MC narration that was replaced by the full video on slide 11 (`S6.11_FULL_VIDEO_20260911141145.mp4`).
**Recommendation:** Confirm whether this video is needed. If it was superseded by the full video, it can be removed to save space. If it's needed, it should be referenced by a slide.

### BUG-5: Unreferenced assets on disk
**Severity:** Low
**Files not referenced by any slide:**
- `s6_4ws_handout.jpeg` — a 4Ws handout image (2.4MB). The ripple task slide 22 mentions distributing a handout but doesn't show this image.
- `s6_ai_fake_news_example.jpeg` — an AI fake news example (2.1MB). Slide 18 mentions showing AI examples but uses `s6_ai_fake_news.png` instead.
- `s6_preamble_2.jpg`, `s6_preamble_3.jpg`, `s6_preamble_4.jpg` — additional preamble images. Slide 19 only references `s6_preamble_1.jpg`.
- `s6_roleplay_character_slips.jpeg` — duplicate of the PNG version that IS referenced.
**Recommendation:** Either reference these in the JSON (show more preamble images, show the handout, show the AI example) or remove to reduce deploy size.

### BUG-6: Video filename doesn't follow naming convention
**Severity:** Low
**File:** `S6.11_FULL_VIDEO_20260911141145.mp4`
**Problem:** Uses uppercase `S6.11` and a timestamp suffix instead of the standard `s6_descriptive_name.kn.mp4` pattern.
**Recommendation:** Rename to `s6_mc_scientific_temper_p2_full.kn.mp4` or similar. Update both JSONs.

### BUG-7: Preamble slide could show more images
**Severity:** Low
**Slide:** 19 — "Constitution Connection"
**Problem:** The PPT likely shows multiple preamble cards, but the slide only references `s6_preamble_1.jpg`. Three additional preamble images exist on disk (`_2`, `_3`, `_4`).
**Recommendation:** If the PPT showed multiple preamble cards, the JSON should reference them.

### BUG-8: Slide 22 mentions a handout but doesn't show it
**Severity:** Low
**Slide:** 22 — "Your 4W Challenge — Ripple Task"
**Problem:** The body mentions "Use the handout" and the tip says "Distribute Annexure 3 (4Ws handout)" but there's no `image` field showing the handout. A handout image (`s6_4ws_handout.jpeg`) exists on disk.
**Recommendation:** Add `"image": "/sessions/assets/s6_4ws_handout.jpeg"` to slide 22.

---

## Summary

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | kn_script had English text | High | FIXED |
| 2 | Slide 11 empty title | Low | Open |
| 3 | Slide 20 quiz uses static instead of mcq | Medium | Open |
| 4 | Unreferenced video (p2) | Medium | Open — confirm if needed |
| 5 | 5 unreferenced image assets | Low | Open |
| 6 | Video filename convention | Low | Open |
| 7 | Preamble slide missing extra images | Low | Open |
| 8 | Handout image not shown | Low | Open |

**Listing page progress (current):**
- "🔴 MC video production (3 parts)" — All 3 S6 MC videos actually EXIST on disk. This should be ✅.
- "🔴 Annexure 1 (roleplay slips)" — `s6_roleplay_character_slips.png` EXISTS. This should be ✅.
- "🔴 AI-generated fake news example image" — `s6_ai_fake_news.png` EXISTS (referenced). `s6_ai_fake_news_example.jpeg` also exists (not referenced). This should be ✅.
- "🔴 Preamble image (Kannada)" — `s6_preamble_1.jpg` through `_4.jpg` all exist. This should be ✅.
- "🔴 Annexure 3 (4Ws handout)" — `s6_4ws_handout.jpeg` EXISTS but not referenced in JSON. Half-done.
