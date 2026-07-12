#!/usr/bin/env python3
from pathlib import Path
import json, argparse, datetime

root = Path(__file__).resolve().parents[1]
ledger_path = root/"product-contract"/"sessions"/"SESSION_LEDGER.json"
parser = argparse.ArgumentParser()
parser.add_argument("--entry", required=True, help="Path to a JSON session entry")
args = parser.parse_args()
ledger = json.loads(ledger_path.read_text(encoding="utf-8"))
entry = json.loads(Path(args.entry).read_text(encoding="utf-8"))
ledger["sessions"].append(entry)
ledger["last_session"] = entry.get("session_id")
ledger_path.write_text(json.dumps(ledger, indent=2), encoding="utf-8")
print("Session appended:", entry.get("session_id"))
