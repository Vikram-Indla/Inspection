import type { AdminGisMessages } from "@/features/admin-gis/strings";

export function spatialResultMessage(code: string, strings: AdminGisMessages): string {
  const map: Record<string, string> = strings.spatial.result;
  return map[code] ?? code;
}
