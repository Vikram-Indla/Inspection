from _common import *
data = read_stdin()
append_jsonl(root()/".project-memory"/"audit"/"config_changes.jsonl", {
    "time": now(),
    "session_id": data.get("session_id"),
    "source": data.get("source"),
    "file_path": data.get("file_path")
})
