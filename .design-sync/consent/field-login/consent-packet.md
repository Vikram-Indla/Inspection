# Design Delta Consent — SAQEEL PWA-Field Login

## Identity
- Project ID: `5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61` ("SAQEEL Design System")
- Page: `SAQEEL PWA-Field Login.dc.html`
- Accepted revision/hash: none exists (no prior consent record for this page — this would be a *baseline-establishment* decision, not a routine delta)
- Observed revision (etag proxy): `1784884213895548`
- Detection timestamp: this session, 2026-07-24

## Verified current implementation
- Route: `/login/field`
- Entry component: `apps/web/src/app/login/field/page.tsx` → `FieldLoginClient.tsx`
- Current business behavior: password sign-in via Supabase Auth; Face ID **unlock** (not login) gated on real backend device-trust + local WebAuthn opt-in; national ID/staff number field explicitly blocked pending MIM directory contract; no OTP flow of any kind.
- Current API/security support: Supabase `signInWithPassword`/`getSession`; server-action-backed device-trust register (`trust_status` column, approved via Operations, never client-inferred); local-only WebAuthn credential, never sent to a server.
- Current tests: **none found** targeting this route (`grep` across `apps/web/e2e`, `apps/web/tests`, `apps/web/__tests__` returned nothing).

## Exact design delta (design shows, code doesn't have)
- **Added in design, absent in code:** "Unrecognized device" warning banner; six-digit OTP input grid; OTP resend timer/button; OTP verify/back buttons; "Trust this device" checkbox on the OTP screen; prefilled sample credentials; hardcoded device-id and last-sync display strings.
- **Removed/changed in code vs. design:** Face ID is unlock-of-existing-session only, never a login/trust-granting path (design implies immediate biometric access for any "trusted" device); theme toggle removed (field channel is dark-only); language toggle re-implemented as a real navigable link instead of client state.
- **State/interaction changes:** design's `trusted`/`untrusted` split (two static variants of the same screen) does not exist in code — code instead branches on three live async checks (session → backend trust → local WebAuthn opt-in) with the plain form as the default/safe state.

## Code and wiring impact (if design were followed literally)
- Components/files: would require adding an OTP-challenge UI state to `FieldLoginClient.tsx` + `field-login.css` (dead CSS classes already present from the reverted `SCR-PWA-001` attempt).
- Services/APIs: **no approved Field Login device-enrollment OTP-issue/verify endpoint exists** (the repository's separate virtual-session OTP capability is not a substitute — see corrected evidence above). Would need a real, purpose-built OTP delivery integration (SMS/email/authenticator) — this is exactly the "not wired" gap the design itself flags.
- Security: OTP as a *device-trust-granting* mechanism would need real rate-limiting, expiry, reuse prevention, and audit logging — none currently designed or backed by any contract in this repo.
- Tests: new Playwright scenarios needed (existing `playwright.ui-compliance.config.ts` / `playwright.inspector-visual.config.ts` are the right harness to extend, not replace).

## Unsupported, ambiguous, or risky behavior
- **Item:** OTP-based untrusted-device enrollment as depicted in the design.
- **Evidence:** No **approved Field Login device-enrollment OTP contract or wiring** exists — no delivery provider, no issuance/verification endpoint, no rate-limit/lockout policy for *this* capability. **CORRECTED 2026-07-24 (Codex re-review):** this does not mean no OTP capability exists anywhere in the system — the repository does contain virtual-session OTP RPCs and a historical accepted OTP configuration, a separate business capability. `OPEN_DECISIONS.yaml` still lists `DEC-007` as open, which is an authority conflict for reusing/extending that capability into Field Login device enrollment — it must be resolved explicitly by the sponsor, not inferred from the virtual-session capability's existence, and not silently borrowed.
- **Classification:** `backend-blocked` + `dependent on product consent` (this is a security-sensitive auth-model decision, not just a wiring gap).
- **Required decision:** see options below.

## Proposed implementation boundary
**No implementation is proposed for building OTP.** The evidence points to the opposite conclusion: the code's existing divergence from the design is a documented, deliberate security correction, not a shortfall. The decision this packet actually surfaces is:

### Option A — Update the design page to match shipped behavior (recommended)
Revise `SAQEEL PWA-Field Login.dc.html` to remove the OTP/untrusted-device flow and reflect the real three-check Face-ID-unlock model, so the design system stops describing a flow nobody intends to build. No app code changes. Low effort, removes the drift permanently.

### Option B — Leave design as aspirational/roadmap, no action
Keep the OTP mockup as a documented future direction (e.g. tag it `experimental` in the registry) but do not treat it as a pending implementation obligation. No app code changes.

### Option C — Scope a real OTP untrusted-device path as new work
Would require: a routed product-contract task (none exists — `TASK_ROUTER.yaml`/`CURRENT_SLICE.yaml` have no entry for this), an approved OTP delivery provider decision (SMS/email/authenticator — currently an open, unanswered product question per the design's own copy), rate-limit/lockout/audit policy, and full Gate G5/G6 implementation-and-verification cycle. Out of scope for this session regardless of which option is chosen — flagged for a future task if the sponsor wants it.

**This session takes no application-code action under any option** — Option A/B are documentation/registry-only and were not applied either, pending your decision below, since even the design-side edit is a write to a shared Claude Design project outside this session's read-only mandate.

## Verification plan (only applicable if Option A or C is later approved)
- Commands: `pnpm -C apps/web typecheck`, `pnpm -C apps/web build`, `pnpm -C apps/web test:e2e -- --config=playwright.ui-compliance.config.ts`
- Business scenarios: valid/invalid password, network failure, Face-ID-eligible device, Face-ID-ineligible device (fallback to password), national-ID input (directory-blocked message), offline indicator toggle, AR/EN toggle.
- Viewports: iPad (primary field device), mobile, desktop (existing `playwright.inspector-visual.config.ts` already covers iPad).
- Accessibility: keyboard-only path through both branches, screen-reader labels on Face ID button and form fields.
- Regression: confirm `/field` post-login shell and `/settings/devices` trust-enrollment flow are untouched.

## Decision
- [ ] APPROVE Option A (align design to code)
- [ ] APPROVE Option B (no action, tag roadmap)
- [ ] APPROVE Option C (scope real OTP as new task)
- [ ] REJECT / REQUEST REVISION

Approver: _pending — sponsor (Vikram)_
Timestamp: _pending_
Decision record: _pending — no `/consent` skill exists in this install (see claude-capability-audit.md); recording your decision back into this file (or a reply in chat) is the consent mechanism for now._
