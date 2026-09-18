# ODD Task — provision-cli-deps

**Branch:** `odd/provision-cli-deps` · **Worktree:** `../Cortex-odd-provision-cli-deps`

## Objective

Make a freshly provisioned worktree able to typecheck and build the CLI without a manual step.

## Problem

`provisionWorktree` installs dependencies for `.opencode` and `.opencode/tools` only. `cli/node_modules` is untracked, so it does not exist in a new worktree and the CLI cannot compile there. Observed in a fresh worktree (after `worktree provision` returned `{"provisioned":true}`):

```
npm run typecheck
> tsc --noEmit
sh: line 1: tsc: command not found

npm run build
> node esbuild.config.js
Error: Cannot find module 'esbuild'
```

## Why

Any ODD change that touches the CLI cannot verify itself in its own worktree. The previous change (`worktree-naming`) lost a full verification round to this and needed an ad-hoc `npm ci`. It also contradicts the provisioning contract, which promises a runnable worktree: `openspec/specs/worktree-provisioning/spec.md:14` already requires "dependencies" among the provisioned state, and the CLI's own dependencies simply were not included.

## Scope

Authorized: `cli/src/engine/worktree.ts` (`provisionWorktree` only).

Out of scope: the install strategy, caching, dependency versions, and the existing `.opencode` / `.opencode/tools` installs. `openspec/specs/worktree-provisioning/spec.md` needs no edit because its wording ("dependencies") is already generic and this change makes it true rather than less true.

## Constraints

- Reuse the existing `installDependencies(directory)` helper and its `package.json` + `package-lock.json` existence guard, so the new call is a no-op in any repository that has no `cli/` directory.
- `cli/node_modules`, `cli/dist`, and `cli/template` are already covered by `cli/.gitignore`, so installing there introduces no new unprotected untracked paths and cannot affect cleanup's loss detection.
- Order matters only for readability: the CLI install belongs with the other dependency installs, before the skills symlinks.

## TDD

Mode: **off** (resolved from project configuration `AGENTS.md`: no test harness — zero test files, `npm test` exits 1). No runner. Functional verification is `npm run typecheck`, `npm run build`, and a real provisioning cycle.

## Tasks

- [x] **T01** — In `provisionWorktree`, add `installDependencies(join(target, 'cli'));` immediately after the `.opencode/tools` install.
- [x] **T02** — Verify: `npm run typecheck` and `npm run build` in `cli/`, then create a scratch worktree with the **rebuilt** CLI and assert that `cli/node_modules` exists in it and that `npm run typecheck` runs there with no manual `npm ci`. Then clean the scratch worktree up.
- [x] **T03** — Commit as reviewable work units and open the PR. **Delivered by PR #10** (`fix(worktree): install cli dependencies when provisioning`, merged 2026-09-16); its files and body match the added CLI install and provisioning-cycle verification.

## Acceptance criteria

- A worktree created by the rebuilt CLI has `cli/node_modules` without any manual step.
- `npm run typecheck` succeeds inside that fresh worktree's `cli/`.
- The `.opencode` and `.opencode/tools` installs are unchanged, and the call is a no-op when `cli/` is absent.

## Verification evidence

### The gap, observed before the fix

Fresh worktree created and provisioned by the pre-fix CLI:

```
node cli/dist/index.js worktree provision /home/stefan/Cortex-odd-provision-cli-deps --root /home/stefan/Cortex
{"provisioned":true,"path":"/home/stefan/Cortex-odd-provision-cli-deps"}

ls /home/stefan/Cortex-odd-provision-cli-deps/cli/node_modules
ls: cannot access '.../cli/node_modules': No such file or directory
```

### This worktree's own toolchain (the fix cannot verify itself until it ships)

```
cd cli && npm ci
cd cli && npm run typecheck   → tsc --noEmit, no diagnostics
cd cli && npm run build       → esbuild OK, dist/index.js rebuilt
```

### The fix proven by a real provisioning cycle

Scratch worktree created with the **rebuilt** CLI:

```
node <worktree>/cli/dist/index.js worktree create scratch-cli-deps --yes --root /home/stefan/Cortex
{"accepted":true,"created":true,"path":"/home/stefan/Cortex-odd-scratch-cli-deps","branch":"odd/scratch-cli-deps"}

ls -d /home/stefan/Cortex-odd-scratch-cli-deps/cli/node_modules
/home/stefan/Cortex-odd-scratch-cli-deps/cli/node_modules

ls .../cli/node_modules/.bin/tsc .../cli/node_modules/.bin/esbuild
(both present)

cd /home/stefan/Cortex-odd-scratch-cli-deps/cli && npm run typecheck
> cortex-brain@1.0.0 typecheck
> tsc --noEmit
(no diagnostics — with no manual install)

cd /home/stefan/Cortex-odd-scratch-cli-deps/cli && npm run build
Template copied: ... → /home/stefan/Cortex-odd-scratch-cli-deps/cli/template

node <worktree>/cli/dist/index.js worktree cleanup scratch-cli-deps --root /home/stefan/Cortex
{"cleaned":true,"slug":"scratch-cli-deps"}
```

Cleanup needed no manual intervention, which also confirms that installing into `cli/` adds no protected untracked path.

## Progress

**Closed.** T01–T03 complete and delivered by PR #10 (`fix(worktree): install cli dependencies when provisioning`, merged 2026-09-16). The PR files and body match the implementation and verification above.

## Next step

None. PR #10 delivered the change. After the merge, rebuild `cli/dist/` in main and run the graph refresh with the squashed SHA.

## Rationale log

- **Install rather than document a manual step.** A manual `npm ci` per worktree is exactly the kind of undocumented prerequisite that turns into silent verification debt; the provisioning step is where a runnable worktree is promised.
- **No spec edit.** The provisioning spec's "dependencies" clause was already generic. Adding a scenario would be ceremony for a one-line gap closure.
- **Reused `installDependencies` instead of a new helper.** It already guards on `package.json` + `package-lock.json`, so repositories without a `cli/` directory are unaffected and there is no new branch to test.
