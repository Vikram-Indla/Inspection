export const APPROVAL_ALIAS_ROUTE = "/admin/compliance-approvals";
export const APPROVAL_ROUTE = "/compliance/approvals";

export const APPROVAL_STEPS = ["overview", "regulation", "inspection_item", "violation", "penalty", "summary"] as const;
export type ApprovalStep = (typeof APPROVAL_STEPS)[number];

export const APPROVAL_VIEWS = ["pending", "partial", "publish"] as const;
export type ApprovalView = (typeof APPROVAL_VIEWS)[number];

export const VIEW_STATUSES: Readonly<Record<ApprovalView, readonly string[]>> = {
  pending: ["pending_review"],
  partial: ["partially_approved"],
  publish: ["approved"],
};

export type ApprovalScopeInput = Record<string, string | string[] | undefined>;

export type ApprovalScope = {
  readonly routeBase: string;
  readonly requestId: string;
  readonly step: ApprovalStep;
  readonly view: ApprovalView | "";
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

const isStep = (value: string): value is ApprovalStep => (APPROVAL_STEPS as readonly string[]).includes(value);
const isView = (value: string): value is ApprovalView => (APPROVAL_VIEWS as readonly string[]).includes(value);

/**
 * `/admin/compliance-approvals` is rewritten to `/compliance/approvals` by the
 * middleware, which passes the typed path in `__shellRoute`. Links are rebased
 * on whichever the reviewer actually used.
 *
 * `view` is honoured here because the admin home links to
 * `/admin/compliance-approvals?view=pending`; the rewrite carried the parameter
 * through but nothing ever read it, so that filter silently did nothing.
 */
export function readApprovalScope(input: ApprovalScopeInput): ApprovalScope {
  const step = first(input.step);
  const view = first(input.view);
  return {
    routeBase: first(input.__shellRoute) === APPROVAL_ALIAS_ROUTE ? APPROVAL_ALIAS_ROUTE : APPROVAL_ROUTE,
    requestId: first(input.request).trim(),
    step: isStep(step) ? step : "overview",
    view: isView(view) ? view : "",
  };
}

export function approvalHref(scope: ApprovalScope, overrides: Partial<ApprovalScope>): string {
  const next = { ...scope, ...overrides };
  const query = new URLSearchParams();
  if (next.view) query.set("view", next.view);
  if (next.requestId) query.set("request", next.requestId);
  if (next.requestId && next.step !== "overview") query.set("step", next.step);
  const suffix = query.toString();
  return suffix ? `${scope.routeBase}?${suffix}` : scope.routeBase;
}
