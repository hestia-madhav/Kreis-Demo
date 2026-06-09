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
  | "preamble";

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
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  // Re-open the tip every time we land on a new slide. Teachers dismiss
  // per-slide when it overlaps controls (e.g. slide 9's "Next question"),
  // but should see the next slide's tip by default.
  useEffect(() => { setTipOpen(true); }, [idx]);

  const slide = session.slides[idx];

  const sectionOf = useCallback(
    (n: number) => session.sections.find((s) => s.slides.includes(n))!,
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
    <div ref={containerRef} className="sr-root" lang={activeLang}>
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
              <div className="sr-nav-sub">CC Club · Session 1</div>
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
        <main className={"sr-canvas " + (
          (slide.kind === "static" || slide.kind === "reflect_share")
            ? "is-projector"
            : ""
        )}>
          <div className="sr-section-crumb">{currentSection.label}</div>
          <h1 className="sr-title">{slide.title}</h1>
          <div className="sr-accent" />

          <div className="sr-slide-body">
            <SlideBody slide={slide} onEvent={onEvent} onAdvance={next} />
          </div>

          {/* Teacher tip — collapsible so it doesn't cover on-slide controls */}
          {slide.tip && (
            tipOpen ? (
              <aside className="sr-tip">
                <button
                  className="sr-tip-close"
                  onClick={() => setTipOpen(false)}
                  aria-label="Hide teacher tip"
                  title="Hide tip"
                >×</button>
                <div className="sr-tip-label">🧑‍🏫 TEACHER TIP</div>
                <div className="sr-tip-body">{slide.tip}</div>
              </aside>
            ) : (
              <button
                className="sr-tip-toggle"
                onClick={() => setTipOpen(true)}
                title="Show teacher tip"
              >🧑‍🏫 Tip</button>
            )
          )}
        </main>
      </div>

      {/* Bottom nav controls */}
      <footer className="sr-controls">
        <button onClick={prev} disabled={idx === 0} className="sr-btn">← Prev</button>
        <div className="sr-hint">← / → to navigate · R to reveal · T to start timer · F fullscreen · N toggle nav</div>
        <button onClick={next} disabled={idx === session.slides.length - 1} className="sr-btn sr-btn-primary">Next →</button>
      </footer>

      <style jsx>{styles}</style>
    </div>
  );
}

// ─────────────────────────── slide body dispatcher ─────────────────────────
function SlideBody({
  slide,
  onEvent,
  onAdvance,
}: {
  slide: Slide;
  onEvent?: (e: SessionEvent) => void;
  onAdvance: () => void;
}) {
  switch (slide.kind) {
    case "title": return <TitleSlide slide={slide} />;
    case "static": return <StaticSlide slide={slide} />;
    case "mc_narration": return <McSlide slide={slide} />;
    case "group_activity_timer": return <TimerSlide slide={slide} onEvent={onEvent} />;
    case "click_reveal": return <RevealSlide slide={slide} onEvent={onEvent} />;
    case "mcq": return <McqSlide slide={slide} onEvent={onEvent} />;
    case "reflect_share": return <ReflectSlide slide={slide} />;
    case "video": return <VideoSlide slide={slide} onEnded={onAdvance} />;
    case "video_question_series": return <VideoQuestionSeriesSlide slide={slide} onEvent={onEvent} />;
    case "preamble": return <PreambleSlide slide={slide} />;
    default: return <pre>{JSON.stringify(slide, null, 2)}</pre>;
  }
}

// ─────────────────────────── slide kinds ───────────────────────────────────
function TitleSlide({ slide }: { slide: Slide }) {
  // Branded layout mirrors Sonu's "Welcome to the Children's Constitution
  // Club!" pptx template — wavy white background, KREIS round seal centred
  // at top, CMCA "spark change" logo top-right, dual-language title centred
  // below. Used for slide 1 (welcome) and the new closing slide (thank you).
  //
  // Two optional fields drive the variants:
  //   slide.title_kn — Kannada title (rendered in Noto Sans Kannada below
  //                    the English title)
  //   slide.thank_you — when true, "Thank You" appears under the title pair
  //                     (matches the pptx slide 4 layout)
  const isThanks = !!slide.thank_you;
  return (
    <div className="sr-branded-title">
      <div className="sr-branded-bg" aria-hidden />
      <div className="sr-branded-logos">
        <img className="sr-kreis-seal" src="/sessions/assets/kreis_seal.png" alt="KREIS" />
        <img className="sr-cmca-mark" src="/sessions/assets/cmca_logo.png" alt="CMCA" />
      </div>
      <div className="sr-branded-titles">
        <h2 className="sr-branded-en">{slide.title}</h2>
        {slide.title_kn && <h3 className="sr-branded-kn">{slide.title_kn}</h3>}
        {isThanks && <h2 className="sr-branded-thanks">Thank You</h2>}
        {slide.subtitle && <p className="sr-subtitle">{slide.subtitle}</p>}
      </div>
      {slide.audio && <div className="sr-branded-audio"><AudioChip src={slide.audio} /></div>}
    </div>
  );
}

function StaticSlide({ slide }: { slide: Slide }) {
  // bullets_large = render body as a big-font bullet list (per Sonu's feedback
  // on slides 7 "Form Groups" and 16 "Write your rules" — needs visual weight).
  const lineCls = slide.bullets_large ? "sr-line sr-line-lg" : "sr-line";
  const hasSideArt = !!slide.image || (slide.images && slide.images.length > 0);
  return (
    <div className={hasSideArt ? "sr-static-with-image" : ""}>
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

function McSlide({ slide }: { slide: Slide }) {
  return (
    <div className="sr-mc-grid">
      <div className="sr-video-frame">
        {slide.video ? (
          <video controls src={slide.video} poster="/sessions/assets/mc_poster.png" />
        ) : (
          <div className="sr-video-placeholder">▶ MC video<br /><small>{slide.video || "(no video attached yet)"}</small></div>
        )}
      </div>
      <div className="sr-transcript">
        <div className="sr-transcript-label">Transcript</div>
        <p>{slide.transcript}</p>
      </div>
    </div>
  );
}

function TimerSlide({ slide, onEvent }: { slide: Slide; onEvent?: (e: SessionEvent) => void }) {
  const total = slide.timer_seconds ?? 60;
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const reminded = useRef(false);

  useEffect(() => {
    setRemaining(total); setRunning(false); reminded.current = false;
  }, [slide.n, total]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          setRunning(false);
          onEvent?.({ type: "timer_completed", slide: slide.n, ts: Date.now() });
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, slide.n, onEvent]);

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

function McqSlide({ slide, onEvent }: { slide: Slide; onEvent?: (e: SessionEvent) => void }) {
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
          {chosen === slide.correct_index
            ? "Correct! Click Next to move on."
            : "Not quite — the correct answer is highlighted. Click Next to continue."}
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

function VideoSlide({ slide, onEnded }: { slide: Slide; onEnded: () => void }) {
  // `post_video_text` shows after the clip ends. If `reveal_on_click` is true,
  // we hold the text hidden behind a "Reveal" button (slide 15 "MC raising hand").
  // For looped clips (loop=true) we never auto-advance — the teacher clicks Next.
  const [ended, setEnded] = useState(false);
  const [revealed, setRevealed] = useState(false);

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

  // English transcript next to the video (per Sonu's directive:
  // "transcripts can be in English to support hearing impaired").
  const hasTranscript = !!slide.transcript;

  return (
    <div className={"sr-video-large-wrap " + (hasTranscript ? "sr-video-with-transcript" : "")}>
      {/* Optional instruction lines rendered ABOVE the video — used for
          calmers ("Teacher says… / Children whisper back…") so the rules of
          the classroom convention are visible on the projector. */}
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
            <video
              controls
              autoPlay
              loop={slide.loop ?? false}
              src={slide.video}
              onEnded={handleEnded}
            />
          ) : (
            <div className="sr-video-placeholder">
              ▶ EMBEDDED VIDEO<br />
              <small>{slide.video || "(video asset not attached yet)"} · {slide.duration_seconds ?? 0}s</small>
            </div>
          )}
        </div>
        {hasTranscript && (
          <aside className="sr-video-transcript">
            <div className="sr-transcript-label">Transcript (English)</div>
            <p>{slide.transcript}</p>
          </aside>
        )}
      </div>

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
          key={current.video}      // forces remount → autoplay restarts cleanly
          controls
          autoPlay
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
  }, [src]);

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
        preload="metadata"
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
  .sr-root { position: fixed; inset: 0; z-index: 9000; display: flex; flex-direction: column; height: 100vh; background: ${CREAM}; color: ${INK}; font-family: "Trebuchet MS", "Trebuchet", "Lucida Sans Unicode", "Lucida Sans", sans-serif; }
  .sr-topbar { display: flex; align-items: center; gap: 16px; padding: 10px 16px; background: ${ORANGE}; color: #fff; }
  .sr-topbar-title { flex: 1; font-size: 14px; }
  .sr-lang-toggle { display: inline-flex; border: 1px solid rgba(255,255,255,.55); border-radius: 999px; overflow: hidden; }
  .sr-lang-btn { background: transparent; color: #fff; border: none; padding: 4px 12px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; letter-spacing: .02em; }
  .sr-lang-btn:hover:not(.is-disabled):not(.is-active) { background: rgba(255,255,255,.18); }
  .sr-lang-btn.is-active { background: #fff; color: ${ORANGE_INK}; cursor: default; }
  .sr-lang-btn.is-disabled { opacity: .45; cursor: not-allowed; }
  .sr-translation-banner { background: #FFF3CD; color: #7A5D00; padding: 6px 16px; font-size: 13px; font-weight: 600; border-bottom: 1px solid #F1D77A; text-align: center; }
  .sr-sep { opacity: 0.4; margin: 0 6px; }
  .sr-icon-btn { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.3); padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 16px; }
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

  .sr-canvas { flex: 1; padding: 28px 40px 110px; overflow-y: auto; position: relative; }
  /* Projector mode: vertically + horizontally center text-only slides and
     scale up typography so the back row of a classroom can read it. */
  .sr-canvas.is-projector { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; min-height: 100%; }
  .sr-canvas.is-projector .sr-section-crumb { align-self: center; }
  .sr-canvas.is-projector .sr-title { font-size: 56px; text-align: center; margin: 8px 0 14px; }
  .sr-canvas.is-projector .sr-accent { margin: 0 auto 24px; }
  .sr-canvas.is-projector .sr-slide-body { max-width: 1000px; font-size: 26px; line-height: 1.55; }
  .sr-canvas.is-projector .sr-line { font-size: 28px; margin: 14px 0; }
  .sr-canvas.is-projector .sr-bullets-lg { list-style: none; padding: 0; }
  .sr-canvas.is-projector .sr-bullets-lg li { font-size: 30px; margin: 18px 0; }
  .sr-canvas.is-projector .sr-callout { font-size: 22px; margin: 24px auto 0; max-width: 900px; }
  .sr-section-crumb { color: ${SAFFRON}; font-weight: 700; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; }
  .sr-title { font-size: 36px; color: ${NAVY}; margin: 4px 0 10px; line-height: 1.15; }
  .sr-accent { width: 56px; height: 5px; background: ${SAFFRON}; border-radius: 3px; margin-bottom: 24px; }
  .sr-slide-body { font-size: 18px; line-height: 1.5; max-width: 1100px; }

  .sr-line { margin: 0 0 12px; font-size: 22px; }
  .sr-callout { background: ${LIGHT_SAFFRON}; border: 1px solid ${SAFFRON}; color: ${NAVY}; padding: 14px 18px; border-radius: 10px; margin-top: 24px; font-size: 16px; font-weight: 600; }

  .sr-title-hero { text-align: center; padding: 40px 0; }
  .sr-title-hero h2 { font-size: 44px; color: ${NAVY}; margin: 0 0 12px; }
  /* Branded welcome / thank-you slide — mirrors the comms-team
     pptx layout (wavy white bg + KREIS round seal + CMCA mark
     + dual-language title). */
  .sr-branded-title {
    position: relative;
    min-height: 70vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 40px;
    text-align: center;
    overflow: hidden;
    border-radius: 16px;
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
    width: 200px; height: 200px;
    object-fit: contain;
    filter: drop-shadow(0 4px 14px rgba(0,0,0,0.15));
  }
  .sr-cmca-mark {
    width: 100px; height: auto;
    object-fit: contain;
    margin-top: 24px;
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
  /* On the branded title slide, the audio card needs to centre under the
     title (the parent uses align-items: center but the audio card is a
     fixed-width block, so we explicitly centre it via flex inside its
     wrapper). */
  .sr-branded-audio { position: relative; z-index: 2; margin-top: 36px; width: 100%; display: flex; justify-content: center; }
  .sr-branded-audio .sr-audio-card { margin-top: 0; }
  .sr-subtitle { font-size: 22px; color: ${SAFFRON}; }

  .sr-mc-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; }
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

  .sr-mcq { max-width: 900px; }
  .sr-scenario { font-size: 19px; margin: 0 0 20px; }
  .sr-options { list-style: none; padding: 0; margin: 0; }
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

  .sr-video-large { background: #000; border-radius: 12px; aspect-ratio: 16 / 9; max-height: 70vh; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; }
  .sr-video-large video { width: 100%; height: 100%; object-fit: contain; }
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
    margin-top: 24px;
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

  .sr-tip { position: fixed; bottom: 86px; right: 24px; max-width: 380px; background: ${LIGHT_SAFFRON}; border: 1px solid ${SAFFRON}; border-radius: 12px; padding: 12px 30px 12px 14px; box-shadow: 0 4px 12px rgba(0,0,0,.08); z-index: 10; }
  .sr-tip-label { color: ${NAVY}; font-size: 11px; font-weight: 800; letter-spacing: 1px; margin-bottom: 4px; }
  .sr-tip-body { color: ${INK}; font-size: 13px; line-height: 1.4; }
  .sr-tip-close { position: absolute; top: 6px; right: 8px; background: transparent; border: none; color: ${NAVY}; font-size: 20px; font-weight: 700; line-height: 1; cursor: pointer; padding: 2px 6px; border-radius: 6px; }
  .sr-tip-close:hover { background: rgba(0,0,0,0.08); }
  .sr-tip-toggle { position: fixed; bottom: 86px; right: 24px; background: ${LIGHT_SAFFRON}; border: 1px solid ${SAFFRON}; color: ${NAVY}; border-radius: 999px; padding: 6px 14px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,.08); z-index: 10; }
  .sr-tip-toggle:hover { background: ${SAFFRON}; color: white; }

  .sr-controls { position: fixed; bottom: 0; left: 0; right: 0; padding: 14px 24px; display: flex; align-items: center; gap: 16px; background: #fff; border-top: 1px solid #e5e7eb; z-index: 11; }
  .sr-hint { flex: 1; text-align: center; color: ${MUTED}; font-size: 12px; }
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
  .sr-static-with-image { display: grid; grid-template-columns: 1.2fr 1fr; gap: 32px; align-items: start; }
  .sr-static-text { min-width: 0; }
  .sr-static-image { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 8px; box-shadow: 0 2px 8px rgba(0,0,0,.05); }
  .sr-static-image img { width: 100%; height: auto; display: block; border-radius: 8px; }
  /* Multi-image strip for slides like 7 (Form Groups reference photos)
     and 8 (KSRTC + KREIS inspiration logos). Auto-flows in a row. */
  .sr-static-image-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px; }
  .sr-image-card { margin: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 10px; box-shadow: 0 2px 8px rgba(0,0,0,.05); display: flex; flex-direction: column; gap: 8px; }
  .sr-image-card img { width: 100%; height: 120px; object-fit: contain; display: block; }
  .sr-image-card figcaption { font-size: 12px; font-weight: 700; color: ${ORANGE_INK}; text-align: center; text-transform: uppercase; letter-spacing: .04em; }
  /* Brief panel on timer slides also supports companion logos beneath
     the brief text — used for slide 8 (KSRTC + KREIS logo inspiration). */
  .sr-brief-logos { display: flex; gap: 16px; margin-top: 18px; flex-wrap: wrap; }
  .sr-brief-logo { margin: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 14px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .sr-brief-logo img { height: 72px; width: auto; object-fit: contain; display: block; }
  .sr-brief-logo figcaption { font-size: 11px; font-weight: 700; color: ${ORANGE_INK}; letter-spacing: .04em; }

  /* Video slide with post-video reveal — slide 5 (Eyes on Me) + slide 15 (MC raising hand) */
  .sr-video-large-wrap { display: flex; flex-direction: column; gap: 18px; }
  /* Video row: when a transcript is present, video + transcript sit side
     by side; otherwise video fills the row. Mirrors the .sr-mc-grid
     layout used by mc_narration slides for visual consistency. */
  .sr-video-row { display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start; }
  .sr-video-with-transcript .sr-video-row { grid-template-columns: 1.4fr 1fr; }
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
