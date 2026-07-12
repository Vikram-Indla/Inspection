from _common import *
data = read_stdin()
append_jsonl(root()/".project-memory"/"audit"/"compactions.jsonl", {
    "time": now(),
    "session_id": data.get("session_id"),
    "trigger": data.get("trigger"),
    "compact_summary": data.get("compact_summary")
})
