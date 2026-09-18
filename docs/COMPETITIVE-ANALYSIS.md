# Rapsodia 2.5 — Competitive Analysis

How Rapsodia 2.5 compares to the coding agent ecosystem after the Architecture 2.5 upgrade.

---

## Architecture Shift: Rapsodia 2.5 vs Prior Art

Rapsodia 2.5 collapses the old multi-agent bureaucracy (41 agents, 66 commands, 3 planning systems) into a **two-persona, four-lobe model** powered by three real tools:

| Lobe | Rapsodia 2.5 | Prior Art |
|------|-----------|-----------|
| Planning | **Gentle AI SDD** | Replace GSD + Planning-with-Files |
| Memory | **Engram** (Gentleman-Programming/engram, 3.3k★) | Replace file-based wiki memory |
| Code understanding | **Graphify** (safishamsi/graphify, 39k★) | Same (kept) |
| API archive | **wiki/** (snapshot via `engram obsidian-export`) | Previously manual wiki ingestion/lint |

## Competitive Positioning

Rapsodia 2.5's advantage is **vertical integration** of three independent open-source tools that other systems use only in isolation:

- No other system combines Gentle AI SDD + Engram + Graphify
- No other system has the 4-lobe brain metaphor as an architectural pattern
- No other system has a pre-commit atomicity gate and 5-step execution discipline built in

**Weaknesses remaining:**
- OpenCode-only (not multi-platform like GSD or ECC)
- No eval/benchmark suite
- No built-in CI/CD or test runner

## MCP Servers Available

Configured in `opencode.json`:

| Server | Status | Purpose |
|--------|--------|---------|
| Engram | Enabled | Persistent memory (19 tools) |
| Graphify | Enabled | Codebase knowledge graph |
| Sequential Thinking | Disabled | Structured reasoning |
| Context7 | Disabled | Doc search (30+ libraries) |
| GitHub | Disabled | PR/issue management |

Enable any by setting `"enabled": true` in `opencode.json`.
