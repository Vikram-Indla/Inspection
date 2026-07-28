from __future__ import annotations

import json
from pathlib import Path

import pytest

from saqeel_ocr_pilot.worker import PilotError, extract, validate_input


def write_source(path: Path) -> Path:
    path.write_bytes(b"%PDF-1.4\nlocal-only pilot fixture\n")
    return path


def fake_runner(_command: str, _source: Path, output_dir: Path, output_format: str) -> Path:
    suffix = ".md" if output_format == "markdown" else ".json"
    artifact = output_dir / f"converted{suffix}"
    artifact.write_text("# extracted\n" if suffix == ".md" else json.dumps({"format": output_format}), encoding="utf-8")
    return artifact


def test_extract_creates_all_derivatives_and_provenance(tmp_path: Path) -> None:
    source = write_source(tmp_path / "inspection.pdf")
    destination = tmp_path / "derivatives"
    job = extract(source, destination, runner=fake_runner)
    assert job.status == "completed"
    assert (destination / "document.md").read_text(encoding="utf-8") == "# extracted\n"
    assert json.loads((destination / "document.json").read_text(encoding="utf-8"))["format"] == "json"
    assert json.loads((destination / "chunks.json").read_text(encoding="utf-8"))["format"] == "chunks"
    provenance = json.loads((destination / "job.json").read_text(encoding="utf-8"))
    assert provenance["source_filename"] == "inspection.pdf"
    assert len(provenance["source_sha256"]) == 64
    assert provenance["status"] == "completed"


def test_rejects_missing_or_unsupported_input(tmp_path: Path) -> None:
    with pytest.raises(PilotError, match="INPUT_NOT_FOUND"):
        validate_input(tmp_path / "missing.pdf")
    unsupported = tmp_path / "notes.txt"
    unsupported.write_text("no", encoding="utf-8")
    with pytest.raises(PilotError, match="UNSUPPORTED_MEDIA"):
        validate_input(unsupported)


def test_failure_writes_no_source_mutation_and_failed_provenance(tmp_path: Path) -> None:
    source = write_source(tmp_path / "inspection.pdf")
    before = source.read_bytes()

    def fail(*_args: object, **_kwargs: object) -> Path:
        raise PilotError("MARKER_UNAVAILABLE: safe failure")

    with pytest.raises(PilotError, match="MARKER_UNAVAILABLE"):
        extract(source, tmp_path / "derivatives", runner=fail)  # type: ignore[arg-type]
    assert source.read_bytes() == before
    provenance = json.loads((tmp_path / "derivatives" / "job.json").read_text(encoding="utf-8"))
    assert provenance["status"] == "failed"
    assert provenance["error_code"] == "MARKER_UNAVAILABLE"
