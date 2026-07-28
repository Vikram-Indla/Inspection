"""Private, local-only conversion worker for the Marker pilot.

The worker deliberately has no database, object-store, HTTP, or Senaei client.
It receives a local file and produces immutable derivative artefacts next to the
requested local output directory. A future application adapter may *enqueue* a
job, but must never synchronously run conversion inside a web request.
"""

from __future__ import annotations

import hashlib
import json
import mimetypes
import shutil
import subprocess
import tempfile
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Callable, Literal
from uuid import uuid4

OutputFormat = Literal["markdown", "json", "chunks"]
FORMATS: tuple[OutputFormat, ...] = ("markdown", "json", "chunks")
SUPPORTED_SUFFIXES = {".pdf", ".png", ".jpg", ".jpeg", ".tif", ".tiff", ".webp"}


class PilotError(RuntimeError):
    """A safe, user-facing failure. The original evidence is never modified."""


@dataclass(frozen=True)
class JobProvenance:
    job_id: str
    status: str
    source_filename: str
    source_sha256: str
    source_mime_type: str
    source_size_bytes: int
    processor: str
    processor_version: str
    output_formats: list[str]
    created_at: str
    completed_at: str | None = None
    error_code: str | None = None


def utc_now() -> str:
    return datetime.now(UTC).isoformat()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def validate_input(path: Path) -> tuple[str, str]:
    if not path.is_file():
        raise PilotError("INPUT_NOT_FOUND: provide one local PDF or image file.")
    suffix = path.suffix.lower()
    if suffix not in SUPPORTED_SUFFIXES:
        raise PilotError("UNSUPPORTED_MEDIA: only PDF and supported image files are accepted by this pilot.")
    if path.stat().st_size == 0:
        raise PilotError("EMPTY_INPUT: the original file was not changed.")
    mime_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return sha256_file(path), mime_type


def marker_version(marker_command: str) -> str:
    try:
        result = subprocess.run(
            [marker_command, "--version"], check=False, capture_output=True, text=True, timeout=15
        )
    except (OSError, subprocess.TimeoutExpired):
        return "unavailable"
    value = (result.stdout or result.stderr).strip().splitlines()
    return value[0] if result.returncode == 0 and value else "unknown"


def discover_artifact(output_dir: Path, output_format: OutputFormat) -> Path:
    suffix = {"markdown": ".md", "json": ".json", "chunks": ".json"}[output_format]
    candidates = sorted(output_dir.rglob(f"*{suffix}"), key=lambda p: p.stat().st_size, reverse=True)
    # Marker can write job metadata as JSON. Prefer an actual content file.
    candidates = [p for p in candidates if p.name not in {"job.json", "metadata.json"}]
    if not candidates:
        raise PilotError(f"MARKER_{output_format.upper()}_MISSING: Marker produced no {output_format} artifact.")
    return candidates[0]


def run_marker(marker_command: str, source: Path, output_dir: Path, output_format: OutputFormat) -> Path:
    if not shutil.which(marker_command):
        raise PilotError("MARKER_UNAVAILABLE: install the approved Marker runtime before conversion.")
    command = [
        marker_command,
        str(source),
        "--output_dir",
        str(output_dir),
        "--output_format",
        output_format,
    ]
    try:
        result = subprocess.run(command, check=False, capture_output=True, text=True, timeout=15 * 60)
    except subprocess.TimeoutExpired as exc:
        raise PilotError("MARKER_TIMEOUT: conversion stopped; the original evidence is unchanged.") from exc
    if result.returncode != 0:
        # Never persist potentially sensitive document content from stdout/stderr.
        raise PilotError(f"MARKER_FAILED: exit code {result.returncode}; inspect private worker logs.")
    return discover_artifact(output_dir, output_format)


def extract(
    source: Path,
    destination: Path,
    *,
    marker_command: str = "marker_single",
    runner: Callable[[str, Path, Path, OutputFormat], Path] = run_marker,
) -> JobProvenance:
    """Convert locally and write a stable provenance envelope.

    The destination must be a local staging/derivative location. This function
    never writes to the source and never communicates with any external system.
    """

    source_hash, mime_type = validate_input(source)
    if destination.resolve() == source.resolve():
        raise PilotError("INVALID_OUTPUT: output must be a separate local directory.")
    destination.mkdir(parents=True, exist_ok=True)
    provenance = JobProvenance(
        job_id=str(uuid4()),
        status="running",
        source_filename=source.name,
        source_sha256=source_hash,
        source_mime_type=mime_type,
        source_size_bytes=source.stat().st_size,
        processor="marker",
        processor_version=marker_version(marker_command),
        output_formats=list(FORMATS),
        created_at=utc_now(),
    )
    try:
        with tempfile.TemporaryDirectory(prefix="saqeel-marker-") as working:
            work = Path(working)
            created: dict[OutputFormat, Path] = {}
            for output_format in FORMATS:
                output = work / output_format
                output.mkdir()
                created[output_format] = runner(marker_command, source, output, output_format)
            targets = {
                "markdown": destination / "document.md",
                "json": destination / "document.json",
                "chunks": destination / "chunks.json",
            }
            for output_format, target in targets.items():
                shutil.copyfile(created[output_format], target)
        completed = JobProvenance(**{**asdict(provenance), "status": "completed", "completed_at": utc_now()})
        (destination / "job.json").write_text(json.dumps(asdict(completed), indent=2, sort_keys=True) + "\n", encoding="utf-8")
        return completed
    except PilotError as exc:
        failed = JobProvenance(**{**asdict(provenance), "status": "failed", "completed_at": utc_now(), "error_code": str(exc).split(":", 1)[0]})
        (destination / "job.json").write_text(json.dumps(asdict(failed), indent=2, sort_keys=True) + "\n", encoding="utf-8")
        raise
