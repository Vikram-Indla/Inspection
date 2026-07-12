from _common import *
data = read_stdin()
tool = str(data.get("tool_name",""))
inp = data.get("tool_input") or {}
project = root()
reason = None

def deny(msg):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": msg
    }}))

if tool == "Bash":
    cmd = str(inp.get("command",""))
    blocked = [
        ("rm -rf", "Destructive recursive deletion is blocked."),
        ("git push --force", "Force push is blocked."),
        ("git push -f", "Force push is blocked."),
        ("git push origin main", "Direct push to main requires human approval."),
        ("git merge", "Merge requires an approved release/change task."),
        ("DROP TABLE", "Destructive database operation is blocked."),
        ("TRUNCATE TABLE", "Destructive database operation is blocked.")
    ]
    for token,msg in blocked:
        if token.lower() in cmd.lower():
            reason = msg
            break

path = str(inp.get("file_path") or inp.get("path") or inp.get("notebook_path") or "")
if tool in ["Edit","Write","NotebookEdit"] and path:
    normalized = path.replace("\\","/")
    if "/product-contract/" in normalized or normalized.startswith("product-contract/"):
        approval = project/"product-contract"/"governance"/"ACTIVE_CHANGE_APPROVAL.yaml"
        if not approval.exists():
            reason = "Product-contract edits require an approved change-control task and ACTIVE_CHANGE_APPROVAL.yaml."

if reason:
    deny(reason)
else:
    sys.exit(0)
