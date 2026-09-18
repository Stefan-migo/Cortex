# ODD Task — ponytail-post-write

**Branch:** `odd/ponytail-post-write` · **Worktree:** `../rapsodia-code-odd-ponytail-post-write`
**Base:** `main` @ `23a1881`
**TDD:** OFF — this repository has no test harness, zero test files, and `npm test` exits 1 with
"No test files found". No runner, no lint script. Functional verification is assertion-based
(`rg` over the edited surfaces plus read-back) and `npm run typecheck` for the one TypeScript file.

## Objective

Make ponytail a **post-write simplification check over code that already exists**, with no
authority over whether something should exist, which dependency is added, which pattern is used,
or how the system is structured.

## Problem

Ponytail currently runs **before** code exists and therefore decides things that are not code
shape. Four verified entry points:

1. **The apply-time ladder leads with scope.** `skills/rapso-persona/SKILL.md:50-51` puts
   *"Does this need to exist? (YAGNI) → No → skip it"* as rung 1, above the counterweight at
   `:66` (*"Not lazy about: … anything explicitly requested"*). A rung that asks whether something
   should exist is a scope decision, not a code-shape decision.
2. **`AGENTS.md` is gate-enforced and carries two architectural rules.** `.gga:49` sets
   `RULES_FILE="AGENTS.md"` and `.githooks/pre-commit:47` runs `gga run` on every commit, so the
   bullets at `AGENTS.md:126-127` are not advice — they are enforced:
   - *"Prefer the standard library or an already-installed dependency before adding a dependency."*
     → a dependency/architecture decision.
   - *"Do not add an abstraction with one implementation and no second use."* → a pattern/
     architecture decision that directly contradicts the same repository's `SOLID FOUNDATIONS`
     principle. It kills ports, adapters, DI seams and layering by rule.
3. **The ODD task document pre-commits ponytail at the Track step.** The boundary table
   (`SKILL.md:165-174`) marks `Track` as **NO**, but the task document's Constraints section is
   where ponytail rules actually get written down — before any code exists. Observed in this
   repository at `odd/tasks/worktree-skill-provisioning.md:103`, and more damagingly in a consumer
   project at `lumat-agent/odd/tasks/panel-assistant-context-and-stream.md:94-95`:
   *"Ponytail: YAGNI → stdlib → native → already-installed dependency → one line → minimum. No new
   abstractions, no new dependency, no boilerplate. Deletion over addition."*
   Nothing defines that the task document must carry ponytail constraints — `skills/rapso-session/SKILL.md`
   (which produces the report that seeds it) has zero ponytail mentions. It leaked in by habit,
   unowned by any rule.
4. **The design-shaped tools are still provisioned.** `cortex-init.sh:71` and
   `cli/src/engine/worktree.ts:43` link `ponytail-plan` — whose own description reads *"Review
   plans, designs, and tasks before code is written… Trigger: reviewing specs, designs, task
   lists"* — into every project and every worktree. No ODD-step rule forbids invoking it during
   Explore or Classify, and the skill list is authoritative to the model.

### Observed damage in a consumer project

`lumat-agent/openspec/changes/hito-1-setup-whatsapp/design.md:222-233` carries a literal
`## Ponytail Plan Review (applied — cuts)` block ending in `net: -8 items cut from design.`
Among the eight applied cuts: deleting the `emergency_rules` and `spend_ledger` tables, deleting
the worker container and broker, deleting the LangGraph checkpointer, deleting secondary LLM
validation on emergencies, and — item 7 — **deleting Excel export**, when the requirement `AP-7`
reads *"CSV or Excel"*. The cut is recorded in the shipped code at
`app/panel/routes/export.py:8` (*"Excel cut by the ponytail review"*) and in that change's
verify-report as `✅ Yes`.

That was a design-time tool overriding a written requirement. It is the concrete failure this
change exists to prevent.

## The principle this change encodes

> **Ponytail operates on code that already exists. It asks whether the same behavior can be
> expressed more simply. It never decides whether something should exist, which dependency is
> added, which pattern is used, or how the system is structured.**

Corollary: when ponytail finds something it believes is unnecessary — a requested feature, an
abstraction it disagrees with, a dependency it would not have added — it **reports a finding**.
It does not edit, and it does not cut. The human decides.

## Scope

Authorized (Rapsodia-owned surfaces only):

- `skills/rapso-persona/SKILL.md` — the rule section, the boundary table, the contradiction fix.
- `AGENTS.md` — the gate-visible rule set.
- `cli/src/template/AGENTS.md` — the mirror for initialized projects.
- `cortex-init.sh` — the skill link list and the heredoc Skills table.
- `cli/src/engine/worktree.ts` — `CANONICAL_SKILLS`.

**Out of scope, deliberately:**

- **The five `skills/ponytail-*/SKILL.md` files.** They are an upstream artifact
  (`author: DietrichGebert`). Same convention as PR #14: the Rapsodia-owned surface owns the
  Rapsodia decision, upstream stays byte-identical.
- **Consumer migration.** Deferred by explicit human decision to the `rapsodia-code` release.
  Recorded under Follow-ups with the evidence needed to do it.
- **`scripts/cortex-sync.sh`.** It globs `"$PACK_DIR"/skills/*/` (`:42`) and would push every
  skill directory regardless of any allowlist, so the restriction is not enforced on that path.
  This belongs to the release-time consumer migration, not to this change. Recorded as a
  release-blocking Follow-up.
- **`cli/src/**` beyond `CANONICAL_SKILLS`.** No other code behavior changes.

## Constraints

- **Do not fork upstream.** No edit to any `skills/ponytail-*/SKILL.md`.
- **The `ponytail:` comment convention survives.** It is a code-level ledger of deliberate
  shortcuts and is in-domain; `/ponytail-debt` harvests it at Close.
- **The gate rule set must stay small and adjudicable.** Only rules a reviewer can actually decide
  belong in `AGENTS.md`. An unadjudicable rule manufactures false findings on unrelated work.
- **Ponytail remains a discipline, not a gate.** It never supplies PASS, never assesses candidate
  risk, and never replaces RDD or native review.
- **`AGENTS.md` and `cli/src/template/AGENTS.md` contain no `gentle-ai:` managed markers**
  (verified), so these edits cannot land inside a managed block.

## Tasks

- [x] **T01** — Rewrite the ponytail rule section in `skills/rapso-persona/SKILL.md` as a
  post-write check over existing code. Ladder is now stdlib → native platform feature →
  already-installed dependency → one line → minimum code, applied to code that already exists.
  Rung 1 (`Does this need to exist?`) deleted, and the acronym removed from the file entirely.
- [x] **T02** — Added the explicit prohibitions: never removes or alters requested behavior;
  reports findings instead of cutting; never chooses dependencies, patterns, or structure.
- [x] **T03** — Added `Track` to the boundary table as **NO** with the pre-commit reason. Kept
  `Implement` and `Close` (bounded). Rewrote the Classify row so it no longer reads as an
  endorsement of a scope-cutting pass. Extended the toggle statement to cover the upstream
  `ponytail-help` mode card and its "Ultra" mode. Also rewrote the `sdd-design` two-sided check
  line, which still named `ponytail-plan` as a thing not to invoke — stale once T05/T06 unlink it.
- [x] **T04** — Removed both architectural bullets from `AGENTS.md` and
  `cli/src/template/AGENTS.md`; kept deletion-over-addition, now conditioned on the authorized
  behavior staying identical; added the code-only boundary and the report-instead-of-cut rule.
- [x] **T05** — Stopped linking `ponytail-plan` in `cortex-init.sh`, removed it from the heredoc
  Skills table and from the Python registry array, and removed the `/ponytail-plan` line from the
  closing `echo` block. A comment now records why it is not linked.
- [x] **T06** — Removed `'ponytail-plan'` from `CANONICAL_SKILLS` in `cli/src/engine/worktree.ts:43`.
- [x] **T07** — Verified with real output (below). Commits and PR pending.

## Acceptance criteria

All assertions are case-insensitive — PR #14's own rationale log records that a case-sensitive
`rg` returns a success-shaped empty result on a correct file (the text reads `Ponytail`).

- No ponytail rule in `skills/rapso-persona/SKILL.md` asks whether something should exist:
  `rg -ni "need to exist|YAGNI" skills/rapso-persona/SKILL.md` returns **zero hits in the whole
  file** — the acronym is removed, not merely relocated.
- The rule section states that ponytail never chooses dependencies, patterns, or architecture, and
  that it reports instead of cutting when it disagrees with authorized scope.
- The boundary table marks Authorize, Explore, Resolve uncertainty, Classify, **Track**, and
  RDD/native review as **NO**.
- `rg -ni "abstraction with one implementation" AGENTS.md cli/src/template/AGENTS.md` returns
  **zero** hits.
- `rg -ni "already-installed dependency before adding a dependency" AGENTS.md cli/src/template/AGENTS.md`
  returns **zero** hits.
- Both `AGENTS.md` files still contain the deletion-over-addition rule and the
  implementation-only guard.
- `ponytail-plan` has no functional reference left: `rg -n "ponytail-plan" cortex-init.sh cli/src/engine/worktree.ts` returns exactly **one** line, and it is the explanatory comment recording why it is not linked. Zero `link_skill`, table, array and registry entries remain.

### Functional verification

- A real `cortex-init.sh` run against a throwaway fixture links **6** skills, not 7.
- `rg -rn "ponytail-plan|YAGNI" <fixture>` returns zero hits, so nothing that the `init` path
  writes into a new project still carries the removed rung.
- `bash -n cortex-init.sh` exits 0.
- `cd cli && npm run typecheck` exits 0.
- No file under `skills/ponytail-*/` is modified: `git diff --name-only | rg '^skills/ponytail-'`
  produces no output.
- `cd cli && npm run typecheck` exits 0.

## Verification evidence

### Pre-change state, observed directly

```
$ rg -n "ponytail" cortex-init.sh cli/src/engine/worktree.ts
cortex-init.sh:71:link_skill "ponytail-plan"
cortex-init.sh:180:| `/ponytail-plan` | Review plans/designs/tasks for over-engineering |
cli/src/engine/worktree.ts:43:const CANONICAL_SKILLS = ['rapso-persona', 'rapso-session', 'ponytail-review', 'ponytail-audit', 'ponytail-debt', 'ponytail-help', 'ponytail-plan'];

$ rg -n "RULES_FILE" .gga
49:RULES_FILE="AGENTS.md"
$ rg -n "gga run" .githooks/pre-commit
47:gga run || exit 1
```

### Post-change assertions

Literal output, pasted from the worktree root:

```
$ rg -ni "need to exist|YAGNI" skills/rapso-persona/SKILL.md
exit=1   (zero hits)

$ rg -ni "abstraction with one implementation" AGENTS.md cli/src/template/AGENTS.md
exit=1   (zero hits)

$ rg -ni "already-installed dependency before adding" AGENTS.md cli/src/template/AGENTS.md
exit=1   (zero hits)

$ rg -ni "deletion and addition both work" AGENTS.md cli/src/template/AGENTS.md
cli/src/template/AGENTS.md:126:- When deletion and addition both work and the authorized behavior stays identical, delete.
AGENTS.md:127:- When deletion and addition both work and the authorized behavior stays identical, delete.

$ rg -n "ponytail-plan" cortex-init.sh cli/src/engine/worktree.ts
cortex-init.sh:71:# ponytail-plan is deliberately not linked: it reviews plans, designs and task lists,

$ git diff --name-only | rg '^skills/ponytail-'
exit=1   (zero hits — upstream untouched)

$ bash -n cortex-init.sh
exit=0

$ cd cli && npm run typecheck
> rapsodia-code@1.0.0 typecheck
> tsc --noEmit
exit=0
```

### Functional run against a throwaway fixture

```
$ rm -rf /tmp/opencode/ponytail-verify && mkdir -p /tmp/opencode/ponytail-verify/proj
$ bash <worktree>/cortex-init.sh /tmp/opencode/ponytail-verify/proj
  Skills:      6 enlazados          <-- was 7 before this change

$ ls /tmp/opencode/ponytail-verify/proj/.opencode/skills/
ponytail-audit  ponytail-debt  ponytail-help  ponytail-review  rapso-persona  rapso-session

$ rg -rn "ponytail-plan" /tmp/opencode/ponytail-verify/proj
exit=1   (zero hits)

$ rg -rn "YAGNI" /tmp/opencode/ponytail-verify/proj
exit=1   (zero hits)

$ rg -n -i "ponytail" /tmp/opencode/ponytail-verify/proj/AGENTS.md
17:- Ponytail post-write simplification check (stdlib → native → already-installed dependency → one line → minimum)
20:- Graphify before code work; Ponytail check after the code is written (ODD's Implement step)
28:| `/ponytail-review` | Review code diff for over-engineering |
29:| `/ponytail-audit` | Audit full repo for bloat |
30:| `/ponytail-debt` | Harvest `ponytail:` shortcuts into a debt ledger |
31:| `/ponytail-help` | Quick-reference card for all ponytail commands |
```

### Defect found by the functional run, not by the assertions — T05b

The heredoc in `cortex-init.sh` still wrote the **old** ladder into every newly initialized
project's `AGENTS.md`:

```
- Ponytail over-engineering rules (YAGNI → stdlib → native → one line → minimum)
- Graphify before code work; Ponytail rules while writing code (ODD's Implement step)
```

The `rg` assertions passed while this was true, because none of them inspected the text the
heredoc emits — they inspected the script's own lines. Only running the script and reading the
file it actually writes exposed it. Both lines are now corrected (see the fixture output above),
which is why the fixture run carries a `YAGNI` check that the original assertion set did not.

## Follow-ups, not in this change

- **`scripts/cortex-sync.sh` does not enforce any allowlist (release-blocking for this decision).**
  `:42` iterates `"$PACK_DIR"/skills/*/` and copies every `SKILL.md` into each project on
  `projects.txt`. Removing `ponytail-plan` from init and worktree provisioning is therefore not
  enough at the release boundary: the sync path would still push it. The release-time migration
  must either add an allowlist or stop shipping the design-shaped skills.
- **Sync copies by directory name, so the `cortex-persona` → `rapso-persona` rename is not
  migrated.** `cortex-sync.sh:48` writes `$target/$name/SKILL.md`. Consumer projects hold the old
  name, so sync adds the new directory and leaves the stale one standing. Two known projects carry
  the old design-time wiring at
  `.opencode/skills/cortex-persona/SKILL.md:172-188` — `repos/lumat-agent` and
  `repos/lumat-agent-odd-planner-tool-schemas` — and both also assert
  *"Ponytail in propose/design/tasks/pre-apply"* at `AGENTS.md:18`. The migration needs an explicit
  removal of the stale directory.
- **`cortex-sync.sh` never touches `AGENTS.md`**, and `cortex-init.sh:151` writes it only
  `if [ ! -f "$AGENTS_FILE" ]`. So the stale consumer `AGENTS.md` claims survive both paths and
  need their own migration decision.
- **`projects.txt` is incomplete.** It lists `repos/lumat-agent` and `repos/lumat-agent-harness`;
  `repos/lumat-agent-odd-planner-tool-schemas` carries the same stale persona and is not on the list.
- **`ponytail-help` advertises a mode that contradicts this decision.** `SKILL.md:25` publishes
  *"Ultra — YAGNI extremist. Challenges requirements before building."* The file is upstream and is
  not edited; `rapso-persona` must explicitly state that the mode card does not govern Rapsodia's
  rules. Same treatment PR #14 gave `PONYTAIL_DEFAULT_MODE`.
- **Pre-existing `gga` finding in `cli/src/engine/worktree.ts:93` — not introduced here.**
  `gga` flagged `readdirSync(archiveRoot, { recursive: true })` as requiring Node 18.17+ while
  `cli/package.json` declares `>=18`. Verified present identically at base `23a1881`
  (`git show 23a1881:cli/src/engine/worktree.ts` → same line 93), so this change did not cause it:
  the diff to that file is one line, the `CANONICAL_SKILLS` array. Recorded, not fixed — fixing it
  is a separate compatibility decision (raise the floor or replace the traversal).
- **`rapsodia-code/AGENTS.md:133` and `cli/src/template/AGENTS.md:132` disagree on the worktree
  path** (`../Cortex-odd-<slug>` vs `../<Project>-odd-<slug>`). The template form matches what the
  CLI actually creates. Separate naming cleanup.

## Progress

Implementation complete and verified. T01–T06 done; T07 verified with the literal output above.
Worktree created at `../rapsodia-code-odd-ponytail-post-write` with explicit human consent.

Five authorized surfaces changed, plus this task document:

| File | Change |
|---|---|
| `skills/rapso-persona/SKILL.md` | Post-write rule section, prohibitions, boundary table with `Track`, toggle statement |
| `AGENTS.md` | Two architectural bullets removed; code-only boundary added |
| `cli/src/template/AGENTS.md` | Same mirror |
| `cortex-init.sh` | `ponytail-plan` unlinked, removed from the Skills table, the registry array and the echo block; heredoc ladder corrected |
| `cli/src/engine/worktree.ts` | `CANONICAL_SKILLS` no longer lists `ponytail-plan` |

## Next step

Commit as reviewable work units and open the PR. After the merge, `npm run build` in main
(`cli/dist/` is gitignored) and the release-time consumer migration (see Follow-ups).

## Rationale log

- **The rung is deleted, not reworded.** "Does this need to exist?" cannot be made safe by
  softening it; the question itself is the authority leak. Removing it is the whole point of the
  change.
- **Report instead of cut.** A pure deletion tool with a one-way metric (`net: -<N> lines`) has no
  way to represent "this looks cuttable but the human asked for it". Giving it a findings channel
  preserves the useful signal without handing it the edit.
- **Upstream files stay untouched.** Editing a vendored upstream file converts every future
  upstream change into a conflict, for no gain — the same reasoning PR #14 recorded.
- **`Track` is named explicitly in the boundary table.** The leak was not a missing prohibition
  someone forgot; it was a step that appeared to be covered by "Track is not code" while the task
  document is written there. Naming it makes the rule decidable.
- **The consumer migration is separated on purpose.** This change makes the rule correct in the
  pack; the release decides how it reaches projects. Mixing them would couple a semantics change
  to a packaging change, which PR #14 already identified as the wrong trade.
