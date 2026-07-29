from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class NormalizeMigrationsTest(unittest.TestCase):
    def test_normalization_preserves_every_migration(self) -> None:
        repo = Path(__file__).resolve().parents[2]
        source = repo / "supabase" / "migrations"
        script = Path(__file__).with_name("normalize_supabase_migrations.py")

        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "normalized"
            result = subprocess.run(
                [sys.executable, str(script), str(source), str(output)],
                check=True,
                capture_output=True,
                text=True,
            )
            summary = json.loads(result.stdout)
            manifest = json.loads(
                (output / "normalization-manifest.json").read_text(
                    encoding="utf-8"
                )
            )

            source_files = sorted(source.glob("*.sql"))
            normalized_files = sorted(output.glob("*.sql"))
            versions = [item["normalized_version"] for item in manifest]

            self.assertEqual(summary["migrations"], len(source_files))
            self.assertEqual(len(normalized_files), len(source_files))
            self.assertEqual(len(versions), len(set(versions)))
            self.assertEqual(
                [item["ordinal"] for item in manifest],
                list(range(1, len(manifest) + 1)),
            )
            self.assertTrue(
                all(
                    item["sha256"] == digest(source / item["original_file"])
                    for item in manifest
                )
            )
            self.assertTrue(
                all(
                    digest(output / item["normalized_file"])
                    == digest(source / item["original_file"])
                    for item in manifest
                )
            )


if __name__ == "__main__":
    unittest.main()
