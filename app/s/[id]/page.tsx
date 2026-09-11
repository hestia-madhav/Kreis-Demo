import SessionLoader from "./SessionLoader";

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return [
    "dom-session-1", "dom-session-2", "dom-session-3", "dom-session-4", "dom-session-5", "dom-session-6",
    "kreis-session-1", "kreis-session-2", "kreis-session-3", "kreis-session-4",
    "kreis-session-5", "kreis-session-6", "kreis-session-7",
  ].map((id) => ({ id }));
}

export default async function SessionPage({ params }: Params) {
  const { id } = await params;
  return <SessionLoader id={id} />;
}
