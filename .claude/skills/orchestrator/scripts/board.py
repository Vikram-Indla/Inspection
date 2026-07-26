#!/usr/bin/env python3
"""Read and move the SAQEEL status board, and publish it to Claude Design.

    board.py show <card>
    board.py set <card> --design N --code N --wiring N --evidence "..." --by who
    board.py add-pending <card> --lane code --text "..."
    board.py clear-pending <card> --index 0 --evidence "..."
    board.py publish [--print-payload]
    board.py record-publish --revision SB-r10 --etag <etag>

A lane number never rises without --evidence. That is the board's law, enforced
here so it cannot be forgotten.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
SPINE = REPO / "status" / "saqeel-status.json"
CONFIG = Path(__file__).resolve().parents[1] / "config.json"
RIYADH = timezone(timedelta(hours=3))
LANES = ("design", "code", "wiring")
OUT_OF_SCOPE = "other-developer"

# Channel ownership lives in config.json — one declaration, read by both scripts.
_owners = json.loads(CONFIG.read_text(encoding="utf-8"))["channelOwners"]


def owner(channel: str) -> str:
    return _owners.get(channel, OUT_OF_SCOPE)


def in_scope(channel: str) -> bool:
    return owner(channel) != OUT_OF_SCOPE


def now() -> str:
    return datetime.now(RIYADH).isoformat(timespec="seconds")


def load() -> dict:
    if not SPINE.exists():
        sys.exit(f"STOP: no board at {SPINE}")
    return json.loads(SPINE.read_text(encoding="utf-8"))


def save(spine: dict) -> None:
    SPINE.write_text(
        json.dumps(spine, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def find(spine: dict, card_id: str) -> dict:
    for c in spine["cards"]:
        if c["id"].lower() == card_id.lower():
            return c
    sys.exit(f"STOP: no card {card_id!r}. Run brief.py --list.")


def bump_revision(spine: dict) -> str:
    m = re.match(r"^(.*?)(\d+)$", str(spine.get("revision") or "SB-r0"))
    spine["revision"] = f"{m.group(1)}{int(m.group(2)) + 1}" if m else "SB-r1"
    return spine["revision"]


def stamp(spine: dict, by: str) -> None:
    spine["updated"] = now()
    spine["updatedBy"] = by
    try:
        spine["branch"] = subprocess.run(
            ["git", "-C", str(REPO), "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True, text=True, check=False,
        ).stdout.strip() or spine.get("branch")
    except OSError:
        pass


def show(card: dict) -> None:
    print(json.dumps(card, indent=2, ensure_ascii=False))


def cmd_show(a) -> None:
    show(find(load(), a.card))


def cmd_set(a) -> None:
    spine = load()
    card = find(spine, a.card)

    if not in_scope(card["channel"]):
        sys.exit(
            f"STOP: the {card['channel']} channel is owned by "
            f"{owner(card['channel'])}. This orchestrator does not move its lanes.\n"
            f"To take the channel, set channelOwners.{card['channel']} to "
            f'"claude-code" in\n{CONFIG}'
        )

    moves = {ln: getattr(a, ln) for ln in LANES if getattr(a, ln) is not None}
    if not moves:
        sys.exit("STOP: nothing to set. Pass at least one of --design/--code/--wiring.")

    raises = {ln: v for ln, v in moves.items()
              if card.get(ln) is not None and v > card[ln]}
    if raises and not a.evidence:
        sys.exit(
            "STOP: raising "
            + ", ".join(f"{ln} {card[ln]}→{v}" for ln, v in raises.items())
            + " needs --evidence. No number rises without proof."
        )

    for ln, v in moves.items():
        if not 0 <= v <= 100:
            sys.exit(f"STOP: {ln}={v} out of range 0..100")
        print(f"  {ln}: {card.get(ln)} → {v}")
        card[ln] = v

    log = card.setdefault("evidenceLog", [])
    log.append({
        "at": now(),
        "by": a.by,
        "lanes": moves,
        "evidence": a.evidence or "(no raise — evidence not required)",
    })

    rev = bump_revision(spine)
    stamp(spine, a.by)
    save(spine)
    print(f"\nboard {rev} written to {SPINE.relative_to(REPO)}")
    print("Now publish to Claude Design: `board.py publish`.")


def cmd_add_pending(a) -> None:
    spine = load()
    card = find(spine, a.card)
    if a.lane not in LANES:
        sys.exit(f"STOP: lane must be one of {LANES}")
    card.setdefault("pending", []).append({"lane": a.lane, "text": a.text})
    bump_revision(spine)
    stamp(spine, a.by)
    save(spine)
    print(f"added pending[{len(card['pending']) - 1}] on {card['id']}")


def cmd_clear_pending(a) -> None:
    spine = load()
    card = find(spine, a.card)
    items = card.get("pending") or []
    if not 0 <= a.index < len(items):
        sys.exit(f"STOP: index {a.index} out of range (0..{len(items) - 1})")
    if not a.evidence:
        sys.exit("STOP: clearing a pending item needs --evidence.")
    gone = items.pop(a.index)
    card.setdefault("evidenceLog", []).append({
        "at": now(), "by": a.by, "cleared": gone, "evidence": a.evidence,
    })
    bump_revision(spine)
    stamp(spine, a.by)
    save(spine)
    print(f"cleared [{gone.get('lane')}] {gone.get('text')}")


DESIGN_PROJECT = "5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61"
DESIGN_PATH = "status/saqeel-status.json"


def cmd_publish(a) -> None:
    """The Claude Design status board renders the project-local copy of this
    file. Publishing is one write: repo copy -> project copy."""
    spine = load()
    payload = json.dumps(spine, indent=2, ensure_ascii=False)
    if a.print_payload:
        print(payload)
        return

    last = (spine.get("published") or [{}])[-1]
    print(f"revision      {spine['revision']}")
    print(f"updated       {spine['updated']} by {spine.get('updatedBy')}")
    print(f"cards         {len(spine['cards'])}")
    print(f"payload bytes {len(payload.encode('utf-8'))}")
    print(f"last publish  {last.get('revision', '(never from this repo)')}"
          f"{'  at ' + last['at'] if last.get('at') else ''}")
    kb = len(payload.encode("utf-8")) / 1024
    print(f"""
TARGET  Claude Design project {DESIGN_PROJECT}
        path {DESIGN_PATH}
        (SAQEEL Status Board.dc.html only renders this file — never hand-edit
         the .dc.html, and never publish status to Google Drive.)

write_files takes inline data only; its local_path returns "not yet implemented
for server-side callers". At {kb:.0f} KB this payload CANNOT be safely inlined —
hand-emitting it risks publishing a corrupted board. Use route A:

1. mcp__claude-design__read_file  project_id={DESIGN_PROJECT}
                                  path={DESIGN_PATH}       -> capture the etag
2. mcp__claude-design__put_conversation  project_id={DESIGN_PROJECT}
     Ask a Claude Design session to copy the repo file byte-for-byte onto
     {DESIGN_PATH}, guarded by if_match=<etag>. Give it the branch, the
     revision ({spine['revision']}), the byte count, and what changed.
3. Re-read the project copy and confirm its revision is {spine['revision']}.
4. python3 {Path(__file__).name} record-publish --revision {spine['revision']} \\
       --etag <etag of the published file>

On an if_match conflict: STOP and reconcile card-by-card. Do not force.
See references/PHASES.md §Publish.""")


def cmd_record_publish(a) -> None:
    spine = load()
    spine.setdefault("published", []).append({
        "revision": a.revision,
        "target": f"claude-design:{DESIGN_PROJECT}/{DESIGN_PATH}",
        "etag": a.etag,
        "at": now(),
    })
    save(spine)
    print(f"recorded: {a.revision} pushed to {DESIGN_PATH} (etag {a.etag})")


def main() -> None:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("show"); p.add_argument("card"); p.set_defaults(fn=cmd_show)

    p = sub.add_parser("set")
    p.add_argument("card")
    for ln in LANES:
        p.add_argument(f"--{ln}", type=int)
    p.add_argument("--evidence", help="what proves the raise — required to raise")
    p.add_argument("--by", default="claude-code")
    p.set_defaults(fn=cmd_set)

    p = sub.add_parser("add-pending")
    p.add_argument("card")
    p.add_argument("--lane", required=True, choices=LANES)
    p.add_argument("--text", required=True)
    p.add_argument("--by", default="claude-code")
    p.set_defaults(fn=cmd_add_pending)

    p = sub.add_parser("clear-pending")
    p.add_argument("card")
    p.add_argument("--index", type=int, required=True)
    p.add_argument("--evidence")
    p.add_argument("--by", default="claude-code")
    p.set_defaults(fn=cmd_clear_pending)

    p = sub.add_parser("publish")
    p.add_argument("--print-payload", action="store_true")
    p.set_defaults(fn=cmd_publish)

    p = sub.add_parser("record-publish")
    p.add_argument("--revision", required=True)
    p.add_argument("--etag", required=True, help="etag returned by write_files")
    p.set_defaults(fn=cmd_record_publish)

    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
