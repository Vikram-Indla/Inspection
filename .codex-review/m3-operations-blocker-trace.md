# M3 Operations Center — Exact Functional Module Blockers

> Branch: `codex/m3-operations-reconciliation`  
> Module: `/operations` (Operations Center + Live Operations)  
> Date: 2026-07-25  
> Scope: Independent trace of all reachable M3 module paths per module-recovery protocol.

---

## 1. Shared Shell Navigation Role-Check Gap — CONFIRMED BLOCKER

### Root Cause
`buildShellNavigation()` in `@/lib/shell-navigation.ts` unconditionally marks every `visibility: "business"` nav item as `enabled: true` (line 235):

```ts
enabled: item.visibility === "business" || allowed,
```

The `operations-center` item is declared with `visibility: "business"` and `roles: businessRoles`, where `businessRoles` includes **all admin roles** (`ADMIN_ROLE_KEYS`). Consequently, an admin-only persona (e.g. `security_admin`, `compliance_admin`) receives `enabled: true` for Operations Center in the shared shell.

### Why This Breaks the Route Guard
Both `/operations/page.tsx` and `/operations/live/page.tsx` derive their direct-route authorization solely from `buildShellNavigation`:

```ts
const operationsDestination = buildShellNavigation(routeRoleKeys)
  .flatMap(g => g.items)
  .find(item => item.href === "/operations");
const mayViewOperations = operationsDestination?.enabled === true;
```

Because the shell says `enabled: true` for any business-role holder (including admins), the route guard **fails to deny admin-only personas**.

### Fix Applied (Operations Module Only)
Added an independent operational-role check in both route pages, using the **already-exported** constants `BUSINESS_ROLE_KEYS` and `FIELD_CHANNEL_ROLE_KEYS` from `shell-navigation.ts` (no new permissions invented, no shared-shell edit):

```ts
const webBusinessRoles = BUSINESS_ROLE_KEYS.filter(
  role => !(FIELD_CHANNEL_ROLE_KEYS as readonly string[]).includes(role)
);
const hasOperationalRole = routeRoleKeys.some(role => webBusinessRoles.includes(role));
const mayViewOperations = operationsDestination?.enabled === true && hasOperationalRole;
```

This narrows the boundary to `planner | reviewer | ops | leadership` (web business roles only), excluding admin-only personas.

### Files Changed
- `apps/web/src/app/(app)/operations/page.tsx`
- `apps/web/src/app/(app)/operations/live/page.tsx`

---

## 2. Region Scoping — CLEAR

- `profiles.region` read via `resolveRegionId()` normalization.
- `inAuthorizedGeography()` filters visits, factories, override queue, and cancellation queue.
- Unassigned region (`authorizedRegionId === null`) preserves national visibility per RBAC-008.
- **No blocker.**

---

## 3. Out-of-Region Exclusion — CLEAR

- `outOfScopeVisitCount`, `outOfScopeOverrideCount`, `outOfScopeCancellationCount` computed independently.
- `outOfScopeRecordCount` disclosed in a warning banner (`sq-banner--warning`) with `role="status"`.
- Records are excluded, never silently dropped.
- **No blocker.**

---

## 4. Lifecycle / Workflow State Separation (FND-002) — CLEAR

- KPI counts use `operational_state` only: `visits.filter(v => v.operational_state === s).length`
- Monitoring table includes visits with active operational states (`on_the_way`, `arrived`, `executing`) even if `planning_status` has lapsed.
- `planning_status` and `operational_state` are treated as separate state machines throughout.
- **No blocker.**

---

## 5. Partial-Source Retry — CLEAR

- `loadErrors[]` collects every failed source by name.
- All reads are wrapped in `Promise.all` of Postgrest responses; individual `.error` fields do not reject the batch.
- Retry affordance is a real `<a href="/operations">` page-load link, not a dead client-side callback.
- **No blocker.**

---

## 6. EN / AR RTL — CLEAR

- `locale === "ar"` branching throughout UI strings and `Intl.DateTimeFormat`.
- `<bdi dir="auto">` for inspector names in LiveOps.
- `[dir="rtl"]` CSS rules for pressed-state insets (`box-shadow: inset -3px 0 0`).
- Map language set via `document.documentElement.lang === "ar"`.
- `inset-inline` and logical properties used in layout.
- **No blocker.**

---

## 7. Responsive and Keyboard Behavior — CLEAR

- Responsive breakpoints: `@media (max-width: 1100px)`, `1024px`, `700px`, `430px`, `340px`.
- Keyboard: Escape closes preview drawer, Tab traps focus inside modal, focus restores to trigger on close.
- `focus-visible` styles on all interactive elements.
- `aria-pressed`, `role="dialog"`, `aria-modal="true"`, `aria-live="polite"` all present.
- **No blocker.**

---

## Summary

| Path | Status | Blocker |
|------|--------|---------|
| Shell nav → route guard | **BLOCKED** | Admin-only personas admitted via `enabled: true` on business-visible items |
| Region scoping | Clear | — |
| Out-of-region exclusion | Clear | — |
| Lifecycle/workflow separation | Clear | — |
| Partial-source retry | Clear | — |
| EN/AR RTL | Clear | — |
| Responsive + keyboard | Clear | — |

**Single functional blocker identified and fixed within the `/operations` module boundary.**
