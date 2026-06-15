<div align="center">
  <h1>Cortex</h1>
  <p><strong>Skill pack for Gentle AI — Persona, Ponytail, Graphify, 5-Step Gate</strong></p>
  <p>
    <a href="https://github.com/Gentleman-Programming/gentle-ai"><img src="https://img.shields.io/badge/Gentle%20AI-Plugin-2563EB?style=flat-square" alt="Gentle AI Plugin"></a>
    <a href="https://github.com/DietrichGebert/ponytail"><img src="https://img.shields.io/badge/Ponytail-Enabled-22AA66?style=flat-square" alt="Ponytail"></a>
    <a href="https://github.com/safishamsi/graphify"><img src="https://img.shields.io/badge/Graphify-Enabled-7C3AED?style=flat-square" alt="Graphify"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License"></a>
  </p>
</div>

---

Cortex is a **skill pack** that extends [Gentle AI](https://github.com/Gentleman-Programming/gentle-ai) with a senior architect persona, Ponytail over-engineering review, Graphify knowledge graph integration, and the mandatory 5-Step Execution Gate.

It doesn't replace gentle-ai — it sits on top of it, modifying the orchestrator's persona and adding specialized skills.

## What's Included

| Component | Description |
|-----------|-------------|
| **cortex-persona** | Senior architect identity — Rioplatense Spanish (voseo) in chat, English in artifacts, passionate teaching tone, 15+ years |
| **ponytail-review** | Over-engineering focused code review: one-line findings with tags (`yagni:`, `stdlib:`, `native:`, `delete:`, `shrink:`) |
| **ponytail-audit** | Repo-wide bloat audit — ranked list of what to delete, simplify, or replace with stdlib |
| **ponytail-debt** | Harvests `ponytail:` comments into a debt ledger with ceiling + upgrade path tracking |
| **ponytail-help** | Quick-reference card for all Ponytail modes and commands |
| **Ponytail Rules** | The lazy-developer ladder: YAGNI → stdlib → native → one line → minimum, as 26 lines in the persona |
| **5-Step Gate** | Mandatory execution flow: Graph Check → Atomic Commit → Verify → Spec Check → Finalize |
| **Graphify** | Knowledge graph integration for codebase awareness before editing |

## Dependencies

- [Gentle AI](https://github.com/Gentleman-Programming/gentle-ai) — ecosystem configurator for Engram + SDD + 24 skills
- [Graphify](https://github.com/safishamsi/graphify) — knowledge graph extraction (optional, but recommended)
- [OpenCode](https://opencode.ai) — AI coding agent IDE

## Quick Start

```bash
# 1. Install Gentle AI (one-time)
gentle-ai install --agent opencode

# 2. Clone this pack
git clone https://github.com/Stefan-migo/Cortex.git

# 3. Install the Cortex command globally
cp Cortex/commands/cortex-init.md ~/.config/opencode/commands/

# 4. Bootstrap any project
opencode .                          # Launch gentle-ai
/cortex-init                        # Links skills, builds graph, suggests /sdd-init
/sdd-init                           # Complete SDD setup
```

## Per-Project Setup

```bash
# From inside the project directory:
bash /path/to/Cortex/cortex-init.sh .

# Or from OpenCode:
/cortex-init
```

This will:
1. Link `cortex-persona` skill to `.opencode/skills/`
2. Link Ponytail skills (`ponytail-review`, `ponytail-audit`, `ponytail-debt`, `ponytail-help`)
3. Build the Graphify knowledge graph (`graphify-out/`)
4. Install `/cortex-init` command in the project

## What Changed (v2.5 → v3.0)

| Before | After |
|--------|-------|
| Standalone 2-agent system (Planner/Developer) | Gentle AI skill pack |
| Spec-Kit `/speckit.*` commands | Gentle AI SDD (`/sdd-*`) |
| cortex-planner / cortex-developer | gentle-orchestrator + 9 SDD sub-agents |
| OpenHarness dual runtime deprecated | Single runtime: Gentle AI on OpenCode |
| 66 GSD commands removed | Replaced by Gentle AI ecosystem |

## License

MIT
