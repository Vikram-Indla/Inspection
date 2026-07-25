# Pilot Delta Review — SAQEEL Profile

Date: 2026-07-24  
Design ID: `WA-DES-038`  
Reviewer recommendation: **APPROVE DESIGN-ONLY PILOT RECORD WITH EVIDENCE CAVEAT**

## Outcome

Claude Code's current pilot is SAQEEL Profile, not Field Login. The pilot maps to the real `/profile` page, has a bounded design-only delta, requires no application or backend work, and was applied after explicit sponsor approval. No application implementation lease is needed or authorized.

## Pilot checks

| Check | Result | Independent finding |
|---|---|---|
| Stable design revision | **Yes, with caveat** | Prior etag `1784806070831883` was used as the conditional-write base; accepted revision is `1784896277489148`. `state/WA-DES-038.json` records both. No semantic hash or immutable exported snapshot is stored. |
| Maps to a real application page | **Yes** | `/profile` and `apps/web/src/app/(app)/profile/page.tsx` exist and represent the authenticated user profile capability. |
| Delta is bounded | **Yes** | The only action was a design-only markup correction from `span dir="ltr"` to `bdi dir="ltr"` for six Latin/numeric values. |
| Avoids unapproved backend work | **Yes** | No application, API, RLS, Supabase, or backend file was proposed or changed. |
| Expected tests are sufficient | **Sufficient for this design-only edit** | Source-level verification and conditional-write revision control cover the narrow markup change. Runtime EN/AR visual verification remains a useful follow-up, not a prerequisite for an application build because application code did not change. |
| Consent packet is complete | **Substantially yes** | It records identity, old/new revisions, exact design change, no-code/no-wiring scope, risk, rollback, approver, timestamp, and accepted result. The missing semantic hash/snapshot is explicitly disclosed. |

## Independent delta finding

The current code already isolates Latin-script and numeric values in RTL contexts using `<bdi dir="ltr">`. Claude Design previously depicted a known-bad pre-fix pattern. Claude changed only the six design values for Name, Email, Region, Roles, Session started, and Session expires.

The remaining design-versus-code differences are correctly classified as no application action:

- shared shell is implemented by the real application shell rather than duplicated prototype markup;
- profile data, roles, and session dates come from real authenticated sources;
- notification preferences and push-permission states are wired in code;
- language and theme behavior are real and persistent;
- the sign-out element differs semantically but not functionally.

## Risks and evidence caveat

- The accepted design state is tracked by etag only; `observed_hash` and `accepted_hash` are null.
- There is no immutable exported design snapshot attached to the consent record.
- No browser comparison was captured after the design-only edit.

These limitations reduce reproducibility but do not expand the change or justify application work.

## Reviewer recommendation

Accept the design-only pilot as completed and record revision `1784896277489148` as the current accepted baseline. Request a semantic hash or immutable snapshot in future design-change packets.

Do not implement, wire, or modify `/profile`. If later runtime evidence is desired, Claude retains design ownership and Codex may perform read-only EN/LTR and AR/RTL comparison unless a separate application lease is explicitly granted.

No application product code, backend, API, stash, `main`, or `setup/Inspection` change was made by this review.
