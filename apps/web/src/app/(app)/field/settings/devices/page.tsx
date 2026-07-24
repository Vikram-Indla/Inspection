import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import { useT } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import TrustedDevicesClient from "./TrustedDevicesClient";

// SAQEEL Field Trusted Devices.dc.html — dedicated field Trusted Devices screen.
// Chrome ported pixel-to-pixel from the design (back-arrow header, no bottom nav,
// device card, enroll action, security note). The design mock lists two fabricated
// iPads with a per-device revoke; the app renders ONLY the real backend-driven
// device register for this user (a single self-enrolled device), governed — it
// never invents extra devices or a revoke action with no backend (CLAUDE.md).
export default async function FieldTrustedDevicesPage() {
  const [sb, { t, locale }] = await Promise.all([supabaseServer(), useT()]);
  const { data: { user }, error } = await getVerifiedUser(sb);
  if (error || !user) redirect("/login");
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));

  const backBtn = (
    <Link href="/field/settings" prefetch={false} className="btn btn-icon btn-ghost" aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" data-directional><path d="M15 6l-6 6 6 6" /></svg>
    </Link>
  );

  return (
    <>
      <FieldHeader
        leading={backBtn}
        title={tr("field.devices.title", "Trusted Devices", "الأجهزة الموثوقة")}
        langHref={locale === "ar" ? "/locale?set=en" : "/locale?set=ar"}
        langLabel={locale === "ar" ? "EN" : "AR"}
      />
      <TrustedDevicesClient locale={locale} userId={user.id} userLabel={user.email ?? user.id} />
    </>
  );
}
