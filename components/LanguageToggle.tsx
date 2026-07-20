"use client";

import { Lang } from "./useLanguage";

export default function LanguageToggle({
  lang,
  onToggle,
  accentColour = "#F39C1F",
}: {
  lang: Lang;
  onToggle: () => void;
  accentColour?: string;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label={lang === "en" ? "Switch to Kannada" : "Switch to English"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.15rem",
        padding: "0",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "0.85rem",
        fontWeight: 600,
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          padding: "0.35rem 0.65rem",
          borderRadius: "8px 0 0 8px",
          background: lang === "en" ? accentColour : "#E5E7EB",
          color: lang === "en" ? "#FFF" : "#6B7280",
          transition: "background 0.15s, color 0.15s",
        }}
      >
        EN
      </span>
      <span
        style={{
          padding: "0.35rem 0.65rem",
          borderRadius: "0 8px 8px 0",
          background: lang === "kn" ? accentColour : "#E5E7EB",
          color: lang === "kn" ? "#FFF" : "#6B7280",
          transition: "background 0.15s, color 0.15s",
        }}
      >
        ಕನ್ನಡ
      </span>
    </button>
  );
}
