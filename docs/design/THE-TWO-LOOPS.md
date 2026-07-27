# The two loops

Keep this file. It is the whole working practice.

---

## Loop A — implement a screen

Say to Claude Code:

```
Screen: <name>

Contract: docs/design/CLASS-CONTRACT.md § "<name>"
Route:    apps/web/src/app/(app)/<route>/
Rules:    CLAUDE.md

Existing working code is authority. Implement only genuine gaps — missing regions,
controls, states, destructive treatments. Do not convert working tables or replace
existing component vocabulary.

Write no CSS. Typecheck and run the grep checks. Report what you added and skipped.
```

Change two lines: screen name, route. Nothing else.

For a batch, list the screens and add *"work through these in order, without stopping
between them; one summary at the end."*

---

## Loop B — the design changed

When the design in Claude Design is updated, say to me:

> **"Re-export and refresh the contract."**

That is the whole instruction. I will:

1. Rebuild `saqeel-revamp.html` from the current artifact.
2. Re-extract `CLASS-CONTRACT.md` by walking the rendered page.
3. Diff it against the previous contract and tell you **only what changed**.
4. Hand you both files plus one `mv`/`git` command.

Then say to Claude Code:

```
Pull latest. docs/design/CLASS-CONTRACT.md changed.

Changed screens: <list I give you>

Re-read those sections and apply only the deltas. Do not re-implement anything else.

Write no CSS. Typecheck and run the grep checks.
```

**Never** hand-edit `CLASS-CONTRACT.md`. It is extracted, not written — editing it makes it
lie about the design, and then nothing is trustworthy.

---

## The one rule under both loops

Claude Code writes no CSS. Every class already exists in the repo. If it needs one that
doesn't, it stops and reports — that is a design-system change request, not a page fix.

Four checks catch violations in ten seconds:

```bash
grep -rn "style={{" apps/web/src/app/
grep -rEn "#[0-9a-fA-F]{6}|rgb\(" apps/web/src/app/
grep -roE "\bax-[a-z-]+|astryx" apps/web/src/
grep -rEn "(padding|margin)-(left|right)" apps/web/src/app/
```

---

## When something comes back wrong

Never say *"make it match the design"* — that triggers a rebuild from memory and loses
detail. Say:

> Element X uses class `.foo` in the contract. You used `.bar`. Change it to `.foo`.
> Change nothing else.

Name the element, the class, the file. One property at a time.

---

## What lives where

| File | What it is | Who edits it |
| --- | --- | --- |
| `design/final-cut/saqeel-revamp.html` | The design, running | Me, via re-export |
| `docs/design/CLASS-CONTRACT.md` | Extracted structure per screen | Me, via re-extract — never by hand |
| `docs/design/HANDOFF.md` | Routes, states, RBAC, rationale | Me |
| `CLAUDE.md` | The rules Claude Code loads every session | Rarely, deliberately |
