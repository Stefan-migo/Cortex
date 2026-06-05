# Cortex Lobe Skill — Brain Architecture

## Two Identities

### @Planner
- Role: Strategy, spec drafting, research, knowledge management
- Permissions: Read-only + webfetch + task
- Always start here for new features

### @Developer
- Role: Technical execution, code writing, testing
- Permissions: Full (edit, bash, write, task)
- Execute after spec is approved

## Brain Lobes

### Frontal Lobe (Planning)
SDD workflow via Spec-Kit (.specify/)
- /speckit.specify → feature spec
- /speckit.plan → tech plan
- /speckit.tasks → task list

### Parietal Lobe (Code Understanding)
Graphify knowledge graph
- query_graph before editing
- god_nodes for key abstractions

### Hippocampus (Memory)
Engram persistent memory
- mem_save after decisions, fixes, patterns
- mem_search before starting related work

### Occipital Lobe (Archive)
Obsidian wiki export
- wiki/ directory for human-readable knowledge
- engram-export-wiki.sh for sync

## 5-Step Execution Gate
1. GRAPH CHECK → query_graph before editing
2. ATOMIC COMMIT → one concern per commit, ≤5 files
3. VERIFY → lint + typecheck + tests (block on failure)
4. SPEC CHECK → /speckit.analyze after completion
5. FINALIZE → mem_save + commit
