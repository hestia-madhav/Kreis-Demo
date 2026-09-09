"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import SessionRunner from "../../../components/SessionRunner";

async function loadVariant(id: string, lang: "en" | "kn"): Promise<unknown | null> {
  const safeId = id.replace(/[^a-z0-9_-]/gi, "");
  if (!safeId) return null;
  const candidates =
    lang === "en"
      ? [`${safeId}.en.json`, `${safeId}.json`]
      : [`${safeId}.${lang}.json`];
  for (const name of candidates) {
    try {
      const res = await fetch(`/sessions/${name}`);
      if (!res.ok) continue;
      return await res.json();
    } catch {
      // try next
    }
  }
  return null;
}

export default function SessionLoader({ id }: { id: string }) {
  const [sessions, setSessions] = useState<{ en: unknown; kn: unknown | null } | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    Promise.all([loadVariant(id, "en"), loadVariant(id, "kn")]).then(([en, kn]) => {
      if (!en) {
        setMissing(true);
        return;
      }
      setSessions({ en, kn });
    });
  }, [id]);

  if (missing) return notFound();
  if (!sessions) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: "1.2rem", color: "#666" }}>Loading session…</div>;

  return (
    <SessionRunner
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sessions={{ en: sessions.en as any, kn: sessions.kn as any | null }}
    />
  );
}
