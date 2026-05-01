# Wiki Log

Chronological record of all wiki activity. Append-only.

Entries are prefixed with date for grep-parseability:
`grep "^## \[" wiki/log.md | tail -5`

---

## [2026-05-01] init | Cortex Wiki Created
Initialized the Cortex wiki structure. Created index.md, log.md, and subdirectories.

## [2026-05-01] install | Graphify + GSD
Installed Graphify (graph extraction, 25 tree-sitter parsers) and GSD (65 commands, 33 subagents) as companion CLI tools. Updated USER-GUIDE.md with full GSD workflow documentation.

## [2026-05-01] docs | SYSTEM-MAP + Self-Maintenance
Added SYSTEM-MAP.md with visual architecture, component-by-component usage guide, and quick reference card.
Updated AGENTS.md with Self-Maintenance section: toolkit summary, proactive behavior rules, and maintenance schedule.

## [2026-05-01] install | Planning with Files
Installed Planning with Files (context discipline skill). Adds 3-file pattern, pre/post tool hooks, and completion verification. Integrated into SYSTEM-MAP.md, AGENTS.md, and Quick Reference Card. ECC excluded to avoid agent/command conflicts with GSD.

## [2026-05-01] feature | Bootstrap + Template System
Added bootstrap skill (.opencode/skills/bootstrap/SKILL.md) for self-adaptation. Added scripts/setup.sh for CLI initialization. Updated AGENTS.md with System Overview table and proactive bootstrap triggers. The template can now be cloned and adapted for any new project.

## [2026-05-01] docs | README.md
Created comprehensive README.md for the Cortex repository. Includes quick start, architecture diagram, capability matrix, component deep-dive, bootstrap workflow, daily workflow, and community documentation.
