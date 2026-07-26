"use server";

import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import type { DeviceTrustStatus } from "../actions";

// Device register READ for the field Trusted Devices route.
//
// `SAQEEL PWA-Field Trusted Devices.dc.html` renders a LIST of the inspector's
// enrolled devices, not a single card. That list is genuinely readable: policy
// `mvp3_devices_read` (migration 20260718150000, line 425) permits
// `assigned_user_id = auth.uid()`, so every row this returns is one the
// database itself agreed to release. The explicit `.eq("assigned_user_id", …)`
// below is NOT the authorization — RLS is — it is required because that same
// policy also releases every device in the estate to `ops`, `security_admin`
// and `auditor`. Without the filter an Operations user opening their own field
// settings would see the whole fleet on a personal screen.
//
// There is deliberately no write here. `mvp3_devices` has no UPDATE and no
// DELETE policy at all; trust transitions exist only inside
// `mvp3_issue_device_command` (SECURITY DEFINER, ops/security_admin), which
// this route cannot call. Enrolment insert lives in `../actions.ts`.

export type FieldDeviceListRow = {
  deviceIdentifier: string;
  /** `mvp3_devices.display_name` — nullable by design (migration
   *  20260726150000). Null means no name is known, and the UI must render
   *  nothing rather than a plausible model string. */
  displayName: string | null;
  trustStatus: DeviceTrustStatus;
  platform: "ipad_os" | "web_managed";
  lastSeenAt: string | null;
  enrolledAt: string;
};

export type FieldDeviceListResult =
  | { kind: "ok"; devices: FieldDeviceListRow[] }
  | { kind: "signed_out" }
  | { kind: "unavailable" };

type Row = {
  device_identifier: string;
  display_name: string | null;
  trust_status: DeviceTrustStatus;
  platform: "ipad_os" | "web_managed";
  last_seen_at: string | null;
  enrolled_at: string;
};

const COLUMNS = "device_identifier,display_name,trust_status,platform,last_seen_at,enrolled_at";

export async function listFieldDevices(): Promise<FieldDeviceListResult> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return { kind: "signed_out" };

  const { data, error } = await sb
    .from("mvp3_devices")
    .select(COLUMNS)
    .eq("assigned_user_id", user.id)
    .order("enrolled_at", { ascending: false });

  if (error) {
    // A failed read is reported as a failed read. No row is invented and no
    // trust is inferred from the absence of data.
    console.error("[field device list]", error.code, error.message);
    return { kind: "unavailable" };
  }

  return {
    kind: "ok",
    devices: ((data ?? []) as Row[]).map(r => ({
      deviceIdentifier: r.device_identifier,
      // Blank-but-present names are treated as unknown, never rendered as an
      // empty bold line.
      displayName: r.display_name?.trim() ? r.display_name.trim() : null,
      trustStatus: r.trust_status,
      platform: r.platform,
      lastSeenAt: r.last_seen_at,
      enrolledAt: r.enrolled_at,
    })),
  };
}
