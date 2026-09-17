# SDD — Spec-Driven Development Skill

Use this skill when starting a new feature, refactoring, or any task that requires structured planning before execution.

## 8-Phase SDD Cycle

### Phase 1: Explore 🔍
- Query the graph: `graphify query "<question>"` for architecture understanding
- Search memory: `mem_search` for past decisions, patterns, bugs
- Read relevant files
- **Output**: `findings.md` in feature directory

### Phase 2: Propose 💡
- Define WHAT to build
- User stories and acceptance criteria
- Identify risks and edge cases
- **Output**: `proposal.md`

### Phase 3: Spec 📋
- Use the Engram topic key `sdd/<change>/spec` or OpenSpec artifacts under `openspec/changes/<change>/` or `openspec/specs/`
- Formal feature specification with requirements
- **Output**: Engram topic `sdd/<change>/spec` or an OpenSpec specification under `openspec/changes/<change>/` or `openspec/specs/`

### Phase 4: Design 🏗️
- Technical architecture and component design
- Use the Engram topic key `sdd/<change>/design` or OpenSpec artifacts under `openspec/changes/<change>/` or `openspec/specs/`
- Data flow, interfaces, dependencies
- **Output**: Engram topic `sdd/<change>/design` or an OpenSpec design under `openspec/changes/<change>/` or `openspec/specs/`

### Phase 5: Tasks 📝
- Break design into executable tasks
- Use the Engram topic key `sdd/<change>/tasks` or OpenSpec artifacts under `openspec/changes/<change>/` or `openspec/specs/`
- Each task: one concern, max 5 files
- **Output**: Engram topic `sdd/<change>/tasks` or OpenSpec tasks under `openspec/changes/<change>/` or `openspec/specs/`

### Phase 6: Apply 🛠️
- Implement each task following the 5-Step Gate:
  1. Graph Check — query_graph before editing
  2. Atomic Commit — one concern per commit, ≤5 files
  3. Verify — lint + typecheck + tests (BLOCK on failure)
  4. Spec Check — verify against spec after completion
  5. Finalize — mem_save + commit
- Test-first approach when possible

### Phase 7: Verify ✅
- Run all tests
- Run linter and typechecker
- Review against acceptance criteria
- **BLOCK on any failure** — do not proceed to next phase

### Phase 8: Archive 📚
- `mem_save` with type: pattern, discovery, or decision
- Update wiki if applicable
- Close feature branch
- Archive does not refresh Graphify. Graphify refresh is owned by delivery/cleanup
  after GitHub confirms a merged `sdd/<slug>` pull request and its merge SHA is
  verified on main.

## Rules
- NEVER skip phases 1-5 (planning) — the agent must plan before coding
- Phase 6-7 (apply + verify) are the ONLY phases where code is written
- Each phase output feeds the next — don't proceed without the previous phase's output
- If stuck on a phase, use `mem_search` and `graphify query` for context
