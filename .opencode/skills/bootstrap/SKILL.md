---
name: bootstrap
description: Complete project bootstrap. Asks structured questions, researches online, checks references, and proposes a tailored plan.
license: MIT
compatibility: opencode
metadata:
  workflow: setup
  audience: all agents
---

## What It Does
Transforms the generic Cortex template into a project-specific development environment. This is a multi-phase workflow: **Discover → Research → Synthesize → Generate**.

## When to Load
- User types `/new-project`
- User says "start a new project"
- User says "adapt this system for my project"
- The project appears to be unconfigured (no PROJECT.md content)

---

## Phase 1 — Discovery: Structured Interview

Ask questions ONE AT A TIME. Wait for the answer before asking the next one. Use the `question` tool for each.

### 1.1 Identity
- "What is the project name?"
- "Describe it in 1-2 sentences. What problem does it solve?"
- "What type of project is it?" (web app, mobile app, CLI tool, API, library, game, data pipeline, other)

### 1.2 Technical Context
- "What's the tech stack? Any preferences for language, framework, database, infrastructure?"
- "What's the target platform?" (browser, mobile, desktop, server, embedded)
- "Any constraints to consider?" (performance, budget, timeline, team size, deployment)

### 1.3 Domain & Industry
- "What domain or industry does this belong to?" (fintech, healthcare, e-commerce, SaaS, developer tools, gaming, education, etc.)
- "Are there any regulations or compliance requirements?" (GDPR, HIPAA, PCI-DSS, SOC2)

### 1.4 References
- "Do you have any reference materials?" (links to similar projects, design inspirations, documentation, existing codebases, competitor products)
- "Any brand guidelines, logos, or color preferences?"
- If they provide URLs → save them, they'll be researched in Phase 2

### 1.5 Goals & Scope
- "What are the top 3 goals for the MVP?"
- "What is explicitly OUT of scope for now?"
- "What would success look like in 3 months?"

---

## Phase 2 — Research

After gathering all context, research the domain. Use `@researcher` via the Task tool.

### 2.1 Tech Stack Research
Spawn `@researcher` with this prompt:
```
Research the following tech stack for a project:
- Stack: {user's stack}
- Type: {project type}
- Domain: {industry}

Investigate:
1. Best practices and common pitfalls for this stack
2. Recommended libraries and tools for {domain}
3. Architecture patterns commonly used
4. Hosting and deployment options
5. Monitoring and observability setup
```

Save findings to `wiki/sessions/{date}-tech-research.md`.

### 2.2 Reference Analysis
If the user provided reference URLs, analyze each one:
- Read the URL content with `webfetch`
- Extract: design patterns, architecture decisions, tech choices, unique features
- Note what to adopt and what to avoid

Save findings to `wiki/sessions/{date}-reference-analysis.md`.

### 2.3 Industry & Compliance Research
Spawn `@researcher` with:
```
Research industry standards for {domain}:
1. Common compliance requirements ({regulations mentioned})
2. Security best practices
3. Data handling requirements
4. Industry-specific architecture patterns
```

Save findings to `wiki/sessions/{date}-industry-research.md`.

### 2.4 Competitor / Similar Projects
Spawn `@researcher` with:
```
Research similar projects to:
- {project description}
- What do competitors in this space use?
- What common mistakes do first-time builders make?
- What differentiators could this project focus on?
```

Save findings to `wiki/sessions/{date}-competitor-research.md`.

---

## Phase 3 — Synthesis

After research completes, synthesize everything into a coherent project plan.

### 3.1 Analyze Research
Read all research files from `wiki/sessions/`. Identify:
- **Key recommendations**: What to definitely do
- **Pitfalls to avoid**: What the research warns against
- **Technology decisions**: What stack choices are validated
- **Architecture decisions**: Recommended patterns

### 3.2 Build the Plan
Create a structured proposal:

```markdown
## Project Proposal: {Name}

### Summary
{concise overview}

### Recommended Stack
- **Language**: {with rationale}
- **Framework**: {with rationale}
- **Database**: {with rationale}
- **Infrastructure**: {with rationale}

### Architecture
{high-level architecture description}

### Phases
| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| 1 | Project Setup | Dev environment, CI/CD, scaffolding |
| 2 | Core Feature 1 | {feature}, tests, docs |
| 3 | Core Feature 2 | {feature}, tests, docs |
| 4 | Polish & Launch | Performance, security audit, deploy |

### Key Decisions
| Decision | Choice | Why |
|----------|--------|-----|
| {decision} | {choice} | {rationale from research} |

### Risks & Mitigations
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| {risk} | {high/med/low} | {plan} |
```

### 3.3 Present to User
Use the `question` tool with options:
```
Here's the project plan I've prepared based on our discussion and research.

[Show the full proposal]

What do you think?
```
- Option: "Looks good, create the project files"
- Option: "I want to modify some things"
- Option: "Let's discuss further"

If they want modifications, adjust and re-present.
If they approve, proceed to Phase 4.

---

## Phase 4 — Generate Project Files

### 4.1 Files to Create/Update

#### AGENTS.md
Insert project context at the top (after the title):
```markdown
## Project Context
- **Name**: {name}
- **Description**: {description}
- **Stack**: {stack}
- **Type**: {type}
- **Domain**: {domain}
- **Goals**: {top 3 goals}
```

#### .planning/PROJECT.md
Full project description with tech stack, goals, constraints, key decisions from research.

#### .planning/ROADMAP.md
Phase-by-phase roadmap with status markers. Extract from the proposal.

#### .planning/STATE.md
Current position set to Phase 1, with decisions log from research.

#### DESIGN.md
If the user provided brand preferences, update the design system. Otherwise, keep defaults but add industry-appropriate suggestions from research.

#### wiki/index.md
Add the project name and description to the index.

#### wiki/log.md
Append: `## [YYYY-MM-DD] bootstrap | {Project Name} initialized`

#### wiki/concepts/
Create initial concept pages from research findings (e.g., architecture decisions, tech stack notes).

### 4.2 Self-Modification Rules
- **CAN** modify: AGENTS.md, DESIGN.md, .planning/*, wiki/index.md, wiki/log.md, wiki/concepts/
- **CANNOT** modify: schema/, .opencode/agents/, .opencode/skills/, .opencode/tools/, opencode.json (these define the system itself)
- Keep the Self-Maintenance section of AGENTS.md intact

---

## Phase 5 — Next Steps

After creating all files, present a summary:

```
╔══════════════════════════════════════════════════╗
║          PROJECT INITIALIZED                     ║
╠══════════════════════════════════════════════════╣
║  Files created:                                  ║
║    • AGENTS.md — context added                   ║
║    • .planning/PROJECT.md — vision & goals       ║
║    • .planning/ROADMAP.md — {N} phases           ║
║    • .planning/STATE.md — initialized            ║
║    • DESIGN.md — configured                      ║
║    • wiki/concepts/ — research pages             ║
║                                                  ║
║  Next steps:                                     ║
║    1. /gsd-discuss-phase 1 — dive into Phase 1   ║
║    2. (if code exists) /graphify .               ║
║    3. Read SYSTEM-MAP.md for full tool reference ║
╚══════════════════════════════════════════════════╝
```

Ask: "Ready to start Phase 1? Or would you like to adjust anything?"
