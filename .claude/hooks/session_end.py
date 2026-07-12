from _common import *
data = read_stdin()
project = root()
git = git_info(project)
event = {
    "time": now(),
    "session_id": data.get("session_id"),
    "reason": data.get("reason"),
    "branch": git["branch"],
    "commit": git["commit"],
    "working_tree": git["status"]
}
append_jsonl(project/".project-memory"/"audit"/"session_end.jsonl", event)
last = project/"product-contract"/"sessions"/"LAST_SESSION.md"
last.write_text(f"""# Last Session
- Time: {event['time']}
- Session ID: {event['session_id']}
- End reason: {event['reason']}
- Branch: {event['branch']}
- Commit: {event['commit']}
- Working tree:
```
{event['working_tree']}
```
- Required next action: complete `SESSION_HANDOFF_TEMPLATE.md` and append `SESSION_LEDGER.json`.
""", encoding="utf-8")
