#!/usr/bin/env python3
"""Build a disposable, uniquely versioned copy of Supabase migrations.

The authoritative migration files are never renamed or edited. This helper is
only for isolated clean-apply testing while legacy duplicate versions remain.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path

VERSIONED_SQL = re.compile(r"^(?P<version>\d+)_(?P<name>.+\.sql)$")
NORMALIZED_BASE = 20_000_000_000_000
MAKER_CHECKER_FILE = "0006_package_maker_checker.sql"
MAKER_CHECKER_ORIGINAL = (
    "if new.status in ('published','locked') and new.approved_by is null then"
)
MAKER_CHECKER_OVERLAY = (
    "if new.status in ('published','locked') and new.approved_by is null\n"
    "     and (tg_op = 'INSERT' or old.status not in ('published','locked')) then"
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument(
        "--legacy-maker-checker-overlay",
        action="store_true",
        help=(
            "Patch only the disposable copy of the legacy package approver "
            "trigger so metadata backfills on already-published rows can run."
        ),
    )
    args = parser.parse_args()

    source = args.source.resolve()
    output = args.output.resolve()
    if not source.is_dir():
        parser.error(f"source is not a directory: {source}")
    if output.exists() and any(output.iterdir()):
        parser.error(f"output must be absent or empty: {output}")
    output.mkdir(parents=True, exist_ok=True)

    migrations: list[tuple[int, str, Path]] = []
    for path in source.glob("*.sql"):
        match = VERSIONED_SQL.match(path.name)
        if not match:
            parser.error(f"unversioned SQL migration: {path.name}")
        migrations.append((int(match.group("version")), path.name, path))
    migrations.sort(key=lambda item: (item[0], item[1]))

    manifest = []
    for ordinal, (original_version, original_name, path) in enumerate(
        migrations, start=1
    ):
        normalized_version = NORMALIZED_BASE + ordinal
        suffix = VERSIONED_SQL.match(original_name).group("name")  # type: ignore[union-attr]
        target = output / f"{normalized_version}_{suffix}"
        shutil.copy2(path, target)
        overlay = None
        if args.legacy_maker_checker_overlay and original_name == MAKER_CHECKER_FILE:
            source_text = target.read_text(encoding="utf-8")
            if source_text.count(MAKER_CHECKER_ORIGINAL) != 1:
                parser.error(
                    "legacy maker-checker overlay target changed; refusing "
                    "an unverified disposable transform"
                )
            target.write_text(
                source_text.replace(
                    MAKER_CHECKER_ORIGINAL,
                    MAKER_CHECKER_OVERLAY,
                ),
                encoding="utf-8",
            )
            overlay = "legacy_published_metadata_backfill_v1"
        manifest.append(
            {
                "ordinal": ordinal,
                "original_file": original_name,
                "original_version": str(original_version),
                "normalized_file": target.name,
                "normalized_version": str(normalized_version),
                "source_sha256": sha256(path),
                "normalized_sha256": sha256(target),
                "compatibility_overlay": overlay,
            }
        )

    (output / "normalization-manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "source": str(source),
                "output": str(output),
                "migrations": len(manifest),
                "unique_versions": len(
                    {item["normalized_version"] for item in manifest}
                ),
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
