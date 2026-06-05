# SDD Skill — Spec-Driven Development

## Purpose
Guide the agent through structured feature development:
explore → propose → spec → design → tasks → apply → verify → archive

## Phases

### 1. Explore
Investigate the codebase and understand context before proposing changes.
- Use graphify query for architecture understanding
- Use mem_search for past decisions
- Output: findings.md

### 2. Propose
Define WHAT to build before HOW.
- User stories
- Acceptance criteria
- Output: proposal.md

### 3. Spec
Write formal feature specification.
- Use .specify/templates/spec-template.md
- Output: .specify/features/<feature-name>/spec.md

### 4. Design
Technical design and architecture.
- Use .specify/templates/plan-template.md
- Output: .specify/features/<feature-name>/design.md

### 5. Tasks
Break into executable tasks.
- Use .specify/templates/tasks-template.md
- Output: .specify/features/<feature-name>/tasks.md

### 6. Apply
Implement each task with test-first approach.
- One concern per commit
- Max 5 files per commit

### 7. Verify
Run lint, typecheck, tests.
- Block on failure

### 8. Archive
Save learnings to Engram.
- mem_save with type: pattern or discovery
