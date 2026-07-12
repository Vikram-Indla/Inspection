from pathlib import Path
import sys, json, os, datetime, subprocess

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
