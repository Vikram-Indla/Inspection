"use client";
// MIM Inspection — offline engine (MVP1-FND-005/006 · STM-SYNC-001/002 · iPad spec §4)
// IndexedDB: durable local drafts + outbox. Replay is idempotent; conflicts are
// explicit records, never silent overwrites.
import { createClient } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase";
import {
  resolveInspectionPackageCache,
  sealInspectionPackage,
  verifyInspectionPackage,
  packageCacheNamespace,
  type CachedInspectionPackage,
  type PackageAuthority,
  type PackageIntegrityResult,
} from "@/lib/offline-package-integrity";
export type { CachedInspectionPackage, PackageIntegrityResult } from "@/lib/offline-package-integrity";

const LEGACY_DB = "mim-field-v1";
const LEGACY_RESOLUTION_KEY = "mim-field-v1:legacy-resolution";
const STORE_NAMES = ["drafts", "packages", "outbox", "conflicts"] as const;
type StoreName = typeof STORE_NAMES[number];

/**
 * D7 diagnostic for the immutable readiness snapshot checksum.
 *
 * Server authority is:
 *   encode(digest(v_resolved::text, 'sha256'), 'hex')
 *
 * `v_resolved` is PostgreSQL jsonb. PostgREST parses that JSON before this
 * client sees it, so JSON number lexemes (for example `1.0` versus `1`) are
 * irretrievably lost. Until the server also supplies the exact
 * `v_resolved::text` bytes, numeric definitions cannot be safely enforced.
 * Non-numeric definitions can still be recomputed byte-exactly for agreement
 * evidence; the result is deliberately diagnostic and never caches data.
 */
export type AuthorityPackageChecksumResult =
  | { state: "match"; computedChecksum: string; enforcementSafe: false }
  | { state: "mismatch"; computedChecksum: string; enforcementSafe: false }
  | { state: "unverifiable"; reason: "missing_checksum" | "numeric_lexeme_lost" | "unsupported_value"; enforcementSafe: false };

const utf8Encoder = new TextEncoder();

function compareJsonbKeys(a: string, b: string): number {
  const left = utf8Encoder.encode(a);
  const right = utf8Encoder.encode(b);
  if (left.length !== right.length) return left.length - right.length;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

function postgresJsonbText(value: unknown): { text?: string; reason?: "numeric_lexeme_lost" | "unsupported_value" } {
  if (value === null) return { text: "null" };
  if (typeof value === "boolean" || typeof value === "string") return { text: JSON.stringify(value) };
  // JSON.parse has already discarded PostgreSQL jsonb's original numeric
  // spelling/scale. Guessing here would reject valid field packages.
  if (typeof value === "number") return { reason: "numeric_lexeme_lost" };
  if (Array.isArray(value)) {
    const parts: string[] = [];
    for (const item of value) {
      const encoded = postgresJsonbText(item);
      if (encoded.reason) return encoded;
      parts.push(encoded.text as string);
    }
    return { text: `[${parts.join(", ")}]` };
  }
  if (typeof value === "object") {
    const parts: string[] = [];
    for (const [key, item] of Object.entries(value as Record<string, unknown>).sort(([a], [b]) => compareJsonbKeys(a, b))) {
      if (item === undefined) return { reason: "unsupported_value" };
      const encoded = postgresJsonbText(item);
      if (encoded.reason) return encoded;
      parts.push(`${JSON.stringify(key)}: ${encoded.text}`);
    }
    return { text: `{${parts.join(", ")}}` };
  }
  return { reason: "unsupported_value" };
}

async function sha256Utf8(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", utf8Encoder.encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function recomputeAuthorityPackageChecksum(
  definition: unknown,
  authorityChecksum: string | null | undefined,
): Promise<AuthorityPackageChecksumResult> {
  const expected = authorityChecksum?.trim().toLowerCase();
  if (!expected) return { state: "unverifiable", reason: "missing_checksum", enforcementSafe: false };
  const canonical = postgresJsonbText(definition);
  if (canonical.reason) return { state: "unverifiable", reason: canonical.reason, enforcementSafe: false };
  const computedChecksum = await sha256Utf8(canonical.text as string);
  return {
    state: computedChecksum === expected ? "match" : "mismatch",
    computedChecksum,
    enforcementSafe: false,
  };
}

export function offlineDatabaseName(userId: string): string {
  return packageCacheNamespace(userId);
}
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
  | { kind: "violation_invalidate"; inspection_id: string; violation_id: string | null; violation_code_id: string | null; reason: string; queued_at: string }
  // SCR-IPAD-630 (FLD-FND-001..003) — inspector finding narrative for a mapped
  // violation. `id` is a client-generated idempotency key: replay UPSERTs the
  // findings row by id (an ambiguous retry never duplicates), and FIFO order
  // guarantees the finding is persisted BEFORE the submit op that references it.
  // The violations.finding_id column is immutable post-insert
  // (guard_violation_invalidate), so it is never mutated from the client — the
  // finding↔violation association rides findings.item_id + the submission manifest.
  | { kind: "finding"; id: string; inspection_id: string; item_id: string; severity: string; description: string; queued_at: string };
/** A queued op together with its own storage key, read as one unit. */
export type OutboxEntry = { key: IDBValidKey; op: OutboxOp };
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

// CR-327 / CR-334 / CR-403 — a local report is evidence of a real immutable
// submission, never a client-created approximation. `submittedAt` and the
// server-assigned version are recorded only after submit_inspection succeeds,
// or copied from an RLS-authorized submission_versions read.
export type CachedSubmittedReport = {
  schema: "saqeel-submitted-report-v1";
  inspectionId: string;
  submissionVersionId: string;
  versionNumber: number;
  submittedAt: string | null;
  snapshot: unknown;
  acknowledgement: unknown;
  factoryName: string | null;
  factoryCode: string | null;
  inspectorName: string | null;
  cachedAt: string;
};

function idb(userId: string): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(offlineDatabaseName(userId), 1);
    r.onupgradeneeded = () => {
      const d = r.result;
      if (!d.objectStoreNames.contains("drafts")) d.createObjectStore("drafts");     // key: inspection_id:item_id -> response draft
      if (!d.objectStoreNames.contains("packages")) d.createObjectStore("packages"); // key: inspection_id -> package definition (version-locked cache, M04-007)
      if (!d.objectStoreNames.contains("outbox")) d.createObjectStore("outbox", { autoIncrement: true });
      if (!d.objectStoreNames.contains("conflicts")) d.createObjectStore("conflicts", { keyPath: "key" });
    };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function tx<T>(userId: string, store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T> {
  const d = await idb(userId);
  return new Promise((res, rej) => {
    const t = d.transaction(store, mode); const s = t.objectStore(store);
    const rq = fn(s);
    t.oncomplete = () => res((rq as IDBRequest<T> | undefined)?.result as T);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error ?? new Error("Offline storage transaction aborted"));
  });
}

function createUserOfflineStore(userId: string) {
  // Resolve once so every method on this handle is permanently bound to the
  // same verified identity, even if the browser session changes later.
  const verifiedUserId = userId.trim();
  offlineDatabaseName(verifiedUserId);
  return {
    saveDraft: (inspection: string, item: string, v: unknown) => tx(verifiedUserId, "drafts", "readwrite", s => s.put(v, `${inspection}:${item}`)),
    getDrafts: (inspection: string) => tx<{ k: IDBValidKey; v: unknown }[]>(verifiedUserId, "drafts", "readonly", s => {
      const out: { k: IDBValidKey; v: unknown }[] = [];
      const rq = s.openCursor();
      rq.onsuccess = () => { const c = rq.result; if (c) { if (String(c.key).startsWith(`${inspection}:`)) out.push({ k: c.key, v: c.value }); c.continue(); } };
      return { get result() { return out; } } as unknown as IDBRequest<{ k: IDBValidKey; v: unknown }[]>;
    }),
    draftInspectionIds: async () => {
      const keys = await tx<IDBValidKey[]>(verifiedUserId, "drafts", "readonly", s => s.getAllKeys());
      return [...new Set(keys.map(key => String(key).split(":", 1)[0]).filter(Boolean))];
    },
    cachePackage: (inspection: string, def: unknown) => tx(verifiedUserId, "packages", "readwrite", s => s.put(def, inspection)),
    getPackage: (inspection: string) => tx<unknown>(verifiedUserId, "packages", "readonly", s => s.get(inspection)),
    cacheVerifiedPackage: async (key: string, input: {
      packageVersionId: string;
      packageVersionLabel: string;
      authorityChecksum: string | null;
      definition: unknown;
    }): Promise<CachedInspectionPackage> => {
      const cached = await sealInspectionPackage(input);
      await tx(verifiedUserId, "packages", "readwrite", store => store.put(cached, key));
      return cached;
    },
    verifyCachedPackage: async (key: string, authority?: PackageAuthority): Promise<PackageIntegrityResult> => {
      const value = await tx<unknown>(verifiedUserId, "packages", "readonly", store => store.get(key));
      return verifyInspectionPackage(value, authority);
    },
    resolveVerifiedPackage: (input: {
      visitId: string;
      inspectionId: string | null;
      authority: PackageAuthority;
    }): Promise<PackageIntegrityResult> => {
      return resolveInspectionPackageCache({
        ...input,
        cache: {
          get: key => tx<unknown>(verifiedUserId, "packages", "readonly", store => store.get(key)),
          put: async (key, value) => {
            await tx(verifiedUserId, "packages", "readwrite", store => store.put(value, key));
          },
        },
      });
    },
    // TASK-IPAD-COMPLETED-HISTORY-001 — immutable, display-only history cache.
    // This key is never processed by the outbox and is replaced only from a
    // successful inspector-scoped server read.
    cacheCompletedHistory: (records: unknown) => tx(verifiedUserId, "packages", "readwrite", s => s.put(records, "completed-history")),
    getCompletedHistory: () => tx<unknown>(verifiedUserId, "packages", "readonly", s => s.get("completed-history")),
    // FLD-JRN-003/004 — the last provider estimate is a display-only offline
    // value. It never mutates workflow state and is always surfaced as stale.
    cacheRouteEstimate: (visit: string, estimate: CachedRouteEstimate) => tx(verifiedUserId, "packages", "readwrite", s => s.put(estimate, `route:${visit}`)),
    getRouteEstimate: (visit: string) => tx<CachedRouteEstimate | undefined>(verifiedUserId, "packages", "readonly", s => s.get(`route:${visit}`)),
    cacheSubmittedReport: (report: CachedSubmittedReport) =>
      tx(verifiedUserId, "packages", "readwrite", s => s.put(report, `report:${report.inspectionId}`)),
    getSubmittedReport: (inspectionId: string) =>
      tx<CachedSubmittedReport | undefined>(verifiedUserId, "packages", "readonly", s => s.get(`report:${inspectionId}`)),
    getSubmittedReports: async () => {
      const reports: CachedSubmittedReport[] = [];
      await tx<CachedSubmittedReport[]>(verifiedUserId, "packages", "readonly", s => {
        const request = s.openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) return;
          if (String(cursor.key).startsWith("report:")) {
            const value = cursor.value as Partial<CachedSubmittedReport>;
            if (
              value.schema === "saqeel-submitted-report-v1"
              && typeof value.inspectionId === "string"
              && typeof value.submissionVersionId === "string"
              && typeof value.versionNumber === "number"
              && (value.submittedAt === null || typeof value.submittedAt === "string")
            ) reports.push(value as CachedSubmittedReport);
          }
          cursor.continue();
        };
        return { get result() { return reports; } } as unknown as IDBRequest<CachedSubmittedReport[]>;
      });
      return reports;
    },
    enqueue: (op: OutboxOp) => tx(verifiedUserId, "outbox", "readwrite", s => s.add(op)),
    peekAll: () => tx<OutboxOp[]>(verifiedUserId, "outbox", "readonly", s => s.getAll() as IDBRequest<OutboxOp[]>),
    keys: () => tx<IDBValidKey[]>(verifiedUserId, "outbox", "readonly", s => s.getAllKeys()),
    /** Keys paired with their own op, read in ONE transaction.
     *
     *  Callers used to read keys() and peekAll() separately and pair them by
     *  position. Those are two transactions, so anything enqueued between them
     *  shifted the lists out of step and a key came back undefined — which
     *  IndexedDB reports as "No key or key range specified" on the delete that
     *  follows. A cursor pairs each key with its own value and cannot drift. */
    entries: () => tx<OutboxEntry[]>(verifiedUserId, "outbox", "readonly", s => {
      const out: OutboxEntry[] = [];
      const rq = s.openCursor();
      rq.onsuccess = () => {
        const cursor = rq.result;
        if (!cursor) return;
        out.push({ key: cursor.primaryKey, op: cursor.value as OutboxOp });
        cursor.continue();
      };
      return { get result() { return out; } } as unknown as IDBRequest<OutboxEntry[]>;
    }),
    // A missing key is a caller bug, not a storage failure. Deleting nothing is
    // the safe outcome — the op stays queued and is retried — where throwing
    // takes down the whole replay and strands every other queued op with it.
    remove: (key: IDBValidKey | undefined) =>
      key == null
        ? Promise.resolve(undefined as unknown as void)
        : tx(verifiedUserId, "outbox", "readwrite", s => s.delete(key)),
    addConflict: (c: Conflict) => tx(verifiedUserId, "conflicts", "readwrite", s => s.put(c)),
    conflicts: () => tx<Conflict[]>(verifiedUserId, "conflicts", "readonly", s => s.getAll() as IDBRequest<Conflict[]>),
    resolveConflict: (key: string) => tx(verifiedUserId, "conflicts", "readwrite", s => s.delete(key)),
  };
}

export type UserOfflineStore = ReturnType<typeof createUserOfflineStore>;
const userStores = new Map<string, UserOfflineStore>();

/** The only accessor for inspection offline state; callers supply a server-verified user id. */
export function localForUser(userId: string): UserOfflineStore {
  const verifiedUserId = userId.trim();
  let store = userStores.get(verifiedUserId);
  if (!store) {
    store = createUserOfflineStore(verifiedUserId);
    userStores.set(verifiedUserId, store);
  }
  return store;
}

type LegacyEntry = { store: StoreName; key: IDBValidKey; value: unknown };
let legacyResolutionInMemory: string | null = null;
let legacyPromptInFlight: Promise<void> | null = null;

function readLegacyResolution(): string | null {
  try { return window.localStorage.getItem(LEGACY_RESOLUTION_KEY) ?? legacyResolutionInMemory; }
  catch { return legacyResolutionInMemory; }
}

function writeLegacyResolution(userId: string, choice: "restored" | "declined" | "empty") {
  const value = JSON.stringify({ userId, choice });
  legacyResolutionInMemory = value;
  try { window.localStorage.setItem(LEGACY_RESOLUTION_KEY, value); } catch { /* in-memory still prevents repeats in this page */ }
}

async function openLegacyDatabase(): Promise<IDBDatabase | null> {
  const factory = indexedDB as IDBFactory & { databases?: () => Promise<{ name?: string }[]> };
  if (factory.databases) {
    const databases = await factory.databases();
    if (!databases.some(database => database.name === LEGACY_DB)) return null;
  }
  return new Promise((resolve, reject) => {
    let created = false;
    const request = indexedDB.open(LEGACY_DB);
    request.onupgradeneeded = () => {
      // The database did not exist. Abort creation: post-fix code never writes
      // or creates the retired unscoped database.
      created = true;
      request.transaction?.abort();
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      if (created && request.error?.name === "AbortError") resolve(null);
      else reject(request.error);
    };
  });
}

async function readLegacyEntries(): Promise<LegacyEntry[]> {
  const database = await openLegacyDatabase();
  if (!database) return [];
  const available = STORE_NAMES.filter(store => database.objectStoreNames.contains(store));
  if (!available.length) { database.close(); return []; }
  return new Promise((resolve, reject) => {
    const entries: LegacyEntry[] = [];
    const transaction = database.transaction(available, "readonly");
    for (const storeName of available) {
      const cursor = transaction.objectStore(storeName).openCursor();
      cursor.onsuccess = () => {
        const row = cursor.result;
        if (!row) return;
        entries.push({ store: storeName, key: row.key, value: row.value });
        row.continue();
      };
    }
    transaction.oncomplete = () => { database.close(); resolve(entries); };
    transaction.onerror = () => { database.close(); reject(transaction.error); };
    transaction.onabort = () => { database.close(); reject(transaction.error ?? new Error("Legacy offline read aborted")); };
  });
}

async function restoreLegacyEntries(userId: string, entries: LegacyEntry[]) {
  const local = localForUser(userId);
  const currentOutbox = new Set((await local.peekAll()).map(op => JSON.stringify(op)));
  for (const entry of entries) {
    if (entry.store === "outbox") {
      const fingerprint = JSON.stringify(entry.value);
      if (!currentOutbox.has(fingerprint)) {
        await local.enqueue(entry.value as OutboxOp);
        currentOutbox.add(fingerprint);
      }
      continue;
    }
    const exists = await tx<number>(userId, entry.store, "readonly", store => store.count(entry.key));
    if (!exists) {
      await tx(userId, entry.store, "readwrite", store => entry.store === "conflicts"
        ? store.put(entry.value)
        : store.put(entry.value, entry.key));
    }
  }
}

/** One browser-wide, explicit decision; the retired database is read-only. */
export async function promptLegacyOfflineRestore(userId: string): Promise<void> {
  if (readLegacyResolution()) return;
  if (legacyPromptInFlight) return legacyPromptInFlight;
  legacyPromptInFlight = (async () => {
    const liveBeforePrompt = (await supabaseBrowser().auth.getSession()).data.session?.user.id ?? null;
    if (liveBeforePrompt !== userId) return;
    const entries = await readLegacyEntries();
    if (!entries.length) { writeLegacyResolution(userId, "empty"); return; }
    const restore = window.confirm("Restore previous local drafts?");
    const liveAfterPrompt = (await supabaseBrowser().auth.getSession()).data.session?.user.id ?? null;
    if (liveAfterPrompt !== userId) return;
    if (restore) await restoreLegacyEntries(userId, entries);
    writeLegacyResolution(userId, restore ? "restored" : "declined");
  })().finally(() => { legacyPromptInFlight = null; });
  return legacyPromptInFlight;
}

export type ConnectivityState = "online" | "offline" | "weak";
export function connectivityState(online: boolean, effectiveType?: string): ConnectivityState {
  if (!online) return "offline";
  return effectiveType === "slow-2g" || effectiveType === "2g" ? "weak" : "online";
}

export type DraftSummary = { inspectionId: string; factoryName: string };
export function mergeDraftSummaries(localInspectionIds: string[], serverDrafts: DraftSummary[], localLabel: string): DraftSummary[] {
  const byInspection = new Map(serverDrafts.map(draft => [draft.inspectionId, draft]));
  for (const inspectionId of localInspectionIds) {
    if (!byInspection.has(inspectionId)) byInspection.set(inspectionId, { inspectionId, factoryName: localLabel });
  }
  return [...byInspection.values()];
}

export class ReplaySessionChanged extends Error {
  constructor() { super("Replay session changed"); }
}

/**
 * A refusal, not a hang (INSP-758-class). submit_inspection and its guard
 * trigger raise stable EXE-SUBMIT-* tokens for a semantic rejection (missing
 * config, a required action form, a scope violation, …) — none of these
 * become true on an unattended retry, so replaying them every tick just
 * disguises "the server said no" as "still working on it" forever. This
 * class marks that distinction for the catch block below: the token text
 * itself is never shown as user copy (same convention as the neutral-code
 * maps elsewhere) — only the mapped, stable code travels to the UI.
 */
export class SubmitRejected extends Error {
  code: string;
  constructor(code: string, message: string) { super(message); this.code = code; }
}
const SUBMIT_TOKEN_CODES: Record<string, string> = {
  "EXE-SUBMIT-DENIED": "SUBMIT_DENIED",
  "EXE-SUBMIT-IDEMPOTENCY": "SUBMIT_IDEMPOTENCY",
  "EXE-SUBMIT-NOT-FOUND": "SUBMIT_NOT_FOUND",
  "EXE-SUBMIT-TERMINAL": "SUBMIT_TERMINAL_STATE",
  "EXE-SUBMIT-UNDER-REVIEW": "SUBMIT_UNDER_REVIEW",
  "EXE-SUBMIT-STATE": "SUBMIT_STATE",
  "EXE-SUBMIT-EVIDENCE-PENDING": "SUBMIT_EVIDENCE_PENDING",
  "EXE-SUBMIT-SCOPE-VIOLATION": "SUBMIT_SCOPE_VIOLATION",
  "EXE-SUBMIT-RACE": "SUBMIT_RACE",
  "EXE-SUBMIT-CONFIG-VERSION-MISMATCH": "SUBMIT_CONFIG_MISMATCH",
  "EXE-SUBMIT-CONFIG-CHECKSUM-MISMATCH": "SUBMIT_CONFIG_MISMATCH",
  "EXE-SUBMIT-SNAPSHOT-VERSION-MISMATCH": "SUBMIT_CONFIG_MISMATCH",
  "EXE-SUBMIT-CONFIG-SNAPSHOT-REQUIRED": "SUBMIT_CONFIG_MISMATCH",
  "EXE-SUBMIT-ACTION-FORM-MISSING": "SUBMIT_ACTION_FORM_MISSING",
  "EXE-SUBMIT-ACTION-FORM-INCOMPLETE": "SUBMIT_ACTION_FORM_INCOMPLETE",
};
function classifySubmitRejection(message: string): string {
  for (const token of Object.keys(SUBMIT_TOKEN_CODES)) {
    if (message.includes(token)) return SUBMIT_TOKEN_CODES[token];
  }
  return "SUBMIT_REJECTED";
}

export function createReplayGuard(capturedUserId: string, liveUserId: () => Promise<string | null>) {
  const assertLive = async () => {
    if ((await liveUserId()) !== capturedUserId) throw new ReplaySessionChanged();
  };
  return {
    assertLive,
    network: async <T>(operation: () => PromiseLike<T>): Promise<T> => {
      await assertLive();
      return operation();
    },
  };
}

export function createPinnedReplayClient(url: string, anonKey: string, capturedAccessToken: string) {
  return createClient(url, anonKey, { accessToken: async () => capturedAccessToken });
}

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
export async function processOutbox(verifiedUserId: string, onState: (s: SyncState, detail?: string) => void, onSubmitSynced?: (inspectionId: string, info: SubmitSynced) => void): Promise<void> {
  if (!navigator.onLine) { onState("offline"); return; }
  const shared = supabaseBrowser();
  const { data: { session } } = await shared.auth.getSession();
  const capturedAccessToken = session?.access_token;
  if (!capturedAccessToken) { onState("failed"); return; }
  const { data: claimData, error: claimError } = await shared.auth.getClaims(capturedAccessToken);
  const capturedUserId = typeof claimData?.claims?.sub === "string" ? claimData.claims.sub : null;
  if (claimError || !capturedUserId || capturedUserId !== verifiedUserId || session.user.id !== capturedUserId) {
    onState("failed"); return;
  }
  const local = localForUser(capturedUserId);
  const sb = createPinnedReplayClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    capturedAccessToken,
  );
  const guard = createReplayGuard(capturedUserId, async () => {
    const { data } = await shared.auth.getSession();
    return data.session?.user.id ?? null;
  });
  // One read, so each op arrives with its own key. Reading keys and values
  // separately let an enqueue between the two calls shift them out of step.
  const entries = await local.entries();
  if (!entries.length) { onState("synced"); return; }
  onState("syncing", `${entries.length} queued`);
  for (let i = 0; i < entries.length; i++) {
    const op = entries[i].op; const key = entries[i].key;
    try {
      if (op.kind === "response") {
        const { data: server } = await guard.network(() => sb.from("checklist_responses").select("id, response, updated_at")
          .eq("inspection_id", op.inspection_id).eq("item_id", op.item_id).maybeSingle());
        if (server && op.baseline_updated_at && new Date(server.updated_at) > new Date(op.baseline_updated_at)
            && JSON.stringify(server.response) !== JSON.stringify(op.response)) {
          await guard.assertLive();
          await local.addConflict({ key: `${op.inspection_id}:${op.item_id}`, local: op.response, server: server.response, item_id: op.item_id, detected_at: new Date().toISOString() });
          await guard.assertLive();
          await local.remove(key); onState("conflict", op.item_id); continue;  // explicit, never overwrite
        }
        const { error } = await guard.network(() => sb.from("checklist_responses").upsert(
          { inspection_id: op.inspection_id, item_id: op.item_id, response: op.response, is_complete: true, updated_at: new Date().toISOString() },
          { onConflict: "inspection_id,item_id" }));
        if (error) throw error;
      } else if (op.kind === "geo_checkin") {
        // M04-039/043 — durable captured facts for a later offline override.
        // This is deliberately only a check-in event; it cannot arrive or
        // unlock the visit without the separately guarded Operations decision.
        const { error } = await guard.network(() => sb.from("geo_events").insert({
          id: op.id, journey_id: op.journey_id, visit_id: op.visit_id, kind: "checkin",
          observed_lat: op.observed_lat, observed_lng: op.observed_lng,
          accuracy_m: op.accuracy_m, altitude_m: op.altitude_m,
          device_occurred_at: op.device_occurred_at, geofence_result: "outside",
          gis_version: op.gis_version, device_id: op.device_id,
        }));
        if (error && !String(error.message).includes("duplicate")) throw error;
      } else if (op.kind === "evidence") {
        const path = `${op.visit_id ?? op.inspection_id}/${op.name}`;
        const bytes = Uint8Array.from(atob(op.data_b64), c => c.charCodeAt(0));
        const up = await guard.network(() => sb.storage.from("evidence").upload(path, bytes, { contentType: op.mime, upsert: true })); // upsert = replay-safe
        if (up.error) throw up.error;
        const row: Record<string, unknown> = {
          inspection_id: op.inspection_id,
          evidence_type: op.evidence_type ?? (op.mime.startsWith("image") ? "photo" : op.mime.startsWith("video") ? "video" : "document"),
          linked_type: op.linked_type, linked_id: op.linked_id, storage_path: path,
          captured_at: op.captured_at, content_sha256: op.sha256, captured_by: capturedUserId, synced_at: new Date().toISOString(),
        };
        if (op.evidence_note) row.evidence_note = op.evidence_note;
        if (op.visit_id) {
          // F3 / M04-058 — cancellation evidence anchors to the visit (0020);
          // pre-0020 the insert fails verbatim and the op stays queued (honest).
          row.visit_id = op.visit_id; row.inspection_id = null;
        }
        const { error } = await guard.network(() => sb.from("evidence").upsert(row, { onConflict: "storage_path", ignoreDuplicates: true } as never));
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
        const { data: rpcResult, error: rpcError } = await guard.network(() => sb.rpc("submit_inspection", {
          p_inspection: op.inspection_id,
          p_snapshot: op.snapshot,
          p_idempotency_key: op.idempotency_key,
          p_acknowledgement: op.acknowledgement,
        }));
        let submitted: SubmitSynced | null = null;
        if (rpcError) {
          const missing =
            rpcError.code === "42883" || rpcError.code === "PGRST202" ||
            String(rpcError.message).includes("Could not find the function");
          if (!missing) {
            // A genuine EXE-SUBMIT-* refusal — explicit failure, never masked
            // as "still working on it" (INSP-758-class: see SubmitRejected).
            throw new SubmitRejected(classifySubmitRejection(String(rpcError.message)), String(rpcError.message));
          }
          // LEGACY FALLBACK (pre-20260721160000 servers): the original direct
          // insert with its duplicate-tolerance. The unguarded status update
          // and client-side version_number stay as-is on this path only.
          const { error } = await guard.network(() => sb.from("submission_versions").insert({
            inspection_id: op.inspection_id, version_number: op.version_number, snapshot: op.snapshot,
            idempotency_key: op.idempotency_key, acknowledgement: op.acknowledgement,
            submitted_by: capturedUserId,
          }));
          if (error && !String(error.message).includes("duplicate")) throw error;  // 409 duplicate = already submitted (ERR-SUB-002)
          await guard.network(() => sb.from("inspections").update({ status: "submitted" }).eq("id", op.inspection_id));
          submitted = {
            submission_version_id: op.idempotency_key,
            version_number: op.version_number,
            reused: Boolean(error),
          };
        } else if (rpcResult) {
          await guard.assertLive();
          submitted = rpcResult as SubmitSynced;
          onSubmitSynced?.(op.inspection_id, submitted);
        }
        if (submitted) {
          await guard.assertLive();
          await local.cacheSubmittedReport({
            schema: "saqeel-submitted-report-v1",
            inspectionId: op.inspection_id,
            submissionVersionId: submitted.submission_version_id,
            versionNumber: submitted.version_number,
            // The RPC does not return the server submitted_at timestamp. The
            // queued_at device value is not substituted as authoritative time.
            submittedAt: null,
            snapshot: op.snapshot,
            acknowledgement: op.acknowledgement,
            factoryName: null,
            factoryCode: null,
            inspectorName: null,
            cachedAt: new Date().toISOString(),
          });
        }
      } else if (op.kind === "factory_check") {
        // M04-103/104/105/113 — observed value + Verified/Updated status persisted
        // separately from Senaei data; audit trigger logs before/after server-side.
        const { error } = await guard.network(() => sb.from("inspection_factory_checks").upsert({
          id: op.check.id, inspection_id: op.inspection_id, field_key: op.check.field_key,
          source_value: op.check.source_value, observed_value: op.check.observed_value,
          status: op.check.status, evidence_note: op.check.evidence_note,
          updated_by: capturedUserId, updated_at: new Date().toISOString(),
        }, { onConflict: "inspection_id,field_key" }));
        if (error) throw error;
      } else if (op.kind === "geo_override_request") {
        // M04-043 / STM-JRN-003 — canonical database guard validates the
        // immutable outside check-in, evidence, expiry and inspector identity.
        // It is intentionally the only replay path; offline never unlocks the
        // visit locally or synthesises an approval.
        const { error } = await guard.network(() => sb.rpc("request_geo_override", {
          p_request: op.request_id,
          p_visit: op.visit_id,
          p_journey: op.journey_id,
          p_checkin_event: op.checkin_event_id,
          p_reason_key: op.reason_key,
          p_explanation: op.explanation,
          p_safety_security_exception: op.safety_security_exception,
        }));
        if (error) throw error;
      } else if (op.kind === "item_state") {
        // §15 / D-017 — upsert on (inspection_id, item_id) carrying the desired
        // final row, so FIFO replays of add → deselect → restore converge.
        // Pre-migration the table is missing: the op stays queued (honest).
        const { error } = await guard.network(() => sb.from("inspection_item_states").upsert({
          inspection_id: op.inspection_id, item_id: op.item_id,
          state: op.state, reason: op.reason, reverted_at: op.reverted_at,
        }, { onConflict: "inspection_id,item_id" }));
        if (error) throw error;
      } else if (op.kind === "finding") {
        // SCR-IPAD-630 / FLD-FND-001..003 — idempotent UPSERT of the finding row
        // by its client-generated id, so an ambiguous retry (or a duplicate op)
        // collapses to ONE row. Severity is the frozen canonical level captured
        // at save. RLS (findings_rw) authorizes the assigned inspector only; the
        // audit trigger records the write. Ordered before the submit op (FIFO),
        // so a submitted inspection always carries persisted findings. The
        // violations.finding_id link is NEVER written here — it is immutable
        // post-insert (guard_violation_invalidate); the association is item_id +
        // the submission manifest. Pre-existing findings table only — no DDL.
        const { error } = await guard.network(() => sb.from("findings").upsert({
          id: op.id, inspection_id: op.inspection_id, item_id: op.item_id,
          severity: op.severity, description: op.description,
        }, { onConflict: "id" }));
        if (error) throw error;
      } else if (op.kind === "violation_invalidate") {
        // §18 / D-018 — invalidate, never delete. Targets the row by id when
        // known, else the ACTIVE candidate for (inspection, code). Zero
        // affected rows is a legitimate no-op (the candidate never synced).
        // The guard trigger (20260721150000) narrows the update to the three
        // invalidation columns; the audit trigger records before/after.
        const stamp = { invalidated_at: new Date().toISOString(), invalidated_by: capturedUserId, invalidate_reason: op.reason };
        let vid = op.violation_id;
        if (vid) {
          const { error } = await guard.network(() => sb.from("violations").update(stamp).eq("id", vid));
          if (error) throw error;
        } else if (op.violation_code_id) {
          const { error } = await guard.network(() => sb.from("violations").update(stamp)
            .eq("inspection_id", op.inspection_id).eq("violation_code_id", op.violation_code_id)
            .is("invalidated_at", null));
          if (error) throw error;
          const { data: justInvalidated } = await guard.network(() => sb.from("violations").select("id")
            .eq("inspection_id", op.inspection_id).eq("violation_code_id", op.violation_code_id)
            .not("invalidated_at", "is", null).limit(1).maybeSingle());
          vid = justInvalidated?.id ?? null;
        }
        // Dependent trigger-generated action forms are re-evaluated here
        // (D-018): open forms LINKED to the invalidated candidate are closed
        // with status 'cancelled' (action_forms.status is free text — no enum
        // forbids it). Package-included forms (violation_id null) are NEVER
        // touched. A missing column (pre-migration) surfaces as an error and
        // the op stays queued — honest, no silent skip.
        if (vid) {
          const { error } = await guard.network(() => sb.from("action_forms").update({ status: "cancelled" })
            .eq("violation_id", vid).eq("status", "open"));
          if (error) throw error;
        }
      }
      await guard.assertLive();
      await local.remove(key);
    } catch (e) {
      if (e instanceof ReplaySessionChanged) {
        onState("pending");
        return;  // original user's current + remaining entries stay untouched
      }
      if (e instanceof SubmitRejected) {
        // Terminal, not transient: nothing about this op changes on its own,
        // so leaving it queued would just replay the identical refusal every
        // tick forever while the UI kept implying patience would fix it
        // (INSP-758-class). Drop it and say what happened; other queued ops
        // (other inspections) still get their turn.
        await local.remove(key);
        onState("failed", e.code);
        continue;
      }
      // Provider details stay diagnostic-only. The field surface supplies the
      // localized neutral recovery copy for the failed-sync state.
      onState("failed");
      return;  // stop; order preserved; retry later — no data loss
    }
  }
  const remaining = await local.keys();
  onState(remaining.length ? "pending" : "synced");
}
