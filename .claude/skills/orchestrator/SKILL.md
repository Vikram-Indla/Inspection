---
name: orchestrator
description: SAQEEL module delivery operating system. Ask for a module name from the status board, discover its real state in the repo, diff it pixel-to-pixel against its Claude Design page, finish the pending work, prove it in Google Chrome with a seeded account, publish the board back to Claude Design, and raise a PR. Use whenever the user says "orchestrator", names a SAQEEL board module, or asks to deliver/finish/verify a SAQEEL module.
---

# SAQEEL Orchestrator

One module in, one delivered-and-proven module out. This skill is the runnable
form of `product-contract/operationalization/SAQEEL_OPERATING_SYSTEM.md`; that
document remains the authority on anything this skill does not state.

## The law, in four lines

1. **Design authority is Claude Design**, not the running app and not memory.
2. **A lane number never rises without evidence.** Ungoverned values render
   "Not configured" — never an invented value.
3. **Done means the functionality works in Google Chrome** against real data
   under a real signed-in account. Typecheck green is not done. A screenshot of
   a static page is not done.
4. **Ownership is declared in `config.json`, not assumed.** Today: web is Claude
   Code's, admin is Codex's, PWA belongs to a different developer and is
   read-only here. See `references/OWNERSHIP.md` to change that.

## Step 0 — Ask for the module

If the user did not name a module, ask for one, and list the board so they can
pick. Do not guess, and do not start on the module you worked on last session.

```bash
python3 .claude/skills/orchestrator/scripts/brief.py --list
```

Accept a card id (`operations`), a card name (`M3 Operations Center + Live`), or
a design page title. Resolve it to exactly one card id before going further. If
the input matches more than one card, show the matches and ask again.

`brief.py` prints each channel's owner. If the resolved card's channel is owned
by `other-developer`, **stop**: report its current board state, say who owns it,
and do not edit its files or move its lanes. Taking that channel is a decision
for the Product Owner, not for you — see `references/OWNERSHIP.md` §Taking a
channel.

## Step 1 — Discovery (never skip, never shorten)

```bash
python3 .claude/skills/orchestrator/scripts/brief.py <card-id>
```

That prints the card, its owner CLI, its design page, its route files, its
requirement-baseline rows, its acceptance ids, its dependencies, its declared
pending items per lane, and the git/worktree state. Read all of it.

Then verify the brief against reality — the brief reports what the board
*claims*:

- Open each route file it names and read what is actually implemented.
- Run the app and load the route (Step 3 setup) before believing any lane number.
- Grep for `TODO`, mock data, hardcoded arrays, and `Not configured` fallbacks
  on the module's surfaces.
- Check whether a worktree/branch for this card already exists
  (`git worktree list`) — resume it rather than starting a rival branch.

Produce a **discovery verdict**: for each lane (design / code / wiring), the
number the board claims, the number you can evidence, and the delta. If your
evidenced number is *lower* than the board's, that is a finding — say so; do not
quietly proceed.

## Step 2 — Design parity

Read `references/PHASES.md` §Parity for the full procedure. In short:

1. Read the card's `.dc.html` from `designs/<channel>/` (vendored) **and**
   confirm it matches the live Claude Design project file — the project is the
   authority; the vendored copy can be stale.
2. Render the design and the shipped route side by side at every declared width,
   in **EN/LTR and AR/RTL**, and enumerate every difference: structure, spacing,
   type, states, empty/loading/error, token usage.
3. Where the shipped route is wrong → fix the code.
4. Where the **design** is wrong or missing → do not invent it in code. Post the
   change request into Claude Design (`mcp__claude-design__*`), get the page
   updated, re-vendor it into `designs/<channel>/`, then implement.

Colour law applies with no exception: design-system tokens only, never a hex,
`rgb()`, `hsl()`, or a Tailwind colour utility.

## Step 3 — Build the pending work

The channel's owner in `config.json` decides who writes the code:

- **`claude-code`** → you write it, in the card's worktree.
- **`codex`** → hand the packet to Codex via `mcp__codex__codex`. You stay the
  orchestrator: you write the packet, you review the diff, you run the browser
  proof. `references/OWNERSHIP.md` has the packet template and the path fence.
- **`other-developer`** → you already stopped at Step 0.

Today that means web → you, admin → Codex, pwa → stop.

Rules that bite:

- Never run `next build` while a dev server holds `apps/web/.next` — it corrupts
  the cache and hangs the server. Use `npm run typecheck` in `apps/web`.
- One card, one file set. Do not touch another card's paths.
- Real wiring only. A permanent mock is not a completion.
- Both directions: EN/LTR and AR/RTL.

## Step 4 — Prove it in Google Chrome

This is the gate. Read `references/PHASES.md` §Browser gate.

Run the app, sign in through the real login with a seeded persona
(`apps/web/e2e/personas.ts`), navigate to the module, and **exercise the
functionality** — not just the paint. Create, edit, submit, reject, filter,
paginate, whatever the card owns. Capture Chrome screenshots as evidence and
read the console and network panels for errors.

If no suitable account exists, provision one with the Supabase CLI against the
project in `references/RESOURCES.md` — never weaken auth to get in.

A module is not done while any P0/P1 remains open.

## Step 5 — Publish status

```bash
python3 .claude/skills/orchestrator/scripts/board.py set <card-id> \
  --design N --code N --wiring N --evidence "<what proves it>" --by "claude-code"
```

Then push the board to Claude Design — `SAQEEL Status Board.dc.html` only
*renders* `status/saqeel-status.json` inside the design project, so publishing
is one `write_files` of the repo copy onto the project copy, guarded by
`if_match`. See `references/PHASES.md` §Publish. Status never goes to Drive.

Every number you move must carry evidence in the same commit. Pending items you
did not clear stay on the card — do not delete them to make the card look clean.

## Step 6 — Raise the PR

Branch off the card's worktree, commit with the card id in the subject, push,
and open a PR into the repository default branch for human review. Never push to
`main` and never merge without explicit human approval.

The PR body states: card id, lanes moved with evidence, design parity result,
browser proof (routes exercised, account used, screenshots), tests run, and what
is still open.

## Reference files

| File | Read it when |
| --- | --- |
| `config.json` | You need to know — or change — who owns a channel. |
| `references/RESOURCES.md` | You need a Drive file id, the design project id, the Supabase project, or the seeded personas. |
| `references/OWNERSHIP.md` | Routing a card, taking a channel, writing a Codex packet, or fencing paths. |
| `references/PHASES.md` | Running parity, the browser gate, or publishing status. |
