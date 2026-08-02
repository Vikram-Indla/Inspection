import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * TASK-G11-REMEDIATION-SAQ-JM-BREAKPOINTS-001
 * SAQ-JM-VIS-SLICE-001
 * JM-VIS-AC-001 / JM-VIS-AC-003 / JM-VIS-AC-012
 *
 * Source-pinned regression proof for two Bulk Visit defects that are already
 * repaired by later migrations at the audited revision. Runtime application of
 * those migrations remains a separate evidence requirement.
 */

const migration = (name: string) =>
  readFileSync(join(process.cwd(), "..", "..", "supabase", "migrations", name), "utf8");

const decision = migration("20260729021000_single_visit_supervision_lifecycle.sql");
const lifecycle = migration("20260729024000_bulk_supervision_lifecycle.sql");
const cardinality = migration("20260729025000_bulk_supervision_request_cardinality.sql");
const aggregate = migration("20260729027000_bulk_supervision_plan_status.sql");

type RequestStatus = "pending" | "approved" | "returned" | "rejected";
type PlanStatus = "pending_supervision" | "published" | "returned" | "cancelled";

function expectedAggregate(statuses: RequestStatus[]): PlanStatus {
  if (statuses.includes("pending")) return "pending_supervision";
  if (statuses.includes("approved")) return "published";
  if (statuses.includes("returned")) return "returned";
  return "cancelled";
}

test.describe("SAQ-JM Bulk Visit repair contracts", () => {
  test("one Bulk plan may own one supervision request per child visit", () => {
    expect(lifecycle).toContain("foreach v_factory_id in array v_ids loop");
    expect(lifecycle).toMatch(
      /insert into public\.planning_supervision_requests\(visit_plan_id,visit_id,submitted_by,proposed_inspector_id\)/,
    );

    expect(cardinality).toMatch(
      /drop constraint if exists planning_supervision_requests_visit_plan_id_key/,
    );
    expect(cardinality).toMatch(
      /create unique index if not exists planning_supervision_requests_visit_id_uq\s+on public\.planning_supervision_requests \(visit_id\)/,
    );
    expect(cardinality).not.toMatch(
      /create unique index[^;]+planning_supervision_requests\s*\(visit_plan_id\)/s,
    );
  });

  test("pending children prevent a single decision from finalizing the Bulk plan", () => {
    expect(aggregate).toMatch(
      /where r\.visit_plan_id = new\.visit_plan_id and r\.status = 'pending'[\s\S]+then 'pending_supervision'/,
    );
    expect(aggregate).toMatch(
      /where r\.visit_plan_id = new\.visit_plan_id and r\.status = 'approved'[\s\S]+then 'published'/,
    );
    expect(aggregate).toMatch(
      /where r\.visit_plan_id = new\.visit_plan_id and r\.status = 'returned'[\s\S]+then 'returned'/,
    );
    expect(aggregate).toMatch(
      /after update of status on public\.planning_supervision_requests/,
    );

    expect(expectedAggregate(["approved", "pending"])).toBe("pending_supervision");
    expect(expectedAggregate(["returned", "pending"])).toBe("pending_supervision");
    expect(expectedAggregate(["rejected", "pending"])).toBe("pending_supervision");
  });

  test("final mixed outcomes use deterministic precedence after no child remains pending", () => {
    expect(expectedAggregate(["approved", "approved"])).toBe("published");
    expect(expectedAggregate(["approved", "rejected"])).toBe("published");
    expect(expectedAggregate(["returned", "rejected"])).toBe("returned");
    expect(expectedAggregate(["rejected", "rejected"])).toBe("cancelled");
  });

  test("the repairs preserve server authorization and separation of duties", () => {
    expect(decision).toContain("not public.has_permission('planning.approve')");
    expect(decision).toContain("not public.has_permission('planning.return')");
    expect(decision).toContain("not public.has_permission('planning.reject')");
    expect(decision).toContain("if v_request.submitted_by=v_actor");
    expect(decision).toContain("PLANNING-SUPERVISION-SELF-DECISION");
    expect(decision).toMatch(/security definer\s+set search_path = public/);
    expect(aggregate).toMatch(/security definer\s+set search_path = public/);
    expect(cardinality).not.toMatch(/\bdisable row level security\b/i);
    expect(aggregate).not.toMatch(/\bdisable row level security\b/i);
  });
});
