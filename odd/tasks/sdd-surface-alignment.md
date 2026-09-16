# ODD Task — sdd-surface-alignment

**Branch:** `odd/sdd-surface-alignment` · **Worktree:** `../Cortex-odd-sdd-surface-alignment`

## Objective

Stop the two shipped surfaces that still point at the retired Spec-Kit workflow: the CLI's runtime suggestion, and the template's missing ODD worktree rule.

## Problem

Three exact sites:

1. **`cli/src/commands/analyze.ts:129-131`** — a gap labelled `speckit`, triggered by the words `speckit`/`spec-kit`/`no tasks`, whose suggestion tells the user to run `/speckit.specify`. That command does not exist.

2. **`cli/src/engine/session.ts:183-186`** — the guard is `warnText.includes('speckit') || !existsSync(join(projectDir, '.specify'))`. The decommission removes `.specify/`, and no modern project has it, so **the second disjunct is permanently true**: every session retrospective reports a false gap (`Spec-Kit tasks or plans not found`) and a false suggestion. A gap that always fires is worse than one that never fires, because it trains the user to ignore the retrospective.

3. **`cli/src/template/AGENTS.md`** — the root `AGENTS.md` documents the ODD worktree rule, the template does not. Every project created with `cortex init` therefore never learns the worktree discipline. This is sync-readiness blocker #2.

## Why

All three are the same defect class as the change that just landed: a surface Cortex ships still describes a workflow that no longer exists. Two of them are worse than documentation, because they are produced at runtime by the tool itself.

## Scope

Authorized, three files: `cli/src/commands/analyze.ts`, `cli/src/engine/session.ts`, `cli/src/template/AGENTS.md`.

**Out of scope** (the rest of Group B and the other sync blockers): `cli/src/commands/status.ts` (spec-kit report fields and its `.specify/tasks` / `.specify/plans` reads), `cli/src/commands/close.ts:122`, `cli/src/engine/deps.ts:53,56-57` (probes the `speckit`/`specify` binaries), both `.specify/` trees, the shell scripts, `docs/COMPETITIVE-ANALYSIS.md`, the `package.json` `files` versus runtime-template mismatch, `projects.txt`, the absolute paths `cortex-init.sh` writes, and the stale `sdd/<slug>` in `.opencode/skills/sdd/SKILL.md:55-57`.

## Constraints and decisions

**`analyze.ts`** — retarget the branch from Spec-Kit to SDD rather than only rewriting the string, because a gap permanently labelled `speckit` would keep tracking a retired tool. The trigger keeps the existing `no tasks` heuristic and drops the `speckit`/`spec-kit` words:

```ts
if (lower.includes('sdd') || lower.includes('no tasks')) {
  gaps.push('sdd');
  suggestions.push('Use `/sdd-new` before starting complex features');
}
```

**`session.ts`** — **drop the filesystem existence check entirely**. The SDD artifact store is resolved by the dispatcher and may be file-based (`openspec/`) or Engram-only, so the filesystem cannot answer "were there planning artifacts". Any directory probe either fires permanently or is wrong for one of the two store shapes. The warning-text trigger carries the detection:

```ts
if (warnText.includes('sdd')) {
  gaps.push('SDD change artifacts not found');
  suggestions.push('Use `/sdd-new` before starting complex features');
}
```

`existsSync` stays imported: it is still used by the Graphify check immediately above.

**Template rule** — port the root's `## ODD Worktrees` section, generalized for a consumer project, placed after `## Coding Standards` and before `## Project` (the position the root uses relative to its own neighbouring sections). Keep: the ODD `Classify` trigger, the born-in-a-worktree default, explicit per-feature human consent before `cortex worktree create` with `--yes` as its consequence, and the `odd/tasks/<feature>.md` delivery rule including the "never inside a `gentle-ai` managed block" constraint.

Adapt and drop:

- The worktree path must be **`../<Project>-odd-<slug>`**, where `<Project>` is the main worktree's directory name. The root hardcodes `Cortex-odd-<slug>` because the root is Cortex; the template serves any project, and this matches what `worktreePath()` actually computes (`${basename(main)}-odd-${slug}`).
- **Drop the post-merge `cli/dist/` rebuild sentence.** It exists because the Cortex repository builds its own CLI. A consumer project has no `cli/`, so shipping that instruction would be a new false instruction — exactly the defect this change is fixing.

Generated artifacts stay in English.

## TDD

Mode: **off**. Two three-line heuristic edits and one Markdown section; there is no test harness in this repository (zero test files, `npm test` exits 1). Functional verification is `npm run typecheck`, `npm run build`, and the grep acceptance checks below.

## Tasks

- [x] **T01** — Retarget the gap branch in `cli/src/commands/analyze.ts`.
- [x] **T02** — Replace the guard in `cli/src/engine/session.ts` and drop the `.specify` existence probe.
- [x] **T03** — Add the generalized `## ODD Worktrees` section to `cli/src/template/AGENTS.md`.
- [ ] **T04** — Verify, commit as two work units (code, then template), and open the PR.

## Acceptance criteria

- `grep -rn "/speckit" cli/src --exclude-dir=.specify` returns nothing. The `--exclude-dir` is required: `cli/src/template/.specify/**` is the retired Spec-Kit scaffolding and is deliberately out of scope. The first draft of this criterion omitted it and was wrong.
- After `npm run build`, `grep -c "/speckit" cli/dist/index.js` is `0`.
- `npm run typecheck` passes.
- The built `cli/template/AGENTS.md` (which is what the runtime reads) contains `## ODD Worktrees`.
- No file outside the three authorized paths is modified.

## Verification evidence

### The acceptance checks

`grep -rn "/speckit" cli/src --exclude-dir=.specify`:
```
(ninguno)
```

`grep -c "/speckit" cli/dist/index.js`:
```
0
```

`grep -n "ODD Worktrees" cli/template/AGENTS.md`:
```
118:## ODD Worktrees
```
This is the **built** copy, which is what `template.ts:12` resolves at runtime, so it proves the build propagates the new section.

`npm run typecheck` (from `cli/`):
```
> cortex-brain@1.0.0 typecheck
> tsc --noEmit
(no diagnostics)
```

`grep -n 'gentle-ai:' cli/src/template/AGENTS.md`:
```
(no output)
```
No managed markers, so the new section cannot be replaced by a `gentle-ai sync`.

### Smoke test, with a differential control

`node cli/dist/index.js analyze --dry-run`:
```
Cortex Session Analysis
───────────────────────
✖ Not inside a Cortex project
```

To prove that refusal is pre-existing rather than caused by this change, the same command was run with the **pre-change** bundle from main, in the same directory:
```
node /home/stefan/Cortex/cli/dist/index.js analyze --dry-run
Cortex Session Analysis
───────────────────────
✖ Not inside a Cortex project
```
Identical output. The worktree has `.cortex/worktree.json` but no project manifest, so the guard fires for both bundles and this change is not implicated.

### What was not exercised

Neither changed branch was executed end to end. Both fire only when session or memory text contains the trigger token, and reaching them requires `cortex analyze` inside a full Cortex project or `cortex close`. They are covered by `typecheck` and by the zero-match grep on the built bundle; the branches themselves were never run.

## Progress

T01–T03 complete and verified. The first draft was stopped once by a too-broad acceptance criterion authored by the parent (`grep -rn "/speckit" cli/src` without excluding `.specify/`); the criterion was corrected, not the implementation. Changes remain uncommitted.

## Next step

Commit the two work units (code, then template plus this record), then open the PR.

## Rationale log

- **Retarget rather than delete.** Both CLI branches exist to detect "no structured planning happened and here is what to do". The detection was right; only its target was dead. Deleting the branches would have removed a useful signal.
- **A permanently-firing gap is worse than a missing one.** This is why `session.ts` loses its `.specify` probe instead of swapping it for an `openspec/` probe: the second would fire permanently for every Engram-store workspace.
- **The template gets the rule without the Cortex-specific rebuild step.** Shipping our own build instruction to consumers would recreate the defect being fixed.
