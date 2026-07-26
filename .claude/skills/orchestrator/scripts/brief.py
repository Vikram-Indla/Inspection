#!/usr/bin/env python3
"""Emit the full delivery brief for one SAQEEL board card.

    brief.py --list              list every card with its owning CLI
    brief.py <card>              full brief for one card
    brief.py <card> --json       machine-readable brief

<card> may be a card id, a card name, or a design page title. The match is
case-insensitive and substring-tolerant; an ambiguous match is an error, not a
guess.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
SPINE = REPO / "status" / "saqeel-status.json"
PHASE1 = REPO / "product-contract" / "web-admin-phase1"
ROUTE_MAP = PHASE1 / "DESIGN_ROUTE_MAP.csv"
BASELINE = PHASE1 / "REQUIREMENT_BASELINE.csv"

CONFIG = Path(__file__).resolve().parents[1] / "config.json"
OUT_OF_SCOPE = "other-developer"

# Channel ownership lives in config.json so it is declared in one place and can
# be handed over without editing code. See that file's _comment.
_owners = json.loads(CONFIG.read_text(encoding="utf-8"))["channelOwners"]


def owner(channel: str) -> str:
    return _owners.get(channel, OUT_OF_SCOPE)


def in_scope(channel: str) -> bool:
    return owner(channel) != OUT_OF_SCOPE

csv.field_size_limit(10_000_000)


def load_spine() -> dict:
    if not SPINE.exists():
        sys.exit(f"STOP: no board at {SPINE}")
    return json.loads(SPINE.read_text(encoding="utf-8"))


def resolve(spine: dict, needle: str) -> dict:
    cards = spine["cards"]
    for c in cards:
        if c["id"].lower() == needle.lower():
            return c
    n = needle.lower()
    hits = [
        c
        for c in cards
        if n in c["id"].lower()
        or n in c["name"].lower()
        or n in (c.get("designPage") or "").lower()
    ]
    if len(hits) == 1:
        return hits[0]
    if not hits:
        sys.exit(f"STOP: no card matches {needle!r}. Run --list.")
    sys.exit(
        "STOP: ambiguous — "
        + ", ".join(f"{c['id']} ({c['name']})" for c in hits)
    )


def design_dir(channel: str) -> Path:
    base = REPO / "designs" / channel
    for cand in (base, *sorted(p for p in base.glob("*") if p.is_dir())):
        if any(cand.glob("*.html")):
            return cand
    return base


def design_files(card: dict) -> list[dict]:
    """Resolve the card's designPage to real files.

    Cards abbreviate the second and later titles with an ellipsis
    ('SAQEEL M3 Operations Center - WA-DES-033-C3.dc.html · …Live - WA-DES-034-C3
    .dc.html'), so a literal filename match is not enough. Resolve each candidate
    against the files that actually exist, preferring the WA-DES id.
    """
    raw = card.get("designPage") or ""
    ddir = design_dir(card["channel"])
    on_disk = sorted(p.name for p in ddir.glob("*.html"))

    out: list[dict] = []
    seen: set[str] = set()
    for cand in re.findall(r"[^·,()]+?\.(?:dc\.)?html", raw):
        # Cards sometimes prefix the channel folder ('pwa/SAQEEL ….dc.html');
        # designs/<channel>/ already is that folder.
        cand = cand.strip().lstrip("… .").split("/")[-1]
        wa = re.search(r"WA-[A-Z]+-\d+", cand)
        match = None
        if cand in on_disk:
            match = cand
        elif wa:
            match = next((n for n in on_disk if wa.group(0) in n), None)
        if match is None:
            tail = cand.lower()
            match = next((n for n in on_disk if n.lower().endswith(tail)), None)
        name = match or cand
        if name in seen:
            continue
        seen.add(name)
        out.append({
            "title": name,
            "declared_as": cand,
            "wa_id": wa.group(0) if wa else None,
            "resolved": match is not None,
        })
    return out


def route_map_rows(files: list[dict]) -> list[dict]:
    """Join to DESIGN_ROUTE_MAP.

    The route map keys on the base design filename ('SAQEEL Operations
    Center.dc.html') while cards cite the revised page ('SAQEEL M3 Operations
    Center - WA-DES-033-C3.dc.html'). The WA-DES id is the reliable join.
    """
    if not ROUTE_MAP.exists():
        return []
    names = {f["title"].strip().lower() for f in files}
    wa_ids = {f["wa_id"] for f in files if f["wa_id"]}
    # 'WA-DES-033-C3' in the card is design_id 'WA-DES-033' in the map.
    wa_base = {re.match(r"WA-[A-Z]+-\d+", w).group(0) for w in wa_ids}

    with ROUTE_MAP.open(encoding="utf-8", newline="") as fh:
        return [
            r
            for r in csv.DictReader(fh)
            if (r.get("design_file") or "").strip().lower() in names
            or (r.get("design_id") or "").strip() in wa_base
        ]


def baseline_rows(req_ids: set[str], routes: set[str]) -> list[dict]:
    if not BASELINE.exists():
        return []
    out = []
    with BASELINE.open(encoding="utf-8", newline="") as fh:
        for r in csv.DictReader(fh):
            if r.get("requirement_id") in req_ids:
                out.append(r)
                continue
            tr = r.get("target_routes") or ""
            if routes and any(rt and rt in tr for rt in routes):
                out.append(r)
    return out


def split_multi(value: str) -> set[str]:
    return {p.strip() for p in re.split(r"[;,|]", value or "") if p.strip()}


def git(*args: str) -> str:
    try:
        return subprocess.run(
            ["git", "-C", str(REPO), *args],
            capture_output=True, text=True, check=False,
        ).stdout.strip()
    except OSError:
        return ""


def worktrees_for(card_id: str) -> list[str]:
    return [
        ln
        for ln in git("worktree", "list").splitlines()
        if card_id in ln
    ]


def resolve_code_paths(raw: str) -> list[tuple[str, str | None]]:
    """Cards write paths loosely: 'web/src/app/(app)/operations (+ live,
    exceptions) · OpsMap.tsx · sla.ts'. Strip the prose, then resolve each
    fragment against the tree — bare filenames get a glob."""
    out: list[tuple[str, str | None]] = []
    for frag in re.split(r"[·|]", raw or ""):
        frag = frag.strip()
        if not frag:
            continue
        # Drop a trailing annotation like " (+ live, exceptions)" without
        # eating a Next.js route group like "(app)" — require the whitespace.
        p = re.sub(r"\s+\([^()]*\)\s*$", "", frag).strip()
        if not p:
            continue
        found = None
        for base in ("", "apps", "apps/web", "apps/web/src"):
            root = REPO / base if base else REPO
            if "*" in p:
                hits = sorted(str(h.relative_to(REPO)) for h in root.glob(p))
                if hits:
                    found = hits[0] + (
                        f"  (+{len(hits) - 1} more)" if len(hits) > 1 else ""
                    )
                    break
                continue
            if (root / p).exists():
                found = str((root / p).relative_to(REPO))
                break
        if found is None and "/" not in p:
            hits = sorted(
                str(h.relative_to(REPO))
                for h in (REPO / "apps" / "web" / "src").rglob(p)
            )
            if hits:
                found = hits[0] + (f"  (+{len(hits) - 1} more)" if len(hits) > 1 else "")
        out.append((frag, found))
    return out


def cmd_list(spine: dict) -> None:
    print(f"SAQEEL board {spine['revision']} — updated {spine['updated']}\n")
    for ch in ("web", "admin", "pwa"):
        cards = [c for c in spine["cards"] if c["channel"] == ch]
        mark = "" if in_scope(ch) else "   [out of scope — read-only]"
        print(f"── {ch}  ({len(cards)} cards)  owner: {owner(ch)}{mark}")
        for c in cards:
            n = lambda v: " ref" if v is None else f"{v:3d}"
            print(
                f"   {c['id']:<20} d{n(c['design'])} c{n(c['code'])} w{n(c['wiring'])}"
                f"  {c['name']}"
            )
        print()


def build_brief(spine: dict, card: dict) -> dict:
    ch = card["channel"]
    files = design_files(card)
    ddir = design_dir(ch)
    rows = route_map_rows(files)

    req_ids: set[str] = set()
    routes: set[str] = set()
    acc_ids: set[str] = set()
    for r in rows:
        req_ids |= split_multi(r.get("requirement_ids", ""))
        routes |= split_multi(r.get("target_routes", ""))
        acc_ids |= split_multi(r.get("acceptance_ids", ""))

    return {
        "card": card,
        "owner": owner(ch),
        "in_scope": in_scope(ch),
        "design_files": [
            {
                **f,
                "vendored": str((ddir / f["title"]).relative_to(REPO)),
                "vendored_exists": (ddir / f["title"]).exists(),
                # Every channel lives in its own folder in the design project.
                # The root holds only SAQEEL Status Board.dc.html.
                "claude_design_path": f"{ch}/{f['title']}",
            }
            for f in files
        ],
        "route_map": [
            {
                k: r.get(k)
                for k in (
                    "design_id", "design_file", "target_routes", "target_persona",
                    "reference_viewport", "responsive_matrix", "desktop_rtl",
                    "required_states", "visual_acceptance", "functional_acceptance",
                    "current_implementation_files", "delta_class", "deviation_status",
                )
            }
            for r in rows
        ],
        "requirement_ids": sorted(req_ids),
        "acceptance_ids": sorted(acc_ids),
        "routes": sorted(routes),
        "requirements": [
            {
                k: r.get(k)
                for k in (
                    "requirement_id", "module", "capability", "purpose",
                    "business_rules", "personas", "target_routes",
                    "acceptance_ids", "status", "disposition",
                )
            }
            for r in baseline_rows(req_ids, routes)
        ],
        "code_paths": resolve_code_paths(card.get("route") or ""),
        "git": {
            "branch": git("rev-parse", "--abbrev-ref", "HEAD"),
            "head": git("rev-parse", "--short", "HEAD"),
            "dirty": git("status", "--porcelain"),
            "worktrees": worktrees_for(card["id"]),
        },
    }


def render(b: dict) -> None:
    c = b["card"]
    n = lambda v: "ref" if v is None else str(v)
    bar = "=" * 72
    print(bar)
    print(f"CARD {c['id']}  —  {c['name']}")
    print(f"channel {c['channel']}   group {c.get('group')}   phase {c.get('phase')}"
          f"   complexity {c.get('complexity')}")
    print(f"OWNER: {b['owner']}")
    if not b["in_scope"]:
        print(f"\n*** OUT OF SCOPE. The {c['channel']} channel is owned by another\n"
              f"    developer. Report status and stop — do not edit its files and do\n"
              f"    not move its lanes. To take this channel, set channelOwners."
              f"{c['channel']} to \"claude-code\" in\n"
              f"    .claude/skills/orchestrator/config.json and say so in the session. ***")
    print(bar)

    print(f"\nLANES (board claim — verify each before believing it)")
    print(f"  design {n(c['design']):>4}   code {n(c['code']):>4}   "
          f"wiring {n(c['wiring']):>4}")

    print(f"\nDEPENDS ON: {', '.join(c.get('dependsOn') or []) or '(none)'}")

    print("\nPENDING (from the board)")
    for p in c.get("pending") or []:
        print(f"  [{p.get('lane','?'):6}] {p.get('text')}")
    if not c.get("pending"):
        print("  (none recorded — that is a claim, not a fact)")

    print("\nDESIGN PAGES (authority: Claude Design project 5e8154ad-…)")
    for d in b["design_files"]:
        mark = "vendored" if d["vendored_exists"] else "NOT VENDORED"
        print(f"  {d['title']}   [{mark}]")
        if not d["resolved"]:
            print(f"     ! card wrote {d['declared_as']!r} — no file matched; "
                  f"confirm the title in Claude Design")
        print(f"     claude-design path : {d['claude_design_path']}")
        print(f"     vendored copy      : {d['vendored']}")
    if not b["design_files"]:
        print(f"  (none parsed from designPage: {c.get('designPage')!r})")

    for r in b["route_map"]:
        print(f"\nROUTE MAP  {r['design_id']}  ({r['design_file']})")
        for k in ("target_routes", "target_persona", "reference_viewport",
                  "responsive_matrix", "desktop_rtl", "required_states",
                  "delta_class", "deviation_status"):
            if r.get(k):
                print(f"  {k:22} {r[k]}")
        for k in ("visual_acceptance", "functional_acceptance"):
            if r.get(k):
                print(f"  {k:22} {r[k][:400]}")

    print(f"\nREQUIREMENTS  ({len(b['requirements'])} rows)")
    for r in b["requirements"][:40]:
        print(f"  {r['requirement_id']:<10} {(r.get('status') or '-'):<12} "
              f"{(r.get('capability') or '')[:70]}")
    if len(b["requirements"]) > 40:
        print(f"  … {len(b['requirements']) - 40} more — read the CSV")
    print(f"\nACCEPTANCE IDS: {', '.join(b['acceptance_ids']) or '(none mapped)'}")

    print("\nCODE PATHS (from the card — read these before trusting any lane)")
    for declared, found in b["code_paths"]:
        if found:
            print(f"  {found}")
            if found.split("  ")[0] != declared:
                print(f"      (card wrote: {declared})")
        else:
            print(f"  NOT FOUND: {declared}")

    g = b["git"]
    print(f"\nGIT  branch {g['branch']}  head {g['head']}")
    if g["worktrees"]:
        print("  worktrees for this card (resume one, do not open a rival branch):")
        for w in g["worktrees"]:
            print(f"    {w}")
    else:
        print("  no worktree for this card yet")
    if g["dirty"]:
        print("  DIRTY working tree:")
        for ln in g["dirty"].splitlines()[:20]:
            print(f"    {ln}")

    print(f"\n{bar}")
    print("Next: verify every lane number against the running app before you "
          "trust it. See SKILL.md Step 1.")
    print(bar)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("card", nargs="?", help="card id, name, or design page")
    ap.add_argument("--list", action="store_true", help="list the whole board")
    ap.add_argument("--json", action="store_true", help="machine-readable brief")
    a = ap.parse_args()

    spine = load_spine()
    if a.list or not a.card:
        cmd_list(spine)
        if not a.card:
            print("Pass a card id to get its full brief.")
        return

    brief = build_brief(spine, resolve(spine, a.card))
    if a.json:
        json.dump(brief, sys.stdout, indent=2, ensure_ascii=False)
        print()
    else:
        render(brief)


if __name__ == "__main__":
    main()
