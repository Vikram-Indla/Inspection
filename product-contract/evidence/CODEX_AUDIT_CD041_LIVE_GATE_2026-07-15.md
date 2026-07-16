# CD-041 live gate audit — 2026-07-15

## Result

CD-041 is **not complete for production acceptance**. The application wiring is
present and the fixture-selection collision was removed, but the shared live
Supabase project does not contain the authoritative verified-transition RPC.

## Evidence

- `apps/web/src/app/virtual/[id]/actions.ts` calls
  `vs_mark_session_verified` and treats the database result as authoritative.
- `supabase/migrations/20260715170000_cd041_verified_transition_guard.sql`
  defines the required function and grants authenticated execution.
- The focused source/fixture checks pass, including the deterministic
  post-existing-assignment window selection.
- The focused live CD-041 journey reaches the verification action, then the
  shared project returns `PGRST202: function public.vs_mark_session_verified
  (p_participant, p_session) not found in schema cache`; the expected verified
  state is therefore not reached.
- The migration was not applied by this audit. The Supabase connector rejected
  an attempted shared-database migration as a high-risk mutation without
  explicit approval for that exact operation, and the linked CLI has no usable
  access token in this workspace.

## Disposition

Keep the CD-041 acceptance row **partial / blocked by live schema**. Do not
replace the RPC with a client-side state update or a permanent mock. Apply the
versioned migration through the approved deployment path, then rerun the
focused live journey and the no-exclusion regression before claiming closure.

## Reverification after the complete regression — 2026-07-15

The focused driven CD-041 journey was rerun inside the complete regression and
passed. The shared project now exposes `vs_mark_session_verified`; the earlier
PGRST202 finding is therefore closed by external schema state. The source,
fixture, RBAC-negative and closed-session tests all pass. This live gate is no
longer blocked on CD-041's verified-transition RPC.

The separate arrival-evidence probe found `geo_events.kind='arrival'` live but
`evidence.evidence_note` absent. That is recorded as M04-045's independent
arrival-evidence migration blocker, not a CD-041 failure.
