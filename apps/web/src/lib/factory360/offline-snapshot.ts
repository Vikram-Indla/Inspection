"use client";

// TASK-FACTORY-360-IPAD-011 · F360IPAD-OFFLINE-005 · CHUNK 4
// Read-only, permission-filtered, versioned Factory 360 offline snapshot store.
// DELIBERATELY a SEPARATE IndexedDB database ("mim-field-f360-v1") from the
// inspection engine database (which owns its own drafts, packages, send-queue
// and conflicts stores) — a Factory 360 refresh must never share the inspection
// send-queue, and observations never flow back into Senaei master data.
// Snapshots are read-only: this module only caches server-projected,
// permission-filtered dossier summaries so an inspector can still see the
// selected CR/license context when offline, with honest Offline/Stale
// signalling. A failed refresh MUST retain the prior usable snapshot (callers
// never overwrite the cache on a failed fetch).

const DB = "mim-field-f360-v1";
const STORE = "snapshots";

export type Factory360SnapshotMeta = {
  snapshotId: string;
  crId: string;
  licenseId: string | null;
  projectionVersion: string;
  checksum: string;
  generatedAt: string;
  permissionsApplied: string[];
  sectionsOmitted: string[];
  providerGaps: string[];
};

export type Factory360SnapshotSummary = {
  crNumber: string;
  unifiedNumber: string | null;
  companyName: string | null;
  licenseNumber: string | null;
  plantNumber: string | null;
  licenseType: string | null;
  licenseStatus: string | null;
  licenseStage: string | null;
  factoryName: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  riskScore: number | null;
  riskBand: string | null;
  riskModelVersion: string | null;
  complianceRate: number | null;
  approvedInspections: number;
  openViolationsNote: string;
  industrialLineCount: number;
  governmentRecordCount: number;
  documentCount: number;
  sourceSystem: string | null;
  sourceSyncedAt: string | null;
  // Cross-provider extensions (F360IPAD-API-015). Optional for backward
  // compatibility: snapshots cached by the pre-015 projection omit these and
  // remain readable. NO raw provider payloads, credentials, tokens or signed
  // URLs are ever cached — only summarised, source-labelled facts.
  canonicalVersion?: string;
  sourceFamilies?: string[];
  activitySummary?: { activities: number; products: number; materials: number; machines: number; spareParts: number };
  discrepancyStates?: Record<string, number>;
  contractUnverifiedDomains?: string[];
};

export type Factory360Snapshot = Factory360SnapshotMeta & { summary: Factory360SnapshotSummary };

const key = (crId: string, licenseId: string | null | undefined) => `${crId}:${licenseId ?? "_"}`;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
    t.oncomplete = () => db.close();
  });
}

export const factory360Offline = {
  /** Cache a freshly projected snapshot. Only call on a SUCCESSFUL online fetch. */
  put: (snapshot: Factory360Snapshot) => tx<void>("readwrite", s => s.put(snapshot, key(snapshot.crId, snapshot.licenseId))),
  /** Read the cached snapshot for a CR + selected license (undefined if none). */
  get: (crId: string, licenseId: string | null | undefined) => tx<Factory360Snapshot | undefined>("readonly", s => s.get(key(crId, licenseId))),
  /** List every cached snapshot (offline picker). */
  all: () => tx<Factory360Snapshot[]>("readonly", s => s.getAll() as IDBRequest<Factory360Snapshot[]>),
  /** Drop a snapshot (e.g. on signout / permission loss). */
  remove: (crId: string, licenseId: string | null | undefined) => tx<void>("readwrite", s => s.delete(key(crId, licenseId))),
};
