import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import { useT } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import DeviceReadinessClient from "./DeviceReadinessClient";

// Responsive browser Device Readiness surface. Related contract anchors:
// SCR-IPAD-610 (Inspector Startup Pack readiness / "storage low" negative state),
// SPC-OFF-002 (see what data/actions are available offline), MVP2-REQ-0181
// (readiness must state the exact fix before field travel), and FND-005/006
// (offline business-state protection). This screen reads browser connectivity
// and storage only; it never clears drafts, packages, conflicts or queued work.
export default async function FieldDeviceReadinessPage() {
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
        title={tr("field.readiness.title", "Device readiness", "جاهزية الجهاز")}
        langHref={locale === "ar" ? "/locale?set=en" : "/locale?set=ar"}
        langLabel={locale === "ar" ? "EN" : "AR"}
      />
      <DeviceReadinessClient locale={locale} />
    </>
  );
}
