import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import EmptyState from "@/components/EmptyState";
import { RecordSignature } from "./RecordSignature";

// TASK-MVP2-M2-12-COMMITTEE-SIGNATURE-001 · MVP2-REQ-0128..0136 · CD-049 (decision_dossier_v1).
const MODES = ["off", "on"] as const;

export default async function CommitteePage() {
  const { t } = await useT();
  if (resolveFeatureFlag(process.env.FEATURE_DECISION_DOSSIER, MODES, "off") !== "on") {
    return (
      <Shell current="/committee" title={t("cmte.title", "Committee & signatures")} context={<span className="ax-lozenge ax-lozenge--warning">CD-049 · REQ-0128</span>}>
        <NotYetBoundary title={t("cmte.title", "Committee & signatures")} consequence={t("cmte.off", "The committee decision record is not enabled here. PKI/EBDA verification is held.")}
          seam="FEATURE_DECISION_DOSSIER=off + PKI/EBDA held" notAvailableLabel={t("tasks.notYet", "Not available yet")} detailLabel={t("common.whyPrereq", "Why / prerequisites")} />
      </Shell>
    );
  }
  const sb = await supabaseServer();
  const [{ data: acts, error: e1 }, { data: vers, error: e2 }] = await Promise.all([
    sb.from("signature_acts").select("id, kind, outcome, verification_status, created_at").order("created_at", { ascending: false }).limit(50),
    sb.from("report_verifications").select("id, status, provider, created_at").order("created_at", { ascending: false }).limit(50),
  ]);
  const error = e1 || e2;
  if (error) console.error("[committee] load", error);
  return (
    <Shell current="/committee" title={t("cmte.title", "Committee & signatures")} context={<span className="ax-lozenge ax-lozenge--info">CD-049 · REQ-0128..0136</span>}>
      <div className="ax-banner"><div><strong>{t("cmte.banner.title", "Signature & verification.")}</strong> {t("cmte.banner.body", "Signature and refusal are distinct facts; queued is not delivered. Verification is never “verified” without a provider — PKI/EBDA is held. Acknowledgement is not a signature.")}</div></div>
      <RecordSignature strings={{
        record: t("cmte.record", "Record signature act"), recording: t("cmte.recording", "Recording…"),
        recorded: t("cmte.recorded", "recorded"), kind: t("cmte.kind", "Kind"), outcome: t("cmte.outcome", "Outcome"),
      }} />
      {error && <div className="ax-banner ax-banner--critical" role="alert"><div><strong>{t("cmte.error", "Couldn’t load committee data. Nothing changed.")}</strong></div></div>}
      {!error && (acts ?? []).length === 0 && (vers ?? []).length === 0 && (
        <EmptyState glyph="✒️" title={t("cmte.empty.title", "No signature or verification records in scope")}
          body={t("cmte.empty.body", "Records appear here as reports are signed and verifications requested. Empty may also mean none are in your scope (RLS).")} />
      )}
      {(acts ?? []).map((a) => (
        <div key={a.id} className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <div className="ax-row" style={{ justifyContent: "space-between" }}>
            <h3>{a.kind} · {a.outcome}</h3><span className="ax-lozenge ax-lozenge--warning">{a.verification_status}</span>
          </div>
        </div>
      ))}
    </Shell>
  );
}
