import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import { useT } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import FieldSettingsClient from "./FieldSettingsClient";

// SAQEEL Field Settings.dc.html — dedicated field Settings screen. Chrome ported
// pixel-to-pixel from the design (back-arrow header, no bottom nav, grouped
// section cards). Real, persisting controls stay interactive (theme, language,
// sync status/refresh, trusted-devices link, sign out); design items with no
// backing store/action render as honest governed rows — never fake toggles
// (CLAUDE.md: no fabricated capability).
export default async function FieldSettingsPage() {
  const [sb, { t, locale }] = await Promise.all([supabaseServer(), useT()]);
  const { data: { user }, error } = await getVerifiedUser(sb);
  if (error || !user) redirect("/login");
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));

  const backBtn = (
    <Link href="/field/account" prefetch={false} className="btn btn-icon btn-ghost" aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" data-directional><path d="M15 6l-6 6 6 6" /></svg>
    </Link>
  );

  return (
    <>
      <FieldHeader
        leading={backBtn}
        title={tr("field.settings.title", "Settings", "الإعدادات")}
        langHref={locale === "ar" ? "/locale?set=en" : "/locale?set=ar"}
        langLabel={locale === "ar" ? "EN" : "AR"}
      />
      <FieldSettingsClient locale={locale} userId={user.id} appVersion={process.env.NEXT_PUBLIC_APP_VERSION ?? null} />
    </>
  );
}
