from _common import *
data = read_stdin()
if data.get("stop_hook_active"):
    sys.exit(0)
project = root()
slice_text = read_text(project/"product-contract"/"execution"/"CURRENT_SLICE.yaml", 6000)
enforce = "enforce_stop_gate: true" in slice_text.lower()
status_complete = any(x in slice_text for x in ['status: "COMPLETE"',"status: COMPLETE",'status: "ACCEPTED"',"status: ACCEPTED"])
if enforce and not status_complete:
    print(json.dumps({
        "decision": "block",
        "reason": "The active slice has not met its exit condition. Update tests, evidence, ledger and current state before stopping."
    }))
