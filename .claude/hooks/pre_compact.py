from _common import *
data = read_stdin()
project = root()
pc = project/"product-contract"
checkpoint = pc/"sessions"/"COMPACTION_CHECKPOINT.md"
git = git_info(project)
checkpoint.write_text(f"""# Compaction Checkpoint
- Time: {now()}
- Session: {data.get('session_id')}
- Trigger: {data.get('trigger')}
- Branch: {git['branch']}
- Commit: {git['commit']}
- Working tree:
```
{git['status']}
```
- Current slice: `product-contract/execution/CURRENT_SLICE.yaml`
- Resume protocol: `product-contract/execution/RESUME_PROTOCOL.md`
""", encoding="utf-8")
print(json.dumps({"hookSpecificOutput": {
    "hookEventName": "PreCompact",
    "additionalContext": "Checkpoint written to product-contract/sessions/COMPACTION_CHECKPOINT.md. Preserve task IDs and evidence after compaction."
}}))
