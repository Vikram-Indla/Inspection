import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import FieldQrPlaceholder from "@/components/field/FieldQrPlaceholder";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";

// SAQEEL Field — Establishment Feedback QR (O-15 STUB / provision).
// The site representative is meant to scan this QR to give feedback / receive
// their acknowledgement copy. Per O-15 the QR PAYLOAD and the public scan/PDF
// destination are undecided, so this is intentionally a PROVISION ONLY:
// a real route + a real linkage payload (inspector, optional visit) + a
// placeholder QR graphic. The scan does NOT resolve to anything yet — clearly
// labelled as pending — and no unauthenticated public flow is built.
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
              "Placeholder only. When the representative scans this code they will reach their feedback / acknowledgement copy — the scan destination and code generation are not built yet.",
              "عنصر مؤقت فقط. عند مسح ممثل الموقع لهذا الرمز سيصل إلى نسخة التقييم / الإقرار الخاصة به — لم يتم بعد بناء وجهة المسح ولا توليد الرمز.")}
          </p>

          <div style={{ width: "100%", borderBlockStart: "1px solid var(--border-subtle)", paddingBlockStart: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12.5 }}>
              <span style={{ color: "var(--text-secondary)" }}>{tr("field.qr.linked", "Linked payload", "الحمولة المرتبطة")}</span>
              <span className="id-code" dir="ltr" style={{ overflowWrap: "anywhere", textAlign: "end" }}>{payload}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
