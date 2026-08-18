"use client";

import Link from "next/link";
import LanguageToggle from "../components/LanguageToggle";
import { useLanguage } from "../components/useLanguage";

type Programme = {
  id: "kreis" | "dom";
  name: string;
  clubLabel: { en: string; kn: string };
  colour: string;
  bgAccent: string;
  audience: { en: string; kn: string };
  href: string;
  sessions: { en: string; kn: string };
  status: string;
};

const PROGRAMMES: Programme[] = [
  {
    id: "kreis",
    name: "KREIS",
    clubLabel: {
      en: "Children's Constitution Club",
      kn: "ಮಕ್ಕಳ ಸಂವಿಧಾನ ಕ್ಲಬ್",
    },
    colour: "#F39C1F",
    bgAccent: "rgba(243, 156, 31, 0.12)",
    audience: {
      en: "Karnataka Residential Educational Institutions Society — 484 residential schools across Karnataka",
      kn: "ಕರ್ನಾಟಕ ವಸತಿ ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಗಳ ಸಂಘ — ಕರ್ನಾಟಕಾದ್ಯಂತ 484 ವಸತಿ ಶಾಲೆಗಳು",
    },
    href: "/kreis",
    sessions: { en: "3 sessions", kn: "3 ಅವಧಿಗಳು" },
    status: "Live for pilot",
  },
  {
    id: "dom",
    name: "DOM",
    clubLabel: {
      en: "Children's Civic Club",
      kn: "ಪೌರ ಕ್ಲಬ್",
    },
    colour: "#0EA5E9",
    bgAccent: "rgba(14, 165, 233, 0.10)",
    audience: {
      en: "Department of Minorities schools — 350+ schools across Karnataka, Andhra Pradesh, and Odisha",
      kn: "ಅಲ್ಪಸಂಖ್ಯಾತರ ಇಲಾಖೆ ಶಾಲೆಗಳು — ಕರ್ನಾಟಕ, ಆಂಧ್ರಪ್ರದೇಶ ಮತ್ತು ಒಡಿಶಾದಲ್ಲಿ 350+ ಶಾಲೆಗಳು",
    },
    href: "/dom",
    sessions: { en: "4 sessions", kn: "4 ಅವಧಿಗಳು" },
    status: "In progress",
  },
];

const STRINGS = {
  en: {
    tagline: "Interactive Session Platform",
    heading: "Choose a programme",
    subheading:
      "Pick the programme you're running today. Each programme has its own session set — content, language, and club framing differ between KREIS and DOM.",
    programmeLabel: "Programme",
    open: "Open →",
    footer: "KREIS platform pilot · A2Z Antifragility × CMCA India",
  },
  kn: {
    tagline: "ಸಂವಾದಾತ್ಮಕ ಅವಧಿ ವೇದಿಕೆ",
    heading: "ಕಾರ್ಯಕ್ರಮವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    subheading:
      "ನೀವು ಇಂದು ನಡೆಸುತ್ತಿರುವ ಕಾರ್ಯಕ್ರಮವನ್ನು ಆಯ್ಕೆಮಾಡಿ. ಪ್ರತಿ ಕಾರ್ಯಕ್ರಮಕ್ಕೂ ತನ್ನದೇ ಆದ ಅವಧಿ ಸೆಟ್ ಇರುತ್ತದೆ.",
    programmeLabel: "ಕಾರ್ಯಕ್ರಮ",
    open: "ತೆರೆಯಿರಿ →",
    footer: "KREIS ವೇದಿಕೆ ಪ್ರಾಯೋಗಿಕ · A2Z Antifragility × CMCA India",
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
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                fontSize: "0.72rem",
                color: "#6B7280",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {t.tagline}
            </div>
            <LanguageToggle lang={lang} onToggle={toggle} />
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
          {t.heading}
        </h1>
        <p
          style={{
            fontSize: "1.05rem",
            color: "#4B5563",
            margin: "0 0 3rem",
            maxWidth: "640px",
          }}
        >
          {t.subheading}
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
                  {t.programmeLabel}
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
                  {p.clubLabel[lang]}
                </div>

                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#4B5563",
                    lineHeight: 1.5,
                    margin: "0 0 1.5rem",
                  }}
                >
                  {p.audience[lang]}
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
                    {p.sessions[lang]}
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
                    {t.open}
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
          {t.footer}
        </div>
      </div>
    </main>
  );
}
