import Link from "next/link";
import Shell from "@/components/Shell";
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
  { id: "republish", from: "any", to: "planned", actor: "planner", guard: "planning.publish capability" },
];

const CAPABILITY_MAP: { capability: string; effect: string }[] = [
  { capability: "planning.publish", effect: "Publish a visit plan into the governed lifecycle" },
  { capability: "planning.manage", effect: "Create and edit visit plans before publication" },
  { capability: "planning.cancel", effect: "Cancel a planned visit (governed cancellation reasons)" },
  { capability: "planning.reassign", effect: "Reassign the inspector on a planned visit" },
  { capability: "planning.reschedule", effect: "Move a planned visit's execution window" },
];

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
      context={<span className="ax-lozenge ax-lozenge--info">PLN-CON-014 · read-only</span>}>
      <div className="ax-banner"><div>
        <strong>{t("admin.planning.status.banner.title", "These rules are governed by workflow configuration.")}</strong>{" "}
        {t("admin.planning.status.banner.body", "Status transitions are defined by the published workflow configuration and enforced by the database. This screen is read-only; changes go through the governed publish flow.")}{" "}
        <Link href="/admin/workflows">{t("admin.planning.status.banner.link", "Open workflow configuration →")}</Link>
      </div></div>

      {isFallback ? (
        <div className="ax-banner ax-banner--warning" role="status"><div>
          {error
            ? t("admin.planning.status.fallback.error", "The published workflow configuration could not be read. The table below is a static copy of the canonical lifecycle (visit-lifecycle-v4) and may be out of date.")
            : t("admin.planning.status.fallback.none", "No published workflow configuration was found. The table below is a static copy of the canonical lifecycle (visit-lifecycle-v4) and may be out of date.")}
        </div></div>
      ) : (
        <p className="ax-caption">
          {t("admin.planning.status.source", "Source: config_versions · engine=workflow · status=published")}
          {data?.version_label ? ` · ${data.version_label}` : ""}
          {data?.effective_from ? ` · ${t("admin.planning.status.effectiveFrom", "effective from")} ${new Date(data.effective_from).toLocaleDateString()}` : ""}
        </p>
      )}

      <section className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h2 style={{ marginBlockStart: 0 }}>{t("admin.planning.status.states", "States")}</h2>
        <div className="row" style={{ gap: "var(--ax-space-100)", flexWrap: "wrap" }}>
          {states.map(state => (
            <span key={state} className="ax-lozenge ax-lozenge--info">{state}</span>
          ))}
        </div>
      </section>

      <section className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h2 style={{ marginBlockStart: 0 }}>{t("admin.planning.status.transitions", "Transitions")}</h2>
        <div className="ax-tablewrap"><table className="ax-table">
          <thead><tr>
            <th scope="col">{t("admin.planning.status.col.id", "Rule")}</th>
            <th scope="col">{t("admin.planning.status.col.from", "From")}</th>
            <th scope="col">{t("admin.planning.status.col.to", "To")}</th>
            <th scope="col">{t("admin.planning.status.col.actor", "Actor")}</th>
            <th scope="col">{t("admin.planning.status.col.guard", "Guard")}</th>
            <th scope="col">{t("admin.planning.status.col.terminal", "Terminal")}</th>
            <th scope="col">{t("admin.planning.status.col.sideEffects", "Side effects")}</th>
          </tr></thead>
          <tbody>
            {transitions.map((tr, index) => (
              <tr key={tr.id ?? index}>
                <td><strong>{tr.id ?? "—"}</strong></td>
                <td><span className="ax-lozenge">{tr.from ?? "—"}</span></td>
                <td><span className="ax-lozenge ax-lozenge--info">{tr.to ?? "—"}</span></td>
                <td>{tr.actor ?? "—"}</td>
                <td className="ax-caption">{tr.guard ?? "—"}</td>
                <td>{tr.terminal ? t("common.yes", "yes") : t("common.no", "no")}</td>
                <td className="ax-caption">{tr.side_effects?.length ? tr.side_effects.join(" · ") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </section>

      <section className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h2 style={{ marginBlockStart: 0 }}>{t("admin.planning.status.capabilities", "Planning capabilities")}</h2>
        <div className="ax-tablewrap"><table className="ax-table">
          <thead><tr>
            <th scope="col">{t("admin.planning.status.col.capability", "Capability")}</th>
            <th scope="col">{t("admin.planning.status.col.effect", "Effect")}</th>
          </tr></thead>
          <tbody>
            {CAPABILITY_MAP.map(row => (
              <tr key={row.capability}>
                <td><strong>{row.capability}</strong></td>
                <td>{row.effect}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <p className="ax-caption" style={{ marginBlockEnd: 0 }}>
          {t("admin.planning.status.capabilitiesNote", "Capability grants per role are managed under Roles & permissions (admin.access.manage).")}
        </p>
      </section>
    </Shell>
  );
}
