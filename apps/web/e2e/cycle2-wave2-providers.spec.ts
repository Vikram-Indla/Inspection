import { test, expect } from "@playwright/test";
import { StagingVideoProvider, selectVideoProvider } from "../src/lib/providers/video";
import { StubMapProvider, selectMapProvider } from "../src/lib/providers/map";
import { SimulatorLocationProvider } from "../src/lib/providers/location";
import { FixtureMediaProvider } from "../src/lib/providers/media";
import { registerStagingNotificationAdapters, readSink, clearSink } from "../src/lib/providers/notification-stubs";
import { SyntheticFactoryMasterProvider, SyntheticRiskProvider } from "../src/lib/providers/factory-risk";
import type { DeliveryAdapter } from "../src/lib/notify";

// Cycle 2 Wave 2 — adapter contract + stub/real-parity + no-production-stub
// guard tests. Pure logic, no browser fixtures needed.

test.describe("no-production-stub guard", () => {
  const originalEnv = process.env.NODE_ENV;
  test.afterEach(() => { (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv; });

  for (const ctor of [
    () => new StagingVideoProvider(),
    () => new StubMapProvider(),
    () => new SimulatorLocationProvider(),
    () => new FixtureMediaProvider(),
    () => new SyntheticFactoryMasterProvider(),
    () => new SyntheticRiskProvider(),
  ]) {
    test(`${ctor.toString().slice(10, 40)} refuses to construct under NODE_ENV=production`, () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      expect(ctor).toThrow(/production/);
    });
  }
});

test.describe("determinism", () => {
  test("video: same session+participant -> same scenario", async () => {
    const p = new StagingVideoProvider();
    const a = await p.joinRoom("session-abc", "participant-1");
    const b = await p.joinRoom("session-abc", "participant-1");
    expect(a).toEqual(b);
  });

  test("map: same query -> same geocode result", async () => {
    const p = new StubMapProvider();
    const a = await p.geocode("Riyadh Industrial City");
    const b = await p.geocode("Riyadh Industrial City");
    expect(a).toEqual(b);
  });

  test("location: same seed -> same sample (ignoring wall-clock observedAt)", async () => {
    const p = new SimulatorLocationProvider();
    const { observedAt: _a, ...a } = await p.sample("visit-42");
    const { observedAt: _b, ...b } = await p.sample("visit-42");
    expect(a).toEqual(b);
  });

  test("risk: same seed+version -> same score and factors", () => {
    const p = new SyntheticRiskProvider();
    const a = p.score("factory-9", "syn-risk-v1");
    const b = p.score("factory-9", "syn-risk-v1");
    expect(a).toEqual(b);
    expect(a.riskScore).toBe(a.factors.reduce((s, f) => s + f.contribution, 0));
  });
});

test.describe("media fixture provider", () => {
  const media = new FixtureMediaProvider();

  test("capture / metadata / checksum", () => {
    const r = media.capture("evidence-seed-1", "photo");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.fixture.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(r.fixture.mimeType).toBe("image/jpeg");
    }
  });

  test("invalid type is rejected", () => {
    const r = media.capture("seed", "photo", { mimeType: "application/x-msdownload" });
    expect(r).toEqual({ ok: false, reason: "invalid_type" });
  });

  test("oversize is rejected", () => {
    const r = media.capture("seed", "video", { sizeBytes: 999_999_999 });
    expect(r).toEqual({ ok: false, reason: "oversize" });
  });

  test("interrupted capture is honest, not a fake success", () => {
    const r = media.capture("seed", "audio", { simulate: "interrupted_capture" });
    expect(r).toEqual({ ok: false, reason: "interrupted_capture" });
  });

  test("scan pass/fail/timeout are deterministic per checksum, and retry recovers from timeout", () => {
    const cap = media.capture("scan-seed", "document");
    expect(cap.ok).toBe(true);
    if (!cap.ok) return;
    const first = media.scan(cap.fixture);
    const second = media.scan(cap.fixture);
    expect(first).toEqual(second);
    const retried = media.scanWithRetry(cap.fixture, 5);
    expect(["pass", "fail"]).toContain(retried.status); // retry must eventually leave "timeout" for a non-timeout seed
  });

  test("chain of custody is append-only and ordered", () => {
    const trail = media.buildCustodyTrail("inspector-1", true);
    expect(trail.map(e => e.action)).toEqual(["captured", "queued_local", "uploaded", "scanned", "signed_url_issued"]);
    for (let i = 1; i < trail.length; i++) expect(trail[i].at >= trail[i - 1].at).toBe(true);
  });
});

test.describe("notification stub sink — dedup + never-real-send", () => {
  test.beforeEach(() => clearSink());

  test("duplicate suppression: same event+recipient+channel only sends once", async () => {
    const adapters: DeliveryAdapter[] = [];
    registerStagingNotificationAdapters(a => adapters.push(a));
    // resolveFeatureFlag defaults to "off" — force staging mode directly for this test.
    process.env.FEATURE_NOTIFICATION_STUBS = "staging";
    adapters.length = 0;
    registerStagingNotificationAdapters(a => adapters.push(a));
    delete process.env.FEATURE_NOTIFICATION_STUBS;
    expect(adapters.length).toBe(3); // push, sms, email
    const pushAdapter = adapters.find(a => a.channel === "push")!;
    const input = { event_key: "review_decision", recipient: "user-1", payload: {} };
    const first = await pushAdapter.deliver(input);
    const second = await pushAdapter.deliver(input);
    expect(second.detail).toBe("duplicate_suppressed");
    expect(readSink().length).toBe(2);
    expect(first).not.toEqual(second);
  });
});

test.describe("fail-closed provider selection", () => {
  test("FEATURE_MAP_PROVIDER=mapbox with a token but no real client throws, never silently claims real", () => {
    process.env.FEATURE_MAP_PROVIDER = "mapbox";
    process.env.MAPBOX_ACCESS_TOKEN = "test-token-not-a-real-credential";
    expect(() => selectMapProvider()).toThrow(/certification/);
    delete process.env.FEATURE_MAP_PROVIDER;
    delete process.env.MAPBOX_ACCESS_TOKEN;
  });

  test("FEATURE_MAP_PROVIDER=mapbox without a token falls back to the stub, not a fake real connection", () => {
    process.env.FEATURE_MAP_PROVIDER = "mapbox";
    const provider = selectMapProvider();
    expect(provider?.name).toBe("stub");
    expect(provider?.certified).toBe(false);
    delete process.env.FEATURE_MAP_PROVIDER;
  });

  test("video provider defaults OFF (no env var) — the honest pending UI is the default", () => {
    delete process.env.NEXT_PUBLIC_FEATURE_VIDEO_PROVIDER;
    expect(selectVideoProvider()).toBeNull();
  });
});
