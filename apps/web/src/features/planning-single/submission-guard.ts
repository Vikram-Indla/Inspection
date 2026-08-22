import { createHash } from "node:crypto";

const RETENTION_MS = 600_000;
const MAX_ENTRIES = 500;
const TOKEN_SHAPE = /^[A-Za-z0-9:_-]{1,120}$/;

type Entry = { settledAt: number | null; promise: Promise<unknown> };

const entries = new Map<string, Entry>();

function evict(now: number) {
  for (const [key, entry] of entries) {
    if (entry.settledAt !== null && now - entry.settledAt > RETENTION_MS) entries.delete(key);
  }
  while (entries.size > MAX_ENTRIES) {
    const oldest = entries.keys().next();
    if (oldest.done) return;
    entries.delete(oldest.value);
  }
}

export function readSubmissionToken(raw: unknown): string {
  const value = typeof raw === "string" ? raw.trim() : "";
  return TOKEN_SHAPE.test(value) ? value : "";
}

export function submissionKey(userId: string, token: string): string {
  return createHash("sha256").update(`${userId} ${token}`).digest("hex");
}

export function runOncePerSubmission<T>(
  key: string,
  run: () => Promise<T>,
  now: () => number = Date.now,
): Promise<T> {
  evict(now());
  const existing = entries.get(key);
  if (existing) return existing.promise as Promise<T>;
  const promise = run();
  const entry: Entry = { settledAt: null, promise };
  entries.set(key, entry);
  promise.then(
    () => { entry.settledAt = now(); },
    () => { entry.settledAt = now(); },
  );
  return promise;
}

export function resetSubmissionGuard() {
  entries.clear();
}
