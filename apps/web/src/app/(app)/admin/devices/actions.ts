"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { logProviderError } from "@/lib/neutral-error";

export type DeviceResult = { ok?: boolean; error?: string; notice?: string };

const GOVERNED_COMMANDS = ["suspend", "resume", "remote_wipe", "expire_packages"];

function mapError(error: { message?: string; code?: string }): string {
  logProviderError("admin issue_device_command", error);
  const message = String(error.message ?? "");
  if (error.code === "42501" || message.includes("not authorized")) return "not_authorized";
  if (message.includes("device not found")) return "device_not_found";
  if (message.includes("invalid command or reason")) return "invalid";
  return "write_failed";
}

export async function issueDeviceCommand(_: DeviceResult, data: FormData): Promise<DeviceResult> {
  const deviceId = String(data.get("deviceId") ?? "").trim();
  const command = String(data.get("command") ?? "").trim();
  const reason = String(data.get("reason") ?? "").trim();
  if (!deviceId || !GOVERNED_COMMANDS.includes(command) || reason.length < 8) return { error: "invalid_request" };

  const sb = await supabaseServer();
  const { data: { user } } = await getVerifiedUser(sb);
  if (!user) return { error: "session_expired" };

  const { error } = await sb.rpc("mvp3_issue_device_command", { p_device_id: deviceId, p_command: command, p_reason: reason });
  if (error) return { error: mapError(error) };
  revalidatePath("/admin/devices");
  return { ok: true, notice: "queued" };
}
