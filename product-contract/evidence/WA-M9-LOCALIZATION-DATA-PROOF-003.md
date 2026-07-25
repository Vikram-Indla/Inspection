# WA-M9 Admin Localization — leased data-proof preflight

## Identity and authority

- Task / lease: `DATA-LEASE-CODEX-ADMIN-LOCALIZATION-003`
- Date: 2026-07-25 Asia/Riyadh
- Project: `iiozvqntawxfwbgffzqu` (non-production verification project)
- Route: `/admin/localization`
- Key: `admin.items.form.guidancePlaceholder`
- Process / screen / engine: `G2-P00` / `SCR-ADM-100` / `SB19`
- Requirements: `MVP1-FND-001`, `MVP1-FND-003`, `MVP1-FND-010`,
  `MVP1-FND-011`
- Acceptance: `WA-M9-AC-001..006`
- Branch / commit at preflight:
  `codex/admin-localization-lookups` / `b1f80205`
- Draft PR: `https://github.com/Vikram-Indla/Inspection/pull/63`
- Verdict: **STOPPED BEFORE WRITE — exact restoration cannot be proven through
  the governed UI.**

No service-role client, Management API, SQL write, schema change, policy
change, provider change, bulk operation or unrelated key was used. The exact
project identity was derived from the configured public Supabase URL, and the
read-only database baseline used only the public anonymous client key under the
existing select policies.

## Exact baseline and collision preflight

Two complete read-only captures were taken at
`2026-07-25T00:13:20.901Z` and `2026-07-25T00:13:23.260Z`.
The canonical serialization of the row plus complete revision chain produced
the same SHA-256 both times:

`2105fc619c3455f6c10471031b5fff558ce2be5d2b75c30ccaa1890cd8dfb90a`

This proves no observed drift between the two bounded reads. A postflight read
at `2026-07-25T00:14:47.802Z` produced the same hash after the browser and
denied-user checks. The primary-key query returned exactly one row:

- key: `admin.items.form.guidancePlaceholder`
- English: `What the inspector verifies`
- Arabic: `ما يتحقق منه المفتش`
- status: `draft`
- context: `null`
- orphaned: `false`
- updated_by: `null`
- updated_at: `2026-07-11T23:01:19.069404+00:00`

The complete baseline revision chain contains exactly one row:

- ID: `b60eba67-eee9-4185-9cd5-7da52407cac3`
- English: `What the inspector verifies`
- Arabic: `null`
- status / orphaned: `draft` / `false`
- changed_by: `null`
- source: `sync`
- changed_at: `2026-07-11T23:01:19.069404+00:00`

The real Config Admin UI independently showed the same key, English, Arabic,
draft status and one history entry. The route displayed all 2,844 keys and the
approved persona roles before the candidate was narrowed to one search result.

## Restore-path proof

The governed workflow is internally consistent for business values:

1. Save writes the temporary Arabic value, forces `draft`, and stamps the
   current user and time.
2. The versioning trigger snapshots the old business row into
   `ui_string_revisions`.
3. Review writes `reviewed` and stamps the current user and time.
4. History reads the trigger-written snapshots.
5. Restore reads only the selected revision's `key` and `ar`, then writes that
   Arabic value with status `draft` and stamps the current user and time.

The path cannot restore the exact complete baseline:

| State | Exact restoration through UI |
|---|---|
| key / English / context / orphaned | Preserved because this journey does not change them |
| Arabic | Restorable from the pre-save snapshot |
| status | Restorable to baseline `draft` |
| updated_by | **Not restorable**; restore stamps the acting Admin user |
| updated_at | **Not restorable**; the touch trigger stamps a new time |
| revision chain | **Not restorable**; history is append-only by design |

The generic `audit_events` trigger list does not include `ui_strings`.
Localization's domain audit evidence is its append-only
`ui_string_revisions` chain, including actor, source and timestamp. Deleting or
rewriting those rows would weaken the accepted audit design and was not
authorized.

The existing baseline revision is not itself a usable full-baseline restore
target because its Arabic value is `null`. A Save would first create a
restorable snapshot containing the current Arabic value, but that Save would
already make the irreversible metadata/history changes described above.

## Stop decision

The lease required all restoration and isolation conditions to be proven
before any write and directed the worker to stop if exact restoration could not
be proven. Therefore:

- Save was not clicked.
- Review was not clicked.
- Restore was not clicked.
- No temporary value exists.
- The candidate remains `draft`, non-orphaned and unchanged.
- The key remains unique.
- The revision chain remains at its single baseline row.
- No permission or policy changed.

## Read-only verification

- Real Config Admin route and candidate/history inspection — PASS
- Two-read collision comparison — PASS, identical SHA-256
- Exact project/key/row uniqueness — PASS
- Focused production localization suite — PASS, 6/6
- Denied reviewer receives a fail-closed boundary before localization data
  loads — PASS
- Exact complete-state restoration proof — **FAIL / STOP**
- Save → review → history → restore journey — **NOT RUN**

## Exact unblock condition

A future write requires an explicit sponsor clarification that “exact restore”
means exact business state (`key`, English, Arabic, status, context and
orphaned) while the new `updated_by`, `updated_at` and append-only revision
rows are required audit residue. That clarification must not authorize deleting
history, falsifying timestamps or resetting actor attribution.

Without that clarification, the safe status is `BLOCKED_PREWRITE` and service
wiring remains `AMBER`.

The separate P1s remain unchanged:

1. `LEASE-WA-SHELL-NAV-ASSERTION-003` for the stale shared shell test
   assertion.
2. Qualified native-Arabic review after approved Arabic UI copy.
