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
    # Always blocked — destructive / irreversible, no approval bypass.
    always_blocked = [
        ("rm -rf", "Destructive recursive deletion is blocked."),
        ("git push --force", "Force push is blocked."),
        ("git push -f", "Force push is blocked."),
        ("DROP TABLE", "Destructive database operation is blocked."),
        ("TRUNCATE TABLE", "Destructive database operation is blocked."),
    ]
    # Release actions — permitted only when the sponsor-approved change-control
    # artifact (ACTIVE_CHANGE_APPROVAL.yaml) is present; blocked otherwise.
    approval_gated = [
        ("git push origin main", "Direct push to main requires ACTIVE_CHANGE_APPROVAL.yaml."),
        ("git merge", "Merge to a release branch requires ACTIVE_CHANGE_APPROVAL.yaml."),
    ]
    approval = project/"product-contract"/"governance"/"ACTIVE_CHANGE_APPROVAL.yaml"
    for token,msg in always_blocked:
        if token.lower() in cmd.lower():
            reason = msg
            break
    if not reason and not approval.exists():
        for token,msg in approval_gated:
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
