# G4-EV-003 Obsidian Vault Verification (structure, not screenshot)

Per human instruction: verify the Obsidian-ready repository structure without
fabricating a desktop screenshot. The `.png` desktop capture is a **non-blocking
post-check**.

## Verified facts
- Repository root **is** the Obsidian vault — `.obsidian/` present at root
  (`app.json`, `core-plugins.json`, `appearance.json`, `graph.json`).
- Single vault only — no duplicate `.obsidian/` elsewhere in the tree.
- `HOME.md` is the human knowledge home; **16/16 wikilinks resolve** to real
  contract files (Obsidian-style, any extension). See `G4-VALIDATION-SUITE.txt`.
- Vault opened locally via `open -a Obsidian <repo root>` (launch OK).

## Non-blocking post-check (owner: human)
- `G4-EV-003-obsidian-vault.png` — capture `HOME.md` rendered in Obsidian with the
  link graph. Does not block G4 PASS; attach when convenient under
  `product-contract/evidence/attachments/`.

## Acceptance mapping
Satisfies ACCEPTANCE_STATUS criteria 1 (one canonical repo) and 2 (no duplicate
Obsidian copy).
