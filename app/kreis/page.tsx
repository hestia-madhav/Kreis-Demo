import Link from "next/link";

// Index page — lists all KREIS sessions. Replaced the old redirect
// (which jumped straight to session 1) now that more sessions are in
// the pipeline. Each card links into the player; sessions in
// production show a disabled "Coming soon" state with the production
// stage flagged in the body copy so reviewers know what's pending.

type Status = "live" | "in_production" | "in_progress" | "draft";

interface SessionEntry {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  status: Status;
  durationMin: number;
  // What's complete for sessions not yet live — shown as a checklist
  // on the card so reviewers can see how close it is.
  progress?: string[];
}

const SESSIONS: SessionEntry[] = [
  {
    id: "kreis-session-1",
    number: 1,
    title: "Welcome to the Children's Constitution Club",
    subtitle: "Introductions · Calmers · Group formation · Constitution connect · Club rules",
    status: "in_progress",
    durationMin: 60,
  },
  {
    id: "kreis-session-2",
    number: 2,
    title: "Naming of Club & Launch Campaign",
    subtitle:
      "Pick a club name · Form the core committee · Elect a president · Plan the school-assembly launch",
    status: "in_progress",
    durationMin: 60,
    progress: [
      "✅ Source deck (V2)",
      "✅ Slide-by-slide script (digital_inputs.csv)",
      "✅ Veo prompts drafted (3 Master Change videos)",
      "✅ Kannada VO prompts drafted (13 audio lines)",
      "✅ Player JSON skeletons (kn + en) — current build",
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
    title: "Choices, Integrity & the Change Champion Box",
    subtitle:
      "Hospital stories · Group values exercise · Reflect on choices · Introduce integrity · Build the Change Champion Box",
    status: "in_progress",
    durationMin: 60,
    progress: [
      "✅ Source deck (V1)",
      "✅ Slide-by-slide script (digital_inputs.csv)",
      "✅ Veo prompts drafted (5 Master Change videos)",
      "✅ Kannada VO prompts drafted (9 audio lines)",
      "✅ Player JSON skeletons (kn + en) — current build",
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
    title: "Child Rights, Responsibilities & Makkala Grama Sabha",
    subtitle:
      "Change Champion Box · Ajay's story · Child rights (4 categories) · ChildLine 1098 · Reflection · MGS introduction",
    status: "in_progress",
    durationMin: 60,
    progress: [
      "✅ Source deck (Irfan Kannada V1)",
      "✅ Player JSON skeletons (kn + en)",
      "🔴 MC video production",
      "🔴 Child rights handout / flash cards",
      "🔴 MGS images",
    ],
  },
  {
    id: "kreis-session-5",
    number: 5,
    title: "Active Citizens & Helpline Numbers",
    subtitle:
      "ROC stories · 3-tier government · Visualization exercise · Local government · Helpline quiz · Complaint letters / postcards · Ripple tasks",
    status: "in_progress",
    durationMin: 60,
    progress: [
      "✅ Source deck (Irfan Kannada V1)",
      "✅ Player JSON skeletons (kn + en)",
      "🔴 MC video production",
      "🔴 Visualization audio with sound effects",
      "🔴 Helpline sheet design",
      "🔴 Sample complaint letter template",
    ],
  },
  {
    id: "kreis-session-6",
    number: 6,
    title: "Fake News, Scientific Temper & the 4Ws Test",
    subtitle:
      "Roleplay (5 student roles) · Scientific temper · 4Ws framework · UPI ban fact-check exercise · AI fake news · Fundamental Duty connection · Ripple task",
    status: "in_progress",
    durationMin: 60,
    progress: [
      "✅ Source deck (Irfan Kannada V1)",
      "✅ Player JSON skeletons (kn + en)",
      "🔴 MC video production (3 parts)",
      "🔴 Annexure 1 (roleplay slips)",
      "🔴 AI-generated fake news example image",
      "🔴 Preamble image (Kannada)",
      "🔴 Annexure 3 (4Ws handout)",
    ],
  },
];

const STATUS_PILL: Record<Status, { label: string; bg: string; fg: string }> = {
  live: { label: "Live", bg: "#D1FAE5", fg: "#065F46" },
  in_production: { label: "In production", bg: "#FEF3C7", fg: "#92400E" },
  in_progress: { label: "In progress", bg: "#FEF3C7", fg: "#92400E" },
  draft: { label: "Draft", bg: "#E5E7EB", fg: "#374151" },
};

export default function HomePage() {
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
        {/* Header with co-branded logos */}
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
          <div
            style={{
              fontSize: "0.75rem",
              color: "#6B7280",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Children&apos;s Constitution Club
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
          KREIS Session Player
        </h1>
        <p
          style={{
            fontSize: "1.05rem",
            color: "#4B5563",
            margin: "0 0 2.5rem",
            maxWidth: "640px",
          }}
        >
          Interactive sessions for the Children&apos;s Constitution Club —
          delivered in Kannada with English subtitles for hearing-impaired
          access. Pick a session below to play.
        </p>

        {/* Session cards */}
        <div style={{ display: "grid", gap: "1.25rem" }}>
          {SESSIONS.map((s) => {
            const pill = STATUS_PILL[s.status];
            // Cards are clickable when not strictly "draft" — sessions
            // marked "in_progress" still link through so reviewers can walk
            // the latest placeholder build.
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
                      color: "#F39C1F",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    Session {s.number}
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
                  {s.title}
                </h2>
                <p
                  style={{
                    margin: "0 0 1rem",
                    color: "#4B5563",
                    fontSize: "0.95rem",
                    lineHeight: 1.5,
                  }}
                >
                  {s.subtitle}
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
                  <span>⏱ {s.durationMin} min</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span>Kannada audio · English subtitles</span>
                </div>

                {/* Progress checklist for in-production sessions */}
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
                      Production status ({s.progress.length} items)
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
                    Production in progress — link will activate once audio &
                    video assets land in <code>public/sessions/</code>.
                  </div>
                )}

                {isLive && (
                  <div
                    style={{
                      marginTop: "1rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      color: "#F39C1F",
                      fontWeight: 600,
                      fontSize: "0.92rem",
                    }}
                  >
                    Play session →
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
          CMCA × KREIS · A programme of Children&apos;s Movement for Civic
          Awareness · Karnataka Residential Educational Institutions Society
        </footer>
      </div>
    </main>
  );
}
