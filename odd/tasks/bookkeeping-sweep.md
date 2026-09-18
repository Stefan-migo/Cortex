# ODD Task — bookkeeping-sweep

**Branch:** `odd/bookkeeping-sweep` · **Worktree:** `../Cortex-odd-bookkeeping-sweep`
**Base:** `origin/main` @ `82827ab` (publish-surface merged as PR #35)
**TDD:** OFF — this repository has no test harness. This change touches no code.
Functional checks only; runner: none.

## Objective

Make `odd/tasks/*.md` stop saying that delivered work is undelivered.

The task documents are this project's recovery surface: a fresh session reads them to learn where
the work stands. Right now eight of them carry open checkboxes for features that are already in
`main`, and at least one says in its own `## Progress` that the work is "implemented and verified,
but not yet committed or delivered" for a PR that merged days ago.

## Why the drift exists (cause, not blame)

Two structural facts, both verified:

1. **Merging does not tick the box.** The ODD flow checks a box when the work is observed
   complete, but the docs travel *inside* the PR they describe, so the boxes describing
   delivery are checked after the merge — in a follow-up that nobody performs by reflex.
2. **`main` cannot commit a tracked file change.** `.githooks/pre-commit` (the main-worktree
   guard) allows only `.cortex-sessions/*`-style paths to be committed from `main`. So a doc
   fix discovered while sitting in `main` has no path to the repository except a new branch and
   PR. `odd/tasks/worktree-naming.md` is exactly that case right now: its close-out has been
   living in `main`'s working tree, uncommittable, since PR #9 merged.

This change is the sweep that resolves both.

## Measured inventory (counted with `grep -c '^- \[ \]'`, verified against `82827ab`)

| Document | Open boxes | Reality |
|---|---|---|
| `cortex-adopt.md` | 1 (T04) | Landed as **PR #13** |
| `ponytail-odd-alignment.md` | 1 (T08) | Landed as **PR #14** |
| `provision-cli-deps.md` | 1 (T03) | Landed as **PR #10** |
| `sdd-surface-alignment.md` | 1 (T04) | Spec-Kit suggestion retargeting: **PR #11 and/or #12** — verify which |
| `spec-kit-false-instructions.md` | 1 (T04) | Same family as above — verify which |
| `template-lock-integrity.md` | 1 (T08) | **Genuinely open.** Slice B, explicitly "separate PR, not started". Keep open |
| `usability-prerequisites.md` | 2 (VERIFY, DELIVER) | WU1 landed as `a5b4a4e` = **PR #25** |
| `worktree-skill-provisioning.md` | 1 (T04) | Landed as **PR #17** |
| `worktree-naming.md` | 3 (T06, T09, T10) | Landed as **PR #9**; the close-out text already exists in `main`'s working tree (see the orphan section) |
| `rename-rapsodia-brand.md` | 6 (T01–T06 in the task list) | The same six tasks are already checked in that document's `## Progress`; delivered as **PR #30** |

`rename-rapsodia.md` and the other documents with zero open boxes need no change.

## Method (mandatory — this is the whole point)

For every box you tick:

1. Name the merged PR number or commit SHA that delivered it, **inside the document**.
2. Confirm that reference is real (`gh pr list --state merged`, or the commit in
   `git log` of `main`), and that the delivered change actually matches the box's claim.
3. Write or update the document's `## Progress` so it states the closed status and the
   reference, and its `## Next step` so it no longer promises work already delivered.

A box whose claim you cannot verify stays open, and you record why in that document. **Ticking a
box you did not verify is the exact failure this change exists to fix.** My PR-to-document
mapping above is a hypothesis to check, not evidence to copy: #11 and #12 both concern the
retired Spec-Kit suggestions, and only one of them may belong to each document.

## Scope

- `odd/tasks/*.md` — box state, `## Progress`, `## Next step` only.
- `odd/tasks/bookkeeping-sweep.md` — this document.
- The orphan close-out for `odd/tasks/worktree-naming.md`, carried in as a patch.

## Out of scope, with reasons (do NOT "helpfully" fix these)

1. **`template-lock-integrity.md` T08.** Slice B is real remaining work, not stale
   bookkeeping. Leave it open.
2. **`.githooks/pre-commit`.** The main-worktree guard is what makes doc fixes uncommittable
   from `main`, and it deserves its own change with its own review. Reported here, not
   touched.
3. **`wiki/**`, `openspec/**`, `raw/**`.** Historical exports and untracked sync surfaces. Do
   not touch.
4. **Rewriting any document's intent, decisions, or rationale log.** This sweep corrects box
   state and forward-looking text. It does not re-edit history.
5. **The `.opencode/node_modules` gap** and the other release follow-ups recorded in
   `odd/tasks/publish-surface.md`. Different changes.

## Tasks

- [x] **T01** — Carry in the orphan: apply the `worktree-naming.md` close-out so the file
      matches the version currently sitting uncommitted in `main`'s working tree. A patch is
      provided; do not reformat or reword it. **Verified by `/tmp/opencode/orphan-worktree-naming.patch` and zero-output parity diff.**
- [x] **T02** — Tick the verified boxes and update `## Progress` / `## Next step` in the
      documents listed in the measured inventory, each with its named PR or commit reference.
- [x] **T03** — Reconcile `rename-rapsodia-brand.md`'s task-list boxes with its own `## Progress`
      section, which already records those six tasks as complete.
- [x] **T04** — Leave every unverifiable box open with a one-line reason, and report the list.
- [ ] **T05** — Verify, commit as reviewable work units (≤5 files per commit), and report.

## Acceptance criteria

1. After the sweep, `grep -c '^- \[ \]' odd/tasks/*.md` returns open boxes only where work is
   genuinely outstanding, and the report accounts for every remaining one.
2. Every ticked box names a real PR number or commit SHA, and that reference resolves
   (`gh pr view <n>` or `git log`).
3. `odd/tasks/worktree-naming.md` in the branch is byte-identical to `main`'s current
   working-tree version of that file.
4. `template-lock-integrity.md`'s T08 is still open.
5. No file outside `odd/tasks/**` is modified.
6. No reworded prose beyond box state and the forward-looking `## Progress` / `## Next step`
   sections.

## Verification scenarios

Run from the worktree.

1. **Box inventory** — before and after: `for f in odd/tasks/*.md; do echo "$f $(grep -c '^- \[ \]' $f)"; done` → report both outputs.
2. **Orphan parity** — `diff <(git -C /home/stefan/Cortex show :odd/tasks/worktree-naming.md) odd/tasks/worktree-naming.md` is not enough on its own; compare against `main`'s **working tree** file: `diff /home/stefan/Cortex/odd/tasks/worktree-naming.md odd/tasks/worktree-naming.md` → expect no differences.
3. **Reference resolution** — for each PR number you cited: `gh pr view <n> --json number,title,state,mergedAt` → report the JSON.
4. **Scope check** — `git diff --stat` → only `odd/tasks/**`.
5. **T08 still open** — `grep -n 'T08' odd/tasks/template-lock-integrity.md` → report the line.

## Constraints

- The `.githooks/pre-commit` Atomicity Gate rejects more than **5 files per commit**. Split by
  group; no `--no-verify` bypass.
- **Never stage the worktree's untracked `.opencode/` install artifacts.** Use explicit paths.
- Artifacts are in **English**.
- No box gets ticked without a resolvable reference.

## Progress

T01–T04 complete. Verified merged references: PRs #9, #10, #11, #12, #13, #14, #17, #25, and #30; PR #26 remains the pre-existing reference for the already-closed worktree-naming T10. The orphan patch applied cleanly and parity is exact. T05 remains open because this authorized work unit must not commit; the parent owns commit history. The only remaining stale/open feature box is `template-lock-integrity.md` T08, which is genuinely open Slice B work.

## Next step

Parent: commit the reviewed changes in groups of at most five files. No implementation or verification work remains in this worktree.

## Rationale log

- **Route: ODD-direct, single PR — not an SDD change.** No design question: the method is
  "verify the claim, name the reference, tick the box".
- **Why a whole PR for box state.** The alternative is to keep the drift, and the drift is what
  makes a resumed session misread the project. The cost is one branch; the benefit is that the
  recovery surface tells the truth.
- **Why the guard is out of scope.** It is the root cause, and root causes get their own
  reviewable change. Fixing it here would hide it inside a docs PR.
