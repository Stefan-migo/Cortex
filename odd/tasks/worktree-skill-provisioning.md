# ODD Tasks — worktree-skill-provisioning

Worktree: `/home/stefan/Cortex-odd-worktree-skill-provisioning`
Branch: `odd/worktree-skill-provisioning`
Base: `b06fc06` (main, after PR #16)

## Objective

Make `cortex worktree create` provision the seven canonical skills without destroying tracked
project content and without ever creating a link that cannot resolve.

## Problem

`provisionWorktree()` resolves the skill source **against the new worktree**:

```ts
symlinkSync(join('..', '..', 'skills', entry), join(target, '.opencode', 'skills', entry));
```

`../../skills/<entry>` resolves against `<worktree>/.opencode/skills/`, so it lands on
`<worktree>/skills/<entry>`. That path exists **only in the Cortex pack repository**. In every
other project the seven links are dangling. Before creating each link, the code
unconditionally `rmSync`s whatever occupies the destination — including a real, git-tracked
`.opencode/skills/<entry>/` directory.

So in an adopted project the command deletes tracked skills and replaces them with links that
point nowhere, then exits 0 reporting success.

## Why

This is the third defect of the same class in this repository: a flow that was only ever
exercised from inside Cortex, where the local layout hides the assumption. `template-lock-integrity`
(forged lockfiles) and `adopt-template-consistency` (`OWNED_PATHS`, `copyDir`) are the
predecessors. Cortex's own `.gitignore:19-20` ignores `/.opencode/skills/cortex-*` and
`/.opencode/skills/ponytail-*`, so inside Cortex there is no tracked file to delete and no
symptom to notice.

It was found by the lumat-agent agent while installing Cortex in that repository.

## Findings

Reproduced end-to-end by the orchestrator before any code change. Fixture:
`/tmp/opencode/repro-skill-provision` — bare origin plus a project that tracks
`.opencode/skills/cortex-persona/SKILL.md` and `.opencode/skills/ponytail-review/SKILL.md`.

```
$ cortex worktree create probe --yes --root /tmp/opencode/repro-skill-provision/proj
{"accepted":true,"created":true,"path":".../proj-odd-probe","branch":"odd/probe"}   exit=0

$ git -C .../proj-odd-probe status --short
 D .opencode/skills/cortex-persona/SKILL.md
 D .opencode/skills/ponytail-review/SKILL.md
?? .opencode/skills/cortex-persona    (and 6 more, all dangling)
```

`<worktree>/skills/` does not exist in that project, so all seven links dangle.

### Corrections to the original report

1. **The report's prescribed fix is itself a trap.** "Resolve the project's real skills root,
   prefer whichever exists" resolves to `<repo>/.opencode/skills` in an adopted project — which
   *is the destination*. Applied literally it deletes the real directory and links it to itself,
   which is worse than the current behaviour.
2. **Line 187, not only line 186.** `refreshRegistry()` filters on
   `<worktree>/skills/<name>/SKILL.md` but emits a row path under
   `<worktree>/.opencode/skills/<name>/SKILL.md`. Two different roots on two adjacent lines;
   masked inside Cortex because both resolve.
3. **The registry fallback is latent, not the observed symptom.** With `gentle-ai` installed
   (it is) line 182 runs and gentle-ai regenerates the registry. Verified: the regenerated
   registry skipped the seven dangling links, because it requires a readable `SKILL.md`.
4. **The report's acceptance target is wrong.** It asks for "seven resolving symlinks" in a
   project without `<repo>/skills/`. In `lumat-agent` those seven skills already exist as real
   tracked directories, together with project-local skills (`component-adapter`,
   `design-agent-lead`) that Cortex does not own. The correct outcome there is **zero new
   symlinks** and seven resolving skills.
5. `.opencode/skills/` in Cortex holds **11** entries, not 10 (`sdd` was not counted).

### Canonical semantics

`scripts/cortex-sync.sh` states the intended mechanism: the **pack's** `skills/*` is the source
of truth, copied into `<project>/.opencode/skills/`, leaving project-local skills untouched.
`provisionWorktree()` already receives both roots (`mainRoot` and `target`) and copies
`graphify-out` from main into the worktree; skills are the only thing resolved against `target`.

## Scope

### In scope

- Skill source resolution and skill linking in `provisionWorktree()`.
- Skill source resolution in `refreshRegistry()` (filter and emitted path agree).

### Out of scope

- Giving the seven skills to projects created by `cortex init`. The template ships only
  `bootstrap`, `design-system` and `graphify`, so an init project has no source at all. That is
  a separate pre-existing gap (pending item 10) and this change does not close it.
- The `gga` pre-commit index defect (pending item 1).
- `cortex-defect-reporting` (pending item 2).

## Constraints

- Technical artifacts in English.
- Ponytail: this is a bug fix, not a feature. Smallest change, no new abstraction with one
  implementation.
- No test harness exists. Verification is `npm run typecheck`, `npm run build`, and concrete
  shell scenarios with their real output.
- The fix must not change behaviour inside Cortex: the seven links must still resolve to the
  canonical `skills/`.

## Authorized scope

- `cli/src/engine/worktree.ts`
- `odd/tasks/worktree-skill-provisioning.md`

## Decisions

### D01 — Resolve the source from a root that actually holds canonical skills

Source order: `<worktree>/skills` if it holds at least one `<entry>/SKILL.md`, else
`<mainRoot>/skills`, else **give up and touch nothing**.

- Inside Cortex `<worktree>/skills` exists and is tracked, so the links stay byte-identical to
  today's behaviour (`../../skills/<entry>`) and continue to resolve.
- Inside an adopted project neither root exists, so provisioning touches nothing and the
  project's own tracked copies stay intact.
- `<mainRoot>/skills` is the second choice rather than the first so that a worktree never links
  into another checkout for a path its own checkout provides.

### D02 — Never delete a real directory

Replace a destination only when `lstat` says it is a symlink. A real directory is the project's
own tracked copy and is left alone, always. Absent destinations are created. This makes the
destructive path impossible without needing to reason about git state.

### D03 — `refreshRegistry()` resolves the destination, not a source root

The fallback registry lists skills that exist at the path it emits:
`<worktree>/.opencode/skills/<name>/SKILL.md`. That is correct in both layouts after linking,
and it removes the second, contradictory root assumption. Its rows are therefore unchanged for
Cortex and now non-empty for an adopted project when the fallback ever runs.

## Task checklist

- [x] **T01** — Implement D01/D02: source resolution plus link-only-symlinks in
      `provisionWorktree()`.
- [x] **T02** — Implement D03 in `refreshRegistry()`.
- [x] **T03** — `npm run typecheck` and `npm run build` from `cli/` in the worktree.
- [x] **T04** — Manual repro: a project **without** `<repo>/skills/` gains a worktree with zero
      deleted tracked files and zero dangling links, and its seven skills resolve. The fixture
      contains only two canonical project copies, so five are correctly absent rather than
      dangling. **Delivered by PR #17** (`fix(cli): resolve skill sources instead of assuming them in worktrees`, merged 2026-09-17); its files and body match this manual repro.
- [x] **T05** — Manual repro: a worktree created inside Cortex still resolves to the canonical
      `skills/`.
- [x] **T06** — Re-verify the pre-fix failure fixture is gone (no dangling links, no deletions)
      after the fix, on a fresh fixture, and record literal output.
- [x] **T07** — Update this document with observed evidence and the acceptance table.

## Checks

TDD mode: **off**. Source: repository `AGENTS.md` — no test harness exists (`vitest` is
configured but there are zero test files; `npm test` exits 1). Verification is typecheck, build,
and concrete shell scenarios.

```bash
# 1. Static (run from the worktree)
cd cli && npm run typecheck && npm run build

# 2. Adopted-project shape: tracked skills, no <repo>/skills/
#    Fixture: bare origin + project tracking .opencode/skills/<name>/SKILL.md
node cli/dist/index.js worktree create probe --yes --root <fixture>
git -C <fixture>-odd-probe status --short          # expect no " D " lines for skills
ls -la <fixture>-odd-probe/.opencode/skills/       # expect real dirs, no dangling links
test -r <fixture>-odd-probe/.opencode/skills/cortex-persona/SKILL.md && echo RESOLVES

# 3. Cortex shape: <wt>/skills exists and is tracked
node <worktree>/cli/dist/index.js worktree create probe-skillfix --yes --root /home/stefan/Cortex
for e in cortex-persona cortex-session ponytail-review ponytail-audit ponytail-debt ponytail-help ponytail-plan; do
  test -r /home/stefan/Cortex-odd-probe-skillfix/.opencode/skills/$e/SKILL.md && echo "$e OK" || echo "$e DANGLING"
done
node <worktree>/cli/dist/index.js worktree cleanup probe-skillfix --root /home/stefan/Cortex
```

## Acceptance criteria

1. In a project without `<repo>/skills/`, `cortex worktree create` deletes **zero** tracked
   files and creates **zero** dangling links.
2. The seven skills resolve in the new worktree of such a project (as tracked project copies).
3. In Cortex itself, a new worktree's seven links still resolve to the canonical `skills/`.
4. No code path removes a non-symlink directory.
5. `npm run typecheck` and `npm run build` exit 0.

## Observed evidence

### Before the fix (orchestrator, pre-change)

```
$ cortex worktree create probe --yes --root /tmp/opencode/repro-skill-provision/proj
{"accepted":true,"created":true,"path":"/tmp/opencode/repro-skill-provision/proj-odd-probe","branch":"odd/probe"}
exit=0

$ git -C /tmp/opencode/repro-skill-provision/proj-odd-probe status --short
 D .opencode/skills/cortex-persona/SKILL.md
 D .opencode/skills/ponytail-review/SKILL.md
?? .cortex/
?? .gitignore
?? .opencode/skills/cortex-persona
?? .opencode/skills/cortex-session
?? .opencode/skills/ponytail-audit
?? .opencode/skills/ponytail-debt
?? .opencode/skills/ponytail-help
?? .opencode/skills/ponytail-plan
?? .opencode/skills/ponytail-review

$ for e in ...; do test -e "$WT/.opencode/skills/$e" && echo OK || echo DANGLING; done
cortex-persona: SYMLINK -> ../../skills/cortex-persona  [DANGLING]
... (all seven dangling)
```

`<worktree>/skills` absent. The `.gitignore` carrying `.atl/` is written by the
`gentle-ai skill-registry refresh` call inside `refreshRegistry()`, the only external writer
in that worktree.

### After the fix

Static checks:

```
$ cd /home/stefan/Cortex-odd-worktree-skill-provisioning/cli && npm run typecheck && npm run build

> cortex-brain@1.0.0 typecheck
> tsc --noEmit


> cortex-brain@1.0.0 build
> node esbuild.config.js

Template copied: /home/stefan/Cortex-odd-worktree-skill-provisioning/cli/src/template → /home/stefan/Cortex-odd-worktree-skill-provisioning/cli/template
```

Fresh adopted-project fixture (the fixture has no `<repo>/skills/` and only two canonical
project copies):

```
$ node /home/stefan/Cortex-odd-worktree-skill-provisioning/cli/dist/index.js worktree create probe --yes --root /tmp/opencode/verify-skill-provision/proj
{"accepted":true,"created":true,"path":"/tmp/opencode/verify-skill-provision/proj-odd-probe","branch":"odd/probe"}

$ git -C /tmp/opencode/verify-skill-provision/proj-odd-probe status --short
?? .cortex/
?? .gitignore

$ ls -la /tmp/opencode/verify-skill-provision/proj-odd-probe/.opencode/skills/
total 0
drwxr-xr-x. 5 stefan stefan 100 Sep 17 11:00 .
drwxr-xr-x. 3 stefan stefan  60 Sep 17 11:00 ..
drwxr-xr-x. 2 stefan stefan  60 Sep 17 11:00 cortex-persona
drwxr-xr-x. 2 stefan stefan  60 Sep 17 11:00 ponytail-review
drwxr-xr-x. 2 stefan stefan  60 Sep 17 11:00 project-local
cortex-persona RESOLVES
cortex-session MISSING
ponytail-review RESOLVES
ponytail-audit MISSING
ponytail-debt MISSING
ponytail-help MISSING
ponytail-plan MISSING
project-local intact
<wt>/skills absent (expected)
```

Cortex fixture:

```
$ node /home/stefan/Cortex-odd-worktree-skill-provisioning/cli/dist/index.js worktree create probe-skillfix --yes --root /home/stefan/Cortex
{"accepted":true,"created":true,"path":"/home/stefan/Cortex-odd-probe-skillfix","branch":"odd/probe-skillfix"}
../../skills/cortex-persona
cortex-persona OK
../../skills/cortex-session
cortex-session OK
../../skills/ponytail-review
ponytail-review OK
../../skills/ponytail-audit
ponytail-audit OK
../../skills/ponytail-debt
ponytail-debt OK
../../skills/ponytail-help
ponytail-help OK
../../skills/ponytail-plan
ponytail-plan OK
?? .opencode/package-lock.json
?? .opencode/package.json
?? .opencode/tools/package-lock.json
{"cleaned":true,"slug":"probe-skillfix"}
```

### Parent spot check — the `lumat-agent` shape (all seven skills tracked)

The executor's fixture tracked only two canonical skills, so it could not exercise the
real-world case. This fixture mirrors `lumat-agent`: nine tracked skills in
`.opencode/skills/` (the seven canonical plus two project-local ones Cortex does not own).

```
$ BASE=/tmp/opencode/verify-lumat-shape   # tracked skills in fixture: 9
$ node <worktree>/cli/dist/index.js worktree create probe --yes --root "$BASE/proj"
{"accepted":true,"created":true,"path":"/tmp/opencode/verify-lumat-shape/proj-odd-probe","branch":"odd/probe"}

$ git -C "$BASE/proj-odd-probe" status --short
?? .cortex/
?? .gitignore

cortex-persona RESOLVES
cortex-session RESOLVES
ponytail-review RESOLVES
ponytail-audit RESOLVES
ponytail-debt RESOLVES
ponytail-help RESOLVES
ponytail-plan RESOLVES
component-adapter RESOLVES          # project-local, untouched
$ find "$BASE/proj-odd-probe/.opencode/skills" -maxdepth 1 -type l | wc -l
0
$ test -e "$BASE/proj-odd-probe/skills" && echo EXISTS || echo absent
absent (expected)
```

### Parent spot check — Cortex shape

Independently re-run, with the same result the executor reported:

```
$ node <worktree>/cli/dist/index.js worktree create probe-skillcheck --yes --root /home/stefan/Cortex
{"accepted":true,"created":true,"path":"/home/stefan/Cortex-odd-probe-skillcheck","branch":"odd/probe-skillcheck"}
  cortex-persona -> ../../skills/cortex-persona  OK
  ... all seven identical -> ../../skills/<entry>, all OK
$ git -C /home/stefan/Cortex-odd-probe-skillcheck status --short
?? .opencode/package-lock.json
?? .opencode/package.json
?? .opencode/tools/package-lock.json
$ node <worktree>/cli/dist/index.js worktree cleanup probe-skillcheck --root /home/stefan/Cortex
{"cleaned":true,"slug":"probe-skillcheck"}
```

The `??` lines are pre-existing provisioning behaviour (it writes those files), identical in every
worktree, and unrelated to this change.

### Real reported scenario — the actual `lumat-agent` content (before and after)

The synthetic fixtures above share the shape of the reported failure but not its content. This pair
runs on the **real repository content**: a local clone of `/home/stefan/repos/lumat-agent` at
`73841157`, twelve tracked skills under `.opencode/skills/` (the seven canonical plus
`component-adapter`, `design-agent-lead`, `bootstrap`, `design-system`, `graphify`) and no
`<repo>/skills/` — exactly the layout the bug report describes.

Clone, not the live checkout, so the reported project is never mutated and no remote is contacted
(`origin` of the clone is the local path).

**Before — main's CLI, unfixed:**

```
$ node /home/stefan/Cortex/cli/dist/index.js worktree create probe-lumat --yes --root /tmp/opencode/lumat-real
{"accepted":true,"created":true,"path":"/tmp/opencode/lumat-real-odd-probe-lumat","branch":"odd/probe-lumat"}
exit=0

$ git -C /tmp/opencode/lumat-real-odd-probe-lumat status --short | grep '^ D '      # 7 deletions
 D .opencode/skills/cortex-persona/SKILL.md
 D .opencode/skills/cortex-session/SKILL.md
 D .opencode/skills/ponytail-audit/SKILL.md
 D .opencode/skills/ponytail-debt/SKILL.md
 D .opencode/skills/ponytail-help/SKILL.md
 D .opencode/skills/ponytail-plan/SKILL.md
 D .opencode/skills/ponytail-review/SKILL.md

$ resolution loop
cortex-persona FAIL (../../skills/cortex-persona)   ... all seven FAIL / dangling
```

**After — the fixed CLI, same content:**

```
$ node /home/stefan/Cortex-odd-worktree-skill-provisioning/cli/dist/index.js worktree create probe-lumat --yes --root /tmp/opencode/lumat-fixed
{"accepted":true,"created":true,"path":"/tmp/opencode/lumat-fixed-odd-probe-lumat","branch":"odd/probe-lumat"}
create_exit=0

$ deletions (expect 0): 0
$ git -C ... status --short
?? .opencode/tools/package-lock.json          # pre-existing provisioning copy, unrelated to skills

cortex-persona real dir OK
cortex-session real dir OK
ponytail-review real dir OK
ponytail-audit real dir OK
ponytail-debt real dir OK
ponytail-help real dir OK
ponytail-plan real dir OK
component-adapter OK
design-agent-lead OK
symlinks created: 0

$ node <fixed cli> worktree cleanup probe-lumat --root /tmp/opencode/lumat-fixed
{"cleaned":true,"slug":"probe-lumat"}
probe worktree gone
```

Same content, same command, same exit code: seven tracked skills destroyed before, zero touched
after.

## Acceptance status

| # | Criterion | Status |
|---|---|---|
| 1 | Zero tracked deletions, zero dangling links in a project without `<repo>/skills/` | Met — status had no deletion lines; all seven destinations were either readable project directories or absent, and `<wt>/skills` was absent. |
| 2 | Seven skills resolve in that worktree | Met — on the nine-skill `lumat-agent`-shaped fixture, all seven canonical skills plus the project-local one resolve, with zero symlinks created. |
| 3 | Cortex worktree links still resolve to the canonical `skills/` | Met — all seven printed `../../skills/<entry>` and `<entry> OK`. |
| 4 | No non-symlink directory is ever removed | Met — adopted-project destinations remained real directories; no skill directory was removed. |
| 5 | Typecheck and build exit 0 | Met — both commands exited 0. |

## Review outcome

Four-lens native review, lineage `review-73ef2c3b599aa464`, candidate commit `ed36255`
(workspace projection over base `b06fc06`).

| Lens | Result |
|---|---|
| review-risk | zero findings |
| review-resilience | zero findings |
| review-reliability | zero findings |
| review-readability | one WARNING, advisory |

Verdict: **approved** with zero blocking findings. The acknowledgement consumed revision
`sha256:1f19187b3e6ce05a2d7f8c32943e862d6461b438264a5176e522bf953c85d2f8` and reported
`authority: burned`.

Advisory, non-blocking — `R2-partial-canonical-root` (readability, `cli/src/engine/worktree.ts:49`):
`canonicalSkillsRoot` accepts a root when only **one** canonical skill is present, after which the
linking loop silently skips the skills that root lacks. In a layout where `<root>/skills` holds
some canonical skills and `.opencode/skills` holds the rest, the chosen source looks complete while
the others are not linked. It is harmless in both layouts measured here — an adopted project has no
`<root>/skills` at all, and a destination that is already a real directory is skipped by design —
so it is recorded as later work rather than as a correction to this candidate.

## Progress

**Closed.** D01–D03 and T04–T07 are delivered by PR #17 (`fix(cli): resolve skill sources instead of assuming them in worktrees`, merged 2026-09-17). Static checks, the executor's two scenarios, the orchestrator's two
independent spot checks (the nine-skill `lumat-agent` shape and the Cortex shape), and the
before/after pair on the real `lumat-agent` content all passed as recorded above. No tracked file
was deleted in any after-the-fix scenario, and no non-symlink directory was removed.

## Next step

None. PR #17 delivered the implementation and verification. The `gga` pre-commit index defect
(pending item 1) remains a separate follow-up.
