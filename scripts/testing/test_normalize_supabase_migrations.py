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
                    item["source_sha256"]
                    == digest(source / item["original_file"])
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

    def test_maker_checker_overlay_is_single_and_transparent(self) -> None:
        repo = Path(__file__).resolve().parents[2]
        source = repo / "supabase" / "migrations"
        script = Path(__file__).with_name("normalize_supabase_migrations.py")

        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "normalized"
            subprocess.run(
                [
                    sys.executable,
                    str(script),
                    str(source),
                    str(output),
                    "--legacy-maker-checker-overlay",
                ],
                check=True,
                capture_output=True,
                text=True,
            )
            manifest = json.loads(
                (output / "normalization-manifest.json").read_text(
                    encoding="utf-8"
                )
            )
            transformed = [
                item
                for item in manifest
                if item["compatibility_overlay"] is not None
            ]

            self.assertEqual(len(transformed), 1)
            self.assertEqual(
                transformed[0]["original_file"],
                "0006_package_maker_checker.sql",
            )
            self.assertEqual(
                transformed[0]["compatibility_overlay"],
                "legacy_published_metadata_backfill_v1",
            )
            self.assertNotEqual(
                transformed[0]["source_sha256"],
                transformed[0]["normalized_sha256"],
            )
            self.assertTrue(
                all(
                    item["source_sha256"] == item["normalized_sha256"]
                    for item in manifest
                    if item["compatibility_overlay"] is None
                )
            )

    def test_pipeline_index_overlay_is_single_and_transparent(self) -> None:
        repo = Path(__file__).resolve().parents[2]
        source = repo / "supabase" / "migrations"
        script = Path(__file__).with_name("normalize_supabase_migrations.py")

        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "normalized"
            subprocess.run(
                [
                    sys.executable,
                    str(script),
                    str(source),
                    str(output),
                    "--supabase-pipeline-index-overlay",
                ],
                check=True,
                capture_output=True,
                text=True,
            )
            manifest = json.loads(
                (output / "normalization-manifest.json").read_text(
                    encoding="utf-8"
                )
            )
            transformed = [
                item
                for item in manifest
                if item["compatibility_overlay"] is not None
            ]

            self.assertEqual(len(transformed), 1)
            self.assertEqual(
                transformed[0]["original_file"],
                "20260721120000_perf_tier_c_global_search.sql",
            )
            self.assertEqual(
                transformed[0]["compatibility_overlay"],
                "supabase_transactional_index_build_v1",
            )
            normalized = (
                output / transformed[0]["normalized_file"]
            ).read_text(encoding="utf-8")
            self.assertNotIn(
                "create index concurrently if not exists",
                normalized,
            )
            self.assertEqual(
                normalized.count("create index if not exists"),
                13,
            )


if __name__ == "__main__":
    unittest.main()
