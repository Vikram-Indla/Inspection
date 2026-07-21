"use client";
// MIM Inspection — offline engine (MVP1-FND-005/006 · STM-SYNC-001/002 · iPad spec §4)
// IndexedDB: durable local drafts + outbox. Replay is idempotent; conflicts are
// explicit records, never silent overwrites.
import { supabaseBrowser } from "@/lib/supabase";
import { getVerifiedUser } from "@/lib/verified-user";

const DB = "mim-field-v1";
export type SyncState = "synced" | "offline" | "pending" | "syncing" | "conflict" | "failed";
export type OutboxOp =
  | { kind: "response"; inspection_id: string; item_id: string; response: unknown; baseline_updated_at: string | null; queued_at: string }
  // A real outside-fence check-in may be captured while offline. It is replayed
  // before its linked override request, and it never changes visit state.
  | { kind: "geo_checkin"; id: string; journey_id: string; visit_id: string; observed_lat: number; observed_lng: number; accuracy_m: number; altitude_m: number | null; distance_m: number; device_occurred_at: string; gis_version: string; device_id: string; queued_at: string }
  // Additive (slice F3 · M04-058): visit_id set = VISIT-linked evidence
  // (cancellation — no inspections row exists yet); inspection_id then only
  // namespaces the storage path. Ops without visit_id replay exactly as before.
  | { kind: "evidence"; inspection_id: string | null; linked_type: string; linked_id: string; evidence_type?: "photo" | "video" | "document" | "comment"; evidence_note?: string; name: string; mime: string; data_b64: string; captured_at: string; sha256: string; queued_at: string; visit_id?: string }
  // Phase 6 — version_number is LEGACY-fallback payload only (used when the
  // server lacks submit_inspection); the RPC assigns the number server-side.
  | { kind: "submit"; inspection_id: string; version_number: number; snapshot: unknown; idempotency_key: string; acknowledgement: unknown; queued_at: string }
  // Additive (slice F1 · M04-095..114): factory-field verification check.
  // Upsert on (inspection_id, field_key) → idempotent replay; never touches factories (FND-007/M04-112).
  | { kind: "factory_check"; inspection_id: string; check: { id: string; field_key: string; source_value: string | null; observed_value: string | null; status: "verified" | "updated"; evidence_note: string | null }; queued_at: string }
  // TASK-IPAD-M04-OVERRIDE-APPROVAL-WORKFLOW-003 — the request is replayed
  // only after its visit-linked photo evidence, if required, has synced. The
  // server derives all GPS/time facts from checkin_event_id, not this payload.
  | { kind: "geo_override_request"; request_id: string; visit_id: string; journey_id: string; checkin_event_id: string; reason_key: string; explanation: string; safety_security_exception: boolean; queued_at: string }
  // Phase 5 (§15, D-017) — per-visit item lifecycle. Upsert on
  // (inspection_id, item_id) with the DESIRED final row (reverted_at set =
  // restored before submit), so replays and re-deselects stay idempotent.
  | { kind: "item_state"; inspection_id: string; item_id: string; state: "added" | "deselected"; reason: string | null; reverted_at: string | null; queued_at: string }
  // Phase 5 (§18, D-018) — invalidate (never delete) the ACTIVE violation
  // candidate when its triggering response flipped back to Compliant. Replays
  // after the response op it follows (FIFO); a missing candidate is a no-op.
  | { kind: "violation_invalidate"; inspection_id: string; violation_id: string | null; violation_code_id: string | null; reason: string; queued_at: string };
export type Conflict = { key: string; local: unknown; server: unknown; item_id: string; detected_at: string };
export type CachedRouteEstimate = {
  etaMinutes: number;
  remainingDistanceM: number;
  estimatedAt: string;
  provider: string;
  mode: "production" | "test_stub";
  refreshAfterMs: number;
  stale?: boolean;
};

function idb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => {
      const d = r.result;
      d.createObjectStore("drafts");     // key: inspection_id:item_id -> response draft
      d.createObjectStore("packages");   // key: inspection_id -> package definition (version-locked cache, M04-007)
      d.createObjectStore("outbox", { autoIncrement: true });
      d.createObjectStore("conflicts", { keyPath: "key" });
    };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T> {
  const d = await idb();
  return new Promise((res, rej) => {
    const t = d.transaction(store, mode); const s = t.objectStore(store);
    const rq = fn(s);
    t.oncomplete = () => res((rq as IDBRequest<T> | undefined)?.result as T);
    t.onerror = () => rej(t.error);
  });
}
export const local = {
  saveDraft: (inspection: string, item: string, v: unknown) => tx("drafts", "readwrite", s => s.put(v, `${inspection}:${item}`)),
  getDrafts: (inspection: string) => tx<{ k: IDBValidKey; v: unknown }[]>("drafts", "readonly", s => {
    const out: { k: IDBValidKey; v: unknown }[] = [];
    const rq = s.openCursor();
    rq.onsuccess = () => { const c = rq.result; if (c) { if (String(c.key).startsWith(inspection)) out.push({ k: c.key, v: c.value }); c.continue(); } };
    return { get result() { return out; } } as unknown as IDBRequest<{ k: IDBValidKey; v: unknown }[]>;
  }),
  cachePackage: (inspection: string, def: unknown) => tx("packages", "readwrite", s => s.put(def, inspection)),
  getPackage: (inspection: string) => tx<unknown>("packages", "readonly", s => s.get(inspection)),
  // FLD-JRN-003/004 — the last provider estimate is a display-only offline
  // value. It never mutates workflow state and is always surfaced as stale.
  cacheRouteEstimate: (visit: string, estimate: CachedRouteEstimate) => tx("packages", "readwrite", s => s.put(estimate, `route:${visit}`)),
  getRouteEstimate: (visit: string) => tx<CachedRouteEstimate | undefined>("packages", "readonly", s => s.get(`route:${visit}`)),
  enqueue: (op: OutboxOp) => tx("outbox", "readwrite", s => s.add(op)),
  peekAll: () => tx<OutboxOp[]>("outbox", "readonly", s => s.getAll() as IDBRequest<OutboxOp[]>),
  keys: () => tx<IDBValidKey[]>("outbox", "readonly", s => s.getAllKeys()),
  remove: (key: IDBValidKey) => tx("outbox", "readwrite", s => s.delete(key)),
  addConflict: (c: Conflict) => tx("conflicts", "readwrite", s => s.put(c)),
  conflicts: () => tx<Conflict[]>("conflicts", "readonly", s => s.getAll() as IDBRequest<Conflict[]>),
  resolveConflict: (key: string) => tx("conflicts", "readwrite", s => s.delete(key)),
};

export async function sha256b64(b64: string): Promise<string> {
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const h = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Phase 6 (§21) — authoritative submit result reported back to the workspace
// so local state reflects the SERVER-assigned version number (D-020), never
// the legacy client-side estimate.
export type SubmitSynced = { submission_version_id: string; version_number: number; reused: boolean };

/** Idempotent replay: every op safe to retry; conflicts become explicit records (STM-SYNC-002). */
export async function processOutbox(onState: (s: SyncState, detail?: string) => void, onSubmitSynced?: (inspectionId: string, info: SubmitSynced) => void): Promise<void> {
  if (!navigator.onLine) { onState("offline"); return; }
  const sb = supabaseBrowser();
  const keys = await local.keys(); const ops = await local.peekAll();
  if (!ops.length) { onState("synced"); return; }
  onState("syncing", `${ops.length} queued`);
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i]; const key = keys[i];
    try {
      if (op.kind === "response") {
        const { data: server } = await sb.from("checklist_responses").select("id, response, updated_at")
          .eq("inspection_id", op.inspection_id).eq("item_id", op.item_id).maybeSingle();
        if (server && op.baseline_updated_at && new Date(server.updated_at) > new Date(op.baseline_updated_at)
            && JSON.stringify(server.response) !== JSON.stringify(op.response)) {
          await local.addConflict({ key: `${op.inspection_id}:${op.item_id}`, local: op.response, server: server.response, item_id: op.item_id, detected_at: new Date().toISOString() });
          await local.remove(key); onState("conflict", op.item_id); continue;  // explicit, never overwrite
        }
        const { error } = await sb.from("checklist_responses").upsert(
          { inspection_id: op.inspection_id, item_id: op.item_id, response: op.response, is_complete: true, updated_at: new Date().toISOString() },
          { onConflict: "inspection_id,item_id" });
        if (error) throw error;
      } else if (op.kind === "geo_checkin") {
        // M04-039/043 — durable captured facts for a later offline override.
        // This is deliberately only a check-in event; it cannot arrive or
        // unlock the visit without the separately guarded Operations decision.
        const { error } = await sb.from("geo_events").insert({
          id: op.id, journey_id: op.journey_id, visit_id: op.visit_id, kind: "checkin",
          observed_lat: op.observed_lat, observed_lng: op.observed_lng,
          accuracy_m: op.accuracy_m, altitude_m: op.altitude_m,
          device_occurred_at: op.device_occurred_at, geofence_result: "outside",
          gis_version: op.gis_version, device_id: op.device_id,
        });
        if (error && !String(error.message).includes("duplicate")) throw error;
      } else if (op.kind === "evidence") {
        const path = `${op.visit_id ?? op.inspection_id}/${op.name}`;
        const bytes = Uint8Array.from(atob(op.data_b64), c => c.charCodeAt(0));
        const up = await sb.storage.from("evidence").upload(path, bytes, { contentType: op.mime, upsert: true }); // upsert = replay-safe
        if (up.error) throw up.error;
        const { data: { user } } = await getVerifiedUser(sb);
        const row: Record<string, unknown> = {
          inspection_id: op.inspection_id,
          evidence_type: op.evidence_type ?? (op.mime.startsWith("image") ? "photo" : op.mime.startsWith("video") ? "video" : "document"),
          linked_type: op.linked_type, linked_id: op.linked_id, storage_path: path,
          captured_at: op.captured_at, content_sha256: op.sha256, captured_by: user?.id, synced_at: new Date().toISOString(),
        };
        if (op.evidence_note) row.evidence_note = op.evidence_note;
        if (op.visit_id) {
          // F3 / M04-058 — cancellation evidence anchors to the visit (0020);
          // pre-0020 the insert fails verbatim and the op stays queued (honest).
          row.visit_id = op.visit_id; row.inspection_id = null;
        }
        const { error } = await sb.from("evidence").upsert(row, { onConflict: "storage_path", ignoreDuplicates: true } as never);
        if (error && !String(error.message).includes("duplicate")) throw error;
      } else if (op.kind === "submit") {
        // Phase 6 (§21/§22) — the atomic submission RPC is the authority:
        // server-side version numbering under a row lock, returned-scope
        // byte-equality, mandatory-evidence-sync precondition, CAS status
        // transition, journey completion and audit in ONE transaction.
        // EXE-* guard failures (e.g. EXE-SUBMIT-SCOPE-VIOLATION) surface as an
        // explicit failed-sync state — they are NEVER routed through the
        // legacy duplicate-tolerance, which could mask a real refusal as
        // success.
        const { data: rpcResult, error: rpcError } = await sb.rpc("submit_inspection", {
          p_inspection: op.inspection_id,
          p_snapshot: op.snapshot,
          p_idempotency_key: op.idempotency_key,
          p_acknowledgement: op.acknowledgement,
        });
        if (rpcError) {
          const missing =
            rpcError.code === "42883" || rpcError.code === "PGRST202" ||
            String(rpcError.message).includes("Could not find the function");
          if (!missing) throw rpcError; // EXE-* token — explicit failure, never masked
          // LEGACY FALLBACK (pre-20260721160000 servers): the original direct
          // insert with its duplicate-tolerance. The unguarded status update
          // and client-side version_number stay as-is on this path only.
          const { error } = await sb.from("submission_versions").insert({
            inspection_id: op.inspection_id, version_number: op.version_number, snapshot: op.snapshot,
            idempotency_key: op.idempotency_key, acknowledgement: op.acknowledgement,
            submitted_by: (await getVerifiedUser(sb)).data.user?.id,
          });
          if (error && !String(error.message).includes("duplicate")) throw error;  // 409 duplicate = already submitted (ERR-SUB-002)
          await sb.from("inspections").update({ status: "submitted" }).eq("id", op.inspection_id);
        } else if (rpcResult) {
          onSubmitSynced?.(op.inspection_id, rpcResult as SubmitSynced);
        }
      } else if (op.kind === "factory_check") {
        // M04-103/104/105/113 — observed value + Verified/Updated status persisted
        // separately from Senaei data; audit trigger logs before/after server-side.
        const { data: { user } } = await getVerifiedUser(sb);
        const { error } = await sb.from("inspection_factory_checks").upsert({
          id: op.check.id, inspection_id: op.inspection_id, field_key: op.check.field_key,
          source_value: op.check.source_value, observed_value: op.check.observed_value,
          status: op.check.status, evidence_note: op.check.evidence_note,
          updated_by: user?.id, updated_at: new Date().toISOString(),
        }, { onConflict: "inspection_id,field_key" });
        if (error) throw error;
      } else if (op.kind === "geo_override_request") {
        // M04-043 / STM-JRN-003 — canonical database guard validates the
        // immutable outside check-in, evidence, expiry and inspector identity.
        // It is intentionally the only replay path; offline never unlocks the
        // visit locally or synthesises an approval.
        const { error } = await sb.rpc("request_geo_override", {
          p_request: op.request_id,
          p_visit: op.visit_id,
          p_journey: op.journey_id,
          p_checkin_event: op.checkin_event_id,
          p_reason_key: op.reason_key,
          p_explanation: op.explanation,
          p_safety_security_exception: op.safety_security_exception,
        });
        if (error) throw error;
      } else if (op.kind === "item_state") {
        // §15 / D-017 — upsert on (inspection_id, item_id) carrying the desired
        // final row, so FIFO replays of add → deselect → restore converge.
        // Pre-migration the table is missing: the op stays queued (honest).
        const { error } = await sb.from("inspection_item_states").upsert({
          inspection_id: op.inspection_id, item_id: op.item_id,
          state: op.state, reason: op.reason, reverted_at: op.reverted_at,
        }, { onConflict: "inspection_id,item_id" });
        if (error) throw error;
      } else if (op.kind === "violation_invalidate") {
        // §18 / D-018 — invalidate, never delete. Targets the row by id when
        // known, else the ACTIVE candidate for (inspection, code). Zero
        // affected rows is a legitimate no-op (the candidate never synced).
        // The guard trigger (20260721150000) narrows the update to the three
        // invalidation columns; the audit trigger records before/after.
        const { data: { user } } = await getVerifiedUser(sb);
        const stamp = { invalidated_at: new Date().toISOString(), invalidated_by: user?.id ?? null, invalidate_reason: op.reason };
        let vid = op.violation_id;
        if (vid) {
          const { error } = await sb.from("violations").update(stamp).eq("id", vid);
          if (error) throw error;
        } else if (op.violation_code_id) {
          const { error } = await sb.from("violations").update(stamp)
            .eq("inspection_id", op.inspection_id).eq("violation_code_id", op.violation_code_id)
            .is("invalidated_at", null);
          if (error) throw error;
          const { data: justInvalidated } = await sb.from("violations").select("id")
            .eq("inspection_id", op.inspection_id).eq("violation_code_id", op.violation_code_id)
            .not("invalidated_at", "is", null).limit(1).maybeSingle();
          vid = justInvalidated?.id ?? null;
        }
        // Dependent trigger-generated action forms are re-evaluated here
        // (D-018): open forms LINKED to the invalidated candidate are closed
        // with status 'cancelled' (action_forms.status is free text — no enum
        // forbids it). Package-included forms (violation_id null) are NEVER
        // touched. A missing column (pre-migration) surfaces as an error and
        // the op stays queued — honest, no silent skip.
        if (vid) {
          const { error } = await sb.from("action_forms").update({ status: "cancelled" })
            .eq("violation_id", vid).eq("status", "open");
          if (error) throw error;
        }
      }
      await local.remove(key);
    } catch (e) {
      // Provider details stay diagnostic-only. The field surface supplies the
      // localized neutral recovery copy for the failed-sync state.
      onState("failed");
      return;  // stop; order preserved; retry later — no data loss
    }
  }
  const remaining = await local.keys();
  onState(remaining.length ? "pending" : "synced");
}
