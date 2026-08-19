import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const migrationPath = "../../supabase/migrations/20260723090200_mvp3_devices_self_enroll_insert.sql";
const migration = src(migrationPath);
const originalControlPlane = src("../../supabase/migrations/20260718150000_mvp3_enterprise_control_plane.sql");
const actions = src("src/app/(app)/field/settings/actions.ts");
const client = src("src/components/sections/field-settings/settings-panels.tsx");
const settingsCopy = src("src/i18n/locales/en/field-settings.json");
const devicesPage = src("src/app/(app)/field/settings/devices/page.tsx");
const devicesClient = src("src/app/(app)/field/settings/devices/TrustedDevicesClient.tsx");

test.describe("PLAN v7 item 3 Field Settings + Trusted Devices contract", () => {
  test("adds only the exact additive pending-device insert policy", () => {
    expect(migration.trim()).toBe(`create policy mvp3_devices_self_enroll_insert on public.mvp3_devices for insert to authenticated
  with check (
    assigned_user_id = (select auth.uid())
    and enrolled_by = (select auth.uid())
    and trust_status = 'pending'
    and mdm_reference is null
    and app_version_compliant = false
    and last_seen_at is null
    and platform = 'ipad_os'
  );`);

    // Negative cross-user proof at the RLS authority: both identity-bearing
    // columns must equal the requesting JWT subject. No OR branch can admit a
    // row assigned to or enrolled by another user.
    expect(migration).toContain("assigned_user_id = (select auth.uid())");
    expect(migration).toContain("enrolled_by = (select auth.uid())");
    expect(migration).not.toMatch(/assigned_user_id\s*=.*\bor\b/i);
    expect(migration).not.toMatch(/enrolled_by\s*=.*\bor\b/i);
  });

  test("server enrollment hardcodes the exact allowed columns and has no overwrite path", () => {
    const insert = actions.match(/\.insert\(\{([\s\S]*?)\}\)\s*\.select/)?.[1] ?? "";
    expect(insert).toContain("assigned_user_id: user.id");
    expect(insert).toContain("enrolled_by: user.id");
    expect(insert).toContain('trust_status: "pending"');
    expect(insert).toContain("mdm_reference: null");
    expect(insert).toContain("app_version_compliant: false");
    expect(insert).toContain("last_seen_at: null");
    expect(insert).toContain('platform: "ipad_os"');
    expect(insert).toContain("device_identifier: deviceIdentifier");

    const keys = [...insert.matchAll(/^\s{6}([a-z_]+):/gm)].map(match => match[1]).sort();
    expect(keys).toEqual([
      "app_version_compliant",
      "assigned_user_id",
      "device_identifier",
      "enrolled_by",
      "last_seen_at",
      "mdm_reference",
      "platform",
      "trust_status",
    ]);
    expect(actions).not.toContain(".upsert(");
    expect(actions).not.toContain(".update(");
    expect(actions).not.toContain("FormData");
  });

  test("app_version_compliant=false and ipad_os remain load-bearing on both layers", () => {
    expect(migration).toContain("app_version_compliant = false");
    expect(migration).toContain("platform = 'ipad_os'");
    expect(actions).toContain("app_version_compliant: false");
    expect(actions).toContain('platform: "ipad_os"');
    expect(originalControlPlane).toMatch(/elsif not v_device\.app_version_compliant then v_outcome := 'denied_app_version'/);
  });

  test("pending is never presented as trusted and collisions are explicit", () => {
    expect(devicesClient).toContain('case "pending"');
    expect(devicesPage).toContain('"Pending approval"');
    expect(devicesPage).toContain('"Pending approval — this device is not trusted yet."');
    expect(devicesClient).toContain('case "trusted"');
    expect(devicesPage).toContain('"The backend device register currently grants trusted status."');
    expect(devicesClient).toContain('case "identifier_collision"');
    expect(devicesPage).toContain('"Identifier already registered"');
    expect(devicesPage).toContain('"Already registered. Pending approval — this device is not trusted yet. Nothing was overwritten."');
    expect(devicesClient).toContain("data-trust-status={d.trustStatus}");
    expect(devicesClient).toContain('const trusted = currentStatus === "trusted"');
    expect(actions).toContain('kind: "identifier_collision"');
    expect(actions).toContain('present("already_registered", existing.row)');
  });

  test("settings reuse persisted controls and expose only read-only offline state", () => {
    expect(client).toContain('import ThemeToggle from "@/components/ThemeToggle"');
    expect(client).toContain('href="/locale?set=en"');
    expect(client).toContain('href="/locale?set=ar"');
    expect(client).toContain("localForUser");
    expect(client).toContain("export default function SettingsPanels({");
    expect(client).toContain("appVersion,");
    expect(client).toContain("local.peekAll()");
    expect(client).toContain("local.conflicts()");
    expect(client).not.toContain("local.remove(");
    expect(client).not.toContain("local.resolveConflict(");
    expect(client).not.toMatch(/indexedDB\.deleteDatabase|localStorage\.clear|\.clear\(\)/);
    expect(client).toContain("copy.data.clearCache");
    expect(settingsCopy).toContain('"Clear cache"');
    expect(client).toContain("note={notConfigured}");
  });

  test("the existing Ops/Security policy and control-plane enrollment source remain intact", () => {
    expect(originalControlPlane).toContain("create policy mvp3_devices_insert on public.mvp3_devices for insert to authenticated");
    expect(originalControlPlane).toContain("((select has_role('ops')) or (select has_role('security_admin')))");
    expect(originalControlPlane).not.toContain("mvp3_devices_self_enroll_insert");

    const adminDevices = src("src/app/(app)/admin/devices/page.tsx");
    const adminActions = src("src/app/(app)/admin/devices/actions.ts");
    expect(adminActions).toContain("issueDeviceCommand");
    expect(adminActions).toContain('revalidatePath("/admin/devices")');
    expect(adminActions).toContain('sb.rpc("mvp3_issue_device_command"');
    expect(adminDevices).not.toContain("selfEnrollFieldDevice");
    expect(adminActions).not.toContain("selfEnrollFieldDevice");
  });
});
