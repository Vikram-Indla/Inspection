"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { local, processOutbox, sha256b64, type SyncState, type Conflict } from "@/lib/offline";
import { supabaseBrowser } from "@/lib/supabase";

type Item = { id: string; code: string; title: string; response_model: { responses?: string[]; mapping?: Record<string, { violation?: string; action_form?: string }> }; evidence_rule: { on?: string; type?: string; mandatory?: boolean } | null };
type Ins = { id: string; status: string; visit_id: string; package_versions: { definition: { sections: { key: string; title: string; items?: string[] }[] } } };
type SResp = { item_id: string; response: { value?: string } | null; updated_at: string };

const LABEL: Record<SyncState, string> = { synced: "Synced", offline: "Offline — work saved locally", pending: "Pending sync", syncing: "Syncing…", conflict: "Conflict — action required", failed: "Sync failed — will retry" };

export default function Workspace({ inspection, items, serverResponses }: { inspection: Ins; items: Item[]; serverResponses: SResp[] }) {
  const [sync, setSync] = useState<SyncState>("synced");
  const [detail, setDetail] = useState<string | undefined>();
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(serverResponses.filter(r => r.response?.value).map(r => [r.item_id, r.response!.value!])));
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(inspection.status === "submitted");
  const baseline = useMemo(() => Object.fromEntries(serverResponses.map(r => [r.item_id, r.updated_at])), [serverResponses]);
  const imap = useMemo(() => Object.fromEntries(items.map(i => [i.code, i])), [items]);
  const sections = inspection.package_versions.definition.sections.filter(s => s.items?.length);

  const onState = useCallback((s: SyncState, d?: string) => { setSync(s); setDetail(d); local.conflicts().then(setConflicts); }, []);
  useEffect(() => {
    const tick = () => processOutbox(onState);
    tick();
    window.addEventListener("online", tick); window.addEventListener("offline", () => onState("offline"));
    const iv = setInterval(tick, 8000);
    return () => { clearInterval(iv); window.removeEventListener("online", tick); };
  }, [onState]);

  async function answer(item: Item, value: string) {
    setAnswers(a => ({ ...a, [item.id]: value }));                       // instant local state
    await local.saveDraft(inspection.id, item.id, { value });            // durable draft (autosave — FND-005)
    await local.enqueue({ kind: "response", inspection_id: inspection.id, item_id: item.id, response: { value }, baseline_updated_at: baseline[item.id] ?? null, queued_at: new Date().toISOString() });
    processOutbox(onState);
    const nc = item.response_model.mapping?.[value];
    if (nc?.violation) setMsg(`${item.code} → auto-violation ${nc.violation}${nc.action_form ? " + blocking action form" : ""}${item.evidence_rule?.mandatory ? " + mandatory photo" : ""} (config-driven, non-overridable M09-026)`);
  }
  async function attachPhoto(item: Item, file: File) {
    const b64 = btoa(String.fromCharCode(...new Uint8Array(await file.arrayBuffer())));
    const sha = await sha256b64(b64);
    await local.enqueue({ kind: "evidence", inspection_id: inspection.id, linked_type: "item", linked_id: item.id, name: `${item.code}-${Date.now()}.jpg`, mime: file.type || "image/jpeg", data_b64: b64, captured_at: new Date().toISOString(), sha256: sha, queued_at: new Date().toISOString() });
    setMsg(`Evidence queued for ${item.code} · sha256 ${sha.slice(0, 12)}… — linked, custody-stamped (ENG-07)`);
    processOutbox(onState);
  }
  async function submit() {
    const missing = sections.flatMap(s => (s.items ?? []).filter(c => !answers[imap[c]?.id]));
    if (missing.length) { setMsg(`Blockers: ${missing.join(", ")} unanswered (ERR-SUB-001 — state stays in progress)`); return; }
    const key = crypto.randomUUID();
    const snapshot = { answers: Object.fromEntries(Object.entries(answers).map(([id, v]) => [items.find(i => i.id === id)?.code ?? id, v])), submitted_offline: !navigator.onLine };
    await local.enqueue({ kind: "submit", inspection_id: inspection.id, version_number: 1, snapshot, idempotency_key: key, acknowledgement: { name: "Factory representative", signed: true, ts: new Date().toISOString() }, queued_at: new Date().toISOString() });
    setSubmitted(true);
    setMsg(navigator.onLine ? "Submitting immutable v1 (idempotency-protected)…" : "Queued — will submit exactly once on reconnect (never claims submitted while unsynced)");
    processOutbox(onState);
  }
  const tone = sync === "synced" ? "ax-sync--synced" : sync === "offline" ? "ax-sync--offline" : sync === "syncing" ? "ax-sync--syncing" : sync === "conflict" ? "ax-sync--conflict" : sync === "failed" ? "ax-sync--failed" : "ax-sync--pending";
  return (
    <div className="ax-stack" style={{ gap: "var(--ax-space-300)" }}>
      <div className="ax-row" style={{ justifyContent: "space-between", position: "sticky", insetBlockStart: 0, zIndex: 10, background: "var(--ax-color-canvas)", paddingBlock: "var(--ax-space-100)" }}>
        <span className={`ax-sync ${tone}`}>{LABEL[sync]}{detail ? ` · ${detail}` : ""}</span>
        <span className="ax-caption ax-numeric">{Object.keys(answers).length}/{sections.flatMap(s => s.items ?? []).length} answered · autosaved locally</span>
      </div>
      {msg && <div className="ax-banner"><div>{msg}</div></div>}
      {conflicts.map(c => (
        <div key={c.key} className="ax-conflict">
          <div className="ax-conflict__head">⚠ Conflict on {items.find(i => i.id === c.item_id)?.code} — explicit resolution (STM-SYNC-002, no silent overwrite)</div>
          <div className="ax-conflict__grid">
            <div className="ax-conflict__side"><h5>This device</h5><p>{JSON.stringify(c.local)}</p></div>
            <div className="ax-conflict__side"><h5>Server</h5><p>{JSON.stringify(c.server)}</p></div>
          </div>
          <div className="ax-conflict__foot">
            <button className="ax-btn ax-btn--secondary" onClick={async () => { const it = items.find(i => i.id === c.item_id)!; await local.resolveConflict(c.key); await answer(it, (c.local as { value: string }).value); }}>Keep mine</button>
            <button className="ax-btn" onClick={async () => { setAnswers(a => ({ ...a, [c.item_id]: (c.server as { value: string }).value })); await local.resolveConflict(c.key); setConflicts(await local.conflicts()); }}>Keep server</button>
          </div>
        </div>
      ))}
      {submitted && <div className="ax-banner ax-banner--immutable"><div><strong>Submitted — immutable v1.</strong> Content locked by the database (proven B3); corrections only via reviewer return.</div></div>}
      {!submitted && sections.map(s => (
        <div key={s.key} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
          <h4>{s.title}</h4>
          {(s.items ?? []).map(code => {
            const it = imap[code]; if (!it) return null;
            const val = answers[it.id];
            return (
              <div key={code} className={`ipad-q ${val ? "is-answered" : ""}`} style={{ border: "1px solid var(--ax-color-border)", borderRadius: "var(--ax-radius-large)", padding: "var(--ax-space-300)", borderInlineStart: val ? "4px solid var(--ax-color-success)" : undefined }}>
                <p style={{ font: "var(--ax-text-field)", fontWeight: 600, marginBlockEnd: "var(--ax-space-150)" }}>{code} · {it.title}</p>
                <div className="ax-row">
                  {(it.response_model.responses ?? []).map(r => (
                    <button key={r} className="ax-btn ax-btn--field" style={{ background: val === r ? (r === "non_compliant" ? "var(--ax-color-critical)" : "var(--ax-color-primary)") : "var(--ax-color-surface)", color: val === r ? "var(--ax-color-inverse-text)" : "var(--ax-color-text)", border: "1.5px solid var(--ax-color-border)" }}
                      onClick={() => answer(it, r)}>{r.replace(/_/g, " ")}</button>
                  ))}
                  {val === "non_compliant" && it.evidence_rule?.mandatory && (
                    <label className="ax-btn ax-btn--field ax-btn--secondary" style={{ cursor: "pointer" }}>
                      📷 Mandatory photo
                      <input type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && attachPhoto(it, e.target.files[0])} />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
      {!submitted && (
        <div className="ax-row" style={{ justifyContent: "flex-end" }}>
          <button className="ax-btn ax-btn--prominent ax-btn--field" onClick={submit}>Review & submit — immutable v1</button>
        </div>
      )}
    </div>
  );
}
