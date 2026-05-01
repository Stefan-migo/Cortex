---
name: bootstrap
description: Complete intelligent project bootstrap. Pre-flight check → questionnaire → deep research → agent team architecture → project generation.
license: MIT
compatibility: opencode
metadata:
  workflow: setup
  audience: all agents
---

## What It Does
Transforms the generic Cortex template into a fully specialized, professional-grade project environment with custom primary agents, specialized subagent teams, MCP servers, and tools — all tailored to the project's tech stack, domain, and architecture.

## When to Load
- User types `/new-project`
- User says "start a new project"
- User says "adapt this system for my project"

---

## Phase 0 — Pre-flight Check

Before ANY questions, verify the system is functional. Run checks silently and report.

### 0.1 Check Essential Tools
```bash
# Check Node.js (needed by GSD)
node --version

# Check GSD files exist
ls .opencode/command/gsd-new-project.md .opencode/agents/gsd-planner.md 2>/dev/null

# Check GSD runtime
ls .opencode/get-shit-done/VERSION 2>/dev/null

# Check Planning with Files
ls .opencode/skills/planning-with-files/SKILL.md 2>/dev/null
```

### 0.2 Check Optional Tools
```bash
# Check Graphify
python3 -c "import graphify" 2>/dev/null && echo "graphify OK"

# Check graphify OpenCode hooks
ls .opencode/plugins/graphify.js 2>/dev/null
```

### 0.3 Report
Present findings:
```
╔══════════════════════════════════════════════════╗
║          CORTEX — PRE-FLIGHT CHECK              ║
╠══════════════════════════════════════════════════╣
║  ✓ Node.js {version}                             ║
║  ✓ GSD commands + runtime (v{v})                 ║
║  ✓ Planning with Files                           ║
║  ✓ Graphify {ok/not installed}                   ║
║  ✓ 41 agents available                           ║
║  ✓ 8 skills available                           ║
╚══════════════════════════════════════════════════╝
```
If anything is missing, tell the user what to install.

---

## Phase 1 — Discovery: Structured Interview

Ask questions ONE AT A TIME. Wait for each answer.

### 1.1 Project Identity
- "What is the project name?" (will be used for agent names: `<Name>Build`, `<Name>Plan`)
- "Describe it in 1-2 sentences. What problem does it solve?"
- "What type?" (web app, mobile app, CLI tool, API, library, game, data pipeline, desktop app, SaaS platform, other)

### 1.2 Technical Context
- "What's your tech stack preference? If unsure, I'll recommend based on research."
  - Frontend: (React, Next.js, Vue, Svelte, none, other)
  - Backend: (Node/Express, Python/FastAPI, Go, Rust, Java/Spring, Ruby/Rails, .NET, other)
  - Database: (PostgreSQL, MySQL, MongoDB, SQLite, Redis, other)
  - Infrastructure: (Docker, Kubernetes, Vercel, AWS, Cloudflare, bare metal, other)

### 1.3 Domain & Industry
- "What domain does this belong to?" (fintech, healthcare, e-commerce, SaaS, dev tools, gaming, education, AI/ML, IoT, other)
- "Any compliance requirements?" (GDPR, HIPAA, PCI-DSS, SOC2, none)

### 1.4 Architecture Preferences
- "How many users do you expect?" (prototype <100, small <10k, medium <100k, large >100k)
- "Any specific architecture preferences?" (microservices, monolith, serverless, event-driven, CQRS)
- "What's your deployment target?" (Vercel, AWS, GCP, Azure, bare metal, Docker host)

### 1.5 Team & Workflow
- "How many developers will work on this?"
- "What's your preferred workflow?" (GitHub Flow, GitFlow, trunk-based)
- "Any existing code or is this from scratch?"

### 1.6 References
- "Do you have any reference materials?" (URLs to similar projects, design inspirations, API docs, competitor products, architecture articles, tech specs)
- "Any brand guidelines or design preferences?"

---

## Phase 2 — Deep Research

After gathering context, spawn parallel research agents.

### 2.1 Tech Stack Validation → @researcher
```
Research the tech stack for {projectName} ({projectType} in {domain}):
- {frontend} + {backend} + {database} + {infra}
Investigate:
1. Is this stack proven for {domain}? Cite real projects using it.
2. Common pitfalls and how to avoid them.
3. Top 5 libraries/tools the community uses with this stack.
4. Recent major version changes or deprecations to be aware of.
5. Architecture patterns commonly used with this stack.
```
Save to `wiki/sessions/{date}-stack-research.md`.

### 2.2 Architecture Recommendations → @researcher
```
Research architecture for {projectType} in {domain} at {scale} users:
1. What architecture pattern is industry standard?
2. Folder/project structure conventions.
3. Infrastructure requirements for {scale}.
4. Monitoring and observability setup.
5. CI/CD best practices.
6. Security architecture for {domain} {compliance}.
```
Save to `wiki/sessions/{date}-architecture-research.md`.

### 2.3 Industry & Competitor Research → @researcher
```
Research the {domain} landscape:
1. Top 3 successful {projectType}s in this space — what's their tech stack?
2. Common mistakes first-time builders make in {domain}.
3. Key differentiators for competitive advantage.
4. Regulatory considerations for {compliance}.
```
Save to `wiki/sessions/{date}-industry-research.md`.

### 2.4 Reference Analysis
If the user provided reference URLs, analyze each:
- Fetch with `webfetch`
- Extract: patterns, tech choices, UX decisions, unique features
- Note: what to adopt, what to avoid, what to differentiate on
Save to `wiki/sessions/{date}-reference-analysis.md`.

---

## Phase 3 — Agent Team Architecture

Based on all research, propose a **professional team structure**. Present to user for approval.

### 3.1 Determine Team Composition

Based on project type, determine which specialized agents are needed:

| If project has... | Create these agents |
|---|---|
| Backend/API | `{name}-backend` |
| Frontend/UI | `{name}-frontend` |
| Database | `{name}-database` |
| Auth/Sensitive data | `{name}-security` |
| Deploy/Infra | `{name}-devops` |
| Tests/Quality | `{name}-qa` |

For a typical full-stack web app, create all 6. For a CLI tool, maybe just backend + qa. For an API, backend + database + security. Use judgment.

### 3.2 Propose Primary Agent Names
Primary agents in Cortex are switched with Tab. For {PROJECT_NAME}:
- **Build** → `{PROJECT_NAME}Build`
- **Plan** → `{PROJECT_NAME}Plan`

### 3.3 Propose MCP Servers & Skills
Based on the stack, suggest:
- **context7** (always recommended — doc search)
- **github** (if using GitHub — PR/issue management)  
- **sequential-thinking** (always recommended — complex reasoning)
- **postgres** / **sqlite** (if using a database)
- **sentry** (for error monitoring)
- **brave-search** (if heavy research ongoing)
- **puppeteer** (if testing a web frontend)

### 3.4 Propose Design System
If the project type needs a UI, suggest:
- Update `DESIGN.md` with domain-appropriate colors/typography
- If user gave brand guidelines, incorporate them
- If no preferences, suggest based on {domain} best practices

### 3.5 Present the Architecture Plan
```
╔══════════════════════════════════════════════════╗
║            PROJECT ARCHITECTURE                  ║
╠══════════════════════════════════════════════════╣
║  Stack: {recommended stack}                      ║
║  Architecture: {pattern}                         ║
║                                                   ║
║  Agent Team:                                      ║
║    Primary: {Name}Build, {Name}Plan              ║
║    Team:                                          ║
║      • {name}-backend — API & business logic     ║
║      • {name}-frontend — UI & components         ║
║      • {name}-database — Data & migrations       ║
║      • {name}-security — Audits & compliance     ║
║      • {name}-devops — CI/CD & infra             ║
║      • {name}-qa — Tests & quality               ║
║                                                   ║
║  MCP Servers: context7, github, ...               ║
║  Design: {DESIGN.md updated}                     ║
╚══════════════════════════════════════════════════╝
```
Ask user to approve or modify before proceeding.

---

## Phase 4 — Generate

### 4.1 Create Primary Agents

For each primary agent, create a new entry in `opencode.json` and a markdown file in `.opencode/agents/`. The original Build/Plan remain for generic use.

**opencode.json** — Add under `agent`:
```json
"{name}Build": {
  "mode": "primary",
  "model": "anthropic/claude-sonnet-4-20250514",
  "prompt": "{file:.opencode/agents/{name}-build.md}",
  "permission": {
    "edit": "allow",
    "bash": "allow"
  }
},
"{name}Plan": {
  "mode": "primary", 
  "model": "anthropic/claude-haiku-4-20250514",
  "prompt": "{file:.opencode/agents/{name}-plan.md}",
  "permission": {
    "edit": "deny",
    "bash": "deny"
  }
}
```

**.opencode/agents/{name}-build.md**:
```markdown
---
description: "{PROJECT_NAME} primary build agent. Full development capabilities for the {PROJECT_NAME} project."
---

## Project Context
- **Project**: {PROJECT_NAME}
- **Description**: {PROJECT_DESCRIPTION}
- **Stack**: {TECH_STACK}
- **Architecture**: {ARCHITECTURE}

## Your Role
You are the primary build agent for {PROJECT_NAME}. You orchestrate the team of specialized agents:

**Your Team:**
- `@{name}-backend` — Backend development
- `@{name}-frontend` — Frontend development
- `@{name}-database` — Database engineering
- `@{name}-security` — Security auditing
- `@{name}-devops` — Infrastructure & deployment
- `@{name}-qa` — Testing & quality

Delegate through `@agent-name` for specialized work.

## Code Standards
- Follow {TECH_STACK} best practices
- Atomic commits: one concern per commit
- Write tests alongside implementation
- All code must pass lint/typecheck before completion
```

**.opencode/agents/{name}-plan.md**: Same pattern but read-only, for analysis and planning.

### 4.2 Create Specialized Subagents

For each agent in the team, copy from `.opencode/templates/agents/{role}.md` and replace placeholders:

- `{PROJECT_NAME}` → actual name
- `{PROJECT_DESCRIPTION}` → actual description
- `{TECH_STACK}` → actual stack
- `{ARCHITECTURE}` → recommended architecture
- `{DOMAIN}` → domain/industry
- `{COMPLIANCE}` → compliance requirements
- `{DATABASE}` → database choice
- `{DATA_LAYER}` → ORM or data layer
- `{INFRASTRUCTURE}` → infra choice
- `{DEPLOYMENT}` → deployment target
- `{TESTING}` → testing framework
- `{E2E_TOOL}` → e2e tool
- `{DESIGN_SYSTEM}` → "DESIGN.md" or custom

File naming: `{name}-{role}.md` in `.opencode/agents/` (e.g., `myapp-backend.md`).

### 4.3 Generate Project Files

#### .planning/PROJECT.md
Full project description with stack, goals, architecture decisions.

#### .planning/ROADMAP.md  
Phase-by-phase roadmap with the new team agents assigned to each phase.

#### .planning/STATE.md
Current position set to Phase 1.

#### AGENTS.md
Add project context at top. Update agent list to include new team agents.

#### DESIGN.md
If UI project: update with domain-appropriate design tokens.

#### wiki/index.md
Update with project entry.

#### wiki/log.md
Append full project initialization entry.

### 4.4 Update opencode.json

- Add new primary agents (`{name}Build`, `{name}Plan`)
- Enable recommended MCP servers
- Update instruction paths

---

## Phase 5 — Launch

Present the complete setup:

```
╔══════════════════════════════════════════════════╗
║          {PROJECT_NAME} — INITIALIZED            ║
╠══════════════════════════════════════════════════╣
║                                                   ║
║  Primary Agents (Tab to switch):                  ║
║    • {Name}Build — full development              ║
║    • {Name}Plan — analysis & planning            ║
║                                                   ║
║  Specialized Team:                                ║
║    • @{name}-backend    • @{name}-frontend       ║
║    • @{name}-database   • @{name}-security       ║
║    • @{name}-devops     • @{name}-qa             ║
║                                                   ║
║  Research stored in wiki/sessions/                ║
║  Design system in DESIGN.md                       ║
║  MCP servers configured                           ║
║                                                   ║
║  Next step: /gsd-discuss-phase 1                  ║
║                                                   ║
╚══════════════════════════════════════════════════╝
```

---

## Self-Modification Rules

- **CAN modify**: opencode.json, AGENTS.md, DESIGN.md, .planning/*, .opencode/agents/* (new project agents), wiki/*
- **CANNOT modify**: schema/*, .opencode/skills/* (system skills), .opencode/agents/researcher.md (core agents), .opencode/tools/*
- **Keep intact**: Self-Maintenance section of AGENTS.md
- **Original Build/Plan**: Keep as fallback primary agents
- **Core agents**: researcher, architect, reviewer, implementer, debugger, sec-auditor, ingest-agent, lint-agent — do NOT modify (they're platform agents, not project-specific)
