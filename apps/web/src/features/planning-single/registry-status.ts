import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";

const REGISTRY_TONES: Readonly<Record<string, StatusTone>> = {
  active: "success",
};

export const registryStatusTone = (status: string): StatusTone =>
  REGISTRY_TONES[status.trim().toLowerCase()] ?? "neutral";
