# WA-M9 Admin Localization — leased data proof

## Identity and verdict

- Task / lease: `DATA-LEASE-CODEX-ADMIN-LOCALIZATION-003`
- Date: 2026-07-25 Asia/Riyadh
- Project: `iiozvqntawxfwbgffzqu` (non-production verification project)
- Route / key: `/admin/localization` /
  `admin.items.form.guidancePlaceholder`
- Process / screen / engine: `G2-P00` / `SCR-ADM-100` / `SB19`
- Requirements: `MVP1-FND-001`, `MVP1-FND-003`, `MVP1-FND-010`,
  `MVP1-FND-011`
- Acceptance: `WA-M9-AC-001..006`
- Branch / starting commit:
  `codex/admin-localization-lookups` / `fc50d51d`
- Draft PR: `https://github.com/Vikram-Indla/Inspection/pull/63`
- Verdict: **REAL UI JOURNEY PASS — exact semantic business state restored;
  append-only history retained; awaiting independent review.**

No service-role client, Management API, SQL write, schema change, policy
change, provider change, bulk operation or unrelated key was used. All writes
ran through the real authenticated Admin Localization UI and its existing
Config Admin action/RLS path. Read-only verification used only the public
anonymous client key under the existing select policies.

## Authoritative clarification

The first lease preflight correctly stopped before writing because the original
wording could have required deletion or falsification of `updated_by`,
`updated_at` and append-only history. The sponsor then clarified:

- exact restoration means exact semantic business state;
- the original Arabic value and workflow status must return exactly;
- actor, time and append-only revision/history rows must remain as truthful
  audit evidence and must not be reset, deleted or hidden.

The clarification authorized a fresh preflight and one single-key UI journey.

## Baseline and collision preflight

The original complete baseline was captured at
`2026-07-25T00:13:20.901Z`, `00:13:23.260Z` and `00:14:47.802Z`.
All three row-plus-history captures had SHA-256:

`2105fc619c3455f6c10471031b5fff558ce2be5d2b75c30ccaa1890cd8dfb90a`

Immediately before the authorized write, two fresh captures at
`2026-07-25T00:18:45.331Z` and `00:18:47.461Z` produced the same hash. The
leased row therefore showed no observed drift and still matched the recorded
baseline.

Exact original semantic state:

- key: `admin.items.form.guidancePlaceholder`
- English: `What the inspector verifies`
- Arabic: `ما يتحقق منه المفتش`
- status: `draft`
- context: `null`
- orphaned: `false`

Original metadata:

- updated_by: `null`
- updated_at: `2026-07-11T23:01:19.069404+00:00`
- row count for the exact primary key: `1`
- revision count: `1`
- revision ID:
  `b60eba67-eee9-4185-9cd5-7da52407cac3`
- revision state: Arabic `null`, status `draft`, actor `null`, source `sync`,
  changed at `2026-07-11T23:01:19.069404+00:00`

The real Config Admin UI independently showed the same key, English, Arabic,
draft status and one history entry. The route showed the approved Config Admin
roles and all 2,844 registry rows before search isolated the one leased key.

## Real UI journey

Temporary proof value:

`ما يتحقق منه المفتش — إثبات مؤقت 003`

Only the leased key was used.

1. **Save**
   - The Arabic textbox was changed to the unique temporary value.
   - The real Save action returned `تم الحفظ`.
   - A full route refresh showed the same temporary value with status `draft`.
   - The database recorded revision
     `ddb9adcc-d1ab-4722-81a8-c833378055c0`, containing the exact original
     Arabic and `draft` before-state.
2. **Review**
   - The real `اعتماد المراجعة` action changed the UI status to `مُراجَع`.
   - A full route refresh preserved the temporary Arabic and reviewed status.
   - The database recorded revision
     `a99880e4-7a26-411a-8ed2-bcbae9b1b2b6`, containing the temporary Arabic
     and `draft` before-state.
3. **History**
   - The real history panel showed the original Arabic revision and the
     temporary draft revision with timestamp and source.
   - A read-only database capture at `2026-07-25T00:19:57.009Z` confirmed the
     current row was reviewed and both new revision IDs belonged to the same
     Admin actor.
4. **Restore**
   - The Restore action was selected on the revision containing the exact
     original Arabic value, not the older sync revision whose Arabic was null.
   - The UI returned `تمت الاستعادة (كمسودة)`.
   - A full route refresh showed Arabic `ما يتحقق منه المفتش` and status
     `مسودة`.
   - The database recorded revision
     `a91d3466-9e04-4772-aa42-c3f266401b09`, preserving the temporary Arabic
     and `reviewed` before-state.

## Final semantic state and residue check

The expected and actual semantic objects were byte-equivalent:

```text
key       admin.items.form.guidancePlaceholder
English   What the inspector verifies
Arabic    ما يتحقق منه المفتش
status    draft
context   null
orphaned  false
```

Both produced SHA-256:

`d1ee876bbb513538e0e2b1b2ca40d6cbe21c96f67107453e6907335ce9a959c7`

Two final reads at `2026-07-25T00:21:17.707Z` and
`2026-07-25T00:21:20.231Z` remained stable.

Final safety checks:

- exact leased-key row count: `1`;
- current rows containing the temporary Arabic value: `0`;
- orphaned: `false`;
- final Arabic: exact original value;
- final workflow status: exact original `draft`;
- English/context/key unchanged;
- no Add key or Sync action used;
- no schema, policy, grant or application source changed;
- denied reviewer remained blocked before localization data loaded.

Required audit residue:

- final updated_by: `f9067e24-99f7-40e7-8421-4717de9ca2db`;
- final updated_at: `2026-07-25T00:20:01.847763+00:00`;
- final revision count: `4` — one original sync revision plus exactly three
  journey revisions;
- all three journey revisions have the same Admin actor and preserve the
  original draft, temporary draft, and temporary reviewed before-states in
  chronological order.

The temporary value remains only inside the required append-only history. It
does not remain in the live business row.

## Audit-label observation

The immutable domain history proves actor, time, before-state and sequence.
All three UI writes currently carry `change_source = 'panel'`; the restore
action does not emit a distinct `restore` source label even though the
migration comment lists `panel | sync | restore`. This was not altered under
the no-schema/no-policy/no-product-code lease. It is disclosed for independent
review rather than hidden or upgraded.

## Verification

- Real Config Admin save → refresh → review → refresh → history → restore →
  refresh — PASS
- Exact semantic-state hash comparison — PASS
- Unique key / no current temporary value / no orphan — PASS
- Append-only actor/time/before-state chain — PASS
- Focused production localization suite after restoration — PASS, 6/6
- Denied reviewer boundary after restoration — PASS
- Permission widening — none; no policy/grant/code change and denied runtime
  remains fail-closed
- Protected F0/shell selection — 11/12; the unchanged, separately leased stale
  shared-shell expected-list assertion remains the only failure

## Review position

The real data-behavior proof requested by
`DATA-LEASE-CODEX-ADMIN-LOCALIZATION-003` is built and browser-verified, but
this implementer does not self-accept it. Stop at independent review.

The separate P1s remain unchanged:

1. `LEASE-WA-SHELL-NAV-ASSERTION-003` for the stale shared shell test
   assertion.
2. Qualified native-Arabic review after approved Arabic UI copy.
