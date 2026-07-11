import Link from "next/link";

// DOM programme session list. Three sessions matching the KREIS structure,
// with "Children's Constitution Club" → "Children's Civic Club" (DOM =
// Department of Minorities). Player JSON (en + kn) has been
// built from the CMCA source decks — Kannada text is an AI draft pending
// CMCA linguistic review (see _revision tag in each session JSON). Video/
// audio assets are not yet produced, same "in_progress skeleton" state as
// KREIS Session 2/3.

type Status = "live" | "in_progress" | "in_preparation" | "draft";

interface SessionEntry {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  status: Status;
  durationMin: number;
  progress: string[];
}

const SESSIONS: SessionEntry[] = [
  {
    id: "dom-session-1",
    number: 1,
    title: "Welcome to the Children's Civic Club",
    subtitle:
      "Introductions · Calmers · Group formation · Constitution connect · Club rules",
    status: "in_progress",
    durationMin: 60,
    progress: [
      "✅ Source deck (English draft from CMCA)",
      "✅ Structural mapping to KREIS Session 1 completed",
      "✅ Player JSON built (en + kn) — AI draft translation",
      "🔴 CMCA linguistic review of Kannada (Sonu / Irfan / Aishwarya)",
      "🔴 'ಮಕ್ಕಳ ನಾಗರಿಕ ಕ್ಲಬ್' (Children's Civic Club) naming sign-off",
      "🔴 State-specific content variants (Odisha local stories per Ramya)",
      "🔴 Video / audio asset production",
    ],
  },
  {
    id: "dom-session-2",
    number: 2,
    title: "Naming of Club & Launch Campaign",
    subtitle:
      "Pick a club name · Form the core committee · Elect a president · Plan the school-assembly launch",
    status: "in_progress",
    durationMin: 60,
    progress: [
      "✅ Source deck (English draft from CMCA)",
      "✅ Player JSON built (en + kn) — AI draft translation",
      "🔴 CMCA linguistic review of Kannada",
      "🔴 Editable club-name field on slide 6 (flagged by CMCA, not yet built)",
      "🔴 Video / audio asset production",
    ],
  },
  {
    id: "dom-session-3",
    number: 3,
    title: "Choices, Integrity & the Change Champion Box",
    subtitle:
      "Hospital stories · Group values exercise · Reflect on choices · Introduce integrity · Build the Change Champion Box",
    status: "in_progress",
    durationMin: 60,
    progress: [
      "✅ Source deck (English draft from CMCA)",
      "✅ Player JSON built (en + kn) — AI draft translation",
      "🔴 CMCA linguistic review of Kannada",
      "🔴 Video / audio asset production",
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

export default function DomHomePage() {
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
            ← All programmes
          </Link>
          <img
            src="/sessions/assets/cmca_logo.png"
            alt="CMCA"
            style={{ height: "44px", width: "auto" }}
          />
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
          DOM · Children's Civic Club
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
          DOM Session Player
        </h1>
        <p
          style={{
            fontSize: "1.05rem",
            color: "#4B5563",
            margin: "0 0 1rem",
            maxWidth: "640px",
          }}
        >
          Interactive Children's Civic Club sessions for the Department of Minorities
          schools — 350+ schools across Karnataka, Andhra Pradesh, and Odisha.
          Pick a session below to review the draft.
        </p>
        <p
          style={{
            fontSize: "0.85rem",
            color: "#B45309",
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: "8px",
            padding: "0.6rem 0.9rem",
            margin: "0 0 2.5rem",
            maxWidth: "640px",
          }}
        >
          ⚠ Kannada text is an AI draft translation for CMCA to vet — not yet
          confirmed by Sonu / Irfan / Aishwarya. Video and audio have not
          been produced yet.
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
                      Session {s.number}
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
                    ≈ {s.durationMin} min
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
                  {s.title}
                </h2>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "#4B5563",
                    margin: "0 0 1rem",
                  }}
                >
                  {s.subtitle}
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
                    Review draft session →
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
          DOM sessions move to "Live" once CMCA confirms the Kannada
          translation and video/audio assets land in{" "}
          <code>public/sessions/</code>.
        </div>
      </div>
    </main>
  );
}
