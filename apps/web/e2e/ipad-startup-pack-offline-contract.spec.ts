import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// TASK-IPAD-SCR-610-STARTUP-001 · SCR-IPAD-610
// Source/pure contract: the Startup Pack must never claim an offline package
// is ready until an actual IndexedDB write has passed a read-back digest check.

const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const read = (file: string) => fs.readFileSync(path.join(repoRoot, file), "utf8");

const offlinePath = "apps/web/src/lib/offline.ts";
const packPath = "apps/web/src/components/field/PreInspectionPackSheet.tsx";
const pagePath = "apps/web/src/app/(app)/field/[visitId]/page.tsx";

test.describe("SCR-IPAD-610 Startup Pack offline integrity", () => {
  test("stores a versioned package envelope and verifies the persisted payload", () => {
    const offline = read(offlinePath);
    expect(offline).toContain('schema: "saqeel-inspection-package-v1"');
    expect(offline).toContain("packageVersionId");
    expect(offline).toContain("packageVersionLabel");
    expect(offline).toContain("authorityChecksum");
    expect(offline).toContain("localChecksum");
    expect(offline).toContain("canonicalJson");
    expect(offline).toContain('crypto.subtle.digest("SHA-256"');
    expect(offline).toContain("cacheVerifiedPackage");
    expect(offline).toContain("verifyCachedPackage");
    expect(offline).toContain('{ state: "corrupt", package: cached }');
  });

  test("download control performs a verified write and exposes honest states", () => {
    const pack = read(packPath);
    const page = read(pagePath);
    expect(pack).toContain("downloadOfflinePackage");
    expect(pack).toContain("await local.cacheVerifiedPackage");
    expect(pack).toContain("await local.verifyCachedPackage");
    expect(pack).toContain('data-testid="pack-download-offline"');
    expect(pack).toContain('data-testid="pack-cache-status"');
    expect(pack).toContain("strings.integrityFailed");
    expect(pack).toContain("strings.offlineUnavailable");
    expect(page).toContain("Cached package failed integrity check");
    expect(page).toContain("Connect to download");
    expect(pack).toContain("disabled={!online || !data.packageVersionId || data.packageDefinition == null");
    expect(pack).not.toContain('className="sq-sync sq-sync--synced">{strings.cached}');
  });

  test("uses the visit cache key before an inspection exists and displays authority lineage", () => {
    const pack = read(packPath);
    const page = read(pagePath);
    expect(pack).toContain('data.inspectionId ?? `visit:${data.visitId}`');
    expect(page).toContain("packageVersionId: effectivePackageRow?.id ?? null");
    expect(page).toContain("packageDefinition: effectivePackageRow?.definition ?? null");
    expect(page).toContain("packageChecksum: snapshot?.checksum ?? null");
    expect(pack).toContain("data.packageChecksum.slice(0, 16)");
  });
});
