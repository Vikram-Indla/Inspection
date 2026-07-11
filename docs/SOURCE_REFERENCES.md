# Official Reference Basis

The G4 structure follows current official Claude Code concepts:
- project `CLAUDE.md` for persistent shared instructions;
- `.claude/rules/` for modular and path-scoped rules;
- `.claude/skills/<skill>/SKILL.md` for on-demand procedures;
- project `.claude/settings.json` for shareable hooks;
- SessionStart, UserPromptSubmit, PreToolUse, PreCompact, PostCompact, Stop and SessionEnd lifecycle events;
- auto memory as local advisory memory, not cross-machine authority.

Official documentation:
- https://code.claude.com/docs/en/memory
- https://code.claude.com/docs/en/hooks
- https://code.claude.com/docs/en/skills
- https://obsidian.md/help/vault
