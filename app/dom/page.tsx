"use client";

import Link from "next/link";
import LanguageToggle from "../../components/LanguageToggle";
import { useLanguage } from "../../components/useLanguage";

type Status = "live" | "in_progress" | "in_preparation" | "draft";

interface SessionEntry {
  id: string;
  number: number;
  title: { en: string; kn: string };
  subtitle: { en: string; kn: string };
  status: Status;
  durationMin: number;
  progress: string[];
}

const SESSIONS: SessionEntry[] = [
  {
    id: "dom-session-1",
    number: 1,
    title: {
      en: "Getting Started",
      kn: "ಪ್ರಾರಂಭ",
    },
    subtitle: {
      en: "Introductions · Calmers · Group formation · Nagarika connect · Club rules",
      kn: "ಪರಿಚಯ · ಶಾಂತಗೊಳಿಸುವಿಕೆ · ಗುಂಪು ರಚನೆ · ನಾಗರಿಕ ಸಂಪರ್ಕ · ಕ್ಲಬ್ ನಿಯಮಗಳು",
    },
    status: "in_progress",
    durationMin: 60,
    progress: [
      "✅ Source deck (English draft from CMCA)",
      "✅ Structural mapping to KREIS Session 1 completed",
      "✅ Player JSON built (en + kn)",
      "✅ Naming corrected: ನಾಗರಿಕ ಕ್ಲಬ್ (Children's Nagarika Club)",
      "✅ 16th July corrections applied",
      "🔴 MC intro video re-record (says 'Constitution Club', needs 'Nagarika Club')",
      "🔴 State-specific content variants (Odisha local stories per Ramya)",
    ],
  },
  {
    id: "dom-session-2",
    number: 2,
    title: {
      en: "Naming of Club and Launch Campaign",
      kn: "ಕ್ಲಬ್ ನ ನಾಮಕರಣ ಮತ್ತು ಉದ್ಘಾಟನಾ ಅಭಿಯಾನ",
    },
    subtitle: {
      en: "Pick a club name · Form the core committee · Elect a president · Plan the school-assembly launch",
      kn: "ಕ್ಲಬ್ ಹೆಸರು ಆಯ್ಕೆ · ಕೋರ್ ಸಮಿತಿ ರಚನೆ · ಅಧ್ಯಕ್ಷರ ಚುನಾವಣೆ · ಶಾಲಾ ಸಭೆ ಉದ್ಘಾಟನೆ ಯೋಜನೆ",
    },
    status: "in_progress",
    durationMin: 60,
    progress: [
      "✅ Source deck (English draft from CMCA)",
      "✅ Player JSON built (en + kn)",
      "✅ 16th July corrections applied",
      "🔴 Editable club-name field on slide 6 (flagged by CMCA, not yet built)",
    ],
  },
  {
    id: "dom-session-3",
    number: 3,
    title: {
      en: "Personal Integrity",
      kn: "ವೈಯುಕ್ತಿಕ ನೈತಿಕತೆ",
    },
    subtitle: {
      en: "Hospital stories · Group values exercise · Reflect on choices · Introduce integrity · Build the Change Champion Box",
      kn: "ಆಸ್ಪತ್ರೆ ಕಥೆಗಳು · ಗುಂಪು ಮೌಲ್ಯ ಅಭ್ಯಾಸ · ಆಯ್ಕೆಗಳ ಬಗ್ಗೆ ಚಿಂತನೆ · ಪ್ರಾಮಾಣಿಕತೆ ಪರಿಚಯ · ಚೇಂಜ್ ಚಾಂಪಿಯನ್ ಬಾಕ್ಸ್ ನಿರ್ಮಾಣ",
    },
    status: "in_progress",
    durationMin: 60,
    progress: [
      "✅ Source deck (English draft from CMCA)",
      "✅ Player JSON built (en + kn)",
      "✅ 16th July corrections applied",
    ],
  },
  {
    id: "dom-session-4",
    number: 4,
    title: {
      en: "Child Rights",
      kn: "ಮಕ್ಕಳ ಹಕ್ಕುಗಳು",
    },
    subtitle: {
      en: "Ajay's story · Picture-cue activity · Four categories of child rights · Protection message · Reflection",
      kn: "ಅಜಯ್ ಕಥೆ · ಚಿತ್ರ-ಸೂಚನೆ ಚಟುವಟಿಕೆ · ಮಕ್ಕಳ ಹಕ್ಕುಗಳ ನಾಲ್ಕು ವಿಭಾಗಗಳು · ರಕ್ಷಣೆ ಸಂದೇಶ · ಪ್ರತಿಫಲನ",
    },
    status: "in_progress",
    durationMin: 60,
    progress: [
      "✅ Source deck V2 (11th August from Ashwini)",
      "✅ Player JSON built (en + kn)",
      "✅ All shared assets from KREIS S4 present — zero missing refs",
      "✅ MC wrap-up video is programme-agnostic (works for both)",
      "🔴 MC video: Change Stories encouragement (animated CC box scenes)",
      "✅ Audio narration: Ajay's story + puppy photo card image",
      "🔴 MC video: Child rights categories explanation",
      "🔴 MC video: Protection/POCSO message narration",
    ],
  },
  {
    id: "dom-session-5",
    number: 5,
    title: {
      en: "Local Government",
      kn: "ಸ್ಥಳೀಯ ಸರ್ಕಾರ",
    },
    subtitle: {
      en: "ROC stories · 3-tier government · Visualization exercise · Local government · Helpline quiz · Complaint letters / postcards · Ripple tasks",
      kn: "ROC ಕಥೆಗಳು · 3-ಹಂತದ ಸರ್ಕಾರ · ಕಲ್ಪನೆ ಅಭ್ಯಾಸ · ಸ್ಥಳೀಯ ಸರ್ಕಾರ · ಸಹಾಯವಾಣಿ ರಸಪ್ರಶ್ನೆ · ದೂರು ಪತ್ರಗಳು · ತರಂಗ ಕಾರ್ಯಗಳು",
    },
    status: "in_progress",
    durationMin: 60,
    progress: [
      "✅ Player JSON built (en + kn)",
      "🔴 MC video production",
      "🔴 Visualization audio with sound effects",
      "🔴 Helpline sheet design",
      "🔴 Sample complaint letter template",
    ],
  },
];

const STATUS_PILL: Record<Status, { label: string; bg: string; fg: string }> = {
  live: { label: "Live", bg: "#D1FAE5", fg: "#065F46" },
  in_progress: { label: "In progress", bg: "#FEF3C7", fg: "#92400E" },
  in_preparation: { label: "In preparation", bg: "#DBEAFE", fg: "#075985" },
  draft: { label: "Draft", bg: "#E5E7EB", fg: "#374151" },
};

const DOM_COLOUR = "#0EA5E9";

const STRINGS = {
  en: {
    back: "← All programmes",
    badge: "DOM · Children's Nagarika Club",
    heading: "DOM Session Player",
    subheading:
      "Interactive Children's Nagarika Club sessions for the Department of Minorities schools — 350+ schools across Karnataka, Andhra Pradesh, and Odisha. Pick a session below to review the draft.",
    sessionLabel: "Session",
    durationSuffix: "min",
    productionStatus: "Production status",
    reviewDraft: "Review draft session →",
    footer: "DOM · Children's Nagarika Club · CMCA India",
  },
  kn: {
    back: "← ಎಲ್ಲಾ ಕಾರ್ಯಕ್ರಮಗಳು",
    badge: "DOM · ನಾಗರಿಕ ಕ್ಲಬ್",
    heading: "DOM ಅವಧಿ ಪ್ಲೇಯರ್",
    subheading:
      "ಅಲ್ಪಸಂಖ್ಯಾತರ ಇಲಾಖೆ ಶಾಲೆಗಳಿಗಾಗಿ ಸಂವಾದಾತ್ಮಕ ನಾಗರಿಕ ಕ್ಲಬ್ ಅವಧಿಗಳು — ಕರ್ನಾಟಕ, ಆಂಧ್ರಪ್ರದೇಶ ಮತ್ತು ಒಡಿಶಾದಲ್ಲಿ 350+ ಶಾಲೆಗಳು. ಕರಡು ಪರಿಶೀಲಿಸಲು ಅವಧಿ ಆಯ್ಕೆಮಾಡಿ.",
    sessionLabel: "ಅವಧಿ",
    durationSuffix: "ನಿಮಿಷ",
    productionStatus: "ಉತ್ಪಾದನೆ ಸ್ಥಿತಿ",
    reviewDraft: "ಕರಡು ಅವಧಿ ಪರಿಶೀಲಿಸಿ →",
    footer: "DOM · ನಾಗರಿಕ ಕ್ಲಬ್ · CMCA India",
  },
} as const;

export default function DomHomePage() {
  const { lang, toggle, ready } = useLanguage();
  const t = STRINGS[lang];

  if (!ready) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 50% -10%, rgba(14, 165, 233, 0.14), transparent 60%), #F0F9FF",
        padding: "3rem 1.25rem 5rem",
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans Kannada", sans-serif',
        color: "#1F2937",
      }}
    >
      <div style={{ maxWidth: "920px", margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            style={{
              color: "#6B7280",
              fontSize: "0.85rem",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            {t.back}
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <img
              src="/sessions/assets/cmca_logo.png"
              alt="CMCA"
              style={{ height: "44px", width: "auto" }}
            />
            <LanguageToggle lang={lang} onToggle={toggle} accentColour={DOM_COLOUR} />
          </div>
        </header>

        <div
          style={{
            display: "inline-block",
            padding: "0.3rem 0.9rem",
            borderRadius: "999px",
            background: "rgba(14, 165, 233, 0.12)",
            color: DOM_COLOUR,
            fontSize: "0.8rem",
            fontWeight: 700,
            marginBottom: "0.75rem",
            letterSpacing: "0.05em",
          }}
        >
          {t.badge}
        </div>

        <h1
          style={{
            fontSize: "2.25rem",
            fontWeight: 800,
            margin: "0 0 0.5rem",
            color: "#0C4A6E",
            lineHeight: 1.15,
          }}
        >
          {t.heading}
        </h1>
        <p
          style={{
            fontSize: "1.05rem",
            color: "#4B5563",
            margin: "0 0 1rem",
            maxWidth: "640px",
          }}
        >
          {t.subheading}
        </p>
        <div style={{ marginBottom: "2.5rem" }} />

        <div style={{ display: "grid", gap: "1.25rem" }}>
          {SESSIONS.map((s) => {
            const pill = STATUS_PILL[s.status];
            const isLive = s.status === "live" || s.status === "in_progress";
            const card = (
              <article
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "1.5rem 1.75rem",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  opacity: isLive ? 1 : 0.9,
                  cursor: isLive ? "pointer" : "default",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: "1rem",
                    flexWrap: "wrap",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "#94A3B8",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}
                    >
                      {t.sessionLabel} {s.number}
                    </div>
                    <div
                      style={{
                        padding: "0.15rem 0.6rem",
                        borderRadius: "999px",
                        background: pill.bg,
                        color: pill.fg,
                        fontSize: "0.72rem",
                        fontWeight: 700,
                      }}
                    >
                      {pill.label}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#6B7280" }}>
                    ≈ {s.durationMin} {t.durationSuffix}
                  </div>
                </div>

                <h2
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    margin: "0 0 0.4rem",
                    color: "#111827",
                  }}
                >
                  {s.title[lang]}
                </h2>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "#4B5563",
                    margin: "0 0 1rem",
                  }}
                >
                  {s.subtitle[lang]}
                </p>

                <details style={{ marginTop: "0.25rem" }}>
                  <summary
                    style={{
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      color: "#6B7280",
                      userSelect: "none",
                    }}
                  >
                    {t.productionStatus} ({s.progress.length} items)
                  </summary>
                  <ul
                    style={{
                      margin: "0.5rem 0 0",
                      padding: "0 0 0 1.25rem",
                      fontSize: "0.85rem",
                      color: "#4B5563",
                      lineHeight: 1.6,
                    }}
                  >
                    {s.progress.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </details>

                {isLive && (
                  <div
                    style={{
                      marginTop: "1rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      color: DOM_COLOUR,
                      fontWeight: 600,
                      fontSize: "0.92rem",
                    }}
                  >
                    {t.reviewDraft}
                  </div>
                )}
              </article>
            );

            return isLive ? (
              <Link
                key={s.id}
                href={`/s/${s.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {card}
              </Link>
            ) : (
              <div key={s.id}>{card}</div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: "2rem",
            fontSize: "0.78rem",
            color: "#6B7280",
            textAlign: "center",
          }}
        >
          {t.footer}
        </div>
      </div>
    </main>
  );
}
