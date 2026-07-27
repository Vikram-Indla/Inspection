import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// Server-side sign-out: clears the session cookie and returns to the landing.
// A plain anchor in Shell hits this route — no client component needed there.
export async function GET() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  // A relative Location keeps the browser on its visible origin. Building an
  // absolute URL from request.url leaks the container's internal host through
  // reverse proxies (for example, http://<container>:3001) and sends the user
  // to an unresolvable address after an otherwise successful sign-out.
  return new NextResponse(null, {
    status: 303,
    headers: { Location: "/login?reason=signedout" },
  });
}
