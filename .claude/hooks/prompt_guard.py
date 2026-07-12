from _common import *
data = read_stdin()
prompt = str(data.get("prompt",""))
project = root()
gates = read_text(project/"product-contract"/"GATE_STATUS.md", 5000)
slice_text = read_text(project/"product-contract"/"execution"/"CURRENT_SLICE.yaml", 5000)
lower = prompt.lower()
build_words = ["implement","build","develop","code","fix the app","create the application","start coding","deploy"]
broad = any(w in lower for w in build_words)
g8_pass = "G8 Pre-Build Certification | PASS" in gates
if broad and not g8_pass:
    print(json.dumps({
        "decision": "block",
        "reason": "Broad implementation is blocked until G8 PASS. Continue the current gate or create an approved gate task.",
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": "Current slice:\n" + slice_text
        }
    }))
else:
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "UserPromptSubmit",
        "additionalContext": "Use the active task and stable contract IDs. Current slice:\n" + slice_text[:3500]
    }}))
