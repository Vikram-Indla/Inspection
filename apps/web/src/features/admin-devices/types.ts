export type DeviceRow = {
  id: string;
  device_identifier: string;
  platform: string;
  assigned_user_id: string | null;
  trust_status: string;
  mdm_reference: string | null;
  last_seen_at: string | null;
  enrolled_at: string;
};

export type CommandRow = {
  id: string;
  device_id: string;
  command: string;
  status: string;
  reason: string | null;
  requested_at: string;
  completed_at: string | null;
};

export type DevicesView = {
  devices: readonly DeviceRow[];
  commands: readonly CommandRow[];
  trustedCount: number;
  devicesError: boolean;
  commandsError: boolean;
};
