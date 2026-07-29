import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  getPlanningReadContract,
  type PlanningSingleReadData,
} from "../src/lib/planning/read-contract";

const repo = path.resolve(process.cwd(), "../..");
const migrationPath = path.join(repo, "supabase/migrations/20260729180000_planning_read_contract.sql");
const singlePagePath = path.join(process.cwd(), "src/app/(app)/planning/single/page.tsx");
const detailPagePath = path.join(process.cwd(), "src/app/(app)/planning/visits/[id]/page.tsx");
const planningRoot = path.join(process.cwd(), "src/app/(app)/planning");

type RpcArgs = {
  p_surface: string;
  p_visit_id: string | null;
  p_correlation_id: string;
};

function client(
  reply: (args: RpcArgs) => { data: unknown; error: null } | {
    data: null;
    error: { code: string; message: string };
  },
) {
  return {
    rpc: async (name: string, args: RpcArgs) => {
      expect(name).toBe("planning_read_contract");
      return reply(args);
    },
  } as never;
}

function plannerReply(name: "Planner One" | "Planner Two") {
  return (args: RpcArgs) => ({
    data: {
      ok: true,
      correlation_id: args.p_correlation_id,
      data: {
        packages: [],
        inspectors: [{ user_id: name === "Planner One" ? "inspector-1" : "inspector-2", full_name: "Authorized Inspector" }],
        virtual_eligible: false,
        can_publish: true,
      },
    },
    error: null,
  } as const);
}

test.describe("DM-006 — canonical Planner read contract", () => {
  test("Planner One resolves the authorized Single Planning path", async () => {
    const result = await getPlanningReadContract<PlanningSingleReadData>(
      client(plannerReply("Planner One")),
      "single",
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.inspectors[0].user_id).toBe("inspector-1");
  });

  test("Planner Two resolves the same authorized contract", async () => {
    const result = await getPlanningReadContract<PlanningSingleReadData>(
      client(plannerReply("Planner Two")),
      "single",
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.inspectors[0].user_id).toBe("inspector-2");
  });

  test("an unauthorized account is denied without a fallback read", async () => {
    const result = await getPlanningReadContract<PlanningSingleReadData>(
      client(args => ({
        data: {
          ok: false,
          code: "PLN-READ-DENIED",
          correlation_id: args.p_correlation_id,
        },
        error: null,
      })),
      "single",
    );
    expect(result).toMatchObject({ ok: false, kind: "denied", code: "PLN-READ-DENIED" });
  });

  test("a missing RPC grant fails closed with a correlated safe code", async () => {
    const originalError = console.error;
    console.error = () => undefined;
    try {
      const result = await getPlanningReadContract<PlanningSingleReadData>(
        client(() => ({
          data: null,
          error: { code: "42501", message: "permission denied for function planning_read_contract" },
        })),
        "single",
      );
      expect(result).toMatchObject({ ok: false, kind: "contract_gap", code: "PLN-READ-GRANT" });
      if (!result.ok) expect(result.correlationId).toMatch(/^[0-9a-f-]{36}$/);
      expect(JSON.stringify(result)).not.toContain("permission denied");
    } finally {
      console.error = originalError;
    }
  });

  test("SQL remains Planner-only, SECURITY INVOKER, RLS-preserving, and least privilege", () => {
    const sql = fs.readFileSync(migrationPath, "utf8").toLowerCase();
    expect(sql).toContain("security invoker");
    expect(sql).not.toContain("security definer");
    expect(sql).toContain("has_internal_role('planner')");
    expect(sql).toContain("has_planning_capability('planning.create.single')");
    expect(sql).toContain("has_planning_capability('planning.view')");
    expect(sql).toContain("when insufficient_privilege or undefined_table or undefined_function or undefined_column");
    expect(sql).toContain("grant execute on function public.planning_read_contract(text, uuid, uuid) to authenticated");
    expect(sql).not.toMatch(/grant\s+select\s+on\s+(?:table\s+)?public\./);
    expect(sql).not.toMatch(/grant\s+all/);
  });

  test("Single and post-schedule detail share the boundary and no Planning screen ships ERR-OPS-001", () => {
    const single = fs.readFileSync(singlePagePath, "utf8");
    const detail = fs.readFileSync(detailPagePath, "utf8");
    expect(single).toContain('getPlanningReadContract<PlanningSingleReadData>(sb, "single")');
    expect(detail).toContain('getPlanningReadContract<{ visit_id: string }>(sb, "visit_detail", id)');
    expect(single).not.toContain('sb.from("package_versions")');
    expect(single).not.toContain('sb.from("user_roles")');
    expect(single).not.toContain('sb.from("engine_settings")');

    const source = fs.readdirSync(planningRoot, { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name))
      .map(entry => fs.readFileSync(path.join(entry.parentPath, entry.name), "utf8"))
      .join("\n");
    expect(source).not.toContain("ERR-OPS-001");
  });
});
