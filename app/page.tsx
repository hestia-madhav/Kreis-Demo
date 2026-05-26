import { redirect } from "next/navigation";

// Root → straight into the KREIS Session 1 player. There's only one
// session here for now; if more get added, swap this for a small index.
export default function HomePage() {
  redirect("/s/kreis-session-1");
}
