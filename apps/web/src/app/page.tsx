import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

// Sponsor instruction 2026-07-12: one login page only. The public landing
// (SCR-PUB-000) is retired; the root routes to the unified Saqeel sign-in
// (SCR-PUB-010 v2).
//
// Reported by Sikander Ahmad: an already signed-in user refreshing the root
// saw the sign-in screen appear before being carried on to their workspace.
// The root used to send everyone to /login unconditionally and /login then
// bounced a signed-in user onward, so the sign-in page rendered every time
// purely as a staging post. Asking who the visitor is first sends them
// straight where they belong, and the sign-in screen is only ever shown to
// someone who actually needs to sign in.
export const dynamic = "force-dynamic";

export default async function Root() {
  const locale = await getLocale();
  const sb = await supabaseServer();
  const { data: { user }, error } = await getVerifiedUser(sb);
  // Any doubt about the session resolves to sign-in. This is a routing
  // decision, not an authorization one — /launch and the middleware remain
  // the authority on what a signed-in user may actually reach.
  if (error || !user) redirect(localeHref(locale, "/login"));
  redirect(localeHref(locale, "/launch"));
}
