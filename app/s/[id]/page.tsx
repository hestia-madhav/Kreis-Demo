import SessionLoader from "./SessionLoader";

type Params = { params: Promise<{ id: string }> };

export default async function SessionPage({ params }: Params) {
  const { id } = await params;
  return <SessionLoader id={id} />;
}
