# PLAN v1 — rejected, round 1 (Sol adversarial review)

Full critique preserved in session transcript. Summary of why v1 was rejected:
- Cited `apps/web/CLAUDE.md` and `handoff/*.md` paths that don't exist in this repo (the handoff
  files live only in an external Claude Design project, never version-pinned into this checkout).
- Called Global Search, Notifications, Trusted-device data, Incident logging, and server-side
  drafts "net-new" when real tables/routes/actions already exist for all five — the actual gap was
  reconciliation, not invention.
- Told the builder to branch the inspection form by report kind against chemical/customs/safety
  catalogues that the recorded migration (`20260719050000_pkg_chemical_customs_scaffold.sql`)
  explicitly marks draft-only and instructs not to invent.
- Proposed replacing the login/reset flow with OTP without checking it would contradict an
  already-passing test and the accepted Supabase-recovery-link design — turned out to be resolvable
  (a real, coded Senaei OTP adapter existed, dead code) but v1 didn't know that because it hadn't
  read the sponsor's real API docs yet.
- Scoped biometric/WebAuthn as a small UI item when no credential schema exists anywhere in the repo.
- Assumed the submission pipeline was healthy; it is platform-wide blocked by DEC-029/DEC-032
  (`pgcrypto`-missing trigger bug).
- Cited `pnpm` commands and an `ads-validator` script neither confirmed to exist in this repo.
- Had no task slice and no sponsor-level decisions on any of the above.

v2 corrects every item above against verified real files, and folds in sponsor decisions made after
v1's rejection (informal task label accepted; OTP required via the real Senaei adapter; biometric is
in scope now, not deferred; submission fix required, migration prepared but gated on explicit
apply-approval).
