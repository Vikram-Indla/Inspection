import Link from "next/link";
import { redirect } from "next/navigation";
import FieldNav from "@/components/field/FieldNav";
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
// scoped to in_progress) and the SAME FieldDraftList component the dashboard
// already renders inline — no new drafts-fetching logic.
//
// Chrome converted to the SAQEEL field design system: the old global <Shell>
// is replaced by <FieldHeader> + the shared <FieldNav> bottom bar, and the
// section/rows use DS surfaces, badges and tokens. Data wiring, the
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
  const themeLabels = {
    toLight: tr("field.theme.toLight", "Light mode", "الوضع الفاتح"),
    toDark: tr("field.theme.toDark", "Dark mode", "الوضع الداكن"),
  };
  const nav = (
    <FieldNav active="home" labels={{
      home: tr("field.tabs.home", "Home", "الرئيسية"),
      myTasks: tr("field.tabs.myTasks", "My Tasks", "مهامي"),
      establishments: tr("field.tabs.establishments", "Establishments", "المنشآت"),
      notifications: tr("field.tabs.notifications", "Notifications", "الإشعارات"),
      account: tr("field.tabs.account", "Account", "الحساب"),
    }} />
  );
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
          langHref={langHref} langLabel={langLabel} themeLabels={themeLabels} />
        <div className={styles.page}>
          <div className="alert alert-critical" role="alert">
            {t("field.dashboard.serviceUnavailable", "Field data is temporarily unavailable (ERR-OPS-001). Try again.")}
          </div>
        </div>
        <div aria-hidden="true" style={{ height: 58, flex: "none" }} />
        {nav}
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
    }));

  return (
    <>
      <FieldHeader leading={back} title={tr("field.drafts.title", "Drafts", "المسودات")}
        subtitle={tr("field.rail.draft", "{n} draft to resume", "{n} مسودة للاستئناف").replace("{n}", String(serverDrafts.length))}
        langHref={langHref} langLabel={langLabel} themeLabels={themeLabels} />
      <div className={styles.page}>
        <section aria-labelledby="field-drafts-heading" className={styles.card}>
          <div className={styles.head}>
            <h2 id="field-drafts-heading" style={{ margin: 0, fontSize: 14, fontWeight: 600, flex: 1 }}>{tr("field.drafts.heading", "Drafts to resume", "مسودات للاستئناف")}</h2>
            <span className="badge badge-draft"><span className="dot" />{String(serverDrafts.length)}</span>
          </div>
          {/* FieldDraftList merges server (in_progress) drafts with local-only
              offline drafts (IndexedDB) — same component, same merge logic the
              dashboard already uses. It owns its own empty state so the
              server-only serverDrafts.length is never used to short-circuit a
              local-only draft. */}
          <div className={styles.list}>
            <FieldDraftList
              userId={user.id}
              serverDrafts={serverDrafts}
              draftLabel={tr("field.attention.draft", "Draft", "مسودة")}
              resumeLabel={tr("field.attention.resume", "Resume", "استئناف")}
              localLabel={tr("field.attention.localDraft", "Local inspection draft", "مسودة تفتيش محلية")}
              emptyLabel={tr("field.drafts.empty", "No drafts to resume", "لا توجد مسودات للاستئناف")}
            />
          </div>
        </section>
      </div>
      <div aria-hidden="true" style={{ height: 58, flex: "none" }} />
      {nav}
    </>
  );
}
