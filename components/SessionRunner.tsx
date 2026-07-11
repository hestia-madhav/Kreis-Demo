"use client";

/**
 * SessionRunner — interactive ppt runtime.
 *
 * Reads a SessionDefinition JSON and renders one slide at a time with REAL
 * DOM-level interactions (click-to-reveal, MCQ scoring, JS countdown timer,
 * audio/video players). Designed as the runtime counterpart to the .pptx
 * authoring template under `kreis-session-1/`.
 *
 * Keyboard: ArrowRight / Space → next  |  ArrowLeft → prev
 *           R → reveal next prompt / MCQ answer
 *           T → start/pause active timer
 *           F → toggle fullscreen
 *           N → toggle nav rail
 *
 * Events fire to onEvent() so the parent route can POST them to PULSE
 * (slide_view, mcq_answer, reveal_clicked, timer_started, completion).
 * For the demo route we just log to console + localStorage.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─────────────────────────── types ─────────────────────────────────────────
type SlideKind =
  | "title"
  | "static"
  | "mc_narration"
  | "group_activity_timer"
  | "click_reveal"
  | "mcq"
  | "reflect_share"
  | "video"
  | "video_question_series"
  | "preamble"
  | "preamble_pair";

interface QuestionItem {
  video: string;
  question: string;
}

interface Slide {
  n: number;
  kind: SlideKind;
  title: string;
  tip?: string;
  subtitle?: string;
  body?: string[];
  bullets_large?: boolean;       // render body as larger, bullet-list emphasis
  callout?: string;
  audio?: string;
  video?: string;
  image?: string;                 // optional companion image (e.g. Ambedkar, flat tyre, asfiya)
  images?: Array<{ src: string; alt?: string; caption?: string }>; // multiple companion images (logos, reference photos)
  loop?: boolean;                 // loop the video instead of auto-advancing on end
  post_video_text?: string;       // text revealed after the video ends (slide 5/15)
  reveal_on_click?: boolean;      // require teacher click before showing post_video_text
  transcript?: string;
  kn_script?: string[];
  kn_questions?: string[];
  brief?: string;
  timer_seconds?: number;
  reminder_at?: number;
  reminder_chime?: string;        // mp3 played at the reminder mark
  intro?: string;
  prompts?: string[];
  items?: QuestionItem[];         // for video_question_series
  footer?: string;
  scenario?: string;
  options?: string[];
  correct_index?: number;
  prompt?: string;
  duration_seconds?: number;
  title_kn?: string;   // optional Kannada title for branded title slide (rendered alongside English)
  thank_you?: boolean; // if true, branded title slide renders the "Thank You" closing variant
  closing_line?: string; // AKG/Savitha 16 Jun: small Kannada closing line under the title — used on each session's final slide
  centered?: boolean; // hint to the renderer to centre this slide's content (used mainly on title cards)
  pause_at?: number[];      // for video slides — pause at these timecodes (seconds) for class discussion. Slide 9: [8,16,24,32,40].
  pause_duration?: number;  // seconds to hold each pause (default 5)
  image_layout?: "side" | "stack"; // static slide composition; "side" puts text + image side-by-side, "stack" stacks them centred. Default stack.
  preamble_en?: string; // slide 28 — full English Preamble image (Madhubani border)
  preamble_kn?: string; // slide 28 — full Kannada Preamble image (Madhubani border)
}

interface SessionDefinition {
  id: string;
  title: string;
  programme: string;
  duration_estimate_minutes: number;
  sections: { id: string; label: string; slides: number[] }[];
  slides: Slide[];
}

type SessionEvent =
  | { type: "slide_view"; slide: number; ts: number }
  | { type: "reveal_clicked"; slide: number; index: number; ts: number }
  | { type: "mcq_answer"; slide: number; chosen: number; correct: boolean; ts: number }
  | { type: "timer_started"; slide: number; seconds: number; ts: number }
  | { type: "timer_completed"; slide: number; ts: number }
  | { type: "completion"; ts: number };

type Lang = "en" | "kn";

interface SessionDefinitionWithMeta extends SessionDefinition {
  // Optional metadata fields. `_translation_status: "pending"` triggers a
  // banner over the player to flag un-translated content.
  _language?: Lang;
  _translation_status?: "pending" | "ready";
}

interface Props {
  // Multi-language sessions. `en` is mandatory; `kn` is optional — when
  // null, the Kannada toggle is shown disabled with a tooltip.
  sessions: { en: SessionDefinitionWithMeta; kn?: SessionDefinitionWithMeta | null };
  onEvent?: (e: SessionEvent) => void;
}

// ─────────────────────────── main component ────────────────────────────────
export default function SessionRunner({ sessions, onEvent }: Props) {
  const [idx, setIdx] = useState(0);
  const [navOpen, setNavOpen] = useState(true);
  const [tipOpen, setTipOpen] = useState(true);
  // Touch-device detection (Madhav 7 Jul: 'no fullscreen option if no
  // keyboard'). matchMedia pointer:coarse is the standard proxy for
  // 'primary input is a finger / stylus, no physical keyboard'.
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(pointer: coarse)");
    setIsTouch(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fit-to-viewport — eliminates per-slide scrolling. The canvas is fixed-
  // height (filling the flex slot between header + footer); the inner
  // wrapper is whatever size the slide content naturally takes. If the
  // inner is taller than the canvas, we scale it down with CSS transform
  // so the whole slide fits the viewport. No scrolling, ever.
  const canvasRef = useRef<HTMLElement | null>(null);
  const fitRef = useRef<HTMLDivElement | null>(null);
  const [fitScale, setFitScale] = useState(1);

  // ─────── language state ───────
  // Resolution order on first paint:
  //   1. ?lang=kn / ?lang=en in the URL — wins, so shareable Kannada links work
  //   2. localStorage["cmca-session-lang"] — sticky per-browser choice
  //   3. "en" default
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const q = url.searchParams.get("lang");
    const stored = window.localStorage.getItem("cmca-session-lang");
    const initial: Lang =
      q === "kn" || q === "en" ? (q as Lang) : stored === "kn" ? "kn" : "en";
    setLang(initial);
  }, []);
  const knAvailable = !!sessions.kn;
  // If Kannada is unavailable, silently fall back to English regardless of state.
  const activeLang: Lang = lang === "kn" && knAvailable ? "kn" : "en";
  const session = sessions[activeLang] ?? sessions.en;
  const translationPending = session._translation_status === "pending";

  const pickLang = (next: Lang) => {
    if (next === "kn" && !knAvailable) return;
    setLang(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("cmca-session-lang", next);
      // Reflect the choice in the URL so refresh / share preserves it.
      const url = new URL(window.location.href);
      url.searchParams.set("lang", next);
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Teacher Tip — AKG/Savitha 16 Jun: tip should appear briefly when
  // entering a slide, then auto-hide. Teacher can click the toggle in
  // the top-right to bring it back. Auto-hide after 5 seconds.
  useEffect(() => {
    setTipOpen(true);
    const t = window.setTimeout(() => setTipOpen(false), 5000);
    return () => window.clearTimeout(t);
  }, [idx]);

  // Fit-to-viewport + scroll fallback (Madhav 25 Jun):
  // - If content fits naturally → no scale.
  // - If content overflows mildly (fit ≥ 0.75) → scale it down to fit.
  // - If overflow is severe (fit < 0.75) → keep natural size and allow the
  //   canvas to scroll vertically (with a hint indicator). Aggressive
  //   downscaling makes everything tiny + unreadable.
  const [canScroll, setCanScroll] = useState(false);
  useEffect(() => {
    const canvasEl = canvasRef.current;
    const fitEl = fitRef.current;
    if (!canvasEl || !fitEl) return;

    const recompute = () => {
      fitEl.style.transform = "scale(1)";
      void fitEl.offsetHeight;
      const canvasH = canvasEl.clientHeight;
      const canvasW = canvasEl.clientWidth;
      const contentH = fitEl.scrollHeight;
      const contentW = fitEl.scrollWidth;
      if (canvasH === 0 || contentH === 0) return;
      const scaleH = canvasH / contentH;
      const scaleW = canvasW / contentW;
      const naturalFit = Math.min(1, scaleH, scaleW);
      // Always shrink to fit — never scroll. Madhav 7 Jul school pilot:
      // 'no scroll for more scenario, layout should be clean like a
      // slideshow'. Even at aggressive scale (down to 0.35), the text
      // stays readable on a projector/smartboard because we lifted the
      // base font sizes; on smaller screens the auto-shrink handles it.
      setFitScale(Math.max(0.35, naturalFit));
      setCanScroll(false);
    };

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(canvasEl);
    ro.observe(fitEl);
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
    // navOpen is included so fitScale is freshly recomputed the moment the
    // nav rail opens/closes — the canvas width changes synchronously with
    // that toggle (verifying DOM build: video/mc_narration slides looked
    // misaligned right after closing the nav).
  }, [idx, activeLang, navOpen]);

  const slide = session.slides[idx];

  const sectionOf = useCallback(
    (n: number) => {
      // Never crash if a slide number isn't in the sections config —
      // fall back to a synthetic empty-label section. Historical bug:
      // sections referenced pre-delete slide numbers → undefined here
      // → .label threw → white-screen crash (Madhav, 6 Jul).
      return (
        session.sections.find((s) => s.slides.includes(n)) ?? {
          id: "unknown",
          label: "",
          slides: [n],
        }
      );
    },
    [session.sections]
  );
  const currentSection = sectionOf(slide.n);

  const next = useCallback(() => {
    setIdx((i) => Math.min(i + 1, session.slides.length - 1));
  }, [session.slides.length]);
  const prev = useCallback(() => setIdx((i) => Math.max(i - 1, 0)), []);

  // Fire slide_view on every change.
  useEffect(() => {
    onEvent?.({ type: "slide_view", slide: slide.n, ts: Date.now() });
    if (idx === session.slides.length - 1) {
      onEvent?.({ type: "completion", ts: Date.now() });
    }
  }, [idx, slide.n, session.slides.length, onEvent]);

  // Keyboard handlers, scoped to the runner div.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      // ArrowRight = next slide. Space used to advance too but was removed —
      // teachers expect Space to play/pause audio/video instead (browser default).
      if (e.key === "ArrowRight") { next(); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { prev(); }
      else if (e.key.toLowerCase() === "n") { setNavOpen((v) => !v); }
      else if (e.key.toLowerCase() === "f") {
        const el = containerRef.current;
        if (!document.fullscreenElement && el?.requestFullscreen) el.requestFullscreen().catch(() => {});
        else if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const jumpToSection = (secId: string) => {
    const sec = session.sections.find((s) => s.id === secId);
    if (!sec) return;
    const firstSlideNumber = sec.slides[0];
    const targetIdx = session.slides.findIndex((s) => s.n === firstSlideNumber);
    if (targetIdx >= 0) setIdx(targetIdx);
  };

  return (
    <div
      ref={containerRef}
      className="sr-root"
      lang={activeLang}
      style={{ ["--sr-progress" as string]: `${((idx + 1) / session.slides.length) * 100}%` }}
    >
      {/* Top bar */}
      <header className="sr-topbar">
        <button className="sr-icon-btn" onClick={() => setNavOpen((v) => !v)} title="Toggle nav (N)">☰</button>
        <div className="sr-topbar-title">
          <strong>{session.programme}</strong>
          <span className="sr-sep">·</span>
          <span>{session.title}</span>
        </div>
        {/* Language toggle. Kannada half is disabled with a tooltip until
            the .kn.json file is shipped. */}
        <div
          className="sr-lang-toggle"
          role="group"
          aria-label="Choose language"
        >
          <button
            className={"sr-lang-btn " + (activeLang === "en" ? "is-active" : "")}
            onClick={() => pickLang("en")}
            aria-pressed={activeLang === "en"}
          >EN</button>
          <button
            className={"sr-lang-btn " + (activeLang === "kn" ? "is-active" : "") + (knAvailable ? "" : " is-disabled")}
            onClick={() => pickLang("kn")}
            aria-pressed={activeLang === "kn"}
            disabled={!knAvailable}
            title={knAvailable ? "ಕನ್ನಡ" : "Kannada coming soon"}
          >ಕನ್ನಡ</button>
        </div>
        <div className="sr-progress">
          <div className="sr-progress-bar"><div style={{ width: `${((idx + 1) / session.slides.length) * 100}%` }} /></div>
          <span>{idx + 1} / {session.slides.length}</span>
        </div>
      </header>
      {/* Translation-pending banner — only shows when a translator has
          dropped a .kn.json skeleton but not yet filled it in. */}
      {activeLang === "kn" && translationPending && (
        <div className="sr-translation-banner">
          ⚠ Kannada translation is in progress — strings shown are still in English.
        </div>
      )}

      <div className="sr-body">
        {/* Left nav rail */}
        {navOpen && (
          <nav className="sr-nav">
            <div className="sr-nav-header">
              <div className="sr-nav-brand">{session.programme}</div>
              <div className="sr-nav-sub">{session.title}</div>
            </div>
            <ul className="sr-nav-list">
              {session.sections.map((sec) => {
                const isCurrent = sec.id === currentSection.id;
                return (
                  <li key={sec.id}>
                    <button
                      className={"sr-nav-item " + (isCurrent ? "is-current" : "")}
                      onClick={() => jumpToSection(sec.id)}
                    >
                      {sec.label}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="sr-nav-footer">CMCA India</div>
          </nav>
        )}

        {/* Main canvas — text-instruction slides are centered for projector
            display; richer kinds (videos, timers, MCQ, sequences) keep their
            existing top-left layout so controls stay reachable. */}
        <main
          ref={canvasRef}
          className={[
            "sr-canvas",
            (slide.kind === "static" || slide.kind === "reflect_share") ? "is-projector" : "",
            canScroll ? "is-scrollable" : "",
            (slide.kind === "video" || slide.kind === "mc_narration") ? "is-video-slide" : "",
          ].filter(Boolean).join(" ")}
        >
          <div
            ref={fitRef}
            className="sr-canvas-fit"
            style={{ transform: `scale(${fitScale})` }}
          >
          {/* Title-kind slides render their own branded title in TitleSlide —
              skip the outer crumb + h1 so we don't render the title twice
              (Madhav 7 Jul: 'title slide has two titles in kannada'). */}
          {slide.kind !== "title" && (
            <>
              <div className="sr-section-crumb">{currentSection.label}</div>
              <h1 className="sr-title">{slide.title}</h1>
              <div className="sr-accent" />
            </>
          )}

          <div className="sr-slide-body">
            <SlideBody slide={slide} onEvent={onEvent} onAdvance={next} lang={activeLang} programme={session.programme} />
          </div>
          </div>

          {/* Teacher tip — brought back per Madhav 7 Jul school pilot.
              Content sweep-rewritten for facilitator use (not dev
              annotations). Toggle pill sits top-right; panel slides in
              from the right when opened. */}
          {slide.tip && (
            <>
              <button
                type="button"
                className={"sr-tip-toggle " + (tipOpen ? "is-open" : "")}
                onClick={() => setTipOpen((v) => !v)}
                aria-expanded={tipOpen}
                title={tipOpen ? "Hide teacher tip" : "Show teacher tip"}
              >
                {tipOpen ? "✕" : "💡"} {tipOpen ? "Hide tip" : "Tip"}
              </button>
              {tipOpen && (
                <aside className="sr-tip-panel" aria-label="Teacher tip">
                  <div className="sr-tip-panel-label">Teacher tip</div>
                  <p>{slide.tip}</p>
                </aside>
              )}
            </>
          )}
          {/* end teacher tip block. Legacy comment retained for context:
              Tips were hidden per Madhav 25 Jun (dev annotations leaking through);
              longer rendered. Restore here if needed. */}
        </main>
      </div>

      {/* Side controls — moved to the bottom-left corner (Madhav, verifying
          DOM build: the old left-edge, vertically-centered stack sat on top
          of the hamburger nav rail whenever it was open). Bottom-left is
          still on the teacher's side of the screen, just out of the nav
          rail's way. Logo moved to bottom-right to make room (see below).

          Fullscreen shortcut hint is hidden when there's no keyboard
          (touch smartboard) — 'No fullscreen option if no keyboard'. */}
      <div className="sr-side-nav" aria-label="Slide navigation">
        <button
          onClick={prev}
          disabled={idx === 0}
          className="sr-side-btn"
          aria-label="Previous slide"
          title="Previous (←)"
        >
          <span className="sr-side-icon">‹</span>
          <span className="sr-side-label">Prev</span>
        </button>
        <div className="sr-side-count">{idx + 1} / {session.slides.length}</div>
        <button
          onClick={next}
          disabled={idx === session.slides.length - 1}
          className="sr-side-btn sr-side-btn-primary"
          aria-label="Next slide"
          title="Next (→)"
        >
          <span className="sr-side-icon">›</span>
          <span className="sr-side-label">Next</span>
        </button>
      </div>

      {/* CMCA logo, bottom-right corner (moved from bottom-left to make
          room for the Prev/Next controls). Always present for brand
          continuity across every slide. */}
      <img
        className="sr-brand-corner"
        src="/sessions/assets/cmca_logo.png"
        alt="CMCA"
        aria-hidden="true"
      />

      <style jsx>{styles}</style>
    </div>
  );
}

// ─────────────────────────── slide body dispatcher ─────────────────────────
function SlideBody({
  slide,
  onEvent,
  onAdvance,
  lang,
  programme,
}: {
  slide: Slide;
  onEvent?: (e: SessionEvent) => void;
  onAdvance: () => void;
  lang: Lang;
  programme: string;
}) {
  switch (slide.kind) {
    case "title": return <TitleSlide slide={slide} programme={programme} />;
    case "static": return <StaticSlide slide={slide} />;
    case "mc_narration": return <McSlide slide={slide} lang={lang} />;
    case "group_activity_timer": return <TimerSlide slide={slide} onEvent={onEvent} />;
    case "click_reveal": return <RevealSlide slide={slide} onEvent={onEvent} />;
    case "mcq": return <McqSlide slide={slide} onEvent={onEvent} lang={lang} />;
    case "reflect_share": return <ReflectSlide slide={slide} />;
    case "video": return <VideoSlide slide={slide} onEnded={onAdvance} lang={lang} />;
    case "video_question_series": return <VideoQuestionSeriesSlide slide={slide} onEvent={onEvent} />;
    case "preamble": return <PreambleSlide slide={slide} />;
    case "preamble_pair": return <PreamblePairSlide slide={slide} />;
    default: return <pre>{JSON.stringify(slide, null, 2)}</pre>;
  }
}

// ─────────────────────────── slide kinds ───────────────────────────────────
function TitleSlide({ slide, programme }: { slide: Slide; programme: string }) {
  // Branded layout mirrors Sonu's "Welcome to the Children's Constitution
  // Club!" pptx template — wavy white background, programme seal centred
  // at top, CMCA "spark change" logo top-right, dual-language title centred
  // below. Used for slide 1 (welcome) and the new closing slide (thank you).
  //
  // Two optional fields drive the variants:
  //   slide.title_kn — Kannada title (rendered in Noto Sans Kannada below
  //                    the English title)
  //   slide.thank_you — when true, "Thank You" appears under the title pair
  //                     (matches the pptx slide 4 layout)
  const isThanks = !!slide.thank_you;
  // The round seal image is KREIS-branded artwork — only KREIS has one.
  // Verifying DOM build: this was hardcoded, so DOM title slides were
  // incorrectly showing the KREIS seal. DOM has no seal asset yet (see
  // dom_sessions_assets_for_srivathsa.md open questions) — omit it rather
  // than show the wrong programme's branding.
  const showSeal = programme === "KREIS";
  return (
    <div className="sr-branded-title">
      <div className="sr-branded-bg" aria-hidden />
      <div className="sr-branded-logos">
        {showSeal && <img className="sr-kreis-seal" src="/sessions/assets/kreis_seal.png" alt="KREIS" />}
        <img className="sr-cmca-mark" src="/sessions/assets/cmca_logo.png" alt="CMCA" />
      </div>
      <div className="sr-branded-titles">
        <h2 className="sr-branded-en">{slide.title}</h2>
        {slide.title_kn && <h3 className="sr-branded-kn">{slide.title_kn}</h3>}
        {isThanks && <h2 className="sr-branded-thanks">Thank You</h2>}
        {slide.subtitle && <p className="sr-subtitle">{slide.subtitle}</p>}
        {/* AKG/Savitha 16 Jun: closing-line on the final slide of every
            session. Renders below the title (or under "Thank You" on the
            session-end slide). Same Noto Sans Kannada font + smaller size. */}
        {slide.closing_line && <p className="sr-branded-closing">{slide.closing_line}</p>}
      </div>
      {/* Madhav 25 Jun: optional hero image on title slides — used on slide 29
          for the big closing visual. Renders above the audio chip. */}
      {slide.image && (
        <div className="sr-branded-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.image} alt="" />
        </div>
      )}
      {slide.audio && <div className="sr-branded-audio"><AudioChip src={slide.audio} /></div>}
    </div>
  );
}

function StaticSlide({ slide }: { slide: Slide }) {
  // bullets_large = render body as a big-font bullet list (per Sonu's feedback
  // on slides 7 "Form Groups" and 16 "Write your rules" — needs visual weight).
  const lineCls = slide.bullets_large ? "sr-line sr-line-lg" : "sr-line";
  const hasSideArt = !!slide.image || (slide.images && slide.images.length > 0);
  // layout: "side" puts text + image side-by-side (slides 6, 7); default
  // is "stack" — text on top, image below, both centred (slide 26 etc).
  const layoutSide = slide.image_layout === "side";
  return (
    <div className={hasSideArt ? ("sr-static-with-image " + (layoutSide ? "is-side" : "is-stack")) : ""}>
      <div className="sr-static-text">
        {slide.bullets_large ? (
          <ul className="sr-bullets-lg">
            {(slide.body || []).map((line, i) => (<li key={i}>{line}</li>))}
          </ul>
        ) : (
          (slide.body || []).map((line, i) => (
            <p key={i} className={lineCls}>{line}</p>
          ))
        )}
        {slide.callout && <div className="sr-callout">💡 {slide.callout}</div>}
        {slide.audio && <AudioChip src={slide.audio} />}
      </div>
      {slide.image && (
        <div className="sr-static-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.image} alt="" />
        </div>
      )}
      {slide.images && slide.images.length > 0 && (
        <div className="sr-static-image-grid">
          {slide.images.map((im, i) => (
            <figure key={i} className="sr-image-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.src} alt={im.alt || ""} />
              {im.caption && <figcaption>{im.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

function McSlide({ slide, lang }: { slide: Slide; lang: Lang }) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  useEffect(() => { setTranscriptOpen(false); }, [slide.n]);
  const [videoFailed, setVideoFailed] = useState(false);
  useEffect(() => { setVideoFailed(false); }, [slide.video]);
  const showKnTranscript = lang === "kn" && slide.kn_script && slide.kn_script.length > 0;
  const transcriptText = showKnTranscript ? slide.kn_script!.join("\n\n") : slide.transcript;
  const transcriptLabel = showKnTranscript ? "ಪಠ್ಯ (ಕನ್ನಡ)" : "Transcript (English)";
  return (
    <div>
      <div className="sr-mc-grid is-video-wide">
        <div className="sr-video-frame">
          {slide.video && !videoFailed ? (
            <video
              key={slide.video}
              controls
              playsInline
              src={slide.video}
              poster="/sessions/assets/mc_poster.png"
              onError={() => setVideoFailed(true)}
            />
          ) : (
            <div className="sr-video-placeholder">▶ MC video not yet produced<br /><small>{slide.video || "(no video attached yet)"}</small></div>
          )}
        </div>
      </div>
      {transcriptText && (
        <>
          <button
            type="button"
            className="sr-transcript-toggle"
            onClick={() => setTranscriptOpen((v) => !v)}
            aria-expanded={transcriptOpen}
          >
            {transcriptOpen ? (showKnTranscript ? "ಪಠ್ಯ ಮರೆಮಾಡಿ" : "Hide transcript") : (showKnTranscript ? "📜 ಪಠ್ಯ ತೋರಿಸಿ" : "📜 Show transcript")}
          </button>
          {transcriptOpen && (
            <aside className="sr-transcript sr-transcript-below">
              <div className="sr-transcript-label">{transcriptLabel}</div>
              <p style={{ whiteSpace: "pre-line" }}>{transcriptText}</p>
            </aside>
          )}
        </>
      )}
      {/* Companion logo strip — used on slide 3 to display the partner
          orgs Sonu mentioned ("Along with CMCA, there are partner
          organisations…"). Renders as a row of logo cards under the
          video / transcript. */}
      {slide.images && slide.images.length > 0 && (
        <div className="sr-mc-partners">
          <div className="sr-mc-partners-label">Partner organisations</div>
          <div className="sr-static-image-grid">
            {slide.images.map((im, i) => (
              <figure key={i} className="sr-image-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.src} alt={im.alt || ""} />
                {im.caption && <figcaption>{im.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TimerSlide({ slide, onEvent }: { slide: Slide; onEvent?: (e: SessionEvent) => void }) {
  const total = slide.timer_seconds ?? 60;
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const [showEndPopup, setShowEndPopup] = useState(false);
  const reminded = useRef(false);

  // Audio elements for the two alert points. Preloaded on mount so playback
  // is instantaneous (Madhav 7 Jul: '2 min mark it should make a sound with
  // a pop up notification' + 'when timer ends [same]').
  const chimeRef = useRef<HTMLAudioElement | null>(null);
  const endRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setRemaining(total); setRunning(false); reminded.current = false; setShowEndPopup(false);
  }, [slide.n, total]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          setRunning(false);
          onEvent?.({ type: "timer_completed", slide: slide.n, ts: Date.now() });
          // Play end alert + open modal popup
          endRef.current?.play().catch(() => {});
          setShowEndPopup(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, slide.n, onEvent]);

  // Fire the 2-min-remaining chime exactly once when countdown crosses
  // reminder_at. Also opens a small popup so a distracted teacher can see it.
  useEffect(() => {
    if (!slide.reminder_at) return;
    if (remaining === slide.reminder_at && !reminded.current) {
      reminded.current = true;
      chimeRef.current?.play().catch(() => {});
    }
  }, [remaining, slide.reminder_at]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "t") { e.preventDefault(); toggle(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const toggle = () => {
    if (!running && remaining === total) {
      onEvent?.({ type: "timer_started", slide: slide.n, seconds: total, ts: Date.now() });
    }
    setRunning((r) => !r);
  };
  const reset = () => { setRemaining(total); setRunning(false); reminded.current = false; };

  const pct = ((total - remaining) / total) * 100;
  const warn = remaining > 0 && remaining <= 30;
  const reminderHit = slide.reminder_at && remaining === slide.reminder_at;
  if (reminderHit && !reminded.current) reminded.current = true;
  const flash = remaining > 0 && reminded.current && remaining <= (slide.reminder_at ?? 0);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="sr-timer-grid">
      <div className="sr-brief">
        <p>{slide.brief}</p>
        {/* Companion image strip — e.g. KSRTC + KREIS logos on slide 8.
            Rendered under the brief so the children see the inspirations
            without losing focus on the timer. */}
        {slide.images && slide.images.length > 0 && (
          <div className="sr-brief-logos">
            {slide.images.map((im, i) => (
              <figure key={i} className="sr-brief-logo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.src} alt={im.alt || ""} />
                {im.caption && <figcaption>{im.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </div>
      <div className={"sr-timer-ring " + (warn ? "is-warn " : "") + (flash ? "is-flash" : "")}>
        <svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" stroke="#e5e7eb" strokeWidth="10" fill="none" />
          <circle
            cx="60" cy="60" r="52"
            stroke="currentColor" strokeWidth="10" fill="none"
            strokeDasharray={`${(pct / 100) * 326.7} 326.7`}
            transform="rotate(-90 60 60)" strokeLinecap="round"
          />
        </svg>
        <div className="sr-timer-readout">
          <div className="sr-timer-digits">{mm}:{ss}</div>
          <div className="sr-timer-label">{remaining === 0 ? "TIME UP" : running ? "RUNNING" : "READY"}</div>
        </div>
        <div className="sr-timer-controls">
          <button className="sr-btn sr-btn-primary" onClick={toggle}>{running ? "Pause" : remaining === 0 ? "Restart" : "Start"}</button>
          <button className="sr-btn" onClick={reset}>Reset</button>
        </div>
      </div>
      {/* Preloaded audio for the two alert points */}
      <audio ref={chimeRef} src={slide.reminder_chime || "/sessions/assets/timer_2min_warning.mp3"} preload="auto" />
      <audio ref={endRef} src="/sessions/assets/timer_end.mp3" preload="auto" />
      {/* End-of-timer modal popup */}
      {showEndPopup && (
        <div className="sr-timer-modal" role="alertdialog" aria-labelledby="sr-timer-modal-title">
          <div className="sr-timer-modal-inner">
            <div className="sr-timer-modal-icon">⏰</div>
            <div id="sr-timer-modal-title" className="sr-timer-modal-title">Time's up!</div>
            <div className="sr-timer-modal-sub">Wrap up the activity and move to sharing.</div>
            <button className="sr-btn sr-btn-primary" onClick={() => setShowEndPopup(false)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

function RevealSlide({ slide, onEvent }: { slide: Slide; onEvent?: (e: SessionEvent) => void }) {
  const [shown, setShown] = useState(0);
  const prompts = slide.prompts || [];

  useEffect(() => { setShown(0); }, [slide.n]);

  const reveal = useCallback(() => {
    setShown((s) => {
      const next = Math.min(s + 1, prompts.length);
      if (next > s) onEvent?.({ type: "reveal_clicked", slide: slide.n, index: next - 1, ts: Date.now() });
      return next;
    });
  }, [prompts.length, slide.n, onEvent]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r") { e.preventDefault(); reveal(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reveal]);

  return (
    <div className="sr-reveal">
      {slide.intro && <p className="sr-intro">{slide.intro}</p>}
      <ol className="sr-reveal-list">
        {prompts.map((p, i) => (
          <li key={i} className={"sr-reveal-item " + (i < shown ? "is-shown" : "is-hidden")}>
            <span className="sr-reveal-num">{i + 1}</span>
            <span className="sr-reveal-body">{i < shown ? p : <span className="sr-reveal-mask">— click Reveal to show —</span>}</span>
          </li>
        ))}
      </ol>
      <div className="sr-reveal-controls">
        <button className="sr-btn sr-btn-primary" onClick={reveal} disabled={shown >= prompts.length}>
          {shown === 0 ? "Reveal first" : shown < prompts.length ? `Reveal next (${shown}/${prompts.length})` : "All revealed"}
        </button>
        <span className="sr-hint">or press R</span>
      </div>
      {slide.footer && shown >= prompts.length && (
        <div className="sr-footer-cheer">🎉 {slide.footer}</div>
      )}
    </div>
  );
}

function McqSlide({ slide, onEvent, lang }: { slide: Slide; onEvent?: (e: SessionEvent) => void; lang: Lang }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => { setChosen(null); setRevealed(false); }, [slide.n]);

  const choose = (i: number) => {
    if (revealed) return;
    setChosen(i);
    setRevealed(true);
    onEvent?.({ type: "mcq_answer", slide: slide.n, chosen: i, correct: i === slide.correct_index, ts: Date.now() });
  };

  return (
    <div className="sr-mcq">
      <p className="sr-scenario">{slide.scenario}</p>
      <ol className="sr-options">
        {(slide.options || []).map((opt, i) => {
          const isCorrect = i === slide.correct_index;
          const isChosen = i === chosen;
          let cls = "sr-option";
          if (revealed) {
            if (isCorrect) cls += " is-correct";
            else if (isChosen) cls += " is-wrong";
            else cls += " is-dim";
          }
          return (
            <li key={i}>
              <button className={cls} onClick={() => choose(i)} disabled={revealed}>
                <span className="sr-option-letter">{String.fromCharCode(65 + i)}</span>
                <span className="sr-option-body">{opt}</span>
                {revealed && isCorrect && <span className="sr-option-mark">✓</span>}
                {revealed && isChosen && !isCorrect && <span className="sr-option-mark">✗</span>}
              </button>
            </li>
          );
        })}
      </ol>
      {revealed && (
        <div className={"sr-feedback " + (chosen === slide.correct_index ? "is-right" : "is-close")}>
          {/* AKG/Savitha 17 Jun: MCQ feedback must be in Kannada when lang=kn. */}
          {chosen === slide.correct_index
            ? (lang === "kn"
                ? "ಸರಿ! ಮುಂದುವರಿಸಲು ಮುಂದಿನ ಬಟನ್ ಒತ್ತಿ."
                : "Correct! Click Next to move on.")
            : (lang === "kn"
                ? "ತಪ್ಪು — ಸರಿ ಉತ್ತರವನ್ನು ಗುರುತಿಸಲಾಗಿದೆ. ಮುಂದುವರಿಸಲು ಮುಂದಿನ ಬಟನ್ ಒತ್ತಿ."
                : "Not quite — the correct answer is highlighted. Click Next to continue.")}
        </div>
      )}
    </div>
  );
}

function ReflectSlide({ slide }: { slide: Slide }) {
  return (
    <div className="sr-reflect">
      <blockquote>“{slide.prompt}”</blockquote>
      <p className="sr-reflect-hint">Take responses from the class. There is no single right answer here.</p>
    </div>
  );
}

function VideoSlide({ slide, onEnded, lang }: { slide: Slide; onEnded: () => void; lang: Lang }) {
  // `post_video_text` shows after the clip ends. If `reveal_on_click` is true,
  // we hold the text hidden behind a "Reveal" button (slide 15 "MC raising hand").
  // For looped clips (loop=true) we never auto-advance — the teacher clicks Next.
  const [ended, setEnded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  useEffect(() => { setTranscriptOpen(false); }, [slide.n]);

  const handleEnded = () => {
    setEnded(true);
    // Don't auto-advance if there's post_video_text — teacher needs to see it
    // and react. Only the legacy "play full video then move on" flow auto-advances.
    if (!slide.post_video_text && !slide.loop) onEnded();
  };

  // For looped videos (slide 15), `ended` never fires — the reveal click alone
  // should unveil the text. For non-looped videos with reveal_on_click, we
  // still wait for the video to end before letting the teacher click reveal.
  const showPost = slide.post_video_text && (
    slide.reveal_on_click
      ? revealed
      : ended
  );

  const showKnTranscript = lang === "kn" && slide.kn_script && slide.kn_script.length > 0;
  const transcriptText = showKnTranscript ? slide.kn_script!.join("\n\n") : slide.transcript;
  const transcriptLabel = showKnTranscript ? "ಪಠ್ಯ (ಕನ್ನಡ)" : "Transcript (English)";
  const hasTranscript = !!transcriptText;

  return (
    <div className={"sr-video-large-wrap " + (hasTranscript ? "sr-video-with-transcript" : "")}>
      {slide.body && slide.body.length > 0 && (
        <div className="sr-video-instructions">
          {slide.body.map((line, i) => (
            <p key={i} className="sr-video-instruction-line">{line}</p>
          ))}
        </div>
      )}
      <div className="sr-video-row">
        <div className="sr-video-large">
          {slide.video ? (
            <VideoWithPauses
              src={slide.video}
              loop={slide.loop ?? false}
              pauseAt={slide.pause_at}
              pauseDuration={slide.pause_duration ?? 5}
              onEnded={handleEnded}
            />
          ) : (
            <div className="sr-video-placeholder">
              ▶ EMBEDDED VIDEO<br />
              <small>{slide.video || "(video asset not attached yet)"} · {slide.duration_seconds ?? 0}s</small>
            </div>
          )}
        </div>
      </div>
      {hasTranscript && (
        <>
          <button
            type="button"
            className="sr-transcript-toggle"
            onClick={() => setTranscriptOpen((v) => !v)}
            aria-expanded={transcriptOpen}
          >
            {transcriptOpen ? (showKnTranscript ? "ಪಠ್ಯ ಮರೆಮಾಡಿ" : "Hide transcript") : (showKnTranscript ? "📜 ಪಠ್ಯ ತೋರಿಸಿ" : "📜 Show transcript")}
          </button>
          {transcriptOpen && (
            <aside className="sr-transcript sr-transcript-below">
              <div className="sr-transcript-label">{transcriptLabel}</div>
              <p style={{ whiteSpace: "pre-line" }}>{transcriptText}</p>
            </aside>
          )}
        </>
      )}

      {slide.post_video_text && (
        <div className="sr-post-video">
          {slide.reveal_on_click && !revealed ? (
            <button className="sr-btn sr-btn-primary" onClick={() => setRevealed(true)}>
              Reveal answer
            </button>
          ) : showPost ? (
            <div className="sr-post-video-text">{slide.post_video_text}</div>
          ) : (
            <div className="sr-post-video-hint">Watch the video — text appears when it ends.</div>
          )}
        </div>
      )}
    </div>
  );
}

// VideoQuestionSeriesSlide: per Sonu's call (slide 9). Plays one MC clip at a
// time; question text stays on screen after each clip. Teacher clicks "Next
// question" to advance through the series. After the last item we show the
// footer (high-five line). No auto-advance — teacher controls pace.
function VideoQuestionSeriesSlide({
  slide,
  onEvent,
}: {
  slide: Slide;
  onEvent?: (e: SessionEvent) => void;
}) {
  const items = slide.items ?? [];
  const [i, setI] = useState(0);
  const [ended, setEnded] = useState(false);
  const current = items[i];
  const isLast = i >= items.length - 1;

  // Reset on slide change
  useEffect(() => { setI(0); setEnded(false); }, [slide.n]);

  if (!current) {
    return <div className="sr-static-text"><p>{slide.intro}</p><p><em>No question clips configured.</em></p></div>;
  }

  return (
    <div className="sr-vqs">
      {slide.intro && i === 0 && !ended && (
        <p className="sr-vqs-intro">{slide.intro}</p>
      )}

      <div className="sr-video-large">
        <video
          key={current.video}      // forces remount so play button resets
          controls
          src={current.video}
          onEnded={() => setEnded(true)}
        />
      </div>

      {/* Question text — visible always (so teacher can read aloud while clip plays),
          but highlighted once clip ends. */}
      <div className={"sr-vqs-question " + (ended ? "is-active" : "")}>
        <span className="sr-vqs-num">Q{i + 1}</span>
        <span>{current.question}</span>
      </div>

      <div className="sr-vqs-controls">
        <button
          className="sr-btn"
          disabled={i === 0}
          onClick={() => { setI(i - 1); setEnded(false); }}
        >
          ← Previous question
        </button>
        <span className="sr-vqs-counter">{i + 1} / {items.length}</span>
        {!isLast ? (
          <button
            className="sr-btn sr-btn-primary"
            onClick={() => {
              onEvent?.({ type: "reveal_clicked", slide: slide.n, index: i, ts: Date.now() });
              setI(i + 1);
              setEnded(false);
            }}
          >
            Next question →
          </button>
        ) : (
          <span className="sr-vqs-done">✓ All questions shown — use Next to continue.</span>
        )}
      </div>

      {isLast && ended && slide.footer && (
        <div className="sr-callout">🙌 {slide.footer}</div>
      )}
    </div>
  );
}

function PreambleSlide({ slide }: { slide: Slide }) {
  return (
    <div className="sr-preamble">
      {(slide.body || []).map((line, i) => (
        <p key={i} className={i === 0 ? "is-hero" : ""}>{line}</p>
      ))}
    </div>
  );
}

function PreamblePairSlide({ slide }: { slide: Slide }) {
  // Side-by-side EN + KN Preamble images (Sonu CSV slide 28 directive).
  // Each image is large and clickable for a full-screen lightbox view so
  // teachers can zoom in on a projector if the body text is small.
  const [zoom, setZoom] = useState<string | null>(null);
  return (
    <div className="sr-preamble-pair">
      {slide.preamble_en && (
        <figure className="sr-preamble-card" onClick={() => setZoom(slide.preamble_en!)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.preamble_en} alt="Preamble (English)" />
          <figcaption>English</figcaption>
        </figure>
      )}
      {slide.preamble_kn && (
        <figure className="sr-preamble-card" onClick={() => setZoom(slide.preamble_kn!)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.preamble_kn} alt="Preamble (Kannada)" />
          <figcaption>ಕನ್ನಡ</figcaption>
        </figure>
      )}
      {zoom && (
        <div className="sr-preamble-zoom" onClick={() => setZoom(null)} role="dialog">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="" />
          <button className="sr-preamble-close" onClick={(e) => { e.stopPropagation(); setZoom(null); }}>×</button>
        </div>
      )}
    </div>
  );
}

// Video element with inter-question pauses. Used on slide 9 to bake the
// "5-sec think break" between MC questions directly into playback — the
// teacher does NOT need to manually pause. Walks the pause_at array; when
// currentTime crosses each timestamp, pauses the video, shows an overlay
// countdown, then resumes automatically. AKG/Savitha 24 Jun + Madhav 25 Jun.
function VideoWithPauses({
  src,
  loop,
  pauseAt,
  pauseDuration,
  onEnded,
}: {
  src: string;
  loop: boolean;
  pauseAt?: number[];
  pauseDuration: number;
  onEnded: () => void;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const consumed = useRef<Set<number>>(new Set());
  const [paused, setPaused] = useState(false);
  // Same "not produced yet" gap as McSlide — swap the broken native player
  // for an honest placeholder when the file 404s.
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // reset on src change
    consumed.current = new Set();
    setPaused(false);
    setFailed(false);
  }, [src]);

  useEffect(() => {
    // Full cleanup on unmount — pause and detach the video source so its
    // audio doesn't linger after navigating away.
    return () => {
      const v = ref.current;
      if (v) {
        try { v.pause(); } catch { /* ignore */ }
        v.removeAttribute("src");
        v.load();
      }
    };
  }, []);

  // Manual advance — pause at each `pause_at` boundary. Teacher must click
  // the → Continue button (corner of the video) to resume. No auto-countdown.
  // Rationale (Madhav, 6 Jul): classroom pace is dictated by the teacher,
  // not the video. `pause_duration` from the JSON is ignored on purpose.
  void pauseDuration;
  const lastTime = useRef(0);
  const onTimeUpdate = () => {
    const v = ref.current;
    if (!v || !pauseAt || pauseAt.length === 0) return;
    // Rewind detection — if the teacher scrubs backwards past a boundary,
    // that boundary should re-fire on next playthrough. Madhav 7 Jul school
    // pilot: 'if rewind, questions don't stop / everything autoplays'.
    if (v.currentTime + 0.5 < lastTime.current) {
      const cleared: number[] = [];
      for (const t of pauseAt) {
        if (t > v.currentTime && consumed.current.has(t)) {
          consumed.current.delete(t);
          cleared.push(t);
        }
      }
      void cleared;
    }
    lastTime.current = v.currentTime;
    if (paused) return;
    for (const t of pauseAt) {
      if (consumed.current.has(t)) continue;
      if (v.currentTime >= t && v.currentTime < t + 0.6) {
        consumed.current.add(t);
        v.pause();
        setPaused(true);
        break;
      }
    }
  };

  const resume = () => {
    const v = ref.current;
    if (v) v.play().catch(() => {});
    setPaused(false);
  };

  if (failed) {
    return (
      <div className="sr-vwp">
        <div className="sr-video-placeholder">▶ Video not yet produced<br /><small>{src}</small></div>
      </div>
    );
  }

  return (
    <div className="sr-vwp">
      <video
        ref={ref}
        controls
        playsInline
        loop={loop}
        src={src}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        onError={() => setFailed(true)}
      />
      {paused && (
        <>
          {/* Dim overlay behind the arrow, gives visual signal without blocking */}
          <div className="sr-vwp-dim" aria-hidden="true" />
          <button
            type="button"
            className="sr-vwp-next-btn"
            onClick={resume}
            aria-label="Continue to next question"
            title="Continue to next question"
          >
            →
          </button>
        </>
      )}
    </div>
  );
}

function AudioChip({ src }: { src: string }) {
  // Custom audio player — replaces the native <audio controls> for two reasons:
  // (1) the native control captures keyboard focus, so the right-arrow key
  //     seeks audio forward instead of advancing to the next slide;
  // (2) the native pill was tiny on a projector. This player is big enough
  //     to be visible from the back of a classroom.
  //
  // The underlying <audio> element is kept (no controls, tabIndex=-1) so it
  // never traps focus or keyboard events. Slide-level keyboard navigation
  // (ArrowRight / Space) keeps working regardless of which control the
  // teacher clicked last.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    // No autoplay — teacher clicks the play button when ready. Madhav
    // 7 Jul school pilot: audio triggering on slide entry was disruptive
    // in a classroom (kids' attention was still on the previous slide).
  }, [src]);

  useEffect(() => {
    // Full cleanup on unmount — pause and detach the audio source so it
    // doesn't keep playing after the user navigates away from an
    // audio-carrying slide. Companion to the VideoWithPauses cleanup.
    return () => {
      const el = audioRef.current;
      if (el) {
        try { el.pause(); } catch { /* ignore */ }
        el.removeAttribute("src");
        el.load();
      }
    };
  }, []);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) el.play(); else el.pause();
    // Blur the play button so focus returns to the slide root → keyboard
    // navigation keeps working immediately after click.
    (document.activeElement as HTMLElement | null)?.blur?.();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.currentTime = ratio * duration;
    (document.activeElement as HTMLElement | null)?.blur?.();
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${r.toString().padStart(2, "0")}`;
  };

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div className="sr-audio-card">
      <button
        className="sr-audio-play"
        onClick={toggle}
        aria-label={playing ? "Pause audio" : "Play audio"}
      >
        {playing ? "⏸" : "▶"}
      </button>
      <div className="sr-audio-meta">
        <div className="sr-audio-label">🔊 Audio</div>
        <div
          className="sr-audio-bar"
          onClick={seek}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={current}
        >
          <div className="sr-audio-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="sr-audio-time">
          <span>{fmt(current)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        tabIndex={-1}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent((e.target as HTMLAudioElement).currentTime)}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
      />
    </div>
  );
}

// ─────────────────────────── styles ─────────────────────────────────────────
// CMCA brand palette — sourced from apps/web/app/globals.css (MD3 tokens).
//   Primary  = CMCA orange  #F39C1F  (used in header / current-nav / progress)
//   Secondary= CMCA teal    #3CB6A6  (accent line / success / icons)
//   Deep teal #00332E       (text on light teal; not used as bg here)
//   Deep brown #5A3800      (slide headings — pairs with orange container)
//   Orange container #FFE7C2 (teacher tip / callout backgrounds)
const ORANGE = "#F39C1F";
const TEAL = "#3CB6A6";
const ORANGE_INK = "#5A3800";   // deep brown for text on light orange bg
const CREAM = "#FFFBF2";        // very light cream canvas
const ORANGE_BG = "#FFE7C2";    // light orange container
const INK = "#1F2937";
const MUTED = "#6B7280";
const SUCCESS = "#10844D";
const ERROR = "#BA1A1A";

// Back-compat aliases — older inline references in this file still use NAVY/SAFFRON names.
// Map them to brand tokens so we don't have to touch every rule below.
const NAVY = ORANGE_INK;        // dark accent / heading color
const SAFFRON = ORANGE;          // bright accent
const LIGHT_SAFFRON = ORANGE_BG;  // pale tint

const styles = `
  .sr-root {
    position: fixed; inset: 0; z-index: 9000;
    display: flex; flex-direction: column; height: 100vh;
    /* Branded wave background applied across the whole runtime UI —
       same image used on the title slides for visual continuity.
       The cream colour shows through as a tint behind the wave.
       Cards (transcript, callout, tip, audio) keep solid backgrounds
       so text stays legible on top. */
    background:
      url('/sessions/assets/branded_bg.jpg') no-repeat center / cover,
      ${CREAM};
    background-attachment: fixed;
    color: ${INK};
    /* Professional UI pair — Inter for English (clean sans), Noto Sans Kannada
       for Kannada. System fallbacks if Inter doesn't load. */
    font-family: "Inter", "Noto Sans Kannada", -apple-system, BlinkMacSystemFont,
                 "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-feature-settings: "cv11", "ss03";
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  /* Topbar — refined gradient + thin progress strip at the top edge. */
  .sr-topbar {
    /* Slim, restrained top strip — dropped the heavy orange gradient
       (Madhav, 6 Jul) so slide content owns the visual foreground.
       Progress bar remains as a thin coloured underline; lang toggle
       sits on the right. Session title reduced to a subtle grey caption. */
    display: flex; align-items: center; gap: 12px;
    padding: 6px 16px;
    background: #fff;
    color: ${NAVY};
    border-bottom: 1px solid rgba(0,0,0,.06);
    position: relative;
    min-height: 32px;
  }
  /* Thin top progress strip — sleek alternative to the in-bar progress bar. */
  .sr-topbar::after {
    /* Progress underline — saffron on white so it shows without being loud */
    content: "";
    position: absolute;
    left: 0; bottom: 0; height: 2px;
    background: ${ORANGE};
    width: var(--sr-progress, 0%);
    transition: width .35s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .sr-topbar-title { flex: 1; font-size: 12px; color: rgba(0,0,0,.5); font-weight: 500; letter-spacing: .02em; }
  .sr-lang-toggle { display: inline-flex; border: 1px solid rgba(0,0,0,.12); border-radius: 999px; overflow: hidden; }
  .sr-lang-btn { background: transparent; color: ${NAVY}; border: none; padding: 3px 10px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; letter-spacing: .02em; }
  .sr-lang-btn:hover:not(.is-disabled):not(.is-active) { background: rgba(255,255,255,.18); }
  .sr-lang-btn.is-active { background: ${ORANGE}; color: #fff; cursor: default; }
  .sr-lang-btn.is-disabled { opacity: .45; cursor: not-allowed; }
  .sr-translation-banner { background: #FFF3CD; color: #7A5D00; padding: 6px 16px; font-size: 13px; font-weight: 600; border-bottom: 1px solid #F1D77A; text-align: center; }
  .sr-sep { opacity: 0.4; margin: 0 6px; }
  .sr-icon-btn { background: transparent; color: ${NAVY}; border: 1px solid rgba(0,0,0,.12); padding: 2px 8px; border-radius: 6px; cursor: pointer; font-size: 14px; }
  .sr-progress { display: flex; align-items: center; gap: 10px; font-size: 12px; min-width: 220px; }
  .sr-progress-bar { width: 160px; height: 6px; background: rgba(255,255,255,.2); border-radius: 3px; overflow: hidden; }
  .sr-progress-bar > div { height: 100%; background: #fff; transition: width .25s ease; }

  .sr-body { display: flex; flex: 1; min-height: 0; }
  .sr-nav { width: 220px; background: ${TEAL}; color: #fff; padding: 16px 10px; display: flex; flex-direction: column; }
  .sr-nav-header { padding: 4px 8px 12px; border-bottom: 1px solid rgba(255,255,255,.15); margin-bottom: 12px; }
  .sr-nav-brand { font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
  .sr-nav-sub { font-size: 11px; color: ${LIGHT_SAFFRON}; margin-top: 4px; }
  .sr-nav-list { list-style: none; margin: 0; padding: 0; flex: 1; }
  .sr-nav-item { display: block; width: 100%; text-align: left; background: transparent; color: #fff; border: 0; padding: 9px 12px; border-radius: 8px; font-size: 13px; cursor: pointer; margin-bottom: 4px; }
  .sr-nav-item:hover { background: rgba(255,255,255,.08); }
  .sr-nav-item.is-current { background: ${ORANGE}; color: #fff; font-weight: 700; }
  .sr-nav-footer { font-size: 10px; opacity: 0.6; text-align: center; padding-top: 12px; }

  .sr-canvas {
    flex: 1; padding: 20px 32px 80px; overflow: hidden; position: relative;
    background: linear-gradient(rgba(255,251,242,0.35), rgba(255,251,242,0.45));
    scroll-behavior: smooth;
  }
  /* Scroll fallback — when content overflows too much to scale, allow
     vertical scrolling with a soft scroll-shadow hint at the bottom. */
  .sr-canvas.is-scrollable {
    overflow-y: auto;
    scrollbar-width: thin;
  }
  /* Scroll indicator — fixed at the bottom of the viewport so it's persistent
     and clearly visible on every slide where scrolling is needed. */
  .sr-canvas.is-scrollable::after {
    content: "↓ scroll for more";
    position: fixed;
    bottom: 14px; left: 50%;
    transform: translateX(-50%);
    padding: 5px 14px;
    background: rgba(0,0,0,0.6);
    color: #fff;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .04em;
    pointer-events: none;
    animation: sr-bounce 1.6s ease-in-out infinite;
    z-index: 8;
  }
  @keyframes sr-bounce {
    0%, 100% { transform: translateY(0); opacity: 0.85; }
    50%      { transform: translateY(-3px); opacity: 1; }
  }
  /* Hide the bottom-left CMCA brand on video slides — slide 27's Asfiya
     video already has the logo baked in, and slide 3 MC video shows
     CMCA inside its own watermark. Avoids visual stacking. */
  .sr-root:has(.sr-canvas.is-video-slide) .sr-brand-corner {
    opacity: 0;
    pointer-events: none;
  }
  /* Transcript panel — below the video, scrollable inside. AKG/Savitha
     25 Jun: previously sat beside the video, made layout cramped. */
  .sr-transcript-below {
    margin: 14px auto 0;
    max-width: 1000px;
    background: rgba(255,255,255,0.96);
    border: 1px solid rgba(0,0,0,.06);
    border-radius: 14px;
    padding: 16px 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,.06);
    max-height: 220px;
    overflow-y: auto;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    animation: sr-transcript-in .22s ease-out;
  }
  @keyframes sr-transcript-in {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .sr-transcript-below p { margin: 0; font-size: 14px; line-height: 1.6; color: ${INK}; }
  /* Make preamble figures look clickable. */
  .sr-preamble-card { cursor: zoom-in; transition: transform .15s ease, box-shadow .15s ease; }
  .sr-preamble-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,.10); }
  /* Make the preamble close X more visible — white circle with dark X. */
  .sr-preamble-close {
    background: rgba(255,255,255,0.98) !important;
    color: #1a1a1a !important;
    font-size: 28px !important;
    font-weight: 300 !important;
    width: 48px !important;
    height: 48px !important;
    box-shadow: 0 4px 14px rgba(0,0,0,0.3) !important;
  }
  .sr-preamble-close:hover { background: #fff !important; transform: scale(1.05); }
  /* Fit-to-viewport wrapper: holds the slide's natural content size and
     gets a CSS transform: scale(N) applied by JS when content overflows
     the canvas. transform-origin: top center keeps the top of the slide
     anchored so the section crumb + title don't drift.
     Subtle fade-up motion on slide change for a polished feel. */
  .sr-canvas-fit {
    transform-origin: top center;
    width: 100%;
    animation: sr-slide-in .35s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes sr-slide-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .sr-canvas.is-projector .sr-canvas-fit {
    /* Projector-mode is-projector centers vertically via flex on the
       canvas; the fit wrapper should still measure as one block. */
    display: flex; flex-direction: column; align-items: center;
  }
  /* Projector mode: horizontally centred, TOP-aligned (was vertically
     centred — Madhav 6 Jul: tall slides like 12/18 with 5 body lines were
     letting the transform-scaled title bleed above the canvas and get
     covered by the top bar). Top-align keeps the title anchored below the
     topbar regardless of body length. Short slides get breathing room as
     bottom whitespace instead of dead space above. */
  .sr-canvas.is-projector { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; text-align: center; padding-top: 24px; }
  .sr-canvas.is-projector .sr-section-crumb { align-self: center; }
  .sr-canvas.is-projector .sr-title { font-size: 40px; text-align: center; margin: 6px 0 10px; }
  .sr-canvas.is-projector .sr-accent { margin: 0 auto 24px; }
  .sr-canvas.is-projector .sr-slide-body { max-width: 1100px; font-size: 22px; line-height: 1.5; }
  .sr-canvas.is-projector .sr-line { font-size: 24px; margin: 10px 0; line-height: 1.4; }
  .sr-canvas.is-projector .sr-bullets-lg { list-style: none; padding: 0; }
  .sr-canvas.is-projector .sr-bullets-lg li { font-size: 30px; margin: 18px 0; }
  .sr-canvas.is-projector .sr-callout { font-size: 22px; margin: 24px auto 0; max-width: 900px; }
  /* Section crumb + title + accent — centered horizontally on every slide
     so the layout reads as a presentation, not a left-aligned doc. */
  .sr-section-crumb { color: ${SAFFRON}; font-weight: 700; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; text-align: center; }
  .sr-title { font-size: 36px; color: ${NAVY}; margin: 4px auto 10px; line-height: 1.2; text-align: center; max-width: 1100px; font-weight: 700; }
  .sr-accent { width: 56px; height: 5px; background: ${SAFFRON}; border-radius: 3px; margin: 0 auto 24px; }
  /* Slide body — centered horizontally regardless of nav-rail state. */
  .sr-slide-body { font-size: 18px; line-height: 1.5; max-width: 1100px; margin: 0 auto; width: 100%; }

  .sr-line { margin: 0 0 12px; font-size: 22px; }
  /* Callout — softer styling, smaller font per AKG/Savitha 25 Jun feedback
     (slide 7 in particular). */
  .sr-callout {
    background: ${LIGHT_SAFFRON};
    border: 1px solid ${SAFFRON};
    color: ${NAVY};
    padding: 10px 14px;
    border-radius: 8px;
    margin-top: 18px;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.45;
    max-width: 720px;
  }

  .sr-title-hero { text-align: center; padding: 40px 0; }
  .sr-title-hero h2 { font-size: 48px; color: ${NAVY}; margin: 0 0 12px; font-weight: 700; }
  /* Branded welcome / thank-you slide — mirrors the comms-team
     pptx layout (wavy white bg + KREIS round seal + CMCA mark
     + dual-language title). */
  .sr-branded-title {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 32px 24px;
    text-align: center;
    overflow: hidden;
    border-radius: 16px;
    margin: 0 auto;
    max-width: 1100px;
  }
  .sr-branded-bg {
    position: absolute; inset: 0;
    background: url('/sessions/assets/branded_bg.jpg') no-repeat center / cover;
    z-index: 0;
  }
  .sr-branded-logos {
    position: relative; z-index: 2;
    display: flex; align-items: flex-start;
    justify-content: center;
    gap: 60px;
    width: 100%;
    max-width: 900px;
    margin-bottom: 28px;
  }
  .sr-kreis-seal {
    width: 140px; height: 140px;
    object-fit: contain;
    filter: drop-shadow(0 4px 14px rgba(0,0,0,0.15));
  }
  .sr-cmca-mark {
    width: 80px; height: auto;
    object-fit: contain;
    margin-top: 16px;
    filter: drop-shadow(0 4px 10px rgba(0,0,0,0.12));
  }
  .sr-branded-titles { position: relative; z-index: 2; max-width: 900px; }
  .sr-branded-en {
    font-size: 56px;
    line-height: 1.15;
    color: ${ORANGE_INK};
    margin: 0 0 18px;
    font-weight: 800;
  }
  .sr-branded-kn {
    font-size: 44px;
    line-height: 1.25;
    color: ${ORANGE};
    margin: 0;
    font-weight: 700;
    font-family: "Noto Sans Kannada", "Noto Serif Kannada", sans-serif;
  }
  .sr-branded-thanks {
    font-size: 64px;
    color: ${ORANGE};
    margin: 36px 0 0;
    font-weight: 800;
    letter-spacing: .02em;
  }
  .sr-branded-title .sr-subtitle {
    margin-top: 24px;
    font-size: 22px;
    color: ${ORANGE_INK};
    opacity: 0.8;
    letter-spacing: .08em;
    font-weight: 600;
  }
  /* AKG/Savitha 16 Jun: closing-line under the title on the final slide. */
  .sr-branded-closing {
    margin: 28px auto 0;
    max-width: 720px;
    font-family: "Noto Sans Kannada", "Trebuchet MS", sans-serif;
    font-size: 20px;
    line-height: 1.5;
    color: ${INK};
    opacity: 0.92;
    text-align: center;
    font-weight: 500;
  }
  /* On the branded title slide, the audio card needs to centre under the
     title (the parent uses align-items: center but the audio card is a
     fixed-width block, so we explicitly centre it via flex inside its
     wrapper). */
  .sr-branded-audio { position: relative; z-index: 2; margin-top: 36px; width: 100%; display: flex; justify-content: center; }
  .sr-branded-audio .sr-audio-card { margin-top: 0; }
  .sr-subtitle { font-size: 22px; color: ${SAFFRON}; }

  /* MC slide grid — bigger video frame per AKG/Savitha 25 Jun. When the
     transcript toggle is closed (default), video takes the full canvas
     width. When opened, splits into video-heavy + transcript pane. */
  .sr-mc-grid { display: grid; gap: 24px; }
  .sr-mc-grid.is-video-wide { grid-template-columns: 1fr; max-width: 1100px; margin: 0 auto; }
  .sr-mc-grid.is-with-transcript { grid-template-columns: 2fr 1fr; }
  .sr-mc-grid .sr-video-frame { width: 100%; min-height: 420px; }
  .sr-mc-grid.is-video-wide .sr-video-frame { min-height: 520px; }
  /* Partner-org strip under MC narration slides (slide 3). */
  .sr-mc-partners { margin-top: 28px; }
  .sr-mc-partners-label { font-size: 12px; font-weight: 800; color: ${ORANGE}; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 10px; }
  /* ── Preamble pair (slide 28) — two large posters side by side,
     click to zoom for projector legibility. ── */
  .sr-preamble-pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 28px;
    max-width: 1180px;
    margin: 0 auto;
    padding: 8px 0 32px;
  }
  .sr-preamble-card {
    margin: 0;
    background: #fff;
    border: 2px solid ${ORANGE};
    border-radius: 14px;
    padding: 14px 14px 12px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.08);
    cursor: zoom-in;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    transition: transform .15s ease, box-shadow .15s ease;
  }
  .sr-preamble-card:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,0.12); }
  .sr-preamble-card img {
    width: 100%; height: auto;
    max-height: 64vh;
    object-fit: contain;
    border-radius: 8px;
  }
  .sr-preamble-card figcaption {
    font-size: 14px; font-weight: 800;
    color: ${ORANGE_INK};
    letter-spacing: .04em;
    text-transform: uppercase;
  }
  .sr-preamble-zoom {
    position: fixed; inset: 0; z-index: 10000;
    background: rgba(0,0,0,0.86);
    display: flex; align-items: center; justify-content: center;
    padding: 40px;
    cursor: zoom-out;
  }
  .sr-preamble-zoom img { max-width: 95vw; max-height: 95vh; object-fit: contain; border-radius: 8px; box-shadow: 0 12px 40px rgba(0,0,0,0.6); }
  .sr-preamble-close {
    position: absolute; top: 18px; right: 24px;
    width: 44px; height: 44px;
    border-radius: 50%; border: none;
    background: ${ORANGE}; color: white;
    font-size: 26px; line-height: 1;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  }
  .sr-preamble-close:hover { background: #d8851a; }
  .sr-video-frame { background: #e5e7eb; border-radius: 12px; aspect-ratio: 16 / 9; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; }
  .sr-video-frame video { width: 100%; height: 100%; object-fit: contain; background: #000; }
  /* CMCA logo overlay — masks the Veo watermark at bottom-right.
     Applied via ::after so we don't need to touch every video element's JSX.
     pointer-events: none so it never blocks the play/pause controls. */
  .sr-video-frame::after {
    content: '';
    position: absolute;
    bottom: 14px;
    right: 14px;
    width: 64px;
    height: 76px;
    background: url('/sessions/assets/cmca_logo.png') no-repeat center / contain;
    pointer-events: none;
    z-index: 5;
    /* subtle drop shadow so the logo sits cleanly on any frame background */
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));
  }
  .sr-video-placeholder { color: ${MUTED}; text-align: center; font-size: 18px; font-weight: 600; }
  .sr-transcript { background: #fff; border: 1px solid #e5e7eb; padding: 16px; border-radius: 10px; max-height: 360px; overflow-y: auto; }
  .sr-transcript-label { color: ${SAFFRON}; font-weight: 700; font-size: 11px; text-transform: uppercase; margin-bottom: 8px; }
  .sr-transcript p { margin: 0; font-size: 14px; line-height: 1.55; }

  .sr-timer-grid { display: grid; grid-template-columns: 1fr 320px; gap: 32px; align-items: center; }
  .sr-brief p { font-size: 22px; line-height: 1.4; margin: 0; }
  .sr-timer-ring { position: relative; width: 320px; height: 320px; color: ${SAFFRON}; }
  .sr-timer-ring.is-warn { color: ${ERROR}; }
  .sr-timer-ring.is-flash { animation: pulse 1s infinite; }
  @keyframes pulse { 50% { opacity: 0.55; } }
  .sr-timer-ring svg { width: 100%; height: 100%; transform: scale(1); }
  .sr-timer-readout { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }
  .sr-timer-digits { font-size: 56px; font-weight: 700; color: ${NAVY}; font-variant-numeric: tabular-nums; }
  .sr-timer-label { font-size: 12px; letter-spacing: 1px; color: ${NAVY}; margin-top: 4px; }
  .sr-timer-controls { position: absolute; bottom: -10px; left: 50%; transform: translate(-50%, 100%); display: flex; gap: 10px; }

  /* End-of-timer modal — big, loud, unmissable. Uses the same saffron
     accent as the pause button. Teachers dismiss with OK. */
  .sr-timer-modal {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.55);
    display: flex; align-items: center; justify-content: center;
    z-index: 100;
    animation: sr-fade-in .18s ease-out;
  }
  .sr-timer-modal-inner {
    background: #fff;
    border-radius: 20px;
    padding: 36px 44px;
    max-width: 460px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  }
  .sr-timer-modal-icon { font-size: 64px; line-height: 1; margin-bottom: 8px; }
  .sr-timer-modal-title { font-size: 30px; font-weight: 800; color: ${NAVY}; margin-bottom: 8px; }
  .sr-timer-modal-sub { font-size: 15px; color: ${MUTED}; margin-bottom: 20px; }

  .sr-reveal { max-width: 900px; }
  .sr-intro { color: ${MUTED}; margin: 0 0 18px; font-size: 14px; }
  .sr-reveal-list { list-style: none; padding: 0; margin: 0; }
  .sr-reveal-item { display: flex; gap: 14px; align-items: flex-start; padding: 14px 16px; background: #fff; border-radius: 10px; margin-bottom: 10px; transition: opacity .25s ease, background .25s ease; border: 1px solid #e5e7eb; }
  .sr-reveal-item.is-hidden { background: rgba(255,255,255,.5); }
  .sr-reveal-num { background: ${SAFFRON}; color: ${NAVY}; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
  .sr-reveal-body { font-size: 17px; line-height: 1.4; }
  .sr-reveal-mask { color: ${MUTED}; font-style: italic; font-size: 14px; }
  .sr-reveal-controls { display: flex; gap: 12px; align-items: center; margin-top: 16px; }
  .sr-footer-cheer { margin-top: 18px; padding: 12px 14px; background: #e8f5ed; color: ${SUCCESS}; border-radius: 8px; font-weight: 700; }

  /* MCQ — centered layout. Slide 25 was rendering with empty right side; */
  /* now the scenario + options are both centered within max-width. */
  .sr-mcq { max-width: 820px; margin: 0 auto; text-align: center; }
  .sr-scenario { font-size: 20px; margin: 0 auto 24px; max-width: 720px; line-height: 1.5; }
  .sr-options { list-style: none; padding: 0; margin: 0 auto; max-width: 680px; text-align: left; }
  .sr-options li { margin-bottom: 12px; }
  .sr-option { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 16px; background: #fff; border: 2px solid #e5e7eb; border-radius: 10px; cursor: pointer; transition: all .15s ease; text-align: left; font-family: inherit; font-size: 16px; color: ${INK}; }
  .sr-option:hover:not(:disabled) { border-color: ${SAFFRON}; }
  .sr-option:disabled { cursor: default; }
  .sr-option.is-correct { background: #e8f5ed; border-color: ${SUCCESS}; color: ${SUCCESS}; font-weight: 700; }
  .sr-option.is-wrong { background: #fdecec; border-color: ${ERROR}; color: ${ERROR}; }
  .sr-option.is-dim { opacity: 0.45; }
  .sr-option-letter { background: ${NAVY}; color: #fff; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; font-size: 14px; }
  .sr-option-body { flex: 1; }
  .sr-option-mark { font-size: 22px; font-weight: 800; }
  .sr-feedback { margin-top: 18px; padding: 12px 14px; border-radius: 8px; font-weight: 600; }
  .sr-feedback.is-right { background: #e8f5ed; color: ${SUCCESS}; }
  .sr-feedback.is-close { background: #fff3cd; color: #92400e; }

  .sr-reflect { max-width: 900px; }
  .sr-reflect blockquote { font-size: 28px; color: ${NAVY}; line-height: 1.4; margin: 20px 0; border-left: 4px solid ${SAFFRON}; padding-left: 20px; font-style: italic; }
  .sr-reflect-hint { color: ${MUTED}; font-size: 14px; }

  /* Video frame — always centered horizontally with a max-width cap so it
     doesn't stretch awkwardly on wide screens. */
  .sr-video-large {
    background: #000;
    border-radius: 12px;
    aspect-ratio: 16 / 9;
    max-height: 64vh;
    max-width: 1080px;
    margin: 0 auto;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
    box-shadow: 0 16px 48px rgba(0,0,0,.18);
  }
  .sr-video-large video { width: 100%; height: 100%; object-fit: contain; }
  .sr-vwp { position: relative; width: 100%; height: 100%; }
  .sr-vwp video { width: 100%; height: 100%; object-fit: contain; }
  /* Inter-question pause — subtle dim behind a corner arrow. Teacher clicks
     the arrow to advance; no auto-countdown (Madhav directive 6 Jul). */
  .sr-vwp-dim {
    position: absolute; inset: 0;
    background: rgba(0,0,0,0.28);
    z-index: 4;
    pointer-events: none;
    animation: sr-fade-in .2s ease-out;
  }
  @keyframes sr-fade-in { from { opacity: 0; } to { opacity: 1; } }
  .sr-vwp-next-btn {
    /* Positioned bottom-LEFT to keep clear of the CMCA logo overlay
       (which sits bottom-right on .sr-video-large::after). */
    position: absolute;
    bottom: 20px; left: 20px;
    width: 68px; height: 68px;
    border-radius: 50%;
    background: ${SAFFRON};
    color: ${NAVY};
    border: 3px solid #fff;
    font-size: 32px;
    font-weight: 800;
    line-height: 1;
    cursor: pointer;
    z-index: 6;
    box-shadow: 0 6px 22px rgba(0,0,0,0.35);
    transition: transform .12s ease, background .12s ease;
    animation: sr-pulse 1.6s ease-in-out infinite;
    display: flex; align-items: center; justify-content: center;
  }
  .sr-vwp-next-btn:hover { transform: scale(1.06); background: #ffb84d; }
  .sr-vwp-next-btn:active { transform: scale(0.98); }
  @keyframes sr-pulse {
    0%, 100% { box-shadow: 0 6px 22px rgba(0,0,0,0.35), 0 0 0 0 rgba(255,180,50,0.7); }
    50%      { box-shadow: 0 6px 22px rgba(0,0,0,0.35), 0 0 0 12px rgba(255,180,50,0); }
  }
  /* CMCA logo overlay for the large video player — same masking strategy
     as .sr-video-frame, scaled up slightly for the bigger frame. */
  .sr-video-large::after {
    content: '';
    position: absolute;
    bottom: 18px;
    right: 18px;
    width: 88px;
    height: 104px;
    background: url('/sessions/assets/cmca_logo.png') no-repeat center / contain;
    pointer-events: none;
    z-index: 5;
    filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
  }

  .sr-preamble { max-width: 900px; line-height: 1.7; }
  .sr-preamble p { font-size: 18px; margin: 0 0 10px; }
  .sr-preamble p.is-hero { font-size: 24px; font-weight: 700; color: ${NAVY}; margin-bottom: 16px; }

  .sr-audio-chip { display: inline-flex; align-items: center; gap: 10px; background: ${CREAM}; border: 1px solid ${SAFFRON}; padding: 8px 14px; border-radius: 999px; margin-top: 20px; font-size: 13px; }
  /* New custom audio player — bigger, classroom-projector friendly.
     Replaces the cramped .sr-audio-chip pill. */
  .sr-audio-card {
    display: flex; align-items: center; gap: 18px;
    background: ${CREAM};
    border: 2px solid ${ORANGE};
    border-radius: 16px;
    padding: 16px 22px;
    margin: 24px auto 0;     /* centred horizontally so it aligns with text above on static slides */
    max-width: 560px;
    box-shadow: 0 4px 14px rgba(243,156,31,0.18);
  }
  .sr-audio-play {
    flex: 0 0 auto;
    width: 60px; height: 60px;
    border-radius: 50%;
    border: none;
    background: ${ORANGE};
    color: white;
    font-size: 26px;
    line-height: 1;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(243,156,31,0.35);
    transition: transform .08s ease, background .15s ease;
  }
  .sr-audio-play:hover { background: #d8851a; transform: scale(1.06); }
  .sr-audio-play:active { transform: scale(0.96); }
  .sr-audio-meta { flex: 1 1 auto; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .sr-audio-label { font-size: 13px; font-weight: 700; color: ${ORANGE_INK}; letter-spacing: .04em; text-transform: uppercase; }
  .sr-audio-bar {
    height: 10px;
    background: rgba(243,156,31,0.18);
    border-radius: 999px;
    overflow: hidden;
    cursor: pointer;
    position: relative;
  }
  .sr-audio-bar:hover { background: rgba(243,156,31,0.28); }
  .sr-audio-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, ${ORANGE}, #ffa940);
    border-radius: 999px;
    transition: width .12s linear;
  }
  .sr-audio-time {
    display: flex; justify-content: space-between;
    font-size: 12px; font-weight: 600; color: ${ORANGE_INK};
    font-variant-numeric: tabular-nums;
  }

  /* Teacher Tip — AKG/Savitha 16 Jun v2: docked top-right, below the
     header bar. Auto-shows for 5s on slide entry then auto-hides; the
     teacher can click the 🧑‍🏫 pill to bring it back. Translucent
     backdrop + small width + soft entrance animation. */
  .sr-tip {
    position: fixed; top: 60px; right: 16px;
    max-width: 320px; max-height: 50vh; overflow-y: auto;
    background: rgba(254, 243, 199, 0.94);
    backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
    border: 1px solid ${SAFFRON};
    border-radius: 10px;
    padding: 10px 28px 10px 12px;
    box-shadow: 0 6px 18px rgba(0,0,0,.12);
    z-index: 10;
    font-size: 12px;
    animation: sr-tip-in .25s ease-out;
  }
  @keyframes sr-tip-in {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .sr-tip-label { color: ${NAVY}; font-size: 10px; font-weight: 800; letter-spacing: 1px; margin-bottom: 3px; }
  .sr-tip-body { color: ${INK}; font-size: 12px; line-height: 1.4; }
  .sr-tip-close { position: absolute; top: 4px; right: 6px; background: transparent; border: none; color: ${NAVY}; font-size: 18px; font-weight: 700; line-height: 1; cursor: pointer; padding: 2px 6px; border-radius: 6px; }
  .sr-tip-close:hover { background: rgba(0,0,0,0.08); }
  .sr-tip-toggle { position: fixed; top: 44px; right: 12px; background: ${LIGHT_SAFFRON}; border: 1px solid ${SAFFRON}; color: ${NAVY}; border-radius: 999px; padding: 6px 14px; font-size: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,.08); z-index: 20; }
  .sr-tip-toggle:hover { background: ${SAFFRON}; color: white; }
  .sr-tip-toggle.is-open { background: #fff; }
  .sr-tip-panel {
    position: fixed;
    top: 82px; right: 12px;
    width: 300px; max-width: calc(100vw - 24px);
    background: #fffbe8;
    border: 1.5px solid ${SAFFRON};
    border-radius: 12px;
    padding: 14px 16px;
    box-shadow: 0 8px 24px rgba(0,0,0,.12);
    z-index: 19;
    animation: sr-fade-in .18s ease-out;
    max-height: 60vh; overflow-y: auto;
  }
  .sr-tip-panel-label { font-size: 11px; font-weight: 700; color: ${SAFFRON}; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 6px; }
  .sr-tip-panel p { margin: 0; font-size: 14px; line-height: 1.5; color: ${NAVY}; white-space: pre-line; }

  /* Bottom controls — AKG/Savitha 25 Jun: hidden by default, slide up on
     hover of the bottom edge OR of the bar itself. Auto-hides on leave.
     Translucent + blur for a modern UI feel. */
  /* Prev/Next — anchored to the bottom-left corner (moved off the
     vertically-centered left edge, which sat on top of the hamburger nav
     rail whenever it was open). Horizontal row: Prev, slide counter,
     Next as the primary action. Always visible; large tap targets for
     touch UX. */
  .sr-side-nav {
    position: fixed;
    left: 16px; bottom: 14px;
    display: flex; flex-direction: row; gap: 10px;
    align-items: center;
    z-index: 15;
    pointer-events: none;
  }
  .sr-side-nav > * { pointer-events: auto; }
  .sr-side-btn {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    width: 60px; min-height: 78px;
    padding: 10px 6px;
    background: rgba(255,255,255,0.94);
    color: ${NAVY};
    border: 1.5px solid rgba(0,0,0,.08);
    border-radius: 14px;
    font-family: inherit;
    cursor: pointer;
    box-shadow: 0 3px 14px rgba(0,0,0,0.10);
    transition: transform .12s ease, background .12s ease, opacity .2s ease;
  }
  .sr-side-btn:hover { background: #fff; transform: translateX(2px); }
  .sr-side-btn:active { transform: translateX(0) scale(0.98); }
  .sr-side-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .sr-side-btn-primary { background: ${ORANGE}; color: #fff; border-color: ${ORANGE}; }
  .sr-side-btn-primary:hover { background: #ff8c00; }
  .sr-side-icon { font-size: 28px; line-height: 1; font-weight: 700; }
  .sr-side-label { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; margin-top: 4px; }
  .sr-side-count {
    text-align: center;
    color: ${NAVY};
    font-size: 12px;
    font-weight: 600;
    padding: 6px 10px;
    background: rgba(255,255,255,0.7);
    border-radius: 10px;
    letter-spacing: .05em;
  }

  /* Responsive breakpoints (Madhav 7 Jul: mobile, tablet, projector,
     smartboard all need to work). Side nav shrinks on narrow screens. */
  @media (max-width: 640px) {
    .sr-side-btn { width: 44px; min-height: 58px; padding: 6px 4px; }
    .sr-side-icon { font-size: 22px; }
    .sr-side-label { font-size: 9px; }
    .sr-side-count { font-size: 10px; padding: 4px 6px; }
    .sr-side-nav { left: 6px; gap: 6px; }
  }
  @media (min-width: 2000px) {
    /* Big projector / 4K smartboard — scale up the side buttons */
    .sr-side-btn { width: 84px; min-height: 108px; padding: 14px 8px; }
    .sr-side-icon { font-size: 40px; }
    .sr-side-label { font-size: 14px; }
    .sr-side-count { font-size: 15px; padding: 8px 14px; }
    .sr-side-nav { left: 24px; gap: 14px; }
  }
  /* CMCA brand corner — fixed bottom-right (moved off bottom-left to make
     room for Prev/Next), present on every slide. */
  .sr-brand-corner {
    position: fixed;
    bottom: 14px;
    right: 18px;
    width: 56px;
    height: auto;
    z-index: 9;
    opacity: 0.88;
    filter: drop-shadow(0 2px 6px rgba(0,0,0,0.12));
    pointer-events: none;
  }
  /* Transcript toggle pill — sits below videos/MC frames. */
  .sr-transcript-toggle {
    display: inline-flex; align-items: center; gap: 6px;
    margin-top: 14px;
    padding: 7px 16px;
    background: rgba(255,255,255,0.85);
    border: 1px solid rgba(0,0,0,.08);
    border-radius: 999px;
    color: ${INK};
    font-family: inherit; font-size: 12px; font-weight: 600; letter-spacing: .02em;
    cursor: pointer;
    transition: background .15s ease, border-color .15s ease, transform .08s ease;
    backdrop-filter: blur(4px);
  }
  .sr-transcript-toggle:hover { background: ${LIGHT_SAFFRON}; border-color: ${SAFFRON}; }
  .sr-transcript-toggle:active { transform: scale(0.97); }
  /* Big hero image on title slides (slide 29 closing). */
  .sr-branded-hero {
    margin: 24px auto 0;
    display: flex;
    justify-content: center;
  }
  .sr-branded-hero img {
    width: clamp(180px, 24vw, 320px);
    height: auto;
    filter: drop-shadow(0 8px 24px rgba(0,0,0,0.10));
  }
  .sr-hint { flex: 1; text-align: center; color: ${MUTED}; font-size: 12px; } /* deprecated — bottom bar removed 7 Jul */
  .sr-btn { background: #fff; border: 1px solid #e5e7eb; padding: 9px 18px; border-radius: 8px; cursor: pointer; font-family: inherit; font-size: 14px; color: ${INK}; }
  .sr-btn:hover:not(:disabled) { border-color: ${SAFFRON}; }
  .sr-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .sr-btn-primary { background: ${ORANGE}; border-color: ${ORANGE}; color: #fff; font-weight: 700; }
  .sr-btn-primary:hover:not(:disabled) { background: #d68310; border-color: #d68310; }

  /* ── New (post-Sonu-call edits) ─────────────────────────────────────── */

  /* Large bullet list — slide 7 (Form Groups), slide 16 (Write rules) */
  .sr-line-lg { font-size: 28px; line-height: 1.4; }
  .sr-bullets-lg { font-size: 28px; line-height: 1.5; color: ${INK}; padding-left: 28px; margin: 0; }
  .sr-bullets-lg li { margin-bottom: 14px; }
  .sr-bullets-lg li::marker { color: ${ORANGE}; }

  /* Static slide with companion image — slide 6 (flat tyre), 22 (Ambedkar), 26 (Asfiya) */
  .sr-video-instructions { text-align: center; margin-bottom: 18px; }
  .sr-video-instruction-line { font-size: 22px; color: ${INK}; margin: 6px 0; font-weight: 600; }
  /* Static + image — two layouts. Default "stack" = single column centred;
     "side" = text and image side-by-side (slides 6, 7). */
  .sr-static-with-image.is-stack {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    text-align: center;
  }
  .sr-static-with-image.is-stack .sr-static-text { max-width: 820px; }
  .sr-static-with-image.is-stack .sr-static-image { max-width: 520px; }
  .sr-static-with-image.is-side {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    align-items: center;
    max-width: 1100px;
    margin: 0 auto;
  }
  .sr-static-with-image.is-side .sr-static-text { text-align: left; }
  .sr-static-with-image.is-side .sr-static-image { width: 100%; }
  .sr-static-with-image.is-side .sr-static-image-grid {
    justify-content: center;
    align-items: center;
  }
  .sr-static-text { min-width: 0; }
  .sr-static-image { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 8px; box-shadow: 0 2px 8px rgba(0,0,0,.05); }
  .sr-static-image img { width: 100%; height: auto; display: block; border-radius: 8px; }
  /* Multi-image strip for slides like 7 (Form Groups reference photos)
     and 8 (KSRTC + KREIS inspiration logos). Auto-flows in a row. */
  /* Logo / reference image strip — centered grid that doesn't sprawl when
     there are few items (slide 8: KSRTC + KREIS logos). */
  .sr-static-image-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 18px;
    margin: 0 auto;
    max-width: 1000px;
  }
  .sr-static-image-grid .sr-image-card {
    flex: 0 1 280px;
    max-width: 340px;
  }
  .sr-image-card { margin: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px; box-shadow: 0 2px 8px rgba(0,0,0,.05); display: flex; flex-direction: column; gap: 8px; }
  .sr-image-card img { width: 100%; height: 200px; object-fit: contain; display: block; }
  .sr-image-card figcaption { font-size: 12px; font-weight: 700; color: ${ORANGE_INK}; text-align: center; text-transform: uppercase; letter-spacing: .04em; }
  /* Brief panel on timer slides also supports companion logos beneath
     the brief text — used for slide 8 (KSRTC + KREIS logo inspiration). */
  .sr-brief-logos { display: flex; gap: 22px; margin-top: 24px; flex-wrap: wrap; align-items: flex-end; }
  .sr-brief-logo { margin: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
  .sr-brief-logo img { height: 140px; width: auto; object-fit: contain; display: block; }
  .sr-brief-logo figcaption { font-size: 14px; font-weight: 800; color: ${ORANGE_INK}; letter-spacing: .04em; }

  /* Video slide with post-video reveal — slide 5 (Eyes on Me) + slide 15 (MC raising hand) */
  /* Video container — fully centered; instructions above and transcript
     below all sit centred. */
  .sr-video-large-wrap { display: flex; flex-direction: column; gap: 18px; align-items: center; width: 100%; }
  /* Video row: when a transcript is present, video + transcript sit side
     by side; otherwise video fills the row. Mirrors the .sr-mc-grid
     layout used by mc_narration slides for visual consistency. */
  /* Video row — always single column, centered. Transcript moved below
     via the toggle (sr-transcript-below). */
  .sr-video-row { display: flex; justify-content: center; width: 100%; }
  .sr-video-row .sr-video-large { width: 100%; }
  .sr-video-transcript { background: ${ORANGE_BG}; border: 1px solid ${ORANGE}; border-radius: 12px; padding: 14px 16px; max-height: 70vh; overflow-y: auto; }
  .sr-video-transcript p { margin: 0; font-size: 15px; line-height: 1.55; color: ${INK}; }
  .sr-post-video { display: flex; justify-content: center; padding: 8px 0; }
  .sr-post-video-text {
    background: ${ORANGE}; color: #fff; font-weight: 800; font-size: 36px;
    padding: 18px 36px; border-radius: 12px; letter-spacing: 1px;
    animation: srPopIn .35s ${`cubic-bezier(.2,.8,.2,1)`};
    box-shadow: 0 8px 24px rgba(243,156,31,.35);
  }
  .sr-post-video-hint { color: ${MUTED}; font-style: italic; font-size: 14px; }
  @keyframes srPopIn { from { transform: scale(.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }

  /* video_question_series — slide 9 */
  .sr-vqs { display: flex; flex-direction: column; gap: 16px; }
  .sr-vqs-intro { font-size: 18px; color: ${MUTED}; font-style: italic; margin: 0; }
  .sr-vqs-question {
    display: flex; align-items: flex-start; gap: 14px;
    background: #fff; border: 2px solid #e5e7eb; border-radius: 12px; padding: 16px 20px;
    font-size: 22px; line-height: 1.35; transition: border-color .25s, background .25s;
  }
  .sr-vqs-question.is-active {
    border-color: ${ORANGE}; background: ${ORANGE_BG};
    box-shadow: 0 4px 14px rgba(243,156,31,.18);
  }
  .sr-vqs-num {
    flex-shrink: 0; background: ${TEAL}; color: #fff; padding: 4px 10px;
    border-radius: 999px; font-weight: 700; font-size: 14px; letter-spacing: .5px;
  }
  .sr-vqs-controls { display: flex; align-items: center; gap: 16px; padding-top: 4px; }
  .sr-vqs-counter { flex: 1; text-align: center; font-weight: 700; color: ${ORANGE_INK}; font-size: 14px; }
  .sr-vqs-done { flex: 1; text-align: right; color: ${SUCCESS}; font-weight: 700; font-size: 14px; }
`;
