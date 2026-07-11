#!/usr/bin/env python3
from pathlib import Path
import argparse, textwrap

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("task_id")
parser.add_argument("gate")
parser.add_argument("title")
args = parser.parse_args()
path = root/"product-contract"/"execution"/"CURRENT_SLICE.yaml"
path.write_text(textwrap.dedent(f'''\
schema_version: "1.0"
task_id: "{args.task_id}"
gate: "{args.gate}"
title: "{args.title}"
status: "PLANNED"
enforce_stop_gate: false
broad_implementation_allowed: false
process_ids: []
requirement_ids: []
acceptance_ids: []
screen_ids: []
engine_ids: []
required_context: []
required_evidence: []
exit_condition: "Define before work starts."
'''), encoding="utf-8")
print("Created current slice:", args.task_id)
