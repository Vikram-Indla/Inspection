from _common import *
data = read_stdin()
append_jsonl(root()/".project-memory"/"audit"/"tool_events.jsonl", {
    "time": now(),
    "session_id": data.get("session_id"),
    "tool_name": data.get("tool_name"),
    "tool_input": redact_secrets(data.get("tool_input")),
    "cwd": data.get("cwd")
})
