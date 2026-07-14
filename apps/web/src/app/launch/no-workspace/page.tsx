import "../../login/login.css";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import AccessState from "@/components/AccessState";

export const dynamic = "force-dynamic";

// CD-003 frame 1c/1f/1g/1h — authenticated, but no role_key matched any
// workspace (CD003-SEC-001). This is the destination that replaced the old
// silent /admin fallback in launch/page.tsx: no-role and admin-role are no
// longer indistinguishable. No nav, no Shell, no module or role names — just
// identity, a safe explanation, a way to check again, and sign-out.
export default async function NoWorkspace() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login"); // defensive: middleware already guards this route

  const { t, dir, locale } = await useT();

  return (
    <AccessState
      tone="neutral"
      dir={dir}
      lang={locale}
      heading={t("access.noWorkspace.title", "No workspace is assigned to your account yet")}
      body={t("access.noWorkspace.body", "Your sign-in was successful, but no role has been assigned to your account. Contact your administrator to request access.")}
      identity={user.email ?? undefined}
      identityLabel={t("access.noWorkspace.signedInAs", "Signed in as")}
      actions={
        <>
          <a className="ax-btn ax-btn--prominent lg-submit" href="/launch">{t("access.noWorkspace.checkAgain", "Check again")}</a>
          <a className="lg-linkbtn" href="/signout">{t("nav.signout", "Sign out")}</a>
        </>
      }
    />
  );
}
