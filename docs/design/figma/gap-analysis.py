#!/usr/bin/env python3
"""
Deterministic Figma coverage gap for the SAQEEL design system.

Inputs
  status/saqeel-status.json      the 57-card delivery board (authority for what exists)
  docs/design/figma/BASELINE-2026-07-31.json   the frozen Figma baseline

Output
  docs/design/figma/GAP-ANALYSIS.md
  docs/design/figma/jira-figma-subtasks.csv    Jira CSV import format
  docs/design/figma/jira-figma-subtasks.json   REST v3 bulk-create payload

PWA is out of scope by Product Owner ruling 2026-07-31 and is excluded.
Run from the repo root:  python3 docs/design/figma/gap-analysis.py
"""
import json, csv, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[3]
OUT = ROOT / "docs/design/figma"

board = json.loads((ROOT / "status/saqeel-status.json").read_text())
baseline = json.loads((OUT / "BASELINE-2026-07-31.json").read_text())

# Which board card each existing Figma screen actually satisfies.
# Only routes whose Figma frame contains real UI count. The six /admin/* frames
# render the RBAC-refusal .saqeel-state, so they satisfy NOTHING.
FIGMA_COVERS = {
    "/dashboard":            "dashboard",
    "/operations":           "operations",
    "/factory-360":          "factories",
    "/planning":             "planning",
    "/reviews":              "reviews",
    "/compliance":           "m6-library",
    "/enforcement-library":  "m6-enforcement",
    "/compliance/approvals": "m6-requests",
}
# Built in Figma but satisfying no board card (repo route with no card of its own)
ORPHAN_FRAMES = ["/execution", "/analytics"]
# Built in Figma but content-free
REFUSAL_ONLY = [r for r in baseline["screens"]["routes"] if r.startswith("/admin/")]

# Shell is delivered as components (App sidebar / App topbar / nav-item), not as a screen.
COVERED_AS_COMPONENTS = {"shell-f0"}

covered = set(FIGMA_COVERS.values()) | COVERED_AS_COMPONENTS

in_scope = [c for c in board["cards"] if c["channel"] in ("web", "admin")]
pending = [c for c in in_scope if c["id"] not in covered]

# Reference-only cards carry no screens to build
REFERENCE_ONLY = {"webref"}
pending_real = [c for c in pending if c["id"] not in REFERENCE_ONLY]


def priority(card):
    """Lower design% and higher code% = code shipped without a design of record = most urgent."""
    d = card.get("design") or 0
    c = card.get("code") or 0
    if c >= 85 and d < 65:
        return "High"
    if c >= 70:
        return "Medium"
    return "Low"


def pages_for(card):
    return (card.get("designPage") or "").strip()


# ---------------------------------------------------------------- GAP markdown
lines = []
lines.append("# SAQEEL Figma — coverage gap\n")
lines.append(f"Generated from `status/saqeel-status.json` (revision {board.get('revision')}, "
             f"updated {board.get('updated')}) against `BASELINE-2026-07-31.json`.\n")
lines.append("PWA (25 cards) is **out of scope** by Product Owner ruling 2026-07-31 and is excluded throughout.\n")

lines.append("\n## Headline\n")
lines.append(f"- In-scope board cards (web + admin): **{len(in_scope)}**")
lines.append(f"- Satisfied by an existing Figma screen: **{len(FIGMA_COVERS)}**")
lines.append(f"- Satisfied as components rather than a screen: **{len(COVERED_AS_COMPONENTS)}** (`shell-f0`)")
lines.append(f"- Reference-only, nothing to build: **{len(REFERENCE_ONLY)}** (`webref`)")
lines.append(f"- **Pending Figma work: {len(pending_real)} cards**\n")
lines.append(f"- Figma frames that satisfy no board card: {', '.join(ORPHAN_FRAMES)}")
lines.append(f"- Figma frames that are RBAC-refusal states, not admin UI: {len(REFUSAL_ONLY)} "
             f"(`{'`, `'.join(REFUSAL_ONLY)}`)\n")
lines.append("> Real admin coverage in Figma is **zero screens**. The six `/admin/*` frames were built "
             "faithfully to `design/final-cut/saqeel-revamp.html`, which renders the refusal state for its "
             "persona — but `designs/admin/` (21 `.dc.html`, now the admin canon) describes a complete admin "
             "product behind its own `ad-*` shell that does not exist in Figma at all.\n")

for ch, label in (("web", "Web"), ("admin", "Admin")):
    rows = [c for c in pending_real if c["channel"] == ch]
    lines.append(f"\n## {label} — {len(rows)} cards pending Figma\n")
    lines.append("| Card | Name | design% | code% | Priority | Design source (.dc.html) |")
    lines.append("|---|---|---|---|---|---|")
    for c in sorted(rows, key=lambda x: -(x.get("code") or 0)):
        lines.append(f"| `{c['id']}` | {c['name']} | {c.get('design')} | {c.get('code')} | "
                     f"{priority(c)} | {pages_for(c)} |")

lines.append("\n## Why `High` priority\n")
lines.append("`code% >= 85` with `design% < 65` means the route is **already shipped in the repo with no "
             "design of record**. Those are the cards where Figma is furthest behind reality, and where a "
             "design-system-first correction has the most leverage.\n")

lines.append("\n## Structural work (not screen work)\n")
lines.append("These block making Figma the authority rather than a mirror, and are tracked separately:\n")
lines.append("1. **`ad-*` admin shell** — 68 classes in `designs/admin/admin/saqeel/admin-shell.css` "
             "(ad-shell, ad-rail, ad-pal command palette, ad-hubcard, ad-subnav, ad-state--denied). "
             "None exist in Figma. Prerequisite for every admin card.")
lines.append("2. **Real Table primitive** — `thead`/`tr` hard-code 4 columns at fixed widths; 365 cells were "
             "converted to instances but the row is not composable. Needs a column-count property.")
lines.append("3. **Admin token delta** — `--text-muted` differs in both modes "
             "(light `#5f666c`, dark `#99a0a8`) and `--transition-fast/base/slow` exist only in admin. "
             "2 mode values + 3 new variables.")
lines.append("4. **AR regeneration** — the 32 AR frames are detached; 543 nodes still pinned at 60px "
             "and 36 overflow. One pass, after structural work settles.")

(OUT / "GAP-ANALYSIS.md").write_text("\n".join(lines) + "\n")

# ---------------------------------------------------------------- Jira exports
PROJECT = "INSP"
PARENT = "INSP-1"          # board 862 epic/parent supplied by the Product Owner

issues = []
for c in pending_real:
    issues.append({
        "project": PROJECT,
        "parent": PARENT,
        "issuetype": "Subtask",
        "summary": f"Figma: {c['name']} ({c['channel']}) — build design-system screen",
        "priority": priority(c),
        "labels": ["figma", "design-system", f"channel-{c['channel']}", f"card-{c['id']}"],
        "description": (
            f"Build the Figma screen(s) for board card `{c['id']}` ({c['channel']}).\n\n"
            f"Design source: {pages_for(c) or 'NONE — design source must be identified first'}\n"
            f"Repo route(s): {c.get('route')}\n"
            f"Board state at capture: design {c.get('design')}% / code {c.get('code')}% / wiring {c.get('wiring')}%\n\n"
            "Definition of done:\n"
            "- Screen built at 1280 wide from published SAQEEL library components (no hand-drawn frames)\n"
            "- Every fill and stroke bound to a Color variable (0 unbound paints)\n"
            "- Every text node carries a t-* text style with explicit line-height\n"
            "- Status renders as badge + text, never colour alone\n"
            "- Ungoverned values render 'Not configured' / 'Decision required'\n"
            "- EN·Light built first; Dark / AR·RTL generated in the batch pass\n"
        ),
    })

with (OUT / "jira-figma-subtasks.csv").open("w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["Project Key", "Parent", "Issue Type", "Summary", "Priority", "Labels", "Description"])
    for i in issues:
        w.writerow([i["project"], i["parent"], i["issuetype"], i["summary"],
                    i["priority"], " ".join(i["labels"]), i["description"]])

(OUT / "jira-figma-subtasks.json").write_text(json.dumps(
    {"issueUpdates": [{"fields": {
        "project": {"key": i["project"]},
        "parent": {"key": i["parent"]},
        "issuetype": {"name": i["issuetype"]},
        "summary": i["summary"],
        "labels": i["labels"],
        "description": i["description"],
    }} for i in issues]}, indent=2))

print(f"in-scope cards      : {len(in_scope)}")
print(f"covered by Figma    : {len(FIGMA_COVERS)} screens + {len(COVERED_AS_COMPONENTS)} as components")
print(f"reference-only      : {len(REFERENCE_ONLY)}")
print(f"PENDING Figma cards : {len(pending_real)}  (web {sum(1 for c in pending_real if c['channel']=='web')}, admin {sum(1 for c in pending_real if c['channel']=='admin')})")
print(f"  High   : {sum(1 for c in pending_real if priority(c)=='High')}")
print(f"  Medium : {sum(1 for c in pending_real if priority(c)=='Medium')}")
print(f"  Low    : {sum(1 for c in pending_real if priority(c)=='Low')}")
print(f"wrote {OUT/'GAP-ANALYSIS.md'}")
print(f"wrote {OUT/'jira-figma-subtasks.csv'}")
print(f"wrote {OUT/'jira-figma-subtasks.json'}")
