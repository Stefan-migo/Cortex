# ODD Task — stale-integration-claims

**Branch:** `odd/stale-integration-claims` · **Worktree:** `../Cortex-odd-stale-integration-claims`
**Base:** `main` @ `0518a67`
**TDD:** OFF — this repository has no test harness (`npm test` exits 1: "No test files found").
Functional checks only; no RED/GREEN cycle is claimed. Runner: none.

## Objective

Make Cortex's install surface stop claiming an integration that gentle-ai no longer ships.

## Root cause — the claim outlived the integration

`commands/cortex-init.md:39` and `cortex-init.sh`'s `AGENTS.md` heredoc both asserted that the
global orchestrator prompt auto-loads Cortex and auto-runs `ponytail-review` after `sdd-apply`.

That was **true against gentle-ai 1.49.0**. Its backed-up orchestrator prompt carried:

```
## Post-Implementation Complexity Review
After any `sdd-apply` phase completes AND before `sdd-verify`:
1. Check if `.opencode/skills/ponytail-review/SKILL.md` exists.
2. If yes, load it and run a complexity review on the diff...
```

The installed **gentle-ai 3.0.2** prompt contains **zero** mentions of `Cortex` or `ponytail`:

```
$ rg -c 'Cortex Identity Auto-Load|Cortex SDD Pipeline Hooks|Post-Implementation Complexity Review' \
     ~/.config/opencode/opencode.json
exit 1 (0 hits)
```

What 3.x ships instead is a `gentle-ai:persona` managed block in the global `AGENTS.md` whose
mechanism is "the skill list is authoritative plus a self-check" — not a hook. Cortex's text was
never updated to match.

Cortex already half-knew: `skills/cortex-persona/SKILL.md:219`, written by PR #14, states
"Nothing runs it automatically — Cortex ships no hook that invokes it". PR #14 corrected the
sibling claim in the persona and recorded `commands/cortex-init.md:39` as an unfixed follow-up.

The phase-hook line (`cortex-init.sh:170`) is false for a **second, independent** reason: PR #14
moved ponytail to ODD's *Implement* step and explicitly out of propose/design/tasks.

## Scope

- `commands/cortex-init.md` — the `/cortex-init` command doc
- `cortex-init.sh` — the `AGENTS.md` heredoc that is written into every newly initialized project

**Out of scope, deliberately:**

- `cli/src/template/USER-GUIDE.md:14` "The system loads automatically" — a different mechanism
  (opencode agent auto-discovery) that genuinely exists, and it is slice 2's file.
- `scripts/migrate-wiki-to-engram.sh:62` — the Engram protocol *is* injected by gentle-ai 3.x.
- `commands/cortex-init.md:26` — the absolute path `/home/stefan/Cortex/cortex-init.sh`. A
  portability defect, not an integration claim; already tracked in `usability-prerequisites`.
- Any rename to `rapsodia-code` / `rapso`. Slices 2 and 3 are not authorized, and `cortex-persona`
  is still the real on-disk skill name — writing the new names here would introduce a *new* false
  claim. See Follow-ups.

## Tasks

- [x] **T01** — Correct the two claims in `commands/cortex-init.md` (the note and the v2→v3 row).
- [x] **T02** — Correct the three claims in `cortex-init.sh`'s `AGENTS.md` heredoc.
- [x] **T03** — Verify with real output, commit as reviewable work units, and open the PR.

## Verification evidence

**Syntax** — `bash -n cortex-init.sh` → exit 0, no output.

**Residual check** — no claim of this class remains in the two files:

```
$ rg -n -i 'auto-runs|automatically|pipeline hooks|already includes' commands/cortex-init.md cortex-init.sh
(vacío)
```

**Functional** — the script was run against a throwaway fixture and the file it actually writes was
inspected. `/tmp/opencode/cortex-init-verify/proj`, `Skills: 7 enlazados`, `AGENTS.md: ✅ creado`:

```
$ cat /tmp/opencode/cortex-init-verify/proj/AGENTS.md
- This project uses the Cortex skill pack. `cortex-persona` is linked into `.opencode/skills/`,
  so it appears in the session's skill list and the skill-loading check below applies to it.
...
The session's skill list is authoritative. Before responding, check whether the request matches a
listed skill and read that skill's `SKILL.md` first; load
`.opencode/skills/cortex-persona/SKILL.md` at the start of every session. That skill defines:
...
- Graphify before code work; Ponytail rules while writing code (ODD's Implement step)
```

**Method note.** The first residual sweep used `rg`, which **skips hidden files by default**, so
`.opencode/` was never searched. Re-run with `git grep`, which covers tracked hidden paths.

## Native review

Lineage `review-703ad9502de2be2c`, four lenses, risk assessed **high** (2 files, 14 lines, two
`process_boundary` / `shell_source` signals on `cortex-init.sh`).

| Lens | Result |
|---|---|
| review-risk | zero findings |
| review-resilience | one WARNING, non-blocking |
| review-readability | zero findings |
| review-reliability | zero findings |

Verdict: **approved** with zero blocking findings. Acknowledgement consumed revision
`sha256:7a583938b9ec615ccdbb634e2bd2b7eb4eb245cbe8e144153c2cb5d90c951901` and reported
`authority: burned`. No correction transition was opened.

The advisory finding is non-blocking and does **not** reopen this review; see Follow-ups.

**Review mechanics worth recording** — the `workspace` projection required an explicit
intended-untracked selection and rejected every form that omitted the inventory digest:

```json
{"schema":"gentle-ai.review-intended-untracked-selection/v1","untracked_scope":"exclude",
 "intended_untracked":[],
 "expected_untracked_inventory":"sha256:7f9bf3ef356ffcabaf53dcf6efc7af5cfebbd804d2ae0021feade5be90969bc3"}
```

Without `expected_untracked_inventory` the error reads `untracked inventory changed; rerun ...` —
misleading, because the inventory had not changed. The three untracked `.opencode/` files are
local provisioning state that `main` ignores, so `exclude` with an empty selection is the honest
answer.

## Follow-ups, not in this change

- **R4 advisory (`R4-post-apply-review`, `commands/cortex-init.md:39`, WARNING, informational).**
  The corrected wording removes the explicit post-apply checkpoint and relies on rules applied
  during implementation. Native review ruled it non-blocking; it is recorded as separate later
  work, never as a reason to re-run review on this candidate.
- **Projects already initialized keep the old text.** `cortex-init.sh:151` writes `AGENTS.md` only
  `if [ ! -f "$AGENTS_FILE" ]`. Existing installs need a migration decision.
- **Nomenclature coverage gap in the rename.** The rename's three slices cover `cli/src/**`
  (slices 1–2) plus `.gitignore` / `.githooks/pre-commit` (slice 3). Twenty-six files outside
  `cli/src` still carry Cortex identity literals — including `commands/cortex-init.md`,
  `cortex-init.sh`, `README.md`, `skills/**` and `scripts/**` — and none is assigned to a slice.
  The rename plan needs a fourth slice or explicit inclusion.

## Rationale log

- **Correct the claim, do not restore the capability.** Re-adding an automatic post-apply review
  would contradict PR #14, which decided ponytail does not run at a review boundary, and would
  duplicate authority the native review already owns. The claim was the defect.
- **Keep the current names.** `cortex-persona` and `.opencode/skills/` are what exist on disk today.
  Writing `rapsodia-code` / `rapso` here would trade one false claim for another, and would reach
  ahead of unauthorized slices.
- **Fix the class, not the line.** PR #14's own rationale log warns that correcting one false
  capability claim while leaving an identical one standing is "incoherence dressed as scope
  discipline". That is why `cortex-init.sh` — which ships into consumer projects — is in scope.
- **Two work units, split by blast radius.** The command doc is read by the operator; the heredoc
  becomes the `AGENTS.md` of every new project.
- **The other two grep hits were checked, not assumed.** `USER-GUIDE.md:14` and
  `migrate-wiki-to-engram.sh:62` describe mechanisms that do exist; a broad pattern match is not a
  finding.
