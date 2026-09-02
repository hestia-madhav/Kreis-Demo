"use client";

import Link from "next/link";
import LanguageToggle from "../../components/LanguageToggle";
import { useLanguage } from "../../components/useLanguage";

type Status = "live" | "in_production" | "in_progress" | "draft";

interface SessionEntry {
  id: string;
  number: number;
  title: { en: string; kn: string };
  subtitle: { en: string; kn: string };
  status: Status;
  durationMin: number;
  progress?: string[];
}

const SESSIONS: SessionEntry[] = [
  {
    id: "kreis-session-1",
    number: 1,
    title: {
      en: "Getting Started",
      kn: "ಪ್ರಾರಂಭ",
    },
    subtitle: {
      en: "Introductions · Calmers · Group formation · Constitution connect · Club rules",
      kn: "ಪರಿಚಯ · ಶಾಂತಗೊಳಿಸುವಿಕೆ · ಗುಂಪು ರಚನೆ · ಸಂವಿಧಾನ ಸಂಪರ್ಕ · ಕ್ಲಬ್ ನಿಯಮಗಳು",
    },
    status: "in_progress",
    durationMin: 60,
  },
  {
    id: "kreis-session-2",
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
      "✅ Source deck (V2)",
      "✅ Slide-by-slide script (digital_inputs.csv)",
      "✅ Veo prompts drafted (3 Master Change videos)",
      "✅ Kannada VO prompts drafted (13 audio lines)",
      "✅ Player JSON (kn + en)",
      "✅ Stock images sourced and picked (10 slots)",
      "✅ Veo generation (democracy, representative qualities, farewell)",
      "✅ Representative qualities video updated (new version Jul 14)",
      "✅ Kannada VO clips landed (drum roll, applause, cheer, timer ping)",
      "🔴 Campaigns slideshow assembly (CapCut)",
      "🔴 Editable Club Name input on slide 6",
    ],
  },
  {
    id: "kreis-session-3",
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
      "✅ Source deck (V1)",
      "✅ Slide-by-slide script (digital_inputs.csv)",
      "✅ Veo prompts drafted (5 Master Change videos)",
      "✅ Kannada VO prompts drafted (9 audio lines)",
      "✅ Player JSON (kn + en)",
      "🔴 PDF annexures (1 / 2 / 3) locked with Ramya",
      "✅ News-article card images (hospital stories)",
      "✅ Stock images sourced (6 illustrations)",
      "✅ Veo generation (5 MC videos + shopkeeper scenario)",
      "✅ Timer audio clips landed (2min + 7min pings)",
      "🔴 Kannada VO generation in Google AI Studio",
      "🔴 INTEGRITY word-reveal animation (player code)",
    ],
  },
  {
    id: "kreis-session-4",
    number: 4,
    title: {
      en: "Child Rights",
      kn: "ಮಕ್ಕಳ ಹಕ್ಕುಗಳು",
    },
    subtitle: {
      en: "Change Champion Box · Ajay's story · Child rights (4 categories) · ChildLine 1098 · Reflection · MGS introduction",
      kn: "ಚೇಂಜ್ ಚಾಂಪಿಯನ್ ಬಾಕ್ಸ್ · ಅಜಯ್ ಕಥೆ · ಮಕ್ಕಳ ಹಕ್ಕುಗಳು (4 ವಿಭಾಗ) · ChildLine 1098 · ಚಿಂತನೆ · MGS ಪರಿಚಯ",
    },
    status: "in_progress",
    durationMin: 60,
    progress: [
      "✅ Source deck (Irfan Kannada V1)",
      "✅ Player JSON (kn + en)",
      "🔴 MC video production",
      "🔴 Child rights handout / flash cards",
      "🔴 MGS images",
    ],
  },
  {
    id: "kreis-session-5",
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
      "✅ Source deck (Irfan Kannada V1)",
      "✅ Player JSON (kn + en)",
      "🔴 MC video production",
      "🔴 Visualization audio with sound effects",
      "🔴 Helpline sheet design",
      "🔴 Sample complaint letter template",
    ],
  },
  {
    id: "kreis-session-6",
    number: 6,
    title: {
      en: "Cultivating Critical Thinking",
      kn: "ವಿಮರ್ಶಾತ್ಮಕಆಲೋಚನೆಯನ್ನು ಅಭಿವೃದ್ಧಿಪಡಿಸುವುದು + ಬದಲಾವಣೆಗಾಗಿ ಜೊತೆಯಾಗೋಣ",
    },
    subtitle: {
      en: "Roleplay (5 student roles) · Scientific temper · 4Ws framework · UPI ban fact-check exercise · AI fake news · Fundamental Duty connection · Ripple task",
      kn: "ಪಾತ್ರಾಭಿನಯ (5 ವಿದ್ಯಾರ್ಥಿ ಪಾತ್ರಗಳು) · ವೈಜ್ಞಾನಿಕ ಮನೋಭಾವ · 4Ws ಚೌಕಟ್ಟು · UPI ನಿಷೇಧ ಸತ್ಯಶೋಧನೆ · AI ಸುಳ್ಳು ಸುದ್ದಿ · ಮೂಲಭೂತ ಕರ್ತವ್ಯ · ತರಂಗ ಕಾರ್ಯ",
    },
    status: "in_progress",
    durationMin: 60,
    progress: [
      "✅ Source deck (Irfan Kannada V1)",
      "✅ Player JSON (kn + en)",
      "🔴 MC video production (3 parts)",
      "🔴 Annexure 1 (roleplay slips)",
      "🔴 AI-generated fake news example image",
      "🔴 Preamble image (Kannada)",
      "🔴 Annexure 3 (4Ws handout)",
    ],
  },
  {
    id: "kreis-session-7",
    number: 7,
    title: {
      en: "Diversity & Composite Culture - 1",
      kn: "ವೈವಿಧ್ಯತೆ ಮತ್ತು ಸಮ್ಮಿಶ್ರ ಸಂಸ್ಕೃತಿ - 1",
    },
    subtitle: {
      en: "Diversity in classroom · Leaf drawing · State information cards · Quiz with dance moves · Social diversity concept",
      kn: "ತರಗತಿಯಲ್ಲಿ ವೈವಿಧ್ಯತೆ · ಎಲೆ ಚಿತ್ರ · ರಾಜ್ಯ ಮಾಹಿತಿ ಕಾರ್ಡ್‌ಗಳು · ನೃತ್ಯ ಹೆಜ್ಜೆಗಳೊಂದಿಗೆ ರಸಪ್ರಶ್ನೆ · ಸಾಮಾಜಿಕ ವೈವಿಧ್ಯತೆ ಪರಿಕಲ್ಪನೆ",
    },
    status: "in_progress",
    durationMin: 60,
    progress: [
      "✅ Source PPT extracted",
      "✅ Player JSON (kn + en)",
      "✅ Quiz images (12 images from PPT)",
      "🔴 MC video: mid-quiz interruption",
      "🔴 MC video: social diversity explanation",
      "🔴 Annexure 1 (State Information Cards)",
      "🔴 Annexure 2 (worksheet)",
    ],
  },
];

const STATUS_PILL: Record<Status, { label: string; bg: string; fg: string }> = {
  live: { label: "Live", bg: "#D1FAE5", fg: "#065F46" },
  in_production: { label: "In production", bg: "#FEF3C7", fg: "#92400E" },
  in_progress: { label: "In progress", bg: "#FEF3C7", fg: "#92400E" },
  draft: { label: "Draft", bg: "#E5E7EB", fg: "#374151" },
};

const KREIS_COLOUR = "#F39C1F";

const STRINGS = {
  en: {
    clubLabel: "Children's Constitution Club",
    heading: "KREIS Session Player",
    subheading:
      "Interactive sessions for the Children's Constitution Club — delivered in Kannada with English subtitles for hearing-impaired access. Pick a session below to play.",
    sessionLabel: "Session",
    durationSuffix: "min",
    audioNote: "Kannada audio · English subtitles",
    productionStatus: "Production status",
    productionNote:
      "Production in progress — link will activate once audio & video assets land.",
    playSession: "Play session →",
    footer:
      "CMCA × KREIS · A programme of Children's Movement for Civic Awareness · Karnataka Residential Educational Institutions Society",
  },
  kn: {
    clubLabel: "ಮಕ್ಕಳ ಸಂವಿಧಾನ ಕ್ಲಬ್",
    heading: "KREIS ಅವಧಿ ಪ್ಲೇಯರ್",
    subheading:
      "ಮಕ್ಕಳ ಸಂವಿಧಾನ ಕ್ಲಬ್‌ಗಾಗಿ ಸಂವಾದಾತ್ಮಕ ಅವಧಿಗಳು — ಕನ್ನಡದಲ್ಲಿ ಧ್ವನಿ, ಇಂಗ್ಲಿಷ್ ಉಪಶೀರ್ಷಿಕೆಗಳೊಂದಿಗೆ. ಪ್ಲೇ ಮಾಡಲು ಅವಧಿ ಆಯ್ಕೆಮಾಡಿ.",
    sessionLabel: "ಅವಧಿ",
    durationSuffix: "ನಿಮಿಷ",
    audioNote: "ಕನ್ನಡ ಧ್ವನಿ · ಇಂಗ್ಲಿಷ್ ಉಪಶೀರ್ಷಿಕೆ",
    productionStatus: "ಉತ್ಪಾದನೆ ಸ್ಥಿತಿ",
    productionNote: "ಉತ್ಪಾದನೆಯಲ್ಲಿದೆ — ಧ್ವನಿ ಮತ್ತು ವೀಡಿಯೊ ಸಿದ್ಧವಾದಾಗ ಲಿಂಕ್ ಸಕ್ರಿಯವಾಗುತ್ತದೆ.",
    playSession: "ಅವಧಿ ಪ್ಲೇ ಮಾಡಿ →",
    footer:
      "CMCA × KREIS · ಮಕ್ಕಳ ನಾಗರಿಕ ಪ್ರಜ್ಞೆ ಚಳುವಳಿಯ ಕಾರ್ಯಕ್ರಮ · ಕರ್ನಾಟಕ ವಸತಿ ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಗಳ ಸಂಘ",
  },
} as const;

export default function HomePage() {
  const { lang, toggle, ready } = useLanguage();
  const t = STRINGS[lang];

  if (!ready) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 50% -10%, rgba(243, 156, 31, 0.15), transparent 60%), #FFFBF2",
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
            marginBottom: "2.5rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <img
              src="/sessions/assets/kreis_logo.png"
              alt="KREIS"
              style={{ height: "56px", width: "auto" }}
            />
            <div style={{ borderLeft: "1px solid #E5E7EB", height: "40px" }} />
            <img
              src="/sessions/assets/cmca_logo.png"
              alt="CMCA"
              style={{ height: "44px", width: "auto" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#6B7280",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {t.clubLabel}
            </div>
            <LanguageToggle lang={lang} onToggle={toggle} accentColour={KREIS_COLOUR} />
          </div>
        </header>

        <h1
          style={{
            fontSize: "2.25rem",
            fontWeight: 800,
            margin: "0 0 0.5rem",
            color: "#1E293B",
            lineHeight: 1.15,
          }}
        >
          {t.heading}
        </h1>
        <p
          style={{
            fontSize: "1.05rem",
            color: "#4B5563",
            margin: "0 0 2.5rem",
            maxWidth: "640px",
          }}
        >
          {t.subheading}
        </p>

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
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  opacity: isLive ? 1 : 0.92,
                  cursor: isLive ? "pointer" : "default",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1rem",
                    marginBottom: "0.4rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.78rem",
                      letterSpacing: "0.12em",
                      color: KREIS_COLOUR,
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {t.sessionLabel} {s.number}
                  </div>
                  <span
                    style={{
                      background: pill.bg,
                      color: pill.fg,
                      borderRadius: "999px",
                      padding: "0.2rem 0.7rem",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {pill.label}
                  </span>
                </div>

                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    margin: "0 0 0.5rem",
                    color: "#1E293B",
                  }}
                >
                  {s.title[lang]}
                </h2>
                <p
                  style={{
                    margin: "0 0 1rem",
                    color: "#4B5563",
                    fontSize: "0.95rem",
                    lineHeight: 1.5,
                  }}
                >
                  {s.subtitle[lang]}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    fontSize: "0.85rem",
                    color: "#6B7280",
                  }}
                >
                  <span>⏱ {s.durationMin} {t.durationSuffix}</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span>{t.audioNote}</span>
                </div>

                {s.progress && (
                  <details style={{ marginTop: "1rem" }}>
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
                      {s.progress.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </details>
                )}

                {!isLive && (
                  <div
                    style={{
                      marginTop: "1rem",
                      padding: "0.6rem 0.9rem",
                      background: "#FEF3C7",
                      color: "#78350F",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                    }}
                  >
                    {t.productionNote}
                  </div>
                )}

                {isLive && (
                  <div
                    style={{
                      marginTop: "1rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      color: KREIS_COLOUR,
                      fontWeight: 600,
                      fontSize: "0.92rem",
                    }}
                  >
                    {t.playSession}
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

        <footer
          style={{
            marginTop: "3rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid #E5E7EB",
            fontSize: "0.8rem",
            color: "#9CA3AF",
            textAlign: "center",
          }}
        >
          {t.footer}
        </footer>
      </div>
    </main>
  );
}
