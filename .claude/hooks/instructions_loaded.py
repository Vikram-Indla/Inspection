from _common import *
data = read_stdin()
append_jsonl(root()/".project-memory"/"audit"/"instructions_loaded.jsonl", {
    "time": now(),
    "session_id": data.get("session_id"),
    "file_path": data.get("file_path"),
    "memory_type": data.get("memory_type"),
    "load_reason": data.get("load_reason")
})
