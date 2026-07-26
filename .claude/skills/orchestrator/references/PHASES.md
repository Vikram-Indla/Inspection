# Phase procedures

## Parity — design truth gate

The board's law: *a card is 100% on Design only when the shipped route matches
its `.dc.html` pixel-to-pixel at every declared width, in EN/LTR and AR/RTL.*

### 0. Admin design-quality gate

Run this before proposing or applying an admin design change. It is additive to
the parity procedure below; it does not replace Claude Design authority.

1. Open a neighboring ChatGPT/Codex review session with repository access.
2. Give it the relevant route and shared-shell files, requirement/acceptance
   rows, current `.dc.html`, runtime screenshots, and known defects.
3. Require at least 20 concrete design recommendations grounded in that
   repository evidence.
4. Score every candidate on:
   - user impact;
   - permission and data-safety preservation;
   - regression risk;
   - accessibility and EN/AR RTL quality;
   - implementation feasibility.
5. Select the highest-rated 10. Record the score and why each survived.
6. Apply a no-functionality-loss qualification to every selected item. Reject
   any recommendation that removes or weakens an authorized destination, deep
   link, route guard, RBAC/RLS policy, workflow transition, immutable version,
   audit/data-truth behavior, responsive state, accessibility behavior, or
   EN/AR RTL outcome.
7. Send Claude Design only the ranked top-10 design brief, page-specific
   constraints, and measurable acceptance criteria. Do **not** paste workflow
   instructions such as "ask ChatGPT first" into Claude Design; those belong in
   the builder packet and session handoff.
8. Have Claude Design resolve the design, then verify all 10 against the
   rendered result before re-vendoring or implementing.

Required evidence:

- ChatGPT/Codex review task or conversation id;
- the 20+ candidate list;
- the scored top 10;
- the concise brief sent to Claude Design;
- Claude Design project/file revision;
- a pass/fail table for the 10 items;
- the no-functionality-loss regression results.

### 1. Get the authoritative design

```
mcp__claude-design__read_file
  project_id: 5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61
  path: "<designPage>"            # admin pages live under admin/
```

Compare against the vendored copy in `designs/<channel>/`. If they differ, the
project wins — re-vendor before building, and say in your report that the
mirror was stale.

`mcp__claude-design__render_preview` gives you the design rendered. Screenshot
it at each declared width.

### 2. Get the declared widths and the RTL flag

`product-contract/web-admin-phase1/DESIGN_ROUTE_MAP.csv` carries, per design
file: `target_routes`, `reference_viewport`, `responsive_matrix`, `desktop_rtl`,
`required_states`, `visual_acceptance`, `functional_acceptance`. `brief.py`
prints these. Use them — do not invent a breakpoint set.

### 3. Diff

For each declared width, and for both `dir=ltr` (EN) and `dir=rtl` (AR):

- Design screenshot vs. shipped-route screenshot, same viewport.
- Enumerate every difference: layout structure, spacing scale, type scale,
  component choice, iconography, state coverage (loading / empty / error /
  unauthorized / partial-service), and token usage.
- Check the states the design declares actually exist in the app, not just the
  happy path.

Record the diff as a list. "Looks close" is not a parity result.

### 4. Resolve each difference

- **App is wrong** → fix the app.
- **Design is wrong, missing a state, or contradicts the requirement baseline**
  → do not invent it in code. Post the change into Claude Design:

  ```
  mcp__claude-design__put_conversation   # state the change and why, with the
                                         # requirement id that forces it
  mcp__claude-design__write_files        # if you are making the edit yourself,
                                         # pass if_match with the etag you read
  ```

  Then re-read the page, re-vendor it into `designs/<channel>/`, and implement
  against the updated page. The repo and the design project must not drift.

- **Neither has the answer** (an ungoverned value) → render "Not configured" and
  raise it as an open decision. Never invent the value.

### Colour law

Design-system tokens only — `var(--ds-*)` with no hex fallback, `token(...)`, or
a component's own `appearance`. Banned in every file: hex, `rgb()`, `rgba()`,
`hsl()`, Tailwind colour utilities, named CSS colours, colour constant maps.
Check before committing:

```bash
grep -rnE "(#[0-9a-fA-F]{3,8}|rgba?\(|hsl a?\(|bg-(red|green|blue|yellow|orange|slate|gray|amber|emerald|teal|cyan|indigo|violet|rose)-|text-(red|green|blue|yellow|orange|slate|gray|amber|emerald|teal|cyan|indigo|violet|rose)-)" \
  --include="*.tsx" --include="*.ts" --include="*.css" apps/web/src | grep -v node_modules
```

Zero output = proceed.

---

## Browser gate — the definition of done

Nothing is done until it works in Google Chrome. Typecheck, unit tests and a
static screenshot are inputs, not the gate.

### 1. Start the app

```bash
cd apps/web && npm run dev
```

Serves on `127.0.0.1:3000`. **Never run `next build` while this is live** — the
dev server and the production build share `apps/web/.next`, and building over a
running dev server corrupts the cache and hangs the server. This has already
happened on this workstation. Use `npm run typecheck` to verify compilation.

### 2. Drive Chrome

Use `mcp__claude-in-chrome__*`. Load the tools you need in **one** ToolSearch
call:

```
select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,
mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,
mcp__claude-in-chrome__form_input,mcp__claude-in-chrome__read_console_messages,
mcp__claude-in-chrome__read_network_requests,mcp__claude-in-chrome__resize_window
```

### 3. Sign in for real

Pick the persona whose role owns the module (`apps/web/e2e/personas.ts`):
planner, inspector, reviewer, admin, ops. Sign in through the real login form.
Do not bypass auth, stub a session, or relax a role check.

No suitable account? Provision one against project `iiozvqntawxfwbgffzqu`:

```bash
supabase login          # if needed
# create the user via the Auth Admin API with the service-role key, then
# grant the role/assignment rows the module requires
```

`scripts/seed/seed_inspectors.py` is the worked example. Seed data for other
shapes comes from the Drive `Seeders/` folder — see `RESOURCES.md`.

### 4. Exercise the functionality

Paint is not proof. Per the card, actually do the work the module exists for:
create, edit, submit, approve, reject, filter, search, paginate, upload, export.
Then confirm the effect persisted — reload, or check the row in Supabase.

Also walk the negative paths the design declares: empty, loading, error,
unauthorized, offline/partial-service.

Both directions: run the module in EN/LTR and in AR/RTL.

### 5. Read the instruments

- `read_console_messages` — any error or unhandled rejection is a finding.
- `read_network_requests` — any 4xx/5xx, and any request that should have fired
  and did not.

### 6. Capture evidence

Screenshot each declared width, each state, both directions. Write evidence
paths through `apps/web/e2e/evidence-path.ts`; binary evidence goes under
`INSPECTION_DOCS_ROOT`, never committed to Git.

### Severity

- **P0** — data loss, security/permission bypass, workflow corruption, module
  unusable.
- **P1** — a required behaviour, state, field, rule or audit event missing or
  wrong.
- **P2** — cosmetic drift inside an otherwise correct surface.

No completion claim while a P0 or P1 is open. Say what is open; do not round up.

---

## Publish — status to the board

### 1. Move the lanes in the repo copy

```bash
python3 .claude/skills/orchestrator/scripts/board.py show <card-id>
python3 .claude/skills/orchestrator/scripts/board.py set <card-id> \
  --design 92 --code 100 --wiring 95 \
  --evidence "Chrome proof: created+approved a request as reviewer@mim.gov.sa at 1440/1024, EN+AR; parity diff clean vs SAQEEL Enforcement.dc.html" \
  --by claude-code
```

`set` refuses to raise a lane without `--evidence`. Pending items you did not
clear stay on the card — clear them explicitly with `--clear-pending <index>`
and only when the work is actually done.

### 2. Push the board to Claude Design

`SAQEEL Status Board.dc.html` in the design project is a **renderer**. Its own
words: *"Agents update `status/saqeel-status.json`; this page only renders it."*
It reads the project-local file `status/saqeel-status.json`.

So publishing means getting the repo copy onto that path. Never hand-edit the
`.dc.html`; never publish anywhere else. Google Drive is not a status target.

```bash
python3 .claude/skills/orchestrator/scripts/board.py publish
```

That prints the revision, the target, and which of the two routes below applies.

### Publishing the board: minify, then delegate

`mcp__claude-design__write_files` takes inline `data` only — `local_path`
returns *"not yet implemented for server-side callers"*. So the payload must be
emitted as tokens, and **~71 KB pretty-printed exceeds a single response's
output budget.** Two attempts failed mid-emit (a truncated call is malformed and
never reaches the server, so nothing is corrupted — but nothing lands either).

**What works, verified 2026-07-26:**

1. **Minify.** `json.dumps(d, separators=(",",":"), ensure_ascii=False)` takes
   71 KB → 55 KB, a 22% cut that fits. Confirm semantic equality first:
   `json.loads(mini) == d`. Whitespace was never under governance.
2. **Delegate the transfer.** Give a subagent one job: read the local file,
   `cmp` its staged transcription against the source, and send it in a single
   `write_files` with `if_match`. Tell it not to narrate or echo the payload —
   the whole output budget goes to the tool call.
3. **Verify by script after the write**, not by eye: JSON parses, revision
   matches, card count matches, and the specific card you moved reads correctly.

**Consequence:** the project copy is minified, the repo copy is `indent=2`.
Future comparisons must be **parsed-object diffs, not byte diffs**.

**Before publishing, always diff card-by-card** against the commit whose board
matches what is currently on the project. If only your card changed and nothing
regressed, a wholesale publish IS a surgical single-card update — no hand-merge
needed. If any other card would move, stop: you hold no evidence for it.

### Route A — ask Claude Design to pull (default)

Post the request into the project chat, then a Claude Design session (which can
read the repo) copies the file across:

```
mcp__claude-design__put_conversation
  project_id: 5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61
  title:      "Board reconciliation <rev> — sync request"
  messages:   [{role:"user", …}, {role:"assistant", …}]
```

State in the message: the repo path and branch, the revision, the byte count,
the `if_match` etag to guard the write, and *"copy it byte-for-byte rather than
regenerating it."* Then verify by re-reading the project copy's `revision`.

### Route B — small, surgical writes

`write_files` is fine for anything small: a `.dc.html` design edit, a single
support file. Read first for the `etag`, write with `if_match`, and record it:

```bash
python3 .claude/skills/orchestrator/scripts/board.py record-publish \
  --revision <rev> --etag <etag returned by the write>
```

**On an `if_match` conflict, stop and reconcile — do not force.** Someone edited
the board in Claude Design while you worked. Read both copies, merge by card,
and only then re-push.

**Known drift (2026-07-26):** the project copy was at `SB-r4`
(`updatedBy: claude-design`, branch `feature/ipad-field-channel-delivery`) while
the repo was at `SB-r9` (`updatedBy: codex`). These are two lineages, not one
behind the other. Reconcile card-by-card the first time you publish; after that
the repo is the source and the project copy is a mirror.

The three CSVs beside it (`status/saqeel-status-cards.csv`, `-pending.csv`,
`-rollup.csv`) are exports for humans. The board page does not read them. Only
regenerate them if the user asks.

---

## PR

```bash
git -C <worktree> add -A
git -C <worktree> commit -m "feat(<card-id>): <what shipped>"
git -C <worktree> push -u origin saqeel/<card-id>
gh pr create --base main --head saqeel/<card-id> --title "..." --body "..."
```

Never push to `main`. Never merge. The PR body carries: card id, lanes moved
with evidence, parity result, browser proof (routes exercised, account, widths,
directions, screenshots), tests run, and what remains open.
