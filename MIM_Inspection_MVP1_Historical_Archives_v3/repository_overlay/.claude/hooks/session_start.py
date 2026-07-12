from _common import *
data = read_stdin()
project = root()
pc = project / "product-contract"
git = git_info(project)
state = read_text(pc / "CURRENT_STATE.md", 4000)
gates = read_text(pc / "GATE_STATUS.md", 4000)
slice_text = read_text(pc / "execution" / "CURRENT_SLICE.yaml", 5000)
context = f"""MIM INSPECTION CONTROL CONTEXT
Git branch: {git['branch']}
Git commit: {git['commit']}
Working tree:
{git['status'] or 'clean'}

CURRENT STATE
{state}

GATE STATUS
{gates}

CURRENT SLICE
{slice_text}

Before acting, state task ID, gate, required context, open decisions, evidence and do-not-touch areas.
"""
title = "Inspection-" + (git["branch"] if git["branch"] not in ["", "unavailable"] else "G4")
print(json.dumps({"hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": context,
    "sessionTitle": title,
    "watchPaths": [str(pc / "CURRENT_STATE.md"), str(pc / "execution" / "CURRENT_SLICE.yaml")]
}}))
