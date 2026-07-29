from __future__ import annotations

import json

import pytest

from saqeel_ocr_pilot import service
from saqeel_ocr_pilot.worker import JobProvenance


def _fake_extract(source, destination):
    destination.mkdir(parents=True, exist_ok=True)
    (destination / "document.md").write_text("# Extracted report\n\nFactory note", encoding="utf-8")
    (destination / "document.json").write_text(json.dumps({"pages": 1}), encoding="utf-8")
    (destination / "chunks.json").write_text(json.dumps([{"text": "Factory note"}]), encoding="utf-8")
    return JobProvenance(
        job_id="marker-job-1",
        status="completed",
        source_filename=source.name,
        source_sha256="a" * 64,
        source_mime_type="application/pdf",
        source_size_bytes=source.stat().st_size,
        processor="marker",
        processor_version="marker-test",
        output_formats=["markdown", "json", "chunks"],
        created_at="2026-07-29T00:00:00+00:00",
        completed_at="2026-07-29T00:00:01+00:00",
    )


def test_service_requires_private_token(monkeypatch):
    monkeypatch.delenv("MARKER_OCR_WORKER_TOKEN", raising=False)
    with pytest.raises(service.HTTPException) as error:
        service.create_extraction(
            service.ExtractionRequest(content_base64="cGRm", mime_type="application/pdf"),
            authorization=None,
        )
    assert error.value.status_code == 503
    assert error.value.detail == "WORKER_TOKEN_NOT_CONFIGURED"


def test_service_returns_marker_derivatives(monkeypatch):
    monkeypatch.setenv("MARKER_OCR_WORKER_TOKEN", "test-token")
    monkeypatch.setattr(service, "extract", _fake_extract)
    body = service.create_extraction(
        service.ExtractionRequest(content_base64="cGRm", mime_type="application/pdf", filename="visit.pdf"),
        authorization="Bearer test-token",
    )
    assert body["status"] == "completed"
    assert body["markdown"].startswith("# Extracted report")
    assert body["structured_output"] == {"pages": 1}
    assert body["retrieval_chunks"] == [{"text": "Factory note"}]
    assert body["source_sha256"] == "a" * 64
    assert body["processor_version"] == "marker-test"
