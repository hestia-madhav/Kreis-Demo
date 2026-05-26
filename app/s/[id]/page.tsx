import { notFound } from "next/navigation";
import { promises as fs } from "fs";
import path from "path";
import SessionRunner from "../../../components/SessionRunner";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function loadSession(id: string): Promise<unknown | null> {
  // Sessions live in /public/sessions/<id>.json. Read from disk on the
  // server — works the same in dev and on Vercel.
  const safeId = id.replace(/[^a-z0-9_-]/gi, "");
  if (!safeId) return null;
  const file = path.join(process.cwd(), "public", "sessions", `${safeId}.json`);
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default async function SessionPage({ params }: Params) {
  const { id } = await params;
  const session = await loadSession(id);
  if (!session) notFound();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <SessionRunner session={session as any} />;
}
