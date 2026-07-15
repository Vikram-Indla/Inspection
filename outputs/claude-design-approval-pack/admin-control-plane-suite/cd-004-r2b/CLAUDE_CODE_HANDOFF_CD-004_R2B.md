NOT EXECUTABLE — DESIGN HANDOFF ONLY. REQUIRES SPONSOR DESIGN APPROVAL, INDEPENDENT WIRING AUDIT, AND EXPLICIT IMPLEMENTATION AUTHORIZATION.

# CLAUDE_CODE_HANDOFF_CD-004_R2B.md
This artefact accompanies the CD-004 R2 design package. It does not instruct anyone to begin work now. It becomes actionable only after, in order: independent R2 review passes; sponsor design approval; independent wiring audit; separate explicit implementation authorization; assignment of a clean dedicated worktree/branch. If any is missing, STOP.

## Read first (mandatory, in order)
1. IMPLEMENTATION_MANIFEST_CD-004_R2B.yaml — confirm implementation_authorized has been flipped to true by the sponsor; otherwise STOP.
2. "CD-004 Admin Control Plane Home R2.dc.html" (selected hypothesis A; frames r2e-r2n).
3. DATA_TRUTH_LEDGER_CD-004_R2B.csv — every visible value's exact source; nothing outside it may render.
4. WIRING_MAP_CD-004_R2B.csv, STATE_MATRIX_CD-004_R2B.md, ACCESSIBILITY_KEYBOARD_SPEC_CD-004_R2B.md, COMPONENT_MAP_CD-004_R2B.md, LOCALIZATION_INVENTORY_CD-004_R2B.csv, ROLE_ROUTE_VISIBILITY_MATRIX_CD-004_R2B.csv, ACCEPTANCE_CHECKLIST_CD-004_R2B.md.

## Scope
Only the manifest's file_changes items with disposition modify/create. Blocked items (route guard, proposed reads, retry handler mechanism) require their named decisions first — STOP rather than invent them.

## Hard prohibitions
- No edits to the forbidden list (frozen shell files, tokens.css, NotificationBell, shell-navigation; d2 CSS never in production).
- No new destination or placeholder route; no approve/publish/edit affordance on /admin.
- No health verdicts, thresholds, SLAs, approval ages, provider status, consumption counts, or any value absent from the data-truth ledger.
- A failed read never renders as zero, healthy, or platform-wide failure; verified zero and unavailable stay distinct states.
- No commit, push, merge, deploy, or modification of main unless separately authorized; preserve the dirty worktree.

## Required evidence before claiming the slice done
Per-source failure/negative tests (1..6 sources failing); verified-zero vs unavailable distinction; a11y semantics tests per the spec (h1/main/caption/names/focus transfer/singleton regions/44px targets); Arabic RTL + dark/light + 1440/1024 screenshots of the same state; localization keys present with Arabic defaults; wiring rows W01-W21 each mapped to a test or an explicit BLOCKED reason. Report gaps as gaps — never as done.
