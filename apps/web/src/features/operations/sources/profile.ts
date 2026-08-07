import type { OperationsClient } from "./client-type";

export async function loadAuthorizedScope(sb: OperationsClient, userId: string): Promise<string> {
  const { data } = await sb.from("profiles").select("region").eq("user_id", userId).maybeSingle();
  return data?.region?.trim() ?? "";
}
