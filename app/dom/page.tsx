import Link from "next/link";

// DOM programme session list. Three sessions matching the KREIS structure,
// with "Constitution Club" → "Civic Club" and content pending Kannada /
// Telugu / Odia translation from Sonu + Aishwarya. Sessions are stubbed
// as "in preparation" until content lands.

type Status = "in_progress" | "in_preparation" | "draft";

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
    title: "Welcome to the Civic Club",
    subtitle:
      "Introductions · Calmers · Group formation · Civic connect · Club rules",
    status: "in_preparation",
    durationMin: 60,
    progress: [
      "✅ Source deck (English draft from CMCA)",
      "✅ Structural mapping to KREIS Session 1 completed",
      "🔴 Kannada / Telugu / Odia translation from Sonu / Aishwarya",
      "🔴 'Constitution Club' → 'Civic Club' replacements",
      "🔴 State-specific content variants (Odisha local stories per Ramya)",
      "🔴 Player JSON build",
    ],
  },
  {
    id: "dom-session-2",
    number: 2,
    title: "Naming of Club & Launch Campaign",
    subtitle:
      "Pick a club name · Form the core committee · Elect a president · Plan the school-assembly launch",
    status: "in_preparation",
    durationMin: 60,
    progress: [
      "✅ Source deck (English draft from CMCA)",
      "🔴 Awaiting Kannada / Telugu / Odia translation",
      "🔴 Player JSON build",
    ],
  },
  {
    id: "dom-session-3",
    number: 3,
    title: "Choices, Integrity & the Change Champion Box",
    subtitle:
      "Hospital stories · Group values exercise · Reflect on choices · Introduce integrity · Build the Change Champion Box",
    status: "in_preparation",
    durationMin: 60,
    progress: [
      "✅ Source deck (English draft from CMCA)",
      "🔴 Awaiting Kannada / Telugu / Odia translation",
      "🔴 Player JSON build",
    ],
  },
];

const STATUS_PILL: Record<Status, { label: string; bg: string; fg: string }> = {
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
          DOM · Civic Club
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
            margin: "0 0 2.5rem",
            maxWidth: "640px",
          }}
        >
          Interactive Civic Club sessions for the Department of Minorities
          schools — 350+ schools across Karnataka, Andhra Pradesh, and Odisha.
          Sessions are in preparation ahead of the 16 Jul training window.
        </p>

        <div style={{ display: "grid", gap: "1.25rem" }}>
          {SESSIONS.map((s) => {
            const pill = STATUS_PILL[s.status];
            return (
              <article
                key={s.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "1.5rem 1.75rem",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  opacity: 0.9,
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

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "grid",
                    gap: "0.3rem",
                    fontSize: "0.82rem",
                    color: "#374151",
                  }}
                >
                  {s.progress.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </article>
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
          DOM sessions activate once Kannada / Telugu / Odia translations land from CMCA content team.
        </div>
      </div>
    </main>
  );
}
