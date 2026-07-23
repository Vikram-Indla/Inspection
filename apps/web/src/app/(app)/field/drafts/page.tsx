import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import FieldTabs from "@/components/FieldTabs";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import FieldDraftList from "@/components/field/FieldDraftList";

// BUG-1 fix — /field/drafts previously did not exist, so the dashboard's
// "N draft to resume" chip had nowhere real to link and any direct nav here
// fell through to the [visitId] catch-all (M02-001 "Visit not found"). This
// route reuses the SAME server read (assignments -> visits -> inspections,
// scoped to in_progress) and the SAME FieldDraftList component the dashboard
// already renders inline — no new drafts-fetching logic.
type Inspection = { id: string; status: string };
type VisitRow = {
  id: string;
  planning_status: string;
  factories: { name: string } | null;
  inspections: Inspection | null;
};

export default async function FieldDraftsPage() {
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login"); // ERR-AUTH-001: never proceed with a null session

  const { data: asg, error } = await sb.from("assignments")
    .select("visit_id, visits(id, planning_status, factories(name), inspections(id, status))")
    .eq("inspector_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[field drafts]", error.message);
    return (
      <Shell current="/field" title={t("field.drafts.title", "Drafts")}>
        <div className="ax-banner ax-banner--critical" role="alert">
          {t("field.dashboard.serviceUnavailable", "Field data is temporarily unavailable (ERR-OPS-001). Try again.")}
        </div>
      </Shell>
    );
  }

  const cards = (asg ?? [])
    .map(a => a.visits as unknown as VisitRow)
    .filter((v): v is NonNullable<typeof v> => !!v && !!v.factories && ["published", "expired"].includes(v.planning_status));

  const serverDrafts = cards
    .filter(v => v.inspections?.status === "in_progress")
    .map(v => ({
      inspectionId: v.inspections!.id,
      factoryName: v.factories!.name,
    }));

  const tabs = <FieldTabs active="home" labels={{
    home: t("field.tabs.dashboard", "Dashboard"),
    myTasks: t("field.tabs.visits", "Visits"),
    establishments: t("field.establishments.title", "Field establishments"),
    notifications: t("field.notifications.title", "Notifications"),
    account: t("field.account.title", "Account"),
  }} />;

  return (
    <Shell current="/field" title={t("field.drafts.title", "Drafts")}
      context={<span className="ax-lozenge ax-lozenge--warning">{t("field.rail.draft", "{n} draft to resume").replace("{n}", String(serverDrafts.length))}</span>}>
      <div className="ax-field-page">
        <section aria-labelledby="field-drafts-heading" className="ax-surface ax-panel"
          style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
          <h2 id="field-drafts-heading" className="ax-overline">{t("field.drafts.heading", "Drafts to resume")}</h2>
          {/* FieldDraftList merges server (in_progress) drafts with local-only
              offline drafts (IndexedDB) — same component, same merge logic the
              dashboard already uses. It owns its own empty state so the
              server-only serverDrafts.length is never used to short-circuit a
              local-only draft. */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-150)" }}>
            <FieldDraftList
              userId={user.id}
              serverDrafts={serverDrafts}
              draftLabel={t("field.attention.draft", "Draft")}
              resumeLabel={t("field.attention.resume", "Resume")}
              localLabel={t("field.attention.localDraft", "Local inspection draft")}
              emptyLabel={t("field.drafts.empty", "No drafts to resume")}
            />
          </div>
        </section>
      </div>
      {tabs}
    </Shell>
  );
}
