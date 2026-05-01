---
name: bootstrap
description: Initialize this template for a new project. Asks questions, then self-modifies AGENTS.md, DESIGN.md, PROJECT.md, and wiki/.
license: MIT
compatibility: opencode
metadata:
  workflow: setup
  audience: all agents
---

## What It Does
Adapts this generic Cortex template to a specific project. When the user describes their project, this skill tells you how to modify the template files to match.

## When to Load
- First time starting a new project from this template
- When the user says: "I want to start a new project"
- When the user says: "Adapt this system for my project"

## Bootstrap Process

### Step 1: Gather Context
Ask the user about:

**Project Identity**
1. What is the project name?
2. What does it do? (1-2 sentence description)
3. What tech stack? (language, framework, database, infra)
4. What type of project? (web app, CLI tool, library, API, mobile, etc.)

**Design Preferences**
5. Any brand colors or design references?
6. Any existing DESIGN.md or design system you want to use?

**Starting Point**
7. Is this a greenfield project (empty repo) or brownfield (existing code)?
8. If brownfield, what language/framework is the codebase?

### Step 2: Modify Template Files

Based on the answers, modify these files:

#### AGENTS.md
Add a project-specific section at the top:
```markdown
## Project Context
- **Name**: {project name}
- **Description**: {description}
- **Stack**: {tech stack}
- **Type**: {project type}
```

Update any relevant conventions or preferences.

#### DESIGN.md
If the user has brand preferences, update:
- Color palette and tokens
- Typography
- Component stylings
- Layout principles

If not, keep the default generic design system.

#### .planning/PROJECT.md
Fill in the project template:
```markdown
# {Project Name}

## Vision
{description}

## Tech Stack
- **Language**: {language}
- **Framework**: {framework}
- **Database**: {database}
- **Infrastructure**: {infra}

## Goals
- {goal 1}
- {goal 2}
```

#### .planning/ROADMAP.md
If the user describes phases or milestones, add them. Otherwise, create:
```
## Phase 1: Project Setup [planned]
## Phase 2: Core Features [planned]
```

### Step 3: Handle Brownfield Projects
If there's existing code:
1. Suggest running `/graphify .` for codebase understanding
2. Suggest `/gsd-map-codebase` for GSD's analysis
3. Save findings to `wiki/concepts/` and `wiki/entities/`

### Step 4: Verify
After making changes, confirm with the user:
- "I've updated AGENTS.md with your project context"
- "I've configured DESIGN.md with your preferences"
- "I've created the project plan in .planning/"
- "Shall I run graphify to map the codebase?"

## Self-Modification Rules
- You CAN modify AGENTS.md to add project context (append at top)
- You CAN modify DESIGN.md (replace with project-specific tokens)
- You CAN modify .planning/ files (fill in templates)
- You SHOULD NOT modify schema/ files (they define system behavior)
- You SHOULD NOT modify .opencode/agents/ or .opencode/skills/ (they define capabilities)
- You SHOULD keep the Self-Maintenance section of AGENTS.md intact
