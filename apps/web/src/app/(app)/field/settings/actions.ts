"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

export type DeviceTrustStatus =
  | "pending"
  | "trusted"
  | "suspended"
  | "revoked"
  | "wipe_pending"
  | "wiped";

export type FieldDeviceEnrollmentResult =
  | { kind: "not_enrolled"; deviceIdentifier: string }
  | {
      kind: "already_registered" | "enrolled";
      deviceIdentifier: string;
      trustStatus: DeviceTrustStatus;
      platform: "ipad_os" | "web_managed";
      appVersionCompliant: boolean;
      mdmReference: string | null;
      lastSeenAt: string | null;
      enrolledAt: string;
    }
  | { kind: "identifier_collision"; deviceIdentifier: string }
  | { kind: "signed_out" | "invalid_identifier" | "unavailable" | "policy_pending"; deviceIdentifier: string };

type DeviceRow = {
  device_identifier: string;
  trust_status: DeviceTrustStatus;
  platform: "ipad_os" | "web_managed";
  app_version_compliant: boolean;
  mdm_reference: string | null;
  last_seen_at: string | null;
  enrolled_at: string;
};

// field-device.ts owns this value. Accept only its stable per-install format;
// no JSON/form payload or security-relevant enrollment field crosses the client boundary.
function validDeviceIdentifier(value: string): boolean {
  return /^field-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function present(kind: "already_registered" | "enrolled", row: DeviceRow): FieldDeviceEnrollmentResult {
  return {
    kind,
    deviceIdentifier: row.device_identifier,
    trustStatus: row.trust_status,
    platform: row.platform,
    appVersionCompliant: row.app_version_compliant,
    mdmReference: row.mdm_reference,
    lastSeenAt: row.last_seen_at,
    enrolledAt: row.enrolled_at,
  };
}

async function readOwnDevice(
  deviceIdentifier: string,
): Promise<{ row: DeviceRow | null; unavailable: boolean }> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return { row: null, unavailable: false };

  const { data, error } = await sb
    .from("mvp3_devices")
    .select("device_identifier,trust_status,platform,app_version_compliant,mdm_reference,last_seen_at,enrolled_at")
    .eq("device_identifier", deviceIdentifier)
    .eq("assigned_user_id", user.id)
    .maybeSingle();
  if (error) {
    console.error("[field device status]", error.code, error.message);
    return { row: null, unavailable: true };
  }
  return { row: (data as DeviceRow | null) ?? null, unavailable: false };
}

export async function readFieldDeviceEnrollment(
  deviceIdentifier: string,
): Promise<FieldDeviceEnrollmentResult> {
  if (!validDeviceIdentifier(deviceIdentifier)) return { kind: "invalid_identifier", deviceIdentifier };

  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return { kind: "signed_out", deviceIdentifier };

  const { data, error } = await sb
    .from("mvp3_devices")
    .select("device_identifier,trust_status,platform,app_version_compliant,mdm_reference,last_seen_at,enrolled_at")
    .eq("device_identifier", deviceIdentifier)
    .eq("assigned_user_id", user.id)
    .maybeSingle();
  if (error) {
    console.error("[field device status]", error.code, error.message);
    return { kind: "unavailable", deviceIdentifier };
  }
  return data
    ? present("already_registered", data as DeviceRow)
    : { kind: "not_enrolled", deviceIdentifier };
}

export async function selfEnrollFieldDevice(
  deviceIdentifier: string,
): Promise<FieldDeviceEnrollmentResult> {
  if (!validDeviceIdentifier(deviceIdentifier)) return { kind: "invalid_identifier", deviceIdentifier };

  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return { kind: "signed_out", deviceIdentifier };

  // PLAN v7 item 3: these are the ONLY inserted columns. Every security value
  // is server-derived/hardcoded; the client supplies no arbitrary enrollment payload.
  const { data, error } = await sb
    .from("mvp3_devices")
    .insert({
      assigned_user_id: user.id,
      enrolled_by: user.id,
      trust_status: "pending",
      mdm_reference: null,
      app_version_compliant: false,
      last_seen_at: null,
      platform: "ipad_os",
      device_identifier: deviceIdentifier,
    })
    .select("device_identifier,trust_status,platform,app_version_compliant,mdm_reference,last_seen_at,enrolled_at")
    .single();

  if (!error && data) {
    revalidatePath("/field/settings");
    return present("enrolled", data as DeviceRow);
  }

  const duplicate = error?.code === "23505" || /duplicate|unique/i.test(error?.message ?? "");
  if (duplicate) {
    // Never overwrite. If RLS exposes an existing row assigned to this user,
    // report its real backend trust state. Otherwise report a privacy-safe collision.
    const existing = await readOwnDevice(deviceIdentifier);
    if (existing.row) return present("already_registered", existing.row);
    if (existing.unavailable) return { kind: "unavailable", deviceIdentifier };
    return { kind: "identifier_collision", deviceIdentifier };
  }

  // 42501 = insufficient_privilege — the self-enroll RLS policy (PLAN v7 item 3,
  // migration 20260723090200) is not yet applied in this environment. This is a
  // real, distinct, expected-until-deployed state, not "the register could not be
  // read" — that message would wrongly suggest the read path is broken.
  const policyPending = error?.code === "42501" || /row-level security|policy/i.test(error?.message ?? "");
  if (policyPending) {
    console.error("[field device enroll] self-enroll policy not yet applied", error?.code, error?.message);
    return { kind: "policy_pending", deviceIdentifier };
  }

  console.error("[field device enroll]", error?.code, error?.message);
  return { kind: "unavailable", deviceIdentifier };
}
