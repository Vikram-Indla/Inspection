import Link from "next/link";
import Shell from "@/app/(app)/admin/_components/AdminShell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { logProviderError } from "@/lib/neutral-error";

// M9 / PLN-CON-014 — planning status rules view. READ-ONLY: renders the
// currently published workflow configuration (config_versions,
// engine=workflow) as a data-driven transition table. When no published
// payload is readable, a static copy of the canonical lifecycle
// (visit-lifecycle-v4) is shown and labelled as such. Changes to these rules
// happen through the governed workflow publish flow (/admin/workflows), never
// here.
export const dynamic = "force-dynamic";

type WorkflowTransition = {
  id?: string;
  from?: string;
  to?: string;
  actor?: string;
  guard?: string;
  terminal?: boolean;
  side_effects?: string[];
};

type WorkflowPayload = {
  object?: string;
  states?: string[];
  transitions?: WorkflowTransition[];
};

// Static copy of the seeded visit-lifecycle-v4 payload — used only when the
// published config_versions row cannot be read, and labelled as a fallback.
const FALLBACK_STATES = ["planned", "acknowledged", "in_execution", "completed", "closed"];
const FALLBACK_TRANSITIONS: WorkflowTransition[] = [
  { id: "STM-PLAN-002", from: "planned", to: "acknowledged", actor: "inspector", guard: "assigned inspector acknowledges" },
  { id: "STM-VIS-001", from: "acknowledged", to: "in_execution", actor: "inspector", guard: "execution window open" },
  { id: "STM-VIS-002", from: "in_execution", to: "completed", actor: "inspector", guard: "report submitted" },
  { id: "STM-VIS-003", from: "completed", to: "closed", actor: "planner", guard: "review accepted" },
  { id: "republish", from: "any", to: "planned", actor: "planner", guard: "the planner is allowed to publish" },
];

// What each permission lets someone do, said in the words a business reader
// uses. The internal name is kept only as a stable key for the row.
const CAPABILITY_MAP: { capability: string; label: string; effect: string }[] = [
  { capability: "planning.publish", label: "Publish a plan", effect: "Make a visit plan live so an inspector can act on it" },
  { capability: "planning.manage", label: "Create and edit plans", effect: "Build and change visit plans before they go live" },
  { capability: "planning.cancel", label: "Cancel a visit", effect: "Cancel a planned visit, giving one of the approved reasons" },
  { capability: "planning.reassign", label: "Change the inspector", effect: "Give a planned visit to a different inspector" },
  { capability: "planning.reschedule", label: "Change the dates", effect: "Move the window a planned visit must be carried out in" },
];

// Lifecycle stages are stored as keys. Show the name a person recognises, and
// fall back to the stored value if a published configuration adds a stage we
// have no name for yet — never a blank.
const STATE_LABELS: Record<string, string> = {
  planned: "Planned",
  acknowledged: "Accepted by inspector",
  in_execution: "Being carried out",
  completed: "Completed",
  closed: "Closed",
  any: "Any stage",
};

const stateLabel = (key: string) => STATE_LABELS[key] ?? key.replace(/_/g, " ");

function asPayload(value: unknown): WorkflowPayload | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const payload = value as WorkflowPayload;
  if (!Array.isArray(payload.states) || !Array.isArray(payload.transitions)) return null;
  return payload;
}

export default async function PlanningStatus() {
  const { t } = await useT();
  const sb = await supabaseServer();

  const { data, error } = await sb
    .from("config_versions")
    .select("id, version_label, status, effective_from, payload")
    .eq("engine", "workflow")
    .eq("status", "published")
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) logProviderError("admin planning status read", error);

  const payload = asPayload(data?.payload);
  const states = payload?.states ?? FALLBACK_STATES;
  const transitions = payload?.transitions ?? FALLBACK_TRANSITIONS;
  const isFallback = !payload;

  return (
    <Shell current="/admin/planning/status" title={t("admin.planning.status.title", "Planning status rules")}
      context={<span className="badge badge-info">Read only</span>}>
      <div className="alert"><div>
        <strong>{t("admin.planning.status.banner.title", "These rules are governed by workflow configuration.")}</strong>{" "}
        {t("admin.planning.status.banner.body", "Status transitions are defined by the published workflow configuration and enforced by the database. This screen is read-only; changes go through the governed publish flow.")}{" "}
        <Link href="/admin/workflows">{t("admin.planning.status.banner.link", "Open workflow configuration")}</Link>
      </div></div>

      {isFallback ? (
        <div className="alert alert-warning" role="status"><div>
          {error
            ? t("admin.planning.status.fallback.error", "The live rules could not be read. What you see below is the standard set of stages, kept here as a reference, and it may be out of date.")
            : t("admin.planning.status.fallback.none", "No rules have been published yet. What you see below is the standard set of stages, kept here as a reference, and it may be out of date.")}
        </div></div>
      ) : (
        <p className="t-caption">
          {t("admin.planning.status.source", "Showing the published workflow configuration")}
          {data?.version_label ? ` · ${data.version_label}` : ""}
          {data?.effective_from ? ` · ${t("admin.planning.status.effectiveFrom", "effective from")} ${new Date(data.effective_from).toLocaleDateString()}` : ""}
        </p>
      )}

      <section className="panel" style={{ padding: "var(--space-6)" }}>
        <h2 style={{ marginBlockStart: 0 }}>{t("admin.planning.status.states", "Stages a visit goes through")}</h2>
        <div className="row">
          {states.map(state => (
            <span key={state} className="badge badge-info">{stateLabel(state)}</span>
          ))}
        </div>
      </section>

      <section className="panel" style={{ padding: "var(--space-6)" }}>
        <h2 style={{ marginBlockStart: 0 }}>{t("admin.planning.status.transitions", "How a visit moves between stages")}</h2>
        <div className="table-wrap"><table className="table">
          <thead><tr>
            <th scope="col">{t("admin.planning.status.col.from", "From")}</th>
            <th scope="col">{t("admin.planning.status.col.to", "To")}</th>
            <th scope="col">{t("admin.planning.status.col.actor", "Who does it")}</th>
            <th scope="col">{t("admin.planning.status.col.guard", "Only when")}</th>
            <th scope="col">{t("admin.planning.status.col.terminal", "Final stage")}</th>
            <th scope="col">{t("admin.planning.status.col.sideEffects", "Also happens")}</th>
          </tr></thead>
          <tbody>
            {transitions.map((tr, index) => (
              <tr key={tr.id ?? index}>
                <td><span className="badge">{tr.from ? stateLabel(tr.from) : "—"}</span></td>
                <td><span className="badge badge-info">{tr.to ? stateLabel(tr.to) : "—"}</span></td>
                <td>{tr.actor ?? "—"}</td>
                <td className="t-caption">{tr.guard ?? "—"}</td>
                <td>{tr.terminal ? t("common.yes", "yes") : t("common.no", "no")}</td>
                <td className="t-caption">{tr.side_effects?.length ? tr.side_effects.join(" · ") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </section>

      <section className="panel" style={{ padding: "var(--space-6)" }}>
        <h2 style={{ marginBlockStart: 0 }}>{t("admin.planning.status.capabilities", "Planning capabilities")}</h2>
        <div className="table-wrap"><table className="table">
          <thead><tr>
            <th scope="col">{t("admin.planning.status.col.capability", "Permission")}</th>
            <th scope="col">{t("admin.planning.status.col.effect", "Effect")}</th>
          </tr></thead>
          <tbody>
            {CAPABILITY_MAP.map(row => (
              <tr key={row.capability}>
                <td><strong>{row.label}</strong></td>
                <td>{row.effect}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <p className="t-caption" style={{ marginBlockEnd: 0 }}>
          {t("admin.planning.status.capabilitiesNote", "What each role is allowed to do is managed under Users & Roles.")}
        </p>
      </section>
    </Shell>
  );
}
