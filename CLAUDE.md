# Claude Code Instructions

@AGENTS.md

`AGENTS.md` is the shared repository contract and must be read before making changes. This file
adds only Claude-specific operating guidance so the two instruction sets do not drift.

## Working Style

- Inspect relevant files and the current diff before proposing or applying edits.
- For a small, well-scoped request, implement directly. For a broad request, briefly outline the
  plan and keep it updated as facts change.
- Ask only when a missing decision would materially change content, public behavior, integrations,
  or deployment; otherwise make the smallest reversible assumption and disclose it.
- Use subagents only for genuinely independent work. Give each subagent a bounded scope and avoid
  concurrent edits to the same files.
- Prefer targeted searches and targeted checks. Do not scan `.env.local`, generated output,
  dependencies, or the full upstream README without a task-specific reason.
- Never claim a check passed unless its command completed successfully. Distinguish pre-existing
  failures from regressions caused by the current change.
- End with a concise handoff: outcome, files changed, verification performed, and unresolved risk.

## Repository Memory Maintenance

- Put durable, repository-wide discoveries in `AGENTS.md`, not here.
- Add a nested `AGENTS.md` only when a directory has stable rules that differ from the root.
- Keep this file limited to Claude behavior and the import above.
