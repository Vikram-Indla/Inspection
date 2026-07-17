from pathlib import Path
import sys, json, os, datetime, subprocess, re

def root():
    return Path(os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())).resolve()

def read_stdin():
    try:
        return json.load(sys.stdin)
    except Exception:
        return {}

def read_text(path, limit=12000):
    try:
        return path.read_text(encoding="utf-8")[:limit]
    except Exception:
        return ""

def append_jsonl(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")

def git_info(project):
    def run(args):
        try:
            return subprocess.check_output(args, cwd=project, stderr=subprocess.DEVNULL, text=True).strip()
        except Exception:
            return "unavailable"
    return {
        "branch": run(["git","branch","--show-current"]),
        "status": run(["git","status","--short"]),
        "commit": run(["git","rev-parse","--short","HEAD"])
    }

def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

# BLK-P2-008 / DEF-SEC-credential-remediation — tool_events.jsonl is tracked in
# git (docs/SECURITY_AND_SECRETS.md: "Hooks log metadata only"). A logged Bash
# command containing a live JWT/API key was previously written verbatim. This
# redacts common secret shapes from any string before it is written to the
# audit log, so future entries cannot reintroduce the same exposure. It does
# not touch already-tracked history — that remediation is a separate,
# explicitly-authorized rotation/history action.
_SECRET_PATTERNS = [
    re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"),  # JWT
    re.compile(r"sk-[A-Za-z0-9]{20,}"),                                            # generic secret-key prefix
    re.compile(r"(?i)(apikey|authorization|token|password|secret)(\s*[:=]\s*)([\"']?)[^\s\"'&]{8,}"),
]

def _redact(value):
    if isinstance(value, str):
        for pat in _SECRET_PATTERNS:
            value = pat.sub("[REDACTED]", value)
        return value
    if isinstance(value, dict):
        return {k: _redact(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_redact(v) for v in value]
    return value

def redact_secrets(obj):
    return _redact(obj)
