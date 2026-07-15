# SOURCE_DISCOVERY_LOG — CD-007
source_branch: setup/Inspection
source_commit: 1b530afe06a620b3b85173d10cec1f12074e2c18
dirty_worktree: true
source_evidence: supplied Codex source-truth memo plus inspected attached source files

files_inspected:
- apps/web/src/app/admin/items/page.tsx — reads inspection_items(id,code,title,active,score_weight,response_model,evidence_rule) + clause/regulation refs.
- apps/web/src/app/admin/items/Controls.tsx — create item + toggle active.
- apps/web/src/app/admin/items/actions.ts — createItem(governed presets, clause link, score weight, guidance, response_model, evidence_rule, active); toggleItemActive(bool, preserves history, no reason).
- package consumers under apps/web/src/app/admin/packages/ — publish validator rejects inactive/missing items + malformed dependent mappings.
- migrations 0001/0002 — schema also has score_excluded_on, guidance_en, guidance_ar; NO item-row audit trigger; duplicate code = DB unique.
contradiction_with_prior_pack: prior CD-007 said 'schema unconfirmed' — withdrawn; schema is confirmed.
