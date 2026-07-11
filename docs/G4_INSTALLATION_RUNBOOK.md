# G4 Installation Runbook

## Objective
Create one durable second memory shared by Git, Obsidian and Claude/Fable.

## Step 1 - Place the overlay
Clone the empty `Vikram-Indla/Inspection` repository, then copy every file from `repository_overlay/` into the repository root.

## Step 2 - Validate locally
macOS/Linux:
```bash
bash bootstrap.sh
```

Windows PowerShell:
```powershell
./bootstrap.ps1
```

## Step 3 - Create the baseline commit
Review the tree, then:
```bash
git add .
git commit -m "chore: establish inspection product contract and G4 memory"
git push origin main
```
Do not force-push.

## Step 4 - Open Obsidian
- Open Obsidian.
- Choose **Open folder as vault**.
- Select the repository root itself.
- Open `HOME.md`.
- Confirm links to current state, gates, current slice and decisions work.
- Do not create a second copy of the vault.

## Step 5 - Start Claude Code
Launch Claude Code from the repository root.
- Accept workspace trust only after reviewing `.claude/settings.json` and hook scripts.
- Run `/memory`.
- Confirm root `CLAUDE.md` and project rules are loaded.
- Keep auto memory enabled only as advisory memory.

## Step 6 - Verify SessionStart
Start a fresh session. Confirm the first context contains:
- branch and commit;
- gate status;
- current state;
- current slice;
- instruction to repeat task/evidence/do-not-touch areas.

## Step 7 - Verify hard guard
In a disposable test branch, ask Claude to run:
```bash
git push origin main
```
The PreToolUse hook must deny it. Do not actually bypass the hook.

## Step 8 - Verify resume
End a test session after creating a session handoff. Start a new session and invoke `/inspection-session-start`.
The new session must reconstruct the task from files without relying on chat history.

## Pass evidence
Capture the seven files listed in `CURRENT_SLICE.yaml`.

## G4 pass decision
G4 passes only after all evidence is reviewed and the actual repository contains the baseline commit.
