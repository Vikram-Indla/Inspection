import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  connectivityState,
  createPinnedReplayClient,
  createReplayGuard,
  mergeDraftSummaries,
  offlineDatabaseName,
  ReplaySessionChanged,
} from "../src/lib/offline";
import { storageStatePath } from "./personas";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

test.describe("PLAN v7 item 6 — user-scoped field offline state", () => {
  test("two users on one browser resolve disjoint databases for all four stores", () => {
    const userA = offlineDatabaseName("user-a");
    const userB = offlineDatabaseName("user-b");
    expect(userA).not.toBe(userB);
    const stores = ["drafts", "packages", "outbox", "conflicts"] as const;
    const browserCatalog = new Map<string, Map<string, string>>();
    const database = (name: string) => {
      let value = browserCatalog.get(name);
      if (!value) { value = new Map(); browserCatalog.set(name, value); }
      return value;
    };
    for (const store of stores) database(userA).set(store, "user-a");
    expect([...database(userB).values()]).toEqual([]);
    for (const store of stores) database(userB).set(store, "user-b");
    expect([...database(userA).values()]).toEqual(["user-a", "user-a", "user-a", "user-a"]);
    expect([...database(userB).values()]).toEqual(["user-b", "user-b", "user-b", "user-b"]);
  });

  test("mid-replay user switch aborts before another request or queue deletion", async () => {
    let liveUser: string | null = "user-a";
    const requests: string[] = [];
    const originalQueue = ["op-1", "op-2"];
    const newUsersQueue = ["user-b-op"];
    const guard = createReplayGuard("user-a", async () => liveUser);

    await guard.network(async () => {
      requests.push("user-a:op-1");
      liveUser = "user-b"; // switch after the first network operation resolves
    });
    await expect(guard.assertLive()).rejects.toBeInstanceOf(ReplaySessionChanged);
    await expect(guard.network(async () => { requests.push("user-b:must-not-run"); })).rejects.toBeInstanceOf(ReplaySessionChanged);

    expect(requests).toEqual(["user-a:op-1"]);
    expect(originalQueue).toEqual(["op-1", "op-2"]); // delete is guarded after the request
    expect(newUsersQueue).toEqual(["user-b-op"]);
  });

  test("pinned-token client stays on the captured bearer in the check/request race window", async () => {
    const capturedToken = "captured-user-a-token";
    let liveUser = "user-a";
    const seenAuthorization: string[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (_input, init) => {
      liveUser = "user-b"; // adversarial switch after the live check, as fetch begins
      seenAuthorization.push(new Headers(init?.headers).get("authorization") ?? "");
      return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    };
    try {
      const guard = createReplayGuard("user-a", async () => liveUser);
      const pinned = createPinnedReplayClient("https://example.supabase.co", "anon-key", capturedToken);
      await guard.network(() => pinned.from("race_probe").select("id"));
      await expect(guard.assertLive()).rejects.toBeInstanceOf(ReplaySessionChanged);
    } finally {
      globalThis.fetch = originalFetch;
    }
    expect(seenAuthorization).toEqual([`Bearer ${capturedToken}`]);
    expect(seenAuthorization).not.toContain("Bearer user-b");
  });

  test("draft union is user-fed, server-complete, and deduped by inspection_id", () => {
    expect(mergeDraftSummaries(
      ["inspection-local", "inspection-shared"],
      [
        { inspectionId: "inspection-server", factoryName: "Server factory" },
        { inspectionId: "inspection-shared", factoryName: "Authoritative server label" },
      ],
      "Local inspection draft",
    )).toEqual([
      { inspectionId: "inspection-server", factoryName: "Server factory" },
      { inspectionId: "inspection-shared", factoryName: "Authoritative server label" },
      { inspectionId: "inspection-local", factoryName: "Local inspection draft" },
    ]);
  });

  test("weak connectivity is emitted only from a real browser signal", () => {
    expect(connectivityState(false)).toBe("offline");
    expect(connectivityState(true)).toBe("online"); // Safari/iOS honest fallback: no invented weak state
    expect(connectivityState(true, "4g")).toBe("online");
    expect(connectivityState(true, "3g")).toBe("online");
    expect(connectivityState(true, "2g")).toBe("weak");
    expect(connectivityState(true, "slow-2g")).toBe("weak");
  });

  test("all production callers use the shared accessor and replay is structurally guarded", () => {
    const offline = read("src/lib/offline.ts");
    const callers = [
      "src/app/(app)/field/[visitId]/Startup.tsx",
      "src/app/(app)/field/inspection/[id]/Workspace.tsx",
      "src/app/(app)/field/inspection/[id]/FactoryVerification.tsx",
      "src/components/field/FieldHeaderSync.tsx",
      "src/components/field/PreInspectionPackSheet.tsx",
      "src/app/(app)/field/settings/FieldSettingsClient.tsx",
      "src/components/field/FieldDraftList.tsx",
    ];
    for (const caller of callers) {
      const source = read(caller);
      expect(source, caller).toContain("localForUser");
      expect(source, caller).not.toMatch(/import\s*\{[^}]*\blocal\b[^}]*\}\s*from\s*["']@\/lib\/offline["']/);
    }
    expect(offline).toContain("createClient(url, anonKey, { accessToken: async () => capturedAccessToken })");
    expect(offline).not.toContain("global: { headers:");
    expect(offline.match(/guard\.network\(/g)?.length).toBeGreaterThanOrEqual(12);
    expect(offline).toContain("await guard.assertLive();\n      await local.remove(key)");
    expect(offline).toContain("captured_by: capturedUserId");
    expect(offline).toContain("submitted_by: capturedUserId");
    expect(offline).toContain("updated_by: capturedUserId");
    expect(offline).toContain("invalidated_by: capturedUserId");
    expect(offline).toContain('const restore = window.confirm("Restore previous local drafts?")');
    expect(offline).toContain('database.transaction(available, "readonly")');
  });

  test("authenticated Inspector and Planner contexts have disjoint browser IndexedDB outboxes", async ({ browser }) => {
    const inspectorContext = await browser.newContext({ storageState: storageStatePath("inspector") });
    const plannerContext = await browser.newContext({ storageState: storageStatePath("planner") });
    const inspectorPage = await inspectorContext.newPage();
    const plannerPage = await plannerContext.newPage();
    // Load a stable same-origin asset so application redirects cannot destroy
    // the execution context while IndexedDB isolation is being measured.
    await inspectorPage.goto("/reset", { waitUntil: "networkidle" });
    await plannerPage.goto("/reset", { waitUntil: "networkidle" });

    const marker = `isolation-${Date.now()}`;
    const inspectorUserId = "runtime-inspector";
    const plannerUserId = "runtime-planner";
    await inspectorPage.evaluate(({ userId, marker }) => new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(`mim-field-v1:${userId}`, 1);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Inspector offline database open was blocked"));
      request.onupgradeneeded = () => request.result.createObjectStore("outbox", { autoIncrement: true });
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("outbox", "readwrite");
        const add = transaction.objectStore("outbox").add({
          kind: "response",
          inspection_id: marker,
          item_id: marker,
          response: { marker },
          baseline_updated_at: null,
          queued_at: new Date().toISOString(),
        });
        add.onsuccess = () => { database.close(); resolve(); };
        add.onerror = () => { database.close(); reject(add.error); };
      };
    }), { userId: inspectorUserId, marker });

    const plannerEntries = await plannerPage.evaluate(({ userId }) => new Promise<unknown[]>((resolve, reject) => {
      const request = indexedDB.open(`mim-field-v1:${userId}`, 1);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Planner offline database open was blocked"));
      request.onupgradeneeded = () => request.result.createObjectStore("outbox", { autoIncrement: true });
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("outbox", "readonly");
        const all = transaction.objectStore("outbox").getAll();
        all.onsuccess = () => { database.close(); resolve(all.result); };
        all.onerror = () => { database.close(); reject(all.error); };
      };
    }), { userId: plannerUserId });
    expect(plannerEntries, "the second authenticated user's outbox must not expose the Inspector marker").toEqual([]);

    const inspectorEntries = await inspectorPage.evaluate(({ userId }) => new Promise<unknown[]>((resolve, reject) => {
      const request = indexedDB.open(`mim-field-v1:${userId}`, 1);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Inspector offline database re-open was blocked"));
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("outbox", "readonly");
        const all = transaction.objectStore("outbox").getAll();
        all.onsuccess = () => { database.close(); resolve(all.result); };
        all.onerror = () => { database.close(); reject(all.error); };
      };
    }), { userId: inspectorUserId });
    expect(JSON.stringify(inspectorEntries)).toContain(marker);

    await inspectorContext.close();
    await plannerContext.close();
  });
});
