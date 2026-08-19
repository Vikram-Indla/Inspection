import { supabaseServer } from "@/lib/supabase-server";
import type { CommandRow, DeviceRow, DevicesView } from "./types";

export async function loadDevices(): Promise<DevicesView> {
  const sb = await supabaseServer();
  const [devicesRead, commandsRead] = await Promise.all([
    sb.from("mvp3_devices")
      .select("id,device_identifier,platform,assigned_user_id,trust_status,mdm_reference,last_seen_at,enrolled_at")
      .order("enrolled_at", { ascending: false }),
    sb.from("mvp3_device_commands")
      .select("id,device_id,command,status,reason,requested_at,completed_at")
      .order("requested_at", { ascending: false }).limit(30),
  ]);

  const devices = (devicesRead.data ?? []) as DeviceRow[];

  return {
    devices,
    commands: (commandsRead.data ?? []) as CommandRow[],
    trustedCount: devices.filter(row => row.trust_status === "trusted").length,
    devicesError: Boolean(devicesRead.error),
    commandsError: Boolean(commandsRead.error),
  };
}
