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
        manifest.append(
            {
                "ordinal": ordinal,
                "original_file": original_name,
                "original_version": str(original_version),
                "normalized_file": target.name,
                "normalized_version": str(normalized_version),
                "sha256": sha256(path),
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
