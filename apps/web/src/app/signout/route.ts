import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// Server-side sign-out: clears the session cookie and returns to the landing.
// A plain anchor in Shell hits this route — no client component needed there.
export async function GET(request: Request) {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url));
}
