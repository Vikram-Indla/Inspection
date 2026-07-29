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
CONCURRENT_INDEX_FILE = "20260721120000_perf_tier_c_global_search.sql"
CONCURRENT_INDEX_ORIGINAL = "create index concurrently if not exists"
CONCURRENT_INDEX_OVERLAY = "create index if not exists"
COMPLIANCE_LOOKUP_CONSUMER_FILE = "20260726042050_visit_result_reports.sql"
COMPLIANCE_LOOKUP_PRELUDE = """\
-- Disposable clean-apply compatibility schema reconstructed from the canonical
-- schema catalogue. No governed lookup values are seeded.
create table if not exists public.compliance_lookup_types (
  lookup_type_key text primary key,
  label_en text not null,
  label_ar text,
  requires_effective_dates boolean not null default false,
  display_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.compliance_lookup_values (
  id uuid primary key default gen_random_uuid(),
  lookup_type_key text not null references public.compliance_lookup_types(lookup_type_key),
  code text not null,
  label_en text not null,
  label_ar text,
  active boolean not null default true,
  effective_from date,
  effective_to date,
  display_order integer not null default 0,
  version_number integer not null default 1,
  supersedes_id uuid references public.compliance_lookup_values(id),
  deactivation_reason text,
  created_by uuid not null references public.profiles(user_id),
  created_at timestamptz not null default now(),
  deactivated_by uuid references public.profiles(user_id),
  deactivated_at timestamptz,
  unique (lookup_type_key, code, version_number)
);

alter table public.compliance_lookup_types enable row level security;
alter table public.compliance_lookup_values enable row level security;

create policy compliance_lookup_types_read
  on public.compliance_lookup_types for select to authenticated
  using (active);
create policy compliance_lookup_values_read
  on public.compliance_lookup_values for select to authenticated
  using (true);

"""
RLS_INITPLAN_FILE = "20260727010000_rls_initplan_wrap.sql"
CREATE_TABLE_NAME = re.compile(
    r"create\s+table\s+(?:if\s+not\s+exists\s+)?"
    r"(?:public\.)?([a-z_][a-z0-9_]*)",
    re.IGNORECASE,
)
ALTER_POLICY_STATEMENT = re.compile(
    r"ALTER\s+POLICY\b.*?\bON\s+public\.([a-z_][a-z0-9_]*)\b.*?;",
    re.IGNORECASE | re.DOTALL,
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
    parser.add_argument(
        "--supabase-pipeline-index-overlay",
        action="store_true",
        help=(
            "Patch only the disposable copy of the legacy performance migration "
            "so Supabase's transactional migration pipeline can build its indexes."
        ),
    )
    parser.add_argument(
        "--missing-compliance-lookup-overlay",
        action="store_true",
        help=(
            "Prepend the catalogue-backed compliance lookup schema to its first "
            "consumer in the disposable copy when no creation migration exists."
        ),
    )
    parser.add_argument(
        "--skip-missing-policy-targets-overlay",
        action="store_true",
        help=(
            "Omit ALTER POLICY statements from the disposable RLS optimizer "
            "when their target table has no creation source in the repository."
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
    created_tables = {
        table.lower()
        for _, _, migration_path in migrations
        for table in CREATE_TABLE_NAME.findall(
            migration_path.read_text(encoding="utf-8")
        )
    }
    if args.missing_compliance_lookup_overlay:
        created_tables.update(
            {"compliance_lookup_types", "compliance_lookup_values"}
        )

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
        if args.supabase_pipeline_index_overlay and original_name == CONCURRENT_INDEX_FILE:
            source_text = target.read_text(encoding="utf-8")
            replacement_count = source_text.count(CONCURRENT_INDEX_ORIGINAL)
            if replacement_count != 13:
                parser.error(
                    "Supabase pipeline index overlay target changed; refusing "
                    "an unverified disposable transform"
                )
            target.write_text(
                source_text.replace(
                    CONCURRENT_INDEX_ORIGINAL,
                    CONCURRENT_INDEX_OVERLAY,
                ),
                encoding="utf-8",
            )
            overlay = "supabase_transactional_index_build_v1"
        if (
            args.missing_compliance_lookup_overlay
            and original_name == COMPLIANCE_LOOKUP_CONSUMER_FILE
        ):
            source_text = target.read_text(encoding="utf-8")
            if "insert into compliance_lookup_types" not in source_text:
                parser.error(
                    "compliance lookup overlay consumer changed; refusing "
                    "an unverified disposable transform"
                )
            target.write_text(
                COMPLIANCE_LOOKUP_PRELUDE + source_text,
                encoding="utf-8",
            )
            overlay = "missing_compliance_lookup_schema_v1"
        if (
            args.skip_missing_policy_targets_overlay
            and original_name == RLS_INITPLAN_FILE
        ):
            source_text = target.read_text(encoding="utf-8")
            skipped_targets: set[str] = set()

            def keep_existing_policy(match: re.Match[str]) -> str:
                target_table = match.group(1).lower()
                if target_table in created_tables:
                    return match.group(0)
                skipped_targets.add(target_table)
                return (
                    "-- Disposable clean-apply: omitted ALTER POLICY for "
                    f"missing repository table public.{target_table};"
                )

            normalized_text = ALTER_POLICY_STATEMENT.sub(
                keep_existing_policy,
                source_text,
            )
            if not skipped_targets:
                parser.error(
                    "missing-policy-target overlay found no missing targets; "
                    "refusing an unnecessary disposable transform"
                )
            target.write_text(normalized_text, encoding="utf-8")
            overlay = "skip_missing_policy_targets_v1:" + ",".join(
                sorted(skipped_targets)
            )
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
