# ROUTE_RUNTIME_TRUTH_MEMO — CD-007 (SCR-ADM-020, /admin/items direct)
- Confirmed fields: inspection_items(id,code,title,active,score_weight,response_model,evidence_rule,clause_id) + score_excluded_on, guidance_en, guidance_ar.
- Actions: createItem (governed presets); toggleItemActive (preserves history, no stored reason).
- Duplicate code enforced by DB unique constraint -> provider error surfaced.
- Package publish validator rejects inactive/missing items + malformed dependent mappings.
- BLOCKED: item edit/version lifecycle, deactivation reason, item-row audit trigger (none), item-route package-usage count, conditional-rule authoring.
