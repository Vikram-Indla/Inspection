import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import FieldDraftList from "@/components/field/FieldDraftList";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import styles from "./drafts.module.css";

// BUG-1 fix — /field/drafts previously did not exist, so the dashboard's
// "N draft to resume" chip had nowhere real to link and any direct nav here
// fell through to the [visitId] catch-all (M02-001 "Visit not found"). This
// route reuses the SAME server read (assignments -> visits -> inspections,
// scoped to in_progress) — no new drafts-fetching logic.
//
// Chrome converted to the SAQEEL field design system: the old global <Shell>
// is replaced by <FieldHeader> + the shared <FieldNav> bottom bar, and the
// layout is ported from SAQEEL PWA-Field Drafts.dc.html (.dr-wrap: intro
// caption, draft cards, offline + grounding note panels). Data wiring, the
// golden-journey exclusion and the FieldDraftList offline merge are unchanged.
type Inspection = { id: string; status: string };
type VisitRow = {
  id: string;
  planning_status: string;
  factories: { name: string; factory_code: string | null } | null;
  inspections: Inspection | null;
};

export default async function FieldDraftsPage() {
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login"); // ERR-AUTH-001: never proceed with a null session

  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = locale === "ar" ? "EN" : "AR";
  // Drafts is reached from Home — a back-arrow returns there (RTL-flipped).
  const back = (
    <Link href="/field" prefetch={false} className="btn btn-icon btn-ghost"
      aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" data-directional><path d="m15 18-6-6 6-6" /></svg>
    </Link>
  );

  const { data: asg, error } = await sb.from("assignments")
    .select("visit_id, visits(id, planning_status, factories(name, factory_code), inspections(id, status))")
    .eq("inspector_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[field drafts]", error.message);
    return (
      <>
        <FieldHeader leading={back} title={tr("field.drafts.title", "Drafts", "المسودات")}
          langHref={langHref} langLabel={langLabel} />
        <div className={styles.page}>
          <div className="alert alert-critical" role="alert">
            {t("field.dashboard.serviceUnavailable", "Field data is temporarily unavailable (ERR-OPS-001). Try again.")}
          </div>
        </div>
        <div aria-hidden="true" style={{ height: 58, flex: "none" }} />
      </>
    );
  }

  // Drop throwaway e2e-created establishments (CD-0xx / G10 Golden Journey) so
  // this list's count and top rows match the dashboard's "{n} draft to resume"
  // chip that links here. Shared, tightly-scoped matcher in @/lib/field/fixtures.
  const cards = (asg ?? [])
    .map(a => a.visits as unknown as VisitRow)
    .filter((v): v is NonNullable<typeof v> => !!v && !!v.factories && ["published", "expired"].includes(v.planning_status))
    .filter(v => !isTestFixtureEstablishment(v.factories));

  const serverDrafts = cards
    .filter(v => v.inspections?.status === "in_progress")
    .map(v => ({
      inspectionId: v.inspections!.id,
      factoryName: v.factories!.name,
      factoryCode: v.factories!.factory_code,
    }));

  return (
    <>
      <FieldHeader leading={back} title={tr("field.drafts.title", "Drafts", "المسودات")}
        right={
          <span className="badge badge-warning" style={{ height: 20 }}>
            <span className="dot" />
            {serverDrafts.length} {tr("field.drafts.draftsWord", "drafts", "مسودة")}
          </span>
        }
        langHref={langHref} langLabel={langLabel} />
      <div className={styles.page}>
        <p className="t-caption" style={{ margin: 0 }}>
          {tr("field.drafts.intro",
            "Inspections saved locally and not yet submitted. Resume where you left off; they sync when connectivity is available.",
            "عمليات التفتيش المحفوظة محلياً ولم تُرسل بعد. تُستأنف من حيث توقفت وتُزامَن عند توفر الاتصال.")}
        </p>
        {/* FieldDraftList merges server (in_progress) drafts with local-only
            offline drafts (IndexedDB). It owns its own empty state so the
            server-only serverDrafts.length is never used to short-circuit a
            local-only draft. */}
        <section aria-label={tr("field.drafts.heading", "Drafts to resume", "مسودات للاستئناف")}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <FieldDraftList
            userId={user.id}
            serverDrafts={serverDrafts}
            cardClassName={styles.draftCard}
            resumeLabel={tr("field.attention.resume", "Resume", "استئناف")}
            localLabel={tr("field.attention.localDraft", "Local inspection draft", "مسودة تفتيش محلية")}
            emptyLabel={tr("field.drafts.empty", "No drafts to resume", "لا توجد مسودات للاستئناف")}
            strings={{
              storeKey: tr("field.drafts.storeKey", "Key", "المفتاح"),
              itemsQueued: tr("field.drafts.itemsQueued", "items queued", "بند في الطابور"),
              syncPending: tr("field.drafts.syncPending", "Pending sync", "بانتظار المزامنة"),
              syncLocal: tr("field.drafts.syncLocal", "Saved locally", "محفوظة محلياً"),
              loading: tr("field.drafts.loading", "Loading local drafts…", "جارٍ تحميل المسودات المحلية…"),
              localUnavailable: tr(
                "field.drafts.localUnavailable",
                "Local drafts are temporarily unavailable. Server drafts remain visible.",
                "المسودات المحلية غير متاحة مؤقتاً. تظل مسودات الخادم ظاهرة.",
              ),
            }}
          />
        </section>
        <div className={`panel ${styles.note}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 14, height: 14, flex: "none", marginBlockStart: 1 }} aria-hidden="true">
            <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
          </svg>
          <span>
            {tr("field.drafts.offlineNote",
              "Drafts are stored on your device and stay available offline until final submission.",
              "المسودات مخزّنة على جهازك وتبقى متاحة دون اتصال حتى الإرسال النهائي.")}
          </span>
        </div>
        <div className={`panel ${styles.note}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 14, height: 14, flex: "none", marginBlockStart: 1 }} aria-hidden="true">
            <path d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2z" />
          </svg>
          <span>
            {tr("field.drafts.grounding",
              "Drafts are read from this device's local store, one entry per inspection item.",
              "تُقرأ المسودات من المخزن المحلي على هذا الجهاز، بإدخال واحد لكل بند تفتيش.")}
          </span>
        </div>
      </div>
    </>
  );
}
