# Cortex — Competitive Analysis & Improvement Roadmap

Deep research into the coding agent ecosystem and how Cortex compares.

---

## 1. Coding Agent Landscape

### Major Players

| Agent | Stars | Runtime | Strengths | Weaknesses |
|-------|-------|---------|-----------|------------|
| **Claude Code** | 120k | Claude CLI | Mature ecosystem, MCP, hooks, plugins | Single-model, proprietary, no wiki/memory |
| **ECC** | 171k | Multi-agent (Claude, Codex, OpenCode) | Massive skill library (182), instinct system | Overwhelming, Claude-first, duplication risks |
| **GSD** | 59k | Multi-agent (11 platforms) | Best planning, atomic commits, wave execution | No memory/wiki, no design system |
| **Aider** | 35k | CLI | Open-source, multi-model, edit-focused | No planning, no memory, minimal structure |
| **Cursor** | Closed | IDE | Built-in editor integration, tab completion | No wiki/memory, locked ecosystem |
| **Windsurf** | Closed | IDE | Cascade system, good UX | Proprietary, no customization |
| **Codex CLI** | Closed | Terminal (OpenAI) | Fast, Codex models | OpenAI-locked, minimal extensibility |
| **Cortex** | — | OpenCode | Memory/wiki, planning, auto-maint, bootstrap | MCP light, one platform, early |

### How Cortex Uniquely Excels

| Feature | Why it matters | Competitors with it |
|---------|---------------|---------------------|
| **Persistent wiki/memory** | Knowledge compounds instead of disappearing into chat history | None |
| **Self-maintenance** | Agent proactively manages its own health | None |
| **5-phase bootstrap** | Research-backed project setup with internet research | None (GSD has /gsd-new-project but less research) |
| **Editorial policy** | Quality control for what enters the knowledge base | None |
| **Three-layer architecture** | Clean separation: sources → wiki → schema | None (Karpathy pattern unique to Cortex) |
| **Design system** | DESIGN.md token-based UI generation | ECC only |

### Architecture Quality Assessment of Cortex

**Strengths:**
- Clean separation of concerns (raw/wiki/schema + planning/knowledge/memory)
- Agent hierarchy is logical (Build/Plan primary → 8 specialized subagents)
- Skill loading is on-demand (keeps context lean)
- File-based memory is git-friendly, portable, and survives /clear
- Planning artifacts shared between GSD and native planning
- Cross-references between all components

**Weaknesses to address:**
1. **No MCP integration** (besides graphify) — missing Context7, GitHub, Sentry, Sequential Thinking
2. **Single-platform** — Cortex is OpenCode-only
3. **No testing agent** — missing automated test runner/analyzer
4. **No performance agent** — no benchmarking or profiling
5. **No CI/CD agent** — no GitHub Actions / deployment management
6. **No translation agent** — competitors have i18n skills
7. **Vault/data not ported to graph** — wiki data not exposed as graph
8. **No eval/benchmark** — how do you measure if the agent is improving?

---

## 2. MCP Server Opportunities

Cortex currently has only the Graphify MCP server configured. Here are the top MCP servers that would significantly expand capabilities:

### Tier 1 — High Impact (should add now)

| MCP Server | What it does | How it helps Cortex |
|-----------|-------------|---------------------|
| **Context7** | Searches documentation across 30+ libraries | Replaces manual doc browsing during development |
| **GitHub** | PR creation, issue management, code search | CI/CD workflow, PR management |
| **Sequential Thinking** | Structured reasoning for complex problems | Better debugging, architecture decisions |
| **Memory** | Knowledge graph-based persistent memory | Redundant with wiki but useful as backup |

### Tier 2 — Medium Impact (add when user needs specific capability)

| MCP Server | What it does | How it helps Cortex |
|-----------|-------------|---------------------|
| **Sentry** | Error monitoring integration | Production bug tracking |
| **PostgreSQL/SQLite** | Direct database access | Schema inspection, query optimization |
| **Puppeteer** | Browser automation | Testing, scraping |
| **Filesystem** | Secure file operations outside worktree | Broader file access |
| **Brave Search** | Web search | Better research than built-in websearch |

### Tier 3 — Long-term

| MCP Server | What it does | How it helps Cortex |
|-----------|-------------|---------------------|
| **Git (MCP official)** | Git operations beyond bash | Better git workflow |
| **Linear/Jira** | Project management | Team integration |
| **Slack** | Team communication | Notification/prompt from chat |
| **Google Drive** | Doc access | Pull requirements from shared docs |

### How to Add MCP Servers to Cortex

OpenCode MCP configuration uses `opencode.json`:
```json
{
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "enabled": true
    },
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "enabled": true,
      "environment": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "{env:GITHUB_TOKEN}"
      }
    }
  }
}
```

---

## 3. Comparison Matrix: Cortex vs Others

| Capability | Cortex | Claude Code | GSD | ECC | Aider |
|-----------|--------|------------|-----|-----|-------|
| Memory/wiki | 9/10 | 2/10 | 3/10 | 5/10 | 1/10 |
| Planning | 8/10 | 4/10 | 10/10 | 7/10 | 2/10 |
| Code understanding | 8/10 | 5/10 | 4/10 | 7/10 | 3/10 |
| Code quality | 7/10 | 3/10 | 7/10 | 8/10 | 3/10 |
| Design system | 8/10 | 0/10 | 3/10 | 6/10 | 0/10 |
| Self-maintenance | 8/10 | 1/10 | 1/10 | 4/10 | 1/10 |
| Session recovery | 8/10 | 1/10 | 3/10 | 6/10 | 1/10 |
| Bootstrap/new project | 9/10 | 0/10 | 7/10 | 5/10 | 0/10 |
| MCP ecosystem | 2/10 | 8/10 | 3/10 | 5/10 | 4/10 |
| Multi-platform | 3/10 | 5/10 | 10/10 | 9/10 | 8/10 |
| **Overall** | **7.0** | **3.9** | **5.1** | **6.2** | **2.1** |

---

## 4. Recommended Improvements

### Immediate (this session)
1. Add MCP server configs for Context7, GitHub, Sequential Thinking
2. Create MCP documentation guide (`.opencode/mcp-template.json`)
3. Add MCP section to SYSTEM-MAP.md
4. Update AGENTS.md to reference MCP servers

### Short-term (next releases)
1. Add testing agent (`@test-runner`) with test execution/coverage analysis
2. Add CI/CD skill for deployment workflows
3. Create `.opencode/mcp.json` with suggested servers
4. Document how to add custom MCP servers per project

### Medium-term
1. Multi-platform support (Claude Code, Cursor, Aider)
2. Performance monitoring agent (`@perf-analyzer`)
3. Eval benchmark suite for agent quality measurement
4. Translation/i18n skill

### Long-term
1. Graph integration between wiki data and Graphify
2. Team collaboration features
3. Plugin marketplace for Cortex skills
4. Web dashboard for wiki/planning visualization
