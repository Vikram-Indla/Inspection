import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PERSONAS } from "./personas";

// Shared-database mutation is deliberately opt-in. Run only after the additive
// migration is approved/applied: RUN_FIELD_SETTINGS_RLS_LIVE=1.
test.skip(process.env.RUN_FIELD_SETTINGS_RLS_LIVE !== "1", "requires approved applied DDL and isolated live-fixture cleanup");
test.describe.configure({ mode: "serial" });

const generatedIds: string[] = [];

function liveEnvironment() {
  const env = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
  const base = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1].trim();
  const anon = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1].trim();
  const service = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1].trim();
  if (!base || !anon) throw new Error("live RLS credentials unavailable");
  return { base, anon, service };
}

async function login(email: string, password: string) {
  const { base, anon } = liveEnvironment();
  const response = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`live RLS auth failed: ${response.status} ${await response.text()}`);
  const body = await response.json() as { access_token: string; user: { id: string } };
  return { jwt: body.access_token, userId: body.user.id };
}

async function rest<T = unknown>(method: string, path: string, jwt: string, body?: unknown) {
  const { base, anon } = liveEnvironment();
  const response = await fetch(`${base}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: anon,
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await response.text();
  return response.ok
    ? { data: (raw ? JSON.parse(raw) : null) as T | null, error: null }
    : { data: null, error: `${response.status} ${raw.slice(0, 220)}` };
}

async function cleanup() {
  if (!generatedIds.length) return;
  const { base, service } = liveEnvironment();
  if (!base || !service) throw new Error("live RLS cleanup credentials unavailable");
  const filter = generatedIds.map(encodeURIComponent).join(",");
  const response = await fetch(`${base}/rest/v1/mvp3_devices?device_identifier=in.(${filter})`, {
    method: "DELETE",
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
  if (!response.ok) throw new Error(`live RLS cleanup failed: ${response.status} ${await response.text()}`);
}

test.afterAll(cleanup);

test("self-enrollment succeeds only for self while cross-user and self-serving values fail RLS", async () => {
  const [inspector, planner] = await Promise.all([
    login(PERSONAS.inspector.email, PERSONAS.inspector.password),
    login(PERSONAS.planner.email, PERSONAS.planner.password),
  ]);

  const ownId = `field-${randomUUID()}`;
  generatedIds.push(ownId);
  const own = await rest("POST", "mvp3_devices", inspector.jwt, {
    assigned_user_id: inspector.userId,
    enrolled_by: inspector.userId,
    trust_status: "pending",
    mdm_reference: null,
    app_version_compliant: false,
    last_seen_at: null,
    platform: "ipad_os",
    device_identifier: ownId,
  });
  expect(own.error).toBeNull();

  const ownRead = await rest<{
    assigned_user_id: string;
    enrolled_by: string;
    trust_status: string;
    mdm_reference: string | null;
    app_version_compliant: boolean;
    last_seen_at: string | null;
    platform: string;
  }[]>("GET", `mvp3_devices?device_identifier=eq.${encodeURIComponent(ownId)}&select=assigned_user_id,enrolled_by,trust_status,mdm_reference,app_version_compliant,last_seen_at,platform`, inspector.jwt);
  expect(ownRead.error).toBeNull();
  expect(ownRead.data).toEqual([{
    assigned_user_id: inspector.userId,
    enrolled_by: inspector.userId,
    trust_status: "pending",
    mdm_reference: null,
    app_version_compliant: false,
    last_seen_at: null,
    platform: "ipad_os",
  }]);

  const forbiddenRows = [
    { assigned_user_id: planner.userId },
    { trust_status: "trusted", mdm_reference: "self-asserted", app_version_compliant: true },
    { app_version_compliant: true },
    { mdm_reference: "self-asserted" },
    { last_seen_at: new Date().toISOString() },
    { platform: "web_managed" },
  ];

  for (const override of forbiddenRows) {
    const id = `field-${randomUUID()}`;
    generatedIds.push(id);
    const denied = await rest("POST", "mvp3_devices", inspector.jwt, {
      assigned_user_id: inspector.userId,
      enrolled_by: inspector.userId,
      trust_status: "pending",
      mdm_reference: null,
      app_version_compliant: false,
      last_seen_at: null,
      platform: "ipad_os",
      device_identifier: id,
      ...override,
    });
    expect(denied.error, JSON.stringify(override)).not.toBeNull();
  }
});

test("the pre-existing Ops enrollment path still admits a managed device", async () => {
  const [ops, inspector] = await Promise.all([
    login(PERSONAS.ops.email, PERSONAS.ops.password),
    login(PERSONAS.inspector.email, PERSONAS.inspector.password),
  ]);
  const id = `ops-managed-${randomUUID()}`;
  generatedIds.push(id);
  const enrolled = await rest("POST", "mvp3_devices", ops.jwt, {
    assigned_user_id: inspector.userId,
    enrolled_by: ops.userId,
    trust_status: "pending",
    mdm_reference: "ops-fixture",
    app_version_compliant: false,
    last_seen_at: null,
    platform: "web_managed",
    device_identifier: id,
  });
  expect(enrolled.error).toBeNull();
});
