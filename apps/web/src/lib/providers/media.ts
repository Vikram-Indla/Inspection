// Cycle 2 Wave 2.D — Media/evidence fixture capture + storage/scanner adapters.
// The real capture path (apps/web/src/app/field/inspection/[id]/Workspace.tsx
// enqueueEvidence()) and real Supabase Storage upload are untouched. This
// module provides synthetic test fixtures (photo/video/audio/document) and a
// deterministic malware-scan stub, for environments/tests that need capture
// and custody behavior without a real device or a real AV engine.
import { createHash } from "node:crypto";
import { assertNonProduction, resolveFeatureFlag, seededFraction } from "./env-gate";

export type MediaFixtureType = "photo" | "video" | "audio" | "document";

export type MediaFixture = {
  type: MediaFixtureType;
  filename: string;
  mimeType: string;
  bytes: Buffer;
  sha256: string;
  capturedAt: string;
};

export type CaptureOutcome =
  | { ok: true; fixture: MediaFixture }
  | { ok: false; reason: "invalid_type" | "oversize" | "interrupted_capture" };

export type ScanOutcome =
  | { status: "pass"; sha256: string }
  | { status: "fail"; sha256: string; detail: string }
  | { status: "timeout"; sha256: string };

export type CustodyEvent = { at: string; actor: string; action: "captured" | "queued_local" | "uploaded" | "scanned" | "signed_url_issued" };

const MAX_BYTES = 25 * 1024 * 1024; // 25MB — sanity bound for a fixture, not a product policy value
const ALLOWED_MIME: Record<MediaFixtureType, string[]> = {
  photo: ["image/jpeg", "image/png"],
  video: ["video/mp4"],
  audio: ["audio/mpeg", "audio/mp4"],
  document: ["application/pdf"],
};

/** Deterministic byte content — same seed always produces the same fixture. */
function fixtureBytes(seed: string, sizeBytes: number): Buffer {
  const buf = Buffer.alloc(sizeBytes);
  for (let i = 0; i < sizeBytes; i++) buf[i] = (seed.charCodeAt(i % seed.length) + i) % 256;
  return buf;
}

export class FixtureMediaProvider {
  readonly name = "stub" as const;

  constructor() { assertNonProduction("FixtureMediaProvider"); }

  /** capture / invalid type / oversize / interrupted capture */
  capture(seed: string, type: MediaFixtureType, opts?: { mimeType?: string; sizeBytes?: number; simulate?: "invalid_type" | "oversize" | "interrupted_capture" }): CaptureOutcome {
    if (opts?.simulate) return { ok: false, reason: opts.simulate };
    const mimeType = opts?.mimeType ?? ALLOWED_MIME[type][0];
    if (!ALLOWED_MIME[type].includes(mimeType)) return { ok: false, reason: "invalid_type" };
    const sizeBytes = opts?.sizeBytes ?? 1024;
    if (sizeBytes > MAX_BYTES) return { ok: false, reason: "oversize" };
    const bytes = fixtureBytes(seed, sizeBytes);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    return {
      ok: true,
      fixture: { type, filename: `${seed}.${type}`, mimeType, bytes, sha256, capturedAt: new Date().toISOString() },
    };
  }

  /** scan pass / fail / timeout — deterministic from the fixture's own checksum */
  scan(fixture: MediaFixture): ScanOutcome {
    const f = seededFraction(fixture.sha256);
    if (f < 0.05) return { status: "timeout", sha256: fixture.sha256 };
    if (f < 0.1) return { status: "fail", sha256: fixture.sha256, detail: "synthetic-eicar-marker" };
    return { status: "pass", sha256: fixture.sha256 };
  }

  /** retry: scan() is a pure function of the checksum, so a caller retries by calling scan() again. */
  scanWithRetry(fixture: MediaFixture, maxAttempts = 3): ScanOutcome {
    let last: ScanOutcome = { status: "timeout", sha256: fixture.sha256 };
    for (let i = 0; i < maxAttempts; i++) {
      last = this.scan(fixture);
      if (last.status !== "timeout") return last;
    }
    return last;
  }

  /** custody trail — captured -> queued_local -> uploaded -> scanned, append-only */
  buildCustodyTrail(actor: string, includeUpload: boolean): CustodyEvent[] {
    const now = Date.now();
    const at = (offsetMs: number) => new Date(now + offsetMs).toISOString();
    const trail: CustodyEvent[] = [
      { at: at(0), actor, action: "captured" },
      { at: at(50), actor, action: "queued_local" },
    ];
    if (includeUpload) {
      trail.push({ at: at(100), actor, action: "uploaded" });
      trail.push({ at: at(150), actor, action: "scanned" });
      trail.push({ at: at(200), actor, action: "signed_url_issued" });
    }
    return trail;
  }
}

export const MEDIA_FIXTURE_MODES = ["stub", "off"] as const;
export type MediaFixtureMode = (typeof MEDIA_FIXTURE_MODES)[number];

export function selectMediaProvider(): FixtureMediaProvider | null {
  const mode = resolveFeatureFlag(process.env.FEATURE_MEDIA_FIXTURES, MEDIA_FIXTURE_MODES, "off");
  if (mode === "off") return null;
  return new FixtureMediaProvider();
}
