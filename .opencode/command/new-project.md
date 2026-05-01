---
description: "Start a new project from scratch. Asks questions, researches online, checks references, and proposes a structured plan."
tools:
  read: true
  bash: true
  write: true
  task: true
  question: true
---

## Step 0 — Banner

Before ANY tool calls, display this banner:

```
╔══════════════════════════════════════════════════╗
║              CORTEX > NEW PROJECT               ║
╚══════════════════════════════════════════════════╝
```

## Step 1 — Load the bootstrap skill

Call the skill tool to load the full bootstrap workflow:
```
skill({name:"bootstrap"})
```

The skill contains the complete step-by-step process for:
- Gathering project context through structured questions
- Internet research on tech stack, best practices, and similar projects
- Checking user-provided references (URLs, docs, repos)
- Synthesizing research into a project plan
- Creating PROJECT.md, ROADMAP.md, STATE.md, and initial wiki pages

Wait for the skill to load, then follow its instructions.

## Step 2 — Offer GSD integration

After the bootstrap skill completes, ask the user if they want to:
- Map existing codebase: `/gsd-map-codebase`
- Plan the first phase: `/gsd-discuss-phase 1`
