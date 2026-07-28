from __future__ import annotations

import argparse
from pathlib import Path

from .worker import PilotError, extract


def main() -> int:
    parser = argparse.ArgumentParser(description="Local-only Saqeel Marker OCR pilot")
    subparsers = parser.add_subparsers(dest="command", required=True)
    command = subparsers.add_parser("extract", help="Create Markdown, JSON and chunks from one local file")
    command.add_argument("--input", required=True, type=Path)
    command.add_argument("--output", required=True, type=Path)
    command.add_argument("--marker-command", default="marker_single")
    args = parser.parse_args()
    try:
        job = extract(args.input, args.output, marker_command=args.marker_command)
    except PilotError as error:
        print(str(error))
        return 2
    print(f"OCR_PILOT_COMPLETED {job.job_id} {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
