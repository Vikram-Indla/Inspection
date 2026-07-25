import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

// TASK-IPAD-SCR-610-STARTUP-001 · SCR-IPAD-610
// Executable pure-behavior tests. The production integrity module is transpiled
// and executed directly; assertions do not inspect source strings.

const modulePath = path.resolve(__dirname, "../src/lib/offline-package-integrity.ts");

type IntegrityModule = {
  packageCacheNamespace(userId: string): string;
  sealInspectionPackage(input: {
    packageVersionId: string;
    packageVersionLabel: string;
    authorityChecksum: string | null;
    definition: unknown;
    cachedAt?: string;
  }): Promise<Record<string, unknown>>;
  verifyInspectionPackage(value: unknown, authority?: {
    packageVersionId: string;
    authorityChecksum: string | null;
  }): Promise<{ state: string; package?: Record<string, unknown> }>;
  resolveInspectionPackageCache(input: {
    cache: {
      get(key: string): Promise<unknown>;
      put(key: string, value: unknown): Promise<void>;
    };
    visitId: string;
    inspectionId: string | null;
    authority: { packageVersionId: string; authorityChecksum: string | null };
  }): Promise<{ state: string; package?: Record<string, unknown> }>;
};

let integrity: IntegrityModule;

test.beforeAll(async () => {
  const source = fs.readFileSync(modulePath, "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  integrity = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`) as IntegrityModule;
});

const authority = { packageVersionId: "pv-current", authorityChecksum: "server-hash-current" };
const definition = { sections: [{ key: "s1", mandatory: true }], action_forms: [] };

test.describe("SCR-IPAD-610 Startup Pack offline integrity", () => {
  test("metadata tampering invalidates the complete immutable envelope", async () => {
    const cached = await integrity.sealInspectionPackage({
      ...authority,
      packageVersionLabel: "v7",
      definition,
      cachedAt: "2026-07-25T12:00:00.000Z",
    });
    await expect(integrity.verifyInspectionPackage(cached, authority)).resolves.toMatchObject({ state: "verified" });

    for (const [field, value] of [
      ["packageVersionId", "pv-tampered"],
      ["packageVersionLabel", "v999"],
      ["authorityChecksum", "server-hash-tampered"],
      ["cachedAt", "2099-01-01T00:00:00.000Z"],
      ["definition", { sections: [] }],
    ] as const) {
      await expect(integrity.verifyInspectionPackage({ ...cached, [field]: value }, authority))
        .resolves.toMatchObject({ state: "corrupt" });
    }
  });

  test("an intact cache for a different authoritative version is outdated, never verified", async () => {
    const cached = await integrity.sealInspectionPackage({
      packageVersionId: "pv-old",
      packageVersionLabel: "v6",
      authorityChecksum: "server-hash-old",
      definition,
    });
    await expect(integrity.verifyInspectionPackage(cached, authority))
      .resolves.toMatchObject({ state: "outdated" });
  });

  test("migrates a verified visit cache to the inspection key without losing readiness", async () => {
    const values = new Map<string, unknown>();
    values.set("visit:visit-1", await integrity.sealInspectionPackage({
      ...authority,
      packageVersionLabel: "v7",
      definition,
    }));
    const cache = {
      get: async (key: string) => values.get(key),
      put: async (key: string, value: unknown) => { values.set(key, value); },
    };
    await expect(integrity.resolveInspectionPackageCache({
      cache, visitId: "visit-1", inspectionId: "inspection-1", authority,
    })).resolves.toMatchObject({ state: "verified" });
    expect(values.get("inspection:inspection-1")).toEqual(values.get("visit:visit-1"));

    values.delete("visit:visit-1");
    await expect(integrity.resolveInspectionPackageCache({
      cache, visitId: "visit-1", inspectionId: "inspection-1", authority,
    })).resolves.toMatchObject({ state: "verified" });
  });

  test("user namespaces and adapters prevent cross-user package visibility", async () => {
    expect(integrity.packageCacheNamespace("inspector-a")).not.toBe(integrity.packageCacheNamespace("inspector-b"));
    expect(() => integrity.packageCacheNamespace(" ")).toThrow();

    const userA = new Map<string, unknown>();
    const userB = new Map<string, unknown>();
    userA.set("visit:visit-1", await integrity.sealInspectionPackage({
      ...authority,
      packageVersionLabel: "v7",
      definition,
    }));
    const adapter = (values: Map<string, unknown>) => ({
      get: async (key: string) => values.get(key),
      put: async (key: string, value: unknown) => { values.set(key, value); },
    });
    await expect(integrity.resolveInspectionPackageCache({
      cache: adapter(userA), visitId: "visit-1", inspectionId: null, authority,
    })).resolves.toMatchObject({ state: "verified" });
    await expect(integrity.resolveInspectionPackageCache({
      cache: adapter(userB), visitId: "visit-1", inspectionId: null, authority,
    })).resolves.toMatchObject({ state: "missing" });
  });
});
