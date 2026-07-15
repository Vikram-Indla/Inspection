# CD-006 through CD-011 frontend/runtime remediation — 2026-07-15

## Status

**SOURCE PASS / TYPECHECK PASS / BUILD PASS / LIVE CERTIFICATION PENDING.**

An independent requirement audit rejected the earlier 73/73 browser result because
several assertions proved source strings or accepted a degraded register instead of
driving the acceptance journey. This remediation does not preserve that false-green
claim.

## Closed findings

- AC-0449: regulation attachments upload to private Supabase Storage, compute
  SHA-256, persist governed metadata, and render signed retrieval links.
  Deactivated/future regulations are rejected from new package publication in
  both the action and database trigger. Prior versions remain frozen.
- AC-0453: the outbox carries the configured evidence type. Video no longer
  replays as document; comment is captured as UTF-8 text evidence; a wrong type
  cannot satisfy a mandatory leg.
- AC-0466/0469/0470: item-response conditions feed the runtime condition context.
  Hidden conditional items do not block; visible mandatory conditional items do.
- AC-0472: weighted runtime scoring excludes disabled/configured-excluded answers
  from numerator and denominator and enters the submission snapshot.
- Admin route layouts deny unrelated roles before loading module data; reviewer
  read-only visibility and database RLS remain separate controls.
- `/admin/regulations/[id]` is a real route.
- Package editor dirty-state, draft input label, violation clause-source failure,
  permission-read failure, future-date deactivation semantics, loading localization,
  and stale Arabic claims were corrected.

## Local verification

- `npm run typecheck` — PASS.
- `npm run build` — PASS, including `/admin/regulations/[id]`.
- `git diff --check` — PASS.
- focused backend/runtime suite — 8/8 PASS, including negative/positive checks for
  item-answer visibility, conditional mandatory behavior, typed evidence, video
  replay mapping, and score exclusion.

## Pending live evidence

After the two named migrations are explicitly approved and applied:

1. generate the admin persona state;
2. drive draft regulation edit, file upload/retrieval, validation failure,
   maker-checker failure/success, publish, audit, and deactivation;
3. drive item authoring through package publication into an inspection and prove
   conditional visibility, type-specific evidence blocking, and score exclusion;
4. rerun the combined CD-006..011 browser/RTL/responsive suite and replace the
   pre-migration screenshots—never commit skeleton/degraded images as proof.

## Remaining capabilities

Version-lineage comparison, broad dependency visualization, package effective
dates/scheduled activation/supersede lifecycle, package simulation and circular
rule tooling, item edit/new-version and deactivation reason, and the richer
violation/penalty version lifecycle remain explicit capabilities outside the six
remediated ACs. They are not represented as complete by this record.
