import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CONSTRAINED_FLOOR_BYTES,
  classifyDisplayMode,
  classifyPersistence,
  classifyShell,
  classifyStorage,
  classifyUpdate,
  formatBytes,
} from "../src/lib/pwa/readiness";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const sw = read("public/sw.js");
const manifest = JSON.parse(read("public/manifest.json"));
const layout = read("src/app/layout.tsx");
const client = read("src/lib/pwa/client.ts");
const register = read("src/components/PwaRegister.tsx");
const prompt = read("src/components/PwaUpdatePrompt.tsx");
const readiness = read("src/app/(app)/field/settings/readiness/DeviceReadinessClient.tsx");
const settings = read("src/app/(app)/field/settings/FieldSettingsClient.tsx");

// Inspector iPad PWA Shell & Device Readiness.
// Anchors: FND-005 (offline shell), SPC-OFF-001 (textual, non-color-only),
// SPC-OFF-005 (reload preserves draft), SPC-OFF-002, SCR-IPAD-610, MVP2-REQ-0181.

test.describe("classifyStorage — measured headroom (SCR-IPAD-610 / MVP2-REQ-0181)", () => {
  test("honest unknown when the browser reports nothing usable", () => {
    expect(classifyStorage(null).state).toBe("unknown");
    expect(classifyStorage({}).state).toBe("unknown");
    expect(classifyStorage({}).measured).toBe(false); // nothing measured at all
    expect(classifyStorage({ usage: 10, quota: 0 }).state).toBe("unknown"); // zero quota
    expect(classifyStorage({ usage: 10, quota: null }).state).toBe("unknown"); // no quota → no headroom verdict
  });

  test("ample when free space is at or above the display floor; constrained below it", () => {
    const quota = 4 * 1024 * 1024 * 1024; // 4 GB
    const ample = classifyStorage({ usage: quota - CONSTRAINED_FLOOR_BYTES, quota }); // exactly floor free
    expect(ample.state).toBe("ample");
    expect(ample.availableBytes).toBe(CONSTRAINED_FLOOR_BYTES);

    const constrained = classifyStorage({ usage: quota - (CONSTRAINED_FLOOR_BYTES - 1), quota });
    expect(constrained.state).toBe("constrained");
    expect(constrained.availableBytes).toBe(CONSTRAINED_FLOOR_BYTES - 1);
  });

  test("ratio is clamped and negative/NaN inputs are rejected", () => {
    const r = classifyStorage({ usage: 5_000, quota: 10_000 });
    expect(r.usedRatio).toBeCloseTo(0.5, 5);
    expect(classifyStorage({ usage: -1, quota: 10_000 }).usageBytes).toBeNull();
    expect(classifyStorage({ usage: Number.NaN, quota: 10_000 }).usageBytes).toBeNull();
  });
});

test.describe("classify* — honest state machines", () => {
  test("persistence maps only true/false, else unknown", () => {
    expect(classifyPersistence(true)).toBe("persisted");
    expect(classifyPersistence(false)).toBe("best_effort");
    expect(classifyPersistence(null)).toBe("unknown");
    expect(classifyPersistence(undefined)).toBe("unknown");
  });

  test("display mode resolves standalone via either signal, else browser/unknown", () => {
    expect(classifyDisplayMode(true, null)).toBe("standalone");
    expect(classifyDisplayMode(false, true)).toBe("standalone"); // iOS legacy flag
    expect(classifyDisplayMode(false, false)).toBe("browser");
    expect(classifyDisplayMode(null, null)).toBe("unknown");
  });

  test("update lifecycle (unsupported/unregistered/current/update_ready)", () => {
    expect(classifyUpdate({ supported: false, registered: false, hasWaiting: false })).toBe("unsupported");
    expect(classifyUpdate({ supported: true, registered: false, hasWaiting: false })).toBe("unregistered");
    expect(classifyUpdate({ supported: true, registered: true, hasWaiting: false })).toBe("current");
    expect(classifyUpdate({ supported: true, registered: true, hasWaiting: true })).toBe("update_ready");
  });

  test("offline shell readiness (FND-005) requires a controller and a cached shell", () => {
    expect(classifyShell({ supported: false, controlling: false, shellCached: null })).toBe("unsupported");
    expect(classifyShell({ supported: true, controlling: false, shellCached: true })).toBe("no_controller");
    expect(classifyShell({ supported: true, controlling: true, shellCached: false })).toBe("not_cached");
    expect(classifyShell({ supported: true, controlling: true, shellCached: true })).toBe("ready");
    expect(classifyShell({ supported: true, controlling: true, shellCached: null })).toBe("ready"); // unknown cache ≠ failure
  });

  test("formatBytes is deterministic and dashes the unknown", () => {
    expect(formatBytes(null)).toBe("—");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(250 * 1024 * 1024)).toBe("250 MB");
    expect(formatBytes(3 * 1024 * 1024 * 1024)).toBe("3.0 GB");
  });
});

test.describe("service worker — controlled update lifecycle (FND-005)", () => {
  test("a new worker WAITS: install no longer auto-skipWaiting", () => {
    expect(sw).toContain('const SHELL = "saqeel-shell-v7";');
    const install = sw.match(/addEventListener\("install"[\s\S]*?\}\);/)?.[0] ?? "";
    expect(install).not.toMatch(/self\.skipWaiting/); // no auto-activation call in install
  });

  test("skipWaiting happens ONLY on the client's explicit SKIP_WAITING message", () => {
    expect(sw).toContain('addEventListener("message"');
    expect(sw).toMatch(/e\.data\.type === "SKIP_WAITING"[\s\S]*self\.skipWaiting\(\)/);
  });

  test("regression: activate still purges old caches + claims clients; push + field-only nav intact", () => {
    expect(sw).toContain("caches.delete");
    expect(sw).toContain("self.clients.claim()");
    expect(sw).toContain('addEventListener("push"');
    // Public pages (/, /login) must still pass through — never cached/served stale.
    expect(sw).toContain('if (!url.pathname.startsWith("/field")) return;');
  });
});

test.describe("stale-asset recovery — safe, never destroys drafts (SPC-OFF-005)", () => {
  test("recovery clears Cache Storage but NEVER IndexedDB", () => {
    expect(client).toContain("caches.delete");
    expect(client).not.toMatch(/indexedDB\.deleteDatabase\(/); // never deletes the outbox DB
    expect(client).not.toMatch(/localStorage\.clear\(\)/);
    // Guarded to once per session to avoid reload loops.
    expect(client).toContain("STALE_RECOVERY_FLAG");
    expect(client).toMatch(/ChunkLoadError/);
  });

  test("controllerchange reload is gated behind a user-initiated update", () => {
    expect(client).toContain("userTriggeredReload");
    expect(client).toMatch(/if \(!userTriggeredReload\) return;/);
    expect(client).toContain('postMessage({ type: "SKIP_WAITING" })');
  });

  test("registration stays production-only; dev unregisters stale workers", () => {
    expect(client).toContain('process.env.NODE_ENV !== "production"');
    expect(client).toContain("r.unregister()");
    expect(register).toContain("registerFieldServiceWorker");
    expect(register).toContain('process.env.NODE_ENV === "production" ? installStaleAssetRecovery()');
  });
});

test.describe("iPad standalone presentation", () => {
  test("layout advertises installed/standalone presentation and safe-area cover", () => {
    expect(layout).toContain('viewportFit: "cover"');
    expect(layout).toContain("appleWebApp: { capable: true");
    expect(layout).toContain('statusBarStyle: "black-translucent"');
    expect(layout).toContain('"mobile-web-app-capable": "yes"');
    // Regression: existing manifest + theme colour metadata preserved.
    expect(layout).toContain('manifest: "/manifest.json"');
    expect(layout).toContain('color: "#101317"');
  });

  test("manifest gains installability fields without changing brand identity", () => {
    expect(manifest.scope).toBe("/");
    expect(manifest.id).toBe("/field");
    expect(manifest.display_override).toEqual(["standalone"]);
    // Regression: brand + launch identity unchanged.
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/field");
    expect(manifest.theme_color).toBe("#34d399");
    expect(manifest.background_color).toBe("#090714");
    expect(manifest.icons).toHaveLength(3);
  });
});

test.describe("update prompt — textual, non-color-only (SPC-OFF-001)", () => {
  test("banner is a status region with a text label and an explicit reload", () => {
    expect(prompt).toContain('role="status"');
    expect(prompt).toContain('data-pwa-update="ready"');
    expect(prompt).toContain("A new version is ready");
    expect(prompt).toContain("data-pwa-update-reload");
    // Reassures the inspector saved work survives the reload (SPC-OFF-005).
    expect(prompt).toContain("Your saved work is kept");
    // DS tokens + canonical button classes only — no bare colours anywhere.
    expect(prompt).toContain("var(--surface-primary)");
    expect(prompt).toContain("btn btn-primary");
    expect(prompt).not.toMatch(/#[0-9a-fA-F]{3,8}\b/); // no bare hex colours
    expect(prompt).not.toMatch(/\brgba?\(/); // no bare rgb/rgba
  });
});

test.describe("Device Readiness surface (SCR-IPAD-610 / SPC-OFF-002 / MVP2-REQ-0181)", () => {
  test("renders measured state and an honest unknown, never a fabricated default", () => {
    expect(readiness).toContain("readDeviceReadiness");
    expect(readiness).toContain('copy(locale, "Unknown"');
    expect(readiness).toContain("Offline app shell");
    expect(readiness).toContain("Installed mode");
    expect(readiness).toContain("Storage headroom");
  });

  test("constrained storage states the exact fix before travel (MVP2-REQ-0181)", () => {
    expect(readiness).toContain('storage?.state === "constrained"');
    expect(readiness).toContain("Free up space in iPadOS Settings before travel");
    expect(readiness).toContain("requestPersistentStorage");
  });

  test("read-only: the readiness screen never clears drafts, packages, or caches", () => {
    expect(readiness).not.toContain("indexedDB.deleteDatabase");
    expect(readiness).not.toContain("caches.delete");
    expect(readiness).not.toMatch(/\.clear\(\)/);
    expect(readiness).not.toContain("local.remove(");
  });
});

test.describe("Field settings integration — additive, no regression to offline surface", () => {
  test("Data & Storage links to the readiness screen", () => {
    expect(settings).toContain('href="/field/settings/readiness"');
    expect(settings).toContain('copy(locale, "Device readiness"');
  });

  test("regression: offline queue/conflict surface (Claude-1) is untouched", () => {
    expect(settings).toContain("local.peekAll()");
    expect(settings).toContain("local.conflicts()");
    expect(settings).toContain('href="/field/settings/conflicts"');
    expect(settings).not.toContain("local.remove(");
  });
});
