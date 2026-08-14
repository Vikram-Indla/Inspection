import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { getUserRoles } from "@/lib/persona";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import type { Locale } from "@/lib/i18n";
import { parseExecutionWorkspaceRead } from "@/app/(app)/execution/read-model";
import type { ExecutionRow } from "./types";

const READ_ROLES = new Set(["inspector", "planner", "supervisor", "admin"]);
const ROW_LIMIT = 1000;

export type ExecutionLoad =
  | { kind: "unauthenticated" }
  | { kind: "denied" }
  | { kind: "unavailable" }
  | { kind: "unverified" }
  | {
      kind: "ready";
      rows: ExecutionRow[];
      currentUserId: string;
      totalVisibleRows: number;
      omittedRows: number;
    };

export async function loadExecution(locale: Locale): Promise<ExecutionLoad> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return { kind: "unauthenticated" };

  const [roles, payload] = await Promise.all([
    getUserRoles(user.id),
    sb.rpc("execution_workspace_read" as never, { p_limit: ROW_LIMIT } as never),
  ]);

  const roleKeys = (roles.data ?? []).map(row => row.role_key);
  if (!roles.error && !roleKeys.some(role => READ_ROLES.has(role))) return { kind: "denied" };
  if (roles.error || payload.error) return { kind: "unavailable" };

  const read = parseExecutionWorkspaceRead(payload.data, locale);
  if (read.status === "invalid") return { kind: "unverified" };

  return {
    kind: "ready",
    rows: read.rows.filter(row => !isTestFixtureEstablishment({
      name: row.factory,
      factory_code: row.factoryCode,
    })),
    currentUserId: user.id,
    totalVisibleRows: read.visibleCount,
    omittedRows: read.omittedRows,
  };
}
