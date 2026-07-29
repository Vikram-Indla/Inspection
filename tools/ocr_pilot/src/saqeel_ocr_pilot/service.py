"""Private HTTP boundary for Saqeel's Marker document worker.

This process deliberately contains no Supabase credentials. Saqeel sends an
authorised copy of an already-authorised evidence object, while the web app
persists the returned derivatives and provenance itself. Deploy it on a private
network and set MARKER_OCR_WORKER_TOKEN; anonymous requests are denied by
default.
"""

from __future__ import annotations

import base64
import json
import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from .worker import PilotError, extract

app = FastAPI(title="Saqeel Marker OCR Worker", docs_url=None, redoc_url=None)


class ExtractionRequest(BaseModel):
    content_base64: str = Field(min_length=1)
    mime_type: str
    filename: str = "evidence"
    requested_outputs: list[str] = ["markdown", "json", "chunks"]


def _suffix(mime_type: str) -> str:
    return {
        "application/pdf": ".pdf",
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/tiff": ".tiff",
        "image/webp": ".webp",
    }.get(mime_type, "")


def _authorize(authorization: str | None) -> None:
    expected = os.environ.get("MARKER_OCR_WORKER_TOKEN")
    if not expected:
        raise HTTPException(status_code=503, detail="WORKER_TOKEN_NOT_CONFIGURED")
    if authorization != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="UNAUTHORIZED")


@app.get("/healthz")
def health() -> dict[str, str]:
    return {"status": "ok", "processor": "marker"}


@app.post("/v1/extractions")
def create_extraction(request: ExtractionRequest, authorization: str | None = Header(default=None)) -> dict:
    _authorize(authorization)
    suffix = _suffix(request.mime_type)
    if not suffix:
        raise HTTPException(status_code=415, detail="UNSUPPORTED_MEDIA")
    try:
        source_bytes = base64.b64decode(request.content_base64, validate=True)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="INVALID_BASE64") from exc
    if not source_bytes:
        raise HTTPException(status_code=400, detail="EMPTY_INPUT")

    with tempfile.TemporaryDirectory(prefix="saqeel-marker-service-") as workspace:
        root = Path(workspace)
        source = root / f"source{suffix}"
        destination = root / "derivatives"
        source.write_bytes(source_bytes)
        try:
            job = extract(source, destination)
        except PilotError as error:
            raise HTTPException(status_code=422, detail=str(error).split(":", 1)[0]) from error

        markdown = (destination / "document.md").read_text(encoding="utf-8")
        structured = json.loads((destination / "document.json").read_text(encoding="utf-8"))
        chunks = json.loads((destination / "chunks.json").read_text(encoding="utf-8"))
        return {
            "status": "completed" if markdown.strip() else "no_text_found",
            "text": markdown,
            "markdown": markdown,
            "structured_output": structured,
            "retrieval_chunks": chunks,
            "source_sha256": job.source_sha256,
            "processor_version": job.processor_version,
            "job_id": job.job_id,
        }
