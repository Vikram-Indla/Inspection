# MVP3 Remote Supabase Migration Certification

Date: 2026-07-18  
Project: `iiozvqntawxfwbgffzqu`  
Migration: `20260718150000_mvp3_enterprise_control_plane`  
Status: PASS

## Authority and scope

The sponsor explicitly prioritized and authorized the remote Supabase migration. Only the MVP3 enterprise control-plane migration was executed. The pre-existing MVP1/MVP2 migration ledger was not repaired, rewritten or replayed. No provider was enabled and no production business data was mutated.

## Preflight

- PostgreSQL 17.6.
- Required MVP1/MVP2 relations present: `profiles`, `inspections`, `signature_acts`, `package_versions`, `config_versions`.
- `pgcrypto` present in schema `extensions`.
- The live ledger contained 93 historical rows using full migration filenames. The established convention was preserved.
- The local clipboard was empty; no credential was copied, printed or stored. Deployment used the existing authenticated Supabase CLI session.

## P0 corrections made before deployment

1. Added `requested_device_identifier` to package access events and allowed `device_id` to be null for auditable unknown-device denials.
2. Made device-command RPCs resolve and record the canonical device identifier and reject missing devices.
3. Removed the contradictory append-only trigger that would prevent queued device commands progressing through their declared lifecycle.
4. Revoked direct execution of internal trigger functions.
5. Split two broad `FOR ALL` RLS policies into explicit INSERT and UPDATE policies to remove duplicate permissive SELECT paths.

## Executed proof

- 13/13 expected MVP3 tables exist.
- 13/13 tables have RLS enabled.
- 25 explicit MVP3 policies are present after policy hardening.
- Anonymous table grants: 0.
- Authenticated table grants: 25, constrained by RLS.
- Seven SECURITY DEFINER RPCs have fixed search paths and explicit internal authentication/role checks.
- Anonymous executable MVP3 functions: 0.
- Authenticated access to internal trigger functions: 0.
- Negative RLS probe: an `authenticated` database role with no user JWT saw 0/4 integration endpoints.
- Four dependency-blocked integration endpoints seeded without enabling a provider.
- Migration ledger row recorded at 2026-07-18 12:31:24 UTC.

## Advisor disposition

- MVP3 performance warnings after remediation: 0.
- The security advisor reports seven authenticated SECURITY DEFINER notices. These are intentional public API RPC entry points; each has a fixed search path, rejects missing authentication, enforces named roles, and is unavailable to `anon`.
- Older MVP1/MVP2 advisor findings remain outside this migration and were not changed under this authority.

## Result

The corrected MVP3 database foundation is live and schema-certified on the target Supabase project. Application deployment and external provider activation remain separate release actions.
