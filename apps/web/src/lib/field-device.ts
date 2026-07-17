// TASK-IPAD-M04-DEVICE-ETA-OVERRIDE-001 · MVP1-M04-012 · AC-0125
// Browser APIs cannot expose a trustworthy hardware serial number. The field
// client therefore records a stable per-install identifier and labels the OS
// value as browser-reported instead of pretending it is authoritative MDM data.

export type FieldDeviceMetadata = {
  deviceId: string;
  osVersion: string;
  applicationVersion: string;
};

const DEVICE_ID_KEY = "mim.field.device-id.v1";
let memoryDeviceId: string | null = null;

function newDeviceId(): string {
  const random = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `field-${random}`;
}

function stableDeviceId(): string {
  if (memoryDeviceId) return memoryDeviceId;
  try {
    const existing = globalThis.localStorage?.getItem(DEVICE_ID_KEY);
    if (existing) return (memoryDeviceId = existing);
    const created = newDeviceId();
    globalThis.localStorage?.setItem(DEVICE_ID_KEY, created);
    return (memoryDeviceId = created);
  } catch {
    return (memoryDeviceId = newDeviceId());
  }
}

export function browserReportedOsVersion(nav: Pick<Navigator, "userAgent" | "platform" | "maxTouchPoints">): string {
  const ua = nav.userAgent || "";
  const ios = ua.match(/OS (\d+(?:[_\.]\d+)*) like Mac OS X/i);
  const ipad = /iPad/i.test(ua) || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
  if (ipad) return `iPadOS ${ios?.[1]?.replaceAll("_", ".") ?? "version unavailable"} (browser-reported)`;

  const iphone = /iPhone|iPod/i.test(ua);
  if (iphone) return `iOS ${ios?.[1]?.replaceAll("_", ".") ?? "version unavailable"} (browser-reported)`;

  const android = ua.match(/Android\s+([\d.]+)/i);
  if (android) return `Android ${android[1]} (browser-reported)`;

  const windows = ua.match(/Windows NT\s+([\d.]+)/i);
  if (windows) return `Windows NT ${windows[1]} (browser-reported)`;

  const mac = ua.match(/Mac OS X\s+([\d_\.]+)/i);
  if (mac) return `macOS ${mac[1].replaceAll("_", ".")} (browser-reported)`;

  const linux = /Linux/i.test(ua);
  if (linux) return "Linux version unavailable (browser-reported)";
  return `${nav.platform || "Unknown OS"} version unavailable (browser-reported)`;
}

export function getFieldDeviceMetadata(applicationVersion: string): FieldDeviceMetadata {
  return {
    deviceId: stableDeviceId(),
    osVersion: browserReportedOsVersion(navigator),
    applicationVersion,
  };
}
