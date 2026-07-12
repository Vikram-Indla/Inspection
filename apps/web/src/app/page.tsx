import { redirect } from "next/navigation";

// Sponsor instruction 2026-07-12: one login page only. The public landing
// (SCR-PUB-000) is retired; the root now routes straight to the unified
// Saqeel sign-in (SCR-PUB-010 v2). Signed-in users are bounced onward by
// /login → /launch role routing, so no session check is needed here.
export default function Root() {
  redirect("/login");
}
