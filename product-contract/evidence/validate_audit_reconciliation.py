#!/usr/bin/env python3
"""Validate the machine-readable wiring-audit reconciliation.

This is intentionally read-only. It checks that the computed acceptance ledger,
the dated partial disposition, wiring maps, and session evidence still describe
the same checkout. It does not apply migrations, mutate runtime data, or decide
whether an upstream policy/provider boundary is acceptable.
"""

from __future__ import annotations

import csv
import json
import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LEDGER = ROOT / "product-contract/evidence/AC_LEDGER.csv"
PARTIALS = ROOT / "product-contract/evidence/CODEX_AUDIT_REMAINING_PARTIALS_2026-07-15.md"
SESSION = ROOT / "product-contract/sessions/SESSION_LEDGER.json"
MAPS = ROOT / "outputs"

EXPECTED_COUNTS = {"verified_live": 15, "implemented": 460, "partial": 18, "missing": 0}


def fail(message: str) -> None:
    raise SystemExit(f"AUDIT_RECONCILIATION_FAIL: {message}")


def main() -> int:
    rows = list(csv.DictReader(LEDGER.open(newline="")))
    counts = Counter(row["status"] for row in rows)
    if len(rows) != sum(EXPECTED_COUNTS.values()):
        fail(f"ledger row count {len(rows)} != {sum(EXPECTED_COUNTS.values())}")
    actual_counts = {status: counts.get(status, 0) for status in EXPECTED_COUNTS}
    if actual_counts != EXPECTED_COUNTS:
        fail(f"ledger counts {actual_counts} != {EXPECTED_COUNTS}")

    # The disposition table is deliberately parsed from its requirement column,
    # rather than copied into a second machine-readable list.
    partial_ids = set()
    for line in PARTIALS.read_text().splitlines():
        match = re.match(r"\|\s*(M(?:VP1-)?[A-Z0-9-]+)\s*\|", line)
        if match:
            value = match.group(1)
            partial_ids.add(value if value.startswith("MVP1-") else f"MVP1-{value}")
    ledger_partial_ids = {row["requirement_id"] for row in rows if row["status"] == "partial"}
    if partial_ids != ledger_partial_ids:
        fail(f"partial disposition mismatch: table={sorted(partial_ids)} ledger={sorted(ledger_partial_ids)}")

    map_count = 0
    for path in sorted(MAPS.glob("cd-*/WIRING_MAP_*.csv")):
        with path.open(newline="") as handle:
            map_rows = list(csv.reader(handle))
        widths = {len(row) for row in map_rows}
        if not map_rows or len(widths) != 1:
            fail(f"non-rectangular or empty wiring map: {path}")
        map_count += 1
    if map_count == 0:
        fail("no authoritative wiring maps found")

    session = json.loads(SESSION.read_text())
    if session.get("last_session") != "2026-07-16-cd031-r3-audit-hardening":
        fail(f"unexpected last_session {session.get('last_session')!r}")
    if not session.get("sessions"):
        fail("session ledger has no sessions")

    print(f"AUDIT_RECONCILIATION_OK: rows={len(rows)} counts={dict(counts)} maps={map_count} partials={len(partial_ids)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
