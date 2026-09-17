# ODD Tasks — gga-index-fix

Worktree: `/home/stefan/Cortex-odd-gga-index-fix`
Branch: `odd/gga-index-fix`
Base: `7e00219` (main, after PR #17)

## Objective

Stop the pre-commit review from staging the whole working tree, so a commit contains exactly what
was staged and the Atomicity Gate keeps working.

## Problem

Every commit made from a dirty working tree drags every modified and untracked file with it.

The pre-commit hook runs `gga run`, which spawns an `opencode` session to review the staged files.
opencode snapshots the workspace with its own git dir:

```
git --git-dir ~/.local/share/opencode/snapshot/<project>/<session> --work-tree <repo> add --all --sparse --pathspec-from-file=-
git --git-dir ~/.local/share/opencode/snapshot/<project>/<session> --work-tree <repo> write-tree
```

git exports `GIT_INDEX_FILE` to every hook it runs (verified: `.git/index`, relative). The snapshot
command inherits it, so the explicit `--git-dir` selects the snapshot's object store while the
**index write lands in the repository's real index**. The result: the whole working tree is staged
after the review, the commit includes it, and the Atomicity Gate cannot help because it reads the
index before `gga run` mutates it.

## Why

- The Atomicity Gate (≤5 files, one concern per commit) is defeated silently on every dirty commit.
- Files that should never be committed — untracked local state, caches, generated artifacts — are
  committed.
- When a dragged file has no blob written, the commit fails with `invalid object ... Error building
  trees`, which is how this was first noticed.
- It is the gate that guards this repository's own commits, so it hides its own class of mistakes.

## Findings

Everything below was measured, not inferred. Scratch repository: `/tmp/opencode/gga-repro`.

### F1 — git exports `GIT_INDEX_FILE` to hooks

A hook that only dumps its environment records:

```
GIT_INDEX_FILE=.git/index
GIT_DIR=<unset>
GIT_PREFIX=<unset>
```

### F2 — the staged set grows to the whole working tree

The repository started with `staged.ts` staged, `tracked.ts` modified and unstaged, and
`untracked.json` untracked:

```
before: [staged.ts ]
after : [.atl/.skill-registry.cache.json .atl/skill-registry.md staged.ts tracked.ts untracked.json ]
```

`gga run` itself exits 0 and reports `✅ CODE REVIEW PASSED`.

### F3 — the writer is opencode's snapshot, not `gga`

With `git` replaced by a logging shim on `PATH`, the exact command that mutates the index is
captured:

```
GITSHIM[cwd=<repo>][IDX=.git/index]: -c core.autocrlf=false -c core.longpaths=true -c core.symlinks=true \
  --git-dir /home/stefan/.local/share/opencode/snapshot/375e69c892e4fc680780af9710f81e587eb15f3f/5d3d0a8a837956f26f975aff6deec938559513b3 \
  --work-tree /tmp/opencode/gga-repro add --all --sparse --pathspec-from-file=- --pathspec-file-nul
GITSHIM[cwd=<repo>][IDX=.git/index]: --git-dir <same snapshot> --work-tree <repo> write-tree
```

`[[IDX=.git/index]]` is the inherited environment variable. Without it the same command writes
`<snapshot>/index` and the repository index is untouched.

### F4 — `gga`'s own code has none of this

- `grep -rn "GIT_INDEX_FILE"` over `~/.local/bin/gga` and `~/.local/share/gga/lib/*.sh`: zero
  matches.
- Every git call `gga` makes is read-only: `diff --cached --name-only --diff-filter=ACM`,
  `diff --name-only`, `show :file`, `rev-parse`, `git branch`, `git diff`.
- Zero occurrences of `add`, `update-index`, `hash-object`, `stash`, `write-tree`, `checkout-index`.

### F5 — controls

| Scenario | Staging |
|---|---|
| `gga run` with a valid cache entry (no opencode session) | none |
| `gga run --no-cache` with nothing staged (review skipped) | none |
| `opencode run` alone, trivial prompt, with and without `GIT_INDEX_FILE` | none |
| full review via `gga run --no-cache`, `GIT_INDEX_FILE` inherited | **whole working tree** |

An easy trigger was not isolated beyond this: the snapshot write happens on the review session, not
on a trivial one, and the review prompt is what `gga` supplies. The correlation that matters is
reproduced deterministically, and the fix is verified against it.

### Correction to the earlier diagnosis

An earlier note in this repository recorded the defect as `gga` staging the working tree when
`GIT_INDEX_FILE` is set. That is wrong in its attribution: `gga`'s code cannot stage anything. It is
the third-party `opencode` snapshot that writes the index, and `gga` is only the path that starts
that session. The fix belongs in this repository's hook, which is the component that controls the
environment the session inherits.

## Scope

### In scope

- `.githooks/pre-commit`: stop the reviewed session from mutating the repository index.

### Out of scope

- Reporting the interaction upstream (opencode inheriting `GIT_INDEX_FILE` into its snapshot
  subprocess, or `gga` spawning an agent from a hook context). Suggesting it is not the same as
  filing it, and no issue is opened without an explicit request.
- `cortex worktree create` provisioning gaps (`.opencode/.gitignore` is not copied into a worktree)
  and the other pending items.

## Constraints

- Ponytail: smallest change that removes the failure mode. No temporary files, no trap, no new
  abstraction.
- The hook must keep blocking when the review fails: `gga run`'s exit code must still abort the
  commit.
- The Atomicity Gate and the main-worktree guard must behave exactly as before.

## Authorized scope

- `.githooks/pre-commit`
- `odd/tasks/gga-index-fix.md`

## Decisions

### D01 — Unset `GIT_INDEX_FILE` for the review invocation

```bash
env -u GIT_INDEX_FILE gga run || exit 1
```

- The hook's own git calls (`git diff --cached`, `rev-parse`) keep running with the inherited
  variable, which git set to the same index those calls would use by default.
- Without the variable, git resolves the default index for every git process the review starts —
  the repository's real index for `gga`'s read-only calls, and the snapshot's own index for
  opencode's snapshot. Both components then behave as designed.
- In a linked worktree (where ODD commits happen) the default index is
  `.git/worktrees/<name>/index`, still the correct per-worktree index.
- `|| exit 1` is unchanged, so a failing review still aborts the commit.

### Alternative rejected — point the review at a copy of the index

`cp` the index to a temporary file, run `GIT_INDEX_FILE=<tmp> gga run`, delete it. Verified to work
as well, but it needs a temporary file, survives as litter if the hook dies, and adds no guarantee
that D01 lacks in any ordinary invocation. Ponytail: prefer the smaller change.

## Task checklist

- [x] **T01** — Implement D01 in `.githooks/pre-commit` with a comment recording the mechanism.
- [x] **T02** — Scratch verification: 1 staged file among a dirty tree commits exactly 1 file.
- [x] **T03** — Scratch verification: 4 staged files commit exactly 4 files (the original plan's
      assertion).
- [x] **T04** — Regression: the Atomicity Gate still blocks a 6-file commit.
- [x] **T05** — Regression: a failing review still aborts the commit (`|| exit 1` intact).
- [x] **T06** — Dogfooding: commit this fix in the worktree while three untracked `.opencode/` files
      are present; the commit must contain exactly the two authorized files.
- [x] **T07** — Record the observed evidence and the acceptance table here.

## Checks

TDD mode: **off**. Source: repository `AGENTS.md` — no test harness exists (`vitest` is configured
but there are zero test files; `npm test` exits 1). Verification is concrete shell scenarios with
literal output.

```bash
# T02/T03 — a dirty tree must not grow the commit
#   fixture: a git repo whose .githooks/pre-commit is the fixed hook
printf 'x\n' > unstaged.txt                 # untracked, must stay out
printf 'y\n' > tracked.txt; git add tracked.txt; git commit -qm base
printf 'z\n' >> tracked.txt                 # modified, must stay out
printf 'w\n' > staged.txt; git add staged.txt
git commit -m "test"                        # commit must contain exactly staged.txt

# T04 — Atomicity Gate regression
#   stage six files: the commit must fail with the gate message

# T05 — review failure regression
#   put a fake `gga` that exits 1 on PATH: the commit must be aborted

# T06 — dogfooding in the fix worktree
git -C /home/stefan/Cortex-odd-gga-index-fix status --short -uall   # three untracked .opencode files
git -C /home/stefan/Cortex-odd-gga-index-fix add .githooks/pre-commit odd/tasks/gga-index-fix.md
git -C /home/stefan/Cortex-odd-gga-index-fix commit -m "..."
git -C /home/stefan/Cortex-odd-gga-index-fix show --name-only --format= HEAD   # exactly two files
```

## Acceptance criteria

1. A commit made from a dirty working tree contains exactly the staged files.
2. The Atomicity Gate still rejects a commit over the file limit.
3. A failing review still aborts the commit.
4. The review still runs and still reports its verdict.

## Observed evidence

### Before the fix

```
$ # scratch repo, staged.ts staged, tracked.ts modified, untracked.json untracked
$ GIT_INDEX_FILE=.git/index gga run
ℹ️  Files to review: staged.ts
✅ CODE REVIEW PASSED

staged before: [staged.ts ]
staged after : [.atl/.skill-registry.cache.json .atl/skill-registry.md staged.ts tracked.ts untracked.json ]
```

The shim capture of the writing command is in F3 above.

### After the fix

Fixture: a repository whose `.githooks/pre-commit` is the fixed hook, with Cortex's `.gga`
(`STRICT_MODE="false"`) so the review can return a verdict. The commits are made from a **linked
worktree** of that repository, because the Main worktree guard rejects direct code commits in a
main worktree — which it did, correctly, on the first attempt.

**T02 — one staged file among a dirty tree**

```
$ git add staged.ts && git commit -m "T02 one staged file"
commit_exit=0
HEAD contains 1: staged.ts
$ git status --short
 M tracked.ts
?? .atl/
?? untracked.json
```

The unstaged modification and the untracked files stayed out, and the review still ran.

**T03 — four staged files**

```
$ git commit -m "T03 four staged files"
commit_exit=0
HEAD contains 4: file1.ts file2.ts file3.ts file4.ts
$ git status --short
 M tracked.ts
?? .atl/
?? untracked.json
```

**T04 — the Atomicity Gate still blocks**

```
$ # six files staged
commit_exit=1
Atomicity Gate message present: 1
HEAD unchanged → no commit created
```

**T05 — a failing review still aborts the commit**

```
$ PATH=<fake gga that exits 1>:$PATH git commit -m "T05 fake gga fails"
FAKE GGA: refusing this commit
commit_exit=1
HEAD unchanged → no commit created
```

**T06 — the fix's own commit, in a real linked worktree, with three untracked files present**

```
$ git status --short -uall          # before staging
 M .githooks/pre-commit
?? .opencode/package-lock.json
?? .opencode/package.json
?? .opencode/tools/package-lock.json
?? odd/tasks/gga-index-fix.md

$ git add .githooks/pre-commit odd/tasks/gga-index-fix.md
$ git commit -m "fix(hooks): keep the review session from staging the working tree"
commit_exit=0

$ git show --name-only --format= HEAD
.githooks/pre-commit
odd/tasks/gga-index-fix.md

$ git status --short -uall
?? .opencode/package-lock.json
?? .opencode/package.json
?? .opencode/tools/package-lock.json
```

Two files committed, three untracked files left alone, zero `.opencode/` paths in the commit.

This is the end-to-end proof, and it is stronger than the assertion that was planned: the previous
change on this repository had to copy `.opencode/.gitignore` into its worktree to keep those same
three files out of its commit. Here no workaround was needed at all.

## Acceptance status

| # | Criterion | Status |
|---|---|---|
| 1 | A dirty tree commits exactly the staged files | Met — T02 (1 of 1) and T03 (4 of 4) |
| 2 | The Atomicity Gate still rejects over-limit commits | Met — T04, exit 1, no commit created |
| 3 | A failing review still aborts the commit | Met — T05, exit 1, no commit created |
| 4 | The review still runs and reports its verdict | Met — the review ran before every commit in T02, T03 and T06 |
| 5 | Dogfooding: the fix's own commit contains exactly the two authorized files while three untracked `.opencode/` files are present | Met — T06 |

## Review outcome

Native review, lineage `review-23e5ac0996ec0eda`, over the candidate range `6c3321d` (the fix) and
`543a003` (this document), base `7e00219`.

Risk was assessed **medium**, so the plan selected **one consolidated lens** instead of four:

| Lens | Result |
|---|---|
| review-reliability | zero findings |

Verdict: **approved** with zero blocking findings. The acknowledgement consumed revision
`sha256:000f7caba5c28da6d2a0b8c9dc3a83411fef3e2e5cd5710e02887003dfc89e43` and reported
`authority: burned`.

The reviewer's own evidence: the hook isolates the review subprocess from the repository index while
preserving failure propagation, and the accompanying verification documents the relevant regression
scenarios.

Two notes about the review mechanics, recorded because they are not obvious and will recur:

- The workspace projection required an explicit intended-untracked selection. The three untracked
  `.opencode/` files are local provisioning state that `main` ignores, so the honest answer is
  `untracked_scope: exclude` with an empty selection. The schema is
  `gentle-ai.review-intended-untracked-selection/v1`, the scope lives inside that JSON, and
  `--untracked-scope` on the command line is a legacy flag that cannot be combined with it.
- Freezing the candidate did not disturb the three untracked files.

## Progress

Doc written before the first source write. D01 implemented; T01–T06 verified with the literal output
recorded above. Reviewed and approved. Pending: the PR.

## Next step

Open the PR for `odd/gga-index-fix`.
