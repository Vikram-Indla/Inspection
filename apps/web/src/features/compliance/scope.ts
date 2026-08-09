import {
  APPROVAL_STEPS,
  LIBRARY_TABS,
  type ApprovalsScope,
  type ApprovalStep,
  type LibraryScope,
  type LibraryTab,
} from "./types";

export type SearchParamsInput = Record<string, string | string[] | undefined>;

function single(input: SearchParamsInput, key: string): string {
  const value = input[key];
  return typeof value === "string" ? value : "";
}

function isLibraryTab(value: string): value is LibraryTab {
  return (LIBRARY_TABS as readonly string[]).includes(value);
}

function isApprovalStep(value: string): value is ApprovalStep {
  return (APPROVAL_STEPS as readonly string[]).includes(value);
}

export function readLibraryScope(input: SearchParamsInput): LibraryScope {
  const rawQuery = single(input, "q");
  const tab = single(input, "tab");
  return {
    routeBase: single(input, "__shellRoute") === "/admin/regulations" ? "/admin/regulations" : "/compliance",
    query: rawQuery.trim().toLowerCase(),
    rawQuery,
    authority: single(input, "authority"),
    status: single(input, "status"),
    selectedId: single(input, "libraryId"),
    tab: isLibraryTab(tab) ? tab : "overview",
  };
}

export function readApprovalsScope(input: SearchParamsInput): ApprovalsScope {
  const requestId = single(input, "request");
  const step = single(input, "step");
  return {
    routeBase: single(input, "__shellRoute") === "/admin/compliance-approvals"
      ? "/admin/compliance-approvals"
      : "/compliance/approvals",
    requestId: requestId || null,
    step: isApprovalStep(step) ? step : "overview",
  };
}

export function libraryHref(scope: LibraryScope, overrides: Partial<Record<"q" | "authority" | "status" | "libraryId" | "tab", string | null>>): string {
  const params = new URLSearchParams();
  const merged = {
    q: overrides.q === undefined ? scope.rawQuery : overrides.q,
    authority: overrides.authority === undefined ? scope.authority : overrides.authority,
    status: overrides.status === undefined ? scope.status : overrides.status,
    libraryId: overrides.libraryId === undefined ? scope.selectedId : overrides.libraryId,
    tab: overrides.tab === undefined ? (scope.tab === "overview" ? "" : scope.tab) : overrides.tab,
  };
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }
  const search = params.toString();
  return search ? `${scope.routeBase}?${search}` : scope.routeBase;
}

export function approvalsHref(scope: ApprovalsScope, overrides: Partial<Record<"request" | "step", string | null>>): string {
  const params = new URLSearchParams();
  const merged = {
    request: overrides.request === undefined ? scope.requestId : overrides.request,
    step: overrides.step === undefined ? (scope.step === "overview" ? "" : scope.step) : overrides.step,
  };
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }
  const search = params.toString();
  return search ? `${scope.routeBase}?${search}` : scope.routeBase;
}
