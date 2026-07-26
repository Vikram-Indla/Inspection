import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import FieldQrPlaceholder from "@/components/field/FieldQrPlaceholder";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";

// SAQEEL Field — Establishment Feedback QR (O-15 partial).
// The QR graphic itself stays a generic, non-scannable placeholder — the
// external self-serve scan flow (O-15: public QR payload encoding, unauth
// scan destination) remains an open decision and is intentionally not built.
// What IS real: when a visit is completed, the assigned inspector can open
// the rating form directly on their own device (rate/[visitId]) and hand it
// to the representative in person — the same device-handoff pattern already
// accepted for factory-representative acknowledgement (DEC-009/M04-197).
export default async function FieldFeedbackQrPage({ searchParams }: { searchParams: Promise<{ visit?: string }> }) {
  const { visit } = await searchParams;
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");

  // The real linkage the eventual QR will encode. Kept as a stable, opaque
  // string; not a working URL yet (generation/destination pending, O-15).
  const uuidShape = /^[0-9a-f-]{36}$/i;
  const visitPart = visit && uuidShape.test(visit) ? `&visit=${visit}` : "";
  const payload = `saqeel://feedback?inspector=${user.id}${visitPart}`;

  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const back = (
    <Link href="/field" prefetch={false} className="btn btn-icon btn-ghost" aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" data-directional><path d="m15 6-6 6 6 6" /></svg>
    </Link>
  );

  return (
    <>
      <FieldHeader leading={back} title={tr("field.qr.title", "Establishment feedback QR", "رمز تقييم المنشأة")}
        subtitle={tr("field.qr.sub", "Show to the site representative", "اعرضه على ممثل الموقع")}
        langHref={langHref} langLabel={locale === "ar" ? "EN" : "AR"} />

      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-5)", maxWidth: 520, width: "100%", margin: "0 auto" }}>
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%" }}>
          <span className="badge badge-pending" style={{ alignSelf: "center" }}>
            <span className="dot" />{tr("field.qr.provision", "Provision — generation pending", "تحت الإعداد — التوليد لاحقًا")}
          </span>

          <FieldQrPlaceholder payload={payload} size={200} />

          <p className="t-caption" style={{ textAlign: "center", margin: 0, maxWidth: 360 }}>
            {tr("field.qr.note",
              "Illustrative only — the self-serve scan flow is not built (open decision O-15). To capture a rating now, use the button below on this device.",
              "توضيحي فقط — لم يُبنَ بعد مسار المسح الذاتي (قرار مفتوح O-15). لتسجيل تقييم الآن، استخدم الزر أدناه على هذا الجهاز.")}
          </p>

          <div style={{ width: "100%", borderBlockStart: "1px solid var(--border-subtle)", paddingBlockStart: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12.5 }}>
              <span style={{ color: "var(--text-secondary)" }}>{tr("field.qr.linked", "Linked payload", "الحمولة المرتبطة")}</span>
              <span className="id-code" dir="ltr" style={{ overflowWrap: "anywhere", textAlign: "end" }}>{payload}</span>
            </div>
          </div>

          {visit && uuidShape.test(visit) && (
            <Link href={`/field/feedback/rate/${visit}`} prefetch={false} className="btn btn-secondary btn-block">
              {tr("field.qr.openForm", "Open rating form on this device", "افتح نموذج التقييم على هذا الجهاز")}
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
