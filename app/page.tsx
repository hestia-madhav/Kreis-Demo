import Link from "next/link";

// Programme picker landing. Two programmes live on this platform:
// - KREIS (Children's Constitution Club) — Karnataka govt schools
// - DOM  (Civic Club)                     — Department of Minorities schools
// User picks a programme, then a session within.

type Programme = {
  id: "kreis" | "dom";
  name: string;
  clubLabel: string;
  colour: string;
  bgAccent: string;
  audience: string;
  href: string;
  sessions: string;
  status: string;
};

const PROGRAMMES: Programme[] = [
  {
    id: "kreis",
    name: "KREIS",
    clubLabel: "Children's Constitution Club",
    colour: "#F39C1F",
    bgAccent: "rgba(243, 156, 31, 0.12)",
    audience:
      "Karnataka Residential Educational Institutions Society — 484 residential schools across Karnataka",
    href: "/kreis",
    sessions: "3 sessions in progress",
    status: "Live for pilot",
  },
  {
    id: "dom",
    name: "DOM",
    clubLabel: "Civic Club",
    colour: "#0EA5E9",
    bgAccent: "rgba(14, 165, 233, 0.10)",
    audience:
      "Department of Minorities schools — Karnataka, Andhra Pradesh, Odisha (pending Kannada / Telugu / Odia translation)",
    href: "/dom",
    sessions: "3 sessions in preparation",
    status: "In preparation · Jul 16 target",
  },
];

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1400px 700px at 50% -10%, rgba(243, 156, 31, 0.13), transparent 60%), #FFFBF2",
        padding: "3rem 1.25rem 5rem",
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans Kannada", sans-serif',
        color: "#1F2937",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            marginBottom: "3rem",
            flexWrap: "wrap",
          }}
        >
          <img
            src="/sessions/assets/cmca_logo.png"
            alt="CMCA"
            style={{ height: "48px", width: "auto" }}
          />
          <div
            style={{
              fontSize: "0.72rem",
              color: "#6B7280",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Interactive Session Platform
          </div>
        </header>

        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: 800,
            margin: "0 0 0.5rem",
            color: "#1E293B",
            lineHeight: 1.15,
          }}
        >
          Choose a programme
        </h1>
        <p
          style={{
            fontSize: "1.05rem",
            color: "#4B5563",
            margin: "0 0 3rem",
            maxWidth: "640px",
          }}
        >
          Pick the programme you&apos;re running today. Each programme has its
          own session set — content, language, and club framing differ between
          KREIS and DOM.
        </p>

        <div
          style={{
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          }}
        >
          {PROGRAMMES.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <article
                style={{
                  background: "#FFFFFF",
                  border: `2px solid ${p.colour}22`,
                  borderRadius: "18px",
                  padding: "2rem 1.75rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  transition:
                    "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                  cursor: "pointer",
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Coloured accent stripe on top */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "6px",
                    background: p.colour,
                  }}
                />

                <div
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: p.colour,
                    marginTop: "0.5rem",
                  }}
                >
                  Programme
                </div>
                <h2
                  style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    margin: "0.25rem 0 0.75rem",
                    color: "#111827",
                  }}
                >
                  {p.name}
                </h2>

                <div
                  style={{
                    display: "inline-block",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "999px",
                    background: p.bgAccent,
                    color: p.colour,
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    marginBottom: "1rem",
                  }}
                >
                  {p.clubLabel}
                </div>

                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#4B5563",
                    lineHeight: 1.5,
                    margin: "0 0 1.5rem",
                  }}
                >
                  {p.audience}
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    paddingTop: "1rem",
                    borderTop: "1px solid #E5E7EB",
                  }}
                >
                  <span style={{ fontSize: "0.9rem", color: "#374151" }}>
                    {p.sessions}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      color: p.colour,
                      fontWeight: 700,
                      fontSize: "0.9rem",
                    }}
                  >
                    Open →
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "#9CA3AF",
                    marginTop: "0.65rem",
                    letterSpacing: "0.03em",
                  }}
                >
                  {p.status}
                </div>
              </article>
            </Link>
          ))}
        </div>

        <div
          style={{
            marginTop: "3rem",
            fontSize: "0.78rem",
            color: "#6B7280",
            textAlign: "center",
          }}
        >
          KREIS platform pilot · A2Z Antifragility × CMCA India
        </div>
      </div>
    </main>
  );
}
