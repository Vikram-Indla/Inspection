# 2026-08-22 · T-178 — WEB-016 Content & Voice, and the content gate

`task: T-178` · `status: done` · `duration: 1.5h`
`rules applied: WEB-006, WEB-007, WEB-008, WEB-013, WEB-016 (authored)`

---

## Goal

Turn the v2 content audit into law and into a build gate, so no new string can
land below the standard.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `brain/web/rules/WEB-016-content-and-voice.md` | created | 0 → 140 |
| `apps/web/scripts/content-vocabulary.json` | created — the word list as data | 0 → 60 |
| `apps/web/scripts/check-content.mjs` | created — the ratcheted gate | 0 → 128 |
| `apps/web/scripts/content-baseline.json` | created — 352 known violations | 0 → 106 |
| `apps/web/package.json` | `gates:content` added and chained into `gates` | +1 |
| `.github/workflows/pull-request-contract.yml` | new `web-gates` job | +26 |
| `CLAUDE.md` | rule 16 added | +17 |
| `brain/web/README.md` | WEB-016 row; Arabic-first rule extended | +6 |

## Decisions

**Renumbered mid-task: WEB-015 was already taken.** `WEB-015-form-controls.md`
exists. Written as WEB-015, caught before the record was filed, renamed to
**WEB-016** and every reference re-pointed (gate script, vocabulary file,
CLAUDE.md, README). This is the same class of collision the tracker logs six
times for task ids — the rule numbers have no reservation either. Worth a gate.

**The word list is data, not code.** `content-vocabulary.json` holds the banned
words with their replacements, the phrasal verbs, the connectors, the idioms and
the sentence cap. The content lead owns it and can change it without an
engineering change. The gate is the only code.

**The gate names the fix, not just the failure.** A banned word fails with the
replacement in the message — `"governed" — say "set by rules / official"` — so
the error message is the remedy.

**The gate does NOT check passive voice.** WEB-016 §3 records why: "You were
signed out" beats every active rewrite. A mechanical passive check would push
copy the wrong way, so passive stays a human judgement.

**The gate reads i18n only.** The 2,370 hardcoded literals are invisible to it,
because they are invisible to the translation system. Written into WEB-016 §6 as
a known limit rather than hidden; a scanner for those is parked.

**Discovery: no gate ran in CI at all.** `pull-request-contract.yml` ran
`typecheck` and nothing else, so `gates:typography`, `gates:date-inputs` and
`check:design-system-v5` were local-only. Every ratchet the team believed was
enforced was not. Added a `web-gates` job running the three gates that currently
pass. **`check:design-system-v5` deliberately excluded** — it fails on
pre-existing emoji-as-icon and UTC-date debt, so adding it would block every PR
on day one. Commented in the workflow with the condition for adding it.

## Inventory taken before writing code

- Read `check-typography.mjs` for the ratchet shape and copied it exactly:
  counts keyed `namespace::rule`, per-key baseline, `--update` to lower.
- Rules implemented, all high-signal and each independently defensible:
  `banned-word` · `phrasal-verb` · `formal-connector` · `idiom` ·
  `long-sentence` · `empty-state` · `no-arabic`.
- Deliberately NOT implemented: unexpanded-acronym (too noisy at this stage),
  passive voice (see Decisions), and full vocabulary-frequency scoring (needs a
  50k word list committed to the repo — parked as a decision, not an omission).
- No e2e spec reads any file this task touched.

## Numbers

```
content baseline            352 known violations across 53 namespaces
  banned-word               the largest rule by count
  no-arabic                 catches a key present in en and missing in ar
gate proven both ways:
  injected 1 bad string  → FAILED, 9 violations, each naming its replacement
  reverted               → PASSED, 352 known, none new
full chain: typography PASSED · content PASSED · date-inputs PASSED
            check:design-system-v5 FAILS (pre-existing, untouched by this task)
```

## Accessibility

Not applicable — no user-visible surface changed.

## Verification

- [x] `npm run typecheck` — 0 errors
- [x] `npm run gates:content` — PASSED, 352 known, none new
- [x] Gate failure path proven by injecting a violation and reverting it
- [x] Workflow YAML parses; jobs are `branch-contract`, `web-typecheck`, `web-gates`
- [ ] CI not observed running — the job is new and no PR has exercised it yet.
      **State this to the reviewer; do not claim CI green.**
- [ ] `npm run test:e2e` — not run

## Retirement

Nothing marked, nothing deleted.

## Parked

- A scanner for the 2,370 hardcoded user-visible literals (WEB-013 has no gate).
- Add `check:design-system-v5` to the `web-gates` job once its debt clears.
- A reservation gate for rule numbers, matching the one the tracker wants for
  task ids — this task hit the collision live.
- Full vocabulary-frequency checking in the gate; needs a word list committed.

## Blocked / open questions

None. The Arabic sign-off blocker from T-177 still stands and is unrelated.

## Proposed commit

```
feat(gates): add the content and voice gate, and run the ratchets in CI
```

## Next

T-179 — retire "Saqeel" as the internal design-system name.
