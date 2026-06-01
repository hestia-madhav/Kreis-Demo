import { notFound } from "next/navigation";
import { promises as fs } from "fs";
import path from "path";
import SessionRunner from "../../../components/SessionRunner";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// Reads a session JSON. Tries `<id>.<lang>.json` first; falls back to the
// legacy single-file `<id>.json` for the English version so old links keep
// working even if someone hasn't done the .en rename.
async function loadVariant(id: string, lang: "en" | "kn"): Promise<unknown | null> {
  const safeId = id.replace(/[^a-z0-9_-]/gi, "");
  if (!safeId) return null;
  const candidates =
    lang === "en"
      ? [`${safeId}.en.json`, `${safeId}.json`]
      : [`${safeId}.${lang}.json`];
  for (const name of candidates) {
    const file = path.join(process.cwd(), "public", "sessions", name);
    try {
      const raw = await fs.readFile(file, "utf-8");
      return JSON.parse(raw);
    } catch {
      // try next
    }
  }
  return null;
}

export default async function SessionPage({ params }: Params) {
  const { id } = await params;
  const [en, kn] = await Promise.all([loadVariant(id, "en"), loadVariant(id, "kn")]);
  if (!en) notFound();
  return (
    <SessionRunner
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sessions={{ en: en as any, kn: kn as any | null }}
    />
  );
}
