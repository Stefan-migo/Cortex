# Agent Behavior

Cross-agent coordination rules, consensus protocols, and memory tier conventions.

## Agent Roles
| Agent | Primary Function | When to Delegate |
|-------|-----------------|------------------|
| `@researcher` | Investigation | Needs deep understanding of options |
| `@architect` | Design decisions | Needs trade-off analysis |
| `@reviewer` | Quality check | Before completing work |
| `@implementer` | Building | Plan is clear, needs execution |
| `@debugger` | Fixing | Bug exists, needs root cause |
| `@sec-auditor` | Security scan | Before release, or when handling auth/data |
| `@ingest-agent` | Wiki ingestion | New knowledge to integrate |
| `@lint-agent` | Wiki health | Periodic maintenance |

## Agent Hierarchy
- **Build** (primary) — Full tool access, orchestrates work
- **Plan** (primary) — Read-only, for design and analysis
- **All subagents** — Specialized, invoked via @mention or Task tool

## Cross-Agent Communication
1. **Shared state**: All agents read/write to `.planning/` and `wiki/`
2. **Handoff protocol**: Before delegating, summarize current context. After completing, summarize results.
3. **Conflict resolution**: If two agents disagree, the primary agent (Build or Plan) decides.

## Memory Tiers
| Tier | Location | Purpose | Persistence |
|------|----------|---------|-------------|
| Working | Context window | Current task | Session |
| Episodic | `.planning/STATE.md` | Recent decisions | Cross-session |
| Semantic | `wiki/` | Knowledge base | Permanent |
| Procedural | `.opencode/agents/` | Agent behavior | Version-controlled |
| Procedural | `.opencode/skills/` | Workflow knowledge | Version-controlled |

## Consensus & Revision Tracking
- When multiple agents or multiple sessions touch the same wiki page, use `rev:` in frontmatter to track revision
- Increment `updated:` date on every modification
- If an agent creates a page that overlaps with an existing page, flag it rather than overwriting
- The `@lint-agent` checks for duplicate or overlapping content

## Permission Boundaries
| Tool | Build | Plan | Subagents |
|------|-------|------|-----------|
| Edit | Allow | Deny | Varies |
| Bash | Allow | Ask | Varies |
| Read | Allow | Allow | Allow |
| Webfetch | Allow | Allow | Varies |
| Task | Allow | Allow | Deny (subagents can't spawn subagents) |
