# ODD Task — ponytail-odd-alignment

**Branch:** `odd/ponytail-odd-alignment` · **Worktree:** `../Cortex-odd-ponytail-odd-alignment`

## Objective

Reposition ponytail from a design-time cutting pass into a code-writing discipline, and wire it into the ODD default flow — **only where that alignment is coherent with ponytail's own objective**.

## Problem

The ponytail rules (`skills/cortex-persona/SKILL.md:45-64`) are hard-wired into the SDD phases by the same persona file, and **every one of those hook points fires before a line of code exists**:

| Line | Phase | Injected instruction |
|---|---|---|
| `:173-176` | `sdd-propose` | "Ponytail YAGNI check" on the proposed scope |
| `:181` | `sdd-design` | "after writing the design, apply `skill("ponytail-plan")`" |
| `:184-187` | `sdd-tasks` | review the generated task list with `ponytail-plan` |
| `:192-194` | `sdd-apply` | pre-apply check + rules during implementation |

That is **four cutting passes before any code exists**. `ponytail-plan` has exactly one job — finding things to cut — and nothing anywhere supplies a counterweight: no check asks whether a design came out too thin. A filter that only subtracts, applied four times, produces monotonic stripping. Design is precisely where options are *weighed*; cutting there removes options before they are evaluated.

Three further defects were verified:

1. **The persona contradicts itself.** `:26` — `SOLID FOUNDATIONS: design patterns, architecture, fundamentals before frameworks` — against `:60` — `Deletion over addition. Boring over clever. Fewest files possible.` "Fewest files possible" applied to architecture pushes toward a monolith and away from ports/adapters. The two rules collide exactly at design time.
2. **The rule is invisible to the gate, so its effect is unmeasurable.** `.gga:36` sets `RULES_FILE="AGENTS.md"`, and `AGENTS.md` never mentions ponytail. Ponytail is therefore context bias with no enforcement and no measurement. Its own tracking mechanism proves the point: the `ponytail:` comment convention (`:62`), the raw material of `/ponytail-debt`, has **zero real occurrences** in `.ts`/`.sh`/`.js`.
3. **The documented off-switch belongs to a runtime that is not installed.** `skills/ponytail-help/SKILL.md:46-51` documents `PONYTAIL_DEFAULT_MODE` and `~/.config/ponytail/config.json` with the resolution `env > config > full`, including "set `off` to disable auto-activation". `~/.config/ponytail/` does not exist, there is no `ponytail` binary on `PATH`, and the only occurrence of that variable anywhere in the repository is its own documentation. Ponytail's upstream runtime (`github.com/DietrichGebert/ponytail`, v4.0) was never installed — only five `SKILL.md` text files were copied in.

## Why

ODD is now the default workflow and SDD is a branch inside it, but ponytail is wired only into SDD. Alignment must be surgical rather than thorough, because ponytail's ladder (YAGNI → stdlib → native → existing dependency → one line → minimum code) is a statement about **how code is written**. Applied outside that domain it does not reduce over-engineering; it removes information.

### The boundary (the single principle this change encodes)

> **Ponytail governs HOW code is written. It never governs WHAT is authorized, HOW MUCH is tracked, or WHETHER something is reviewed.**

| ODD step | Ponytail | Rationale |
|---|---|---|
| Authorize | **NO** | Human intent and scope. Cutting here is scope creep against the user. |
| Explore | **NO** | Understanding is not code. |
| Resolve uncertainty | **NO** | Product decisions. Ponytail has no standing. |
| Classify | **NO** | "Substantial" means the progress is worth recovering, not that the code is large. A YAGNI pass here would make the agent **skip tracking on real work** — it would reduce recoverability, not over-engineering. |
| Track | **NO** | The task document is a record, not code. |
| **Implement task by task** | **YES — the real home** | The only step that writes code. |
| **Close** | **YES, bounded** | Harvest the `ponytail:` ledger via `/ponytail-debt`. |
| RDD / native review | **NO** | External authority. Duplicating or replacing the native refuter is prohibited. |

### Guards that must be stated, not implied

- **Ponytail does not govern ODD's ~400-line heuristic.** That heuristic is already advisory-only — "not a task acceptance criterion, hard cap, counter-trigger, automatic stop, forced split, or RDD trigger". Welding "less code" to "a better PR is a smaller PR" would corrupt the rule, not apply it.
- **Ponytail is not an approval checkbox.** Checkboxes grant no approval and no receipt.
- **Ponytail never runs at a review boundary.** It does not assess candidate risk, does not supply PASS, and never replaces RDD.

## Scope

Authorized (Cortex-owned surfaces only):

- `skills/cortex-persona/SKILL.md` — the boundary, the phase mapping, the contradiction resolution, the toggle statement.
- `AGENTS.md` — the surgical, gate-visible rule set.
- `cli/src/template/AGENTS.md` — the mirror for initialized projects.

Out of scope, deliberately:

- **The five `skills/ponytail-*/SKILL.md` files.** They are an upstream artifact (`author: DietrichGebert`, v4.0). Forks of upstream files are how a local edit silently becomes an upgrade conflict, so the Cortex-owned surface owns the Cortex decision and upstream stays intact.
- **The skill-delivery gap.** `cli/src/template/.opencode/skills/` ships only `bootstrap`, `design-system`, and `graphify`, so `cortex init` cannot deliver ponytail or `cortex-persona` at all (`cortex-init.sh:55-75` and worktree provisioning can, via symlinks to root `skills/`). That is the separately identified "unify the two skill sources" change. Dragging it in here would mix a packaging question with a workflow-semantics question.
- **`cli/src/**` code and `.gga`.** No code behavior and no gate configuration changes.

## Constraints

- **Do not fork upstream.** No edit to `skills/ponytail-*/SKILL.md`.
- **The gate rule set must be small and adjudicable.** Adding ponytail to `AGENTS.md` makes it the standard `gga` enforces on every reviewed `.ts`/`.json` commit. Only rules a reviewer can actually decide belong there — "no new dependency when stdlib or an installed dependency covers it", "no abstraction with a single implementation and no second use", "delete rather than add when both work". The unmeasurable headline ("Write 80-94% Less Code") must **not** be promoted into the gate: an unadjudicable rule manufactures false findings.
- **Minimize `AGENTS.md` growth.** It is read on every commit and reviewed against; the surgical set is the point.
- `AGENTS.md` and `cli/src/template/AGENTS.md` contain **no `gentle-ai:` managed markers** (verified), so this task document and these edits cannot land inside a managed block.
- Editing `cli/src/template/AGENTS.md` requires `npm run build` in main **after** the merge, because the runtime reads the built `cli/template` copy, not `src/template`.

## TDD

Mode: **off** — resolved from project configuration (`AGENTS.md`): this repository has no test harness, zero test files, and `npm test` exits 1 with "No test files found". No runner. No lint script exists.

Applicable functional verification for this change is assertion-based, and it is the honest ceiling: `rg` assertions over the edited surfaces plus read-back of the final text. No test will be claimed that does not exist.

## Tasks

- [x] **T01** — State the boundary and its guards in `skills/cortex-persona/SKILL.md`: what ponytail governs, what it never governs (the table above), and the three explicit guards (400-line heuristic, no checkbox, no review boundary).
- [x] **T02** — Strip ponytail from the three pre-code SDD phases: remove the `sdd-propose` YAGNI check (`:173-176`), the `sdd-design` `ponytail-plan` pass (`:181`), and the `sdd-tasks` review (`:184-187`).
- [x] **T03** — Replace the design-time one-way pass with a **two-sided** check owned by `cortex-persona`: not "what can be cut" but "what requirement dies if this is cut, and which trade-off is being accepted". Defined inline, not by invoking `ponytail-plan`.
- [x] **T04** — Keep and sharpen ponytail where it is code: the `sdd-apply` section (`:190-194`), and the new ODD mapping recording that ponytail applies at "Implement task by task" and nowhere earlier.
- [x] **T05** — Resolve the `:26` vs `:60` self-contradiction by phase: architecture wins at design, minimum code wins at apply.
- [x] **T06** — Add the surgical ponytail rule set to `AGENTS.md` and mirror it in `cli/src/template/AGENTS.md`.
- [x] **T07** — Own the toggle truthfully: state in `cortex-persona` that the upstream env/config switch requires the upstream runtime and does not govern Cortex's embedded rules; leave `skills/ponytail-help/SKILL.md` untouched. Also wire the ODD **Close** step to harvest the `ponytail:` ledger, so the ledger stops being write-only-in-theory.
- [x] **T07b** — Unplanned, found during verification: correct a second false capability claim of the same class as the dead toggle. `:206` asserted that the orchestrator "already runs `ponytail-review` automatically over the diff (built-in hook)". **No such hook exists.**
- [x] **T08** — Verify and deliver: run the assertions below, record real output, commit as reviewable work units, open the PR. **Delivered by PR #14** (`refactor(persona): scope ponytail to code writing and align it with ODD`, merged 2026-09-17); its files and body match the boundary, gate-visible rules, and verification.

## Acceptance criteria

- No ponytail instruction remains in `sdd-propose`, `sdd-design`, or `sdd-tasks`: `rg -ni "ponytail" skills/cortex-persona/SKILL.md` returns only the code-writing rule section, the ODD boundary section (including its table), the two-sided design check, the `sdd-apply` section, and the toggle statement — with zero hits inside the propose/design/tasks phase blocks. **The assertion must be case-insensitive**: a case-sensitive `rg -n "ponytail"` returns zero hits even when the file is correct, because the text reads `Ponytail`.
- The boundary table names every ODD step and marks Authorize, Explore, Resolve uncertainty, Classify, Track, and RDD as **NO**.
- The design section contains a two-sided check that names the cost of cutting, and does not invoke `ponytail-plan`.
- `AGENTS.md` contains the adjudicable ponytail set and **not** the "80-94%" headline; `git diff` shows the `AGENTS.md` addition stays proportionate.
- `cli/src/template/AGENTS.md` carries the same set.
- The toggle statement names the upstream runtime as the owner of `PONYTAIL_DEFAULT_MODE` / `~/.config/ponytail/config.json` and claims no local implementation.
- No claim of an automatic ponytail hook survives: `rg -ni "built-in hook|automatically over the diff" skills/cortex-persona/SKILL.md` returns no hits, because no such hook is implemented anywhere in the repository.
- No file under `skills/ponytail-*/` is modified.

## Verification evidence

### Pre-change state, observed directly

```
$ rg -n "PONYTAIL_DEFAULT_MODE" --glob='!node_modules' .
./skills/ponytail-help/SKILL.md:48:export PONYTAIL_DEFAULT_MODE=ultra

$ ls -la ~/.config/ponytail/
ls: cannot access '/home/stefan/.config/ponytail/': No such file or directory
$ command -v ponytail
(no output — no binary on PATH)

$ rg -n "ponytail:" -tcode --glob='!node_modules' .
./cortex-init.sh:181:| `/ponytail-debt` | Harvest `ponytail:` shortcuts into a debt ledger |
(zero real `ponytail:` comments in .ts/.sh/.js)

$ rg -n "RULES_FILE" .gga
36:RULES_FILE="AGENTS.md"
```

### The gate is blind to ponytail, before the change

`AGENTS.md` contains no occurrence of `ponytail`; `.gga:36` points the reviewer at `AGENTS.md`. The rule was therefore unenforced and unmeasured.

### Post-change assertions

Literal output, pasted unedited from the worktree root:

```
$ rg -ni "ponytail" skills/cortex-persona/SKILL.md
3:description: "Cortex identity — Senior Architect persona, Ponytail minimalism, 5-Step Gate, and Graphify integration. Load for every project session."
45:## Ponytail Rules — Minimum Code at Apply Time
47:Ponytail governs HOW code is written. It never governs WHAT is authorized, HOW MUCH is tracked, or WHETHER something is reviewed. During design, SOLID FOUNDATIONS wins: preserve the architecture and options needed to evaluate requirements. During implementation, minimum code wins: use the first Ponytail rung that satisfies the approved design.
64:- Mark intentional simplifications with a `ponytail:` comment. If the shortcut has a known ceiling (global lock, O(n²) scan, naive heuristic), name the ceiling and the upgrade path.
161:## ODD and SDD Ponytail Boundary
163:Ponytail applies at ODD's **Implement task by task** step, because that is where code is written. It also applies at ODD's **Close** step only to harvest the `ponytail:` ledger with `/ponytail-debt`. It does not apply to Authorize, Explore, Resolve uncertainty, Classify, or Track. It does not apply at an RDD or native review boundary.
165:| ODD step | Ponytail | Boundary |
169:| Resolve uncertainty | **NO** | Product decisions are not Ponytail decisions. |
173:| Close | **YES, bounded** | Harvest the `ponytail:` ledger with `/ponytail-debt`; do not re-scope the work. |
174:| RDD / native review | **NO** | Ponytail never replaces external review authority. |
176:These guards are explicit: Ponytail does not govern ODD's advisory ~400-line heuristic; it is not an approval checkbox and grants no receipt; and it never runs at a review boundary, supplies PASS, assesses candidate risk, or replaces RDD.
178:The upstream `PONYTAIL_DEFAULT_MODE` environment variable and `~/.config/ponytail/config.json` switch require the upstream Ponytail runtime. Cortex has no local implementation of that runtime, and the upstream switch does not govern Cortex's embedded rules.
182:Cortex integrates Graphify and Ponytail into the gentle-ai SDD pipeline. Steps
198:- **Two-sided architecture trade-off check**: for each proposed cut, state what requirement, safety margin, or future option would die if it were cut, and state which trade-off the design accepts. This check is owned by `cortex-persona` and does not invoke `ponytail-plan`.
205:- **Ponytail applies here**: before and during implementation, apply the cortex-persona Ponytail Rules (YAGNI → stdlib → native → installed dependency → one line → minimum) to the approved task. This is a code-writing discipline, not a scope, tracking, or review gate.
206:- **Post-apply**: `ponytail-review` is available on demand over the diff. Nothing runs it automatically — Cortex ships no hook that invokes it — and it never supplies PASS, assesses candidate risk, or replaces RDD/native review.
```

Zero hits inside the `sdd-propose`, `sdd-design`, and `sdd-tasks` phase blocks. The `sdd-apply` block carries ponytail; the design block explicitly does not. Line `205` is the `sdd-apply` phase block; lines `196-201` are design and tasks and contain no ponytail instruction.

```
$ rg -ni "ponytail" AGENTS.md cli/src/template/AGENTS.md
AGENTS.md:119:## Ponytail — Code-Writing Discipline
AGENTS.md:121:Ponytail governs HOW code is written. It does not decide authorization, tracking, or review.
cli/src/template/AGENTS.md:118:## Ponytail — Code-Writing Discipline
cli/src/template/AGENTS.md:120:Ponytail governs HOW code is written. It does not decide authorization, tracking, or review.
```

```
$ rg -ni "80-94|Write 80" AGENTS.md cli/src/template/AGENTS.md skills/cortex-persona/SKILL.md
(no matches)
```

```
$ rg -ni "built-in hook|automatically over the diff" skills/cortex-persona/SKILL.md
(no matches)
```

```
$ git diff --stat
 AGENTS.md                      |  9 +++++++++
 cli/src/template/AGENTS.md     |  9 +++++++++
 skills/cortex-persona/SKILL.md | 40 ++++++++++++++++++++++++++--------------
 3 files changed, 44 insertions(+), 14 deletions(-)

$ git diff --name-only | rg '^skills/ponytail-'
(no output)

$ cd cli && npm run typecheck

> cortex-brain@1.0.0 typecheck
> tsc --noEmit
```

### Finding caught by parent verification, not by the writer — T07b

The writer reported `rg -n "ponytail" AGENTS.md cli/src/template/AGENTS.md` as **empty output** while simultaneously reporting that it had added ponytail rules to both files. Both claims were in the same report and the contradiction was not flagged. Root cause of the discrepancy: **the assertion command was case-sensitive and the added text reads `Ponytail`** — the file was correct, the command was not. The defective command was authored in this task document and has been corrected above to `rg -ni`.

The same verification pass surfaced a real defect the writer had left standing: `skills/cortex-persona/SKILL.md:206` asserted that the orchestrator "already runs `ponytail-review` automatically over the diff (built-in hook)". Verified false — the only plugin is `.opencode/plugins/graphify.js` (733 bytes, no ponytail logic), nothing under `.opencode/` mentions ponytail, and no `.githooks/` hook invokes it. This is the same defect class as the dead toggle: a documented capability with no implementation. Corrected in T07b.

## Progress

**Closed.** T01–T08 complete and delivered by PR #14 (`refactor(persona): scope ponytail to code writing and align it with ODD`, merged 2026-09-17). The PR files and body match the implementation and verification above.

## Next step

None. PR #14 delivered the three authorized files and recorded `commands/cortex-init.md:39` as an out-of-scope follow-up. After the merge, the documented build and graph refresh remain operational follow-ups.

## Rationale log

- **Boundary as one principle instead of a per-step list of tastes.** "Governs HOW code is written, never WHAT is authorized, HOW MUCH is tracked, or WHETHER it is reviewed" decides every future case the ODD protocol grows, including steps that do not exist yet. A list would need maintenance; the principle does not.
- **`Classify` is the highest-risk step, so it is excluded explicitly.** The plausible-looking mistake is reading "YAGNI" as "this work is small, skip the task document". That trades over-engineering for lost recoverability — a strictly worse trade.
- **The design check becomes two-sided rather than deleted.** Design legitimately benefits from someone asking "is this too much?". What it must not have is a pass that only ever subtracts. Naming the cost of a cut keeps the benefit and removes the bias.
- **Upstream files are left alone.** The decision belongs to the surface Cortex owns. Editing a vendored upstream file converts every future upstream change into a conflict, for no gain — the fix is in our own text.
- **The unmeasurable headline stays out of `AGENTS.md`.** `gga` reviews whole files against that file, so an unadjudicable rule does not create discipline; it manufactures false findings on unrelated work.
- **No code change, and no test claimed.** This change is text semantics plus workflow wiring. Recording that honestly is more useful than a synthetic harness.
- **T07b was added mid-flight, and that is the right call.** Correcting one false capability claim (the toggle) while leaving an identical false claim standing two sections away (the auto-run hook) would have been incoherence dressed as scope discipline. The defect class, not the file boundary, decided the scope — and the extra edit is one line inside a surface already authorized.
- **The verification command was the defect, not the artifact.** The case-sensitive `rg` in the acceptance criteria would report success-shaped emptiness on a correct file, and it did — a writer can then report an empty result next to a claim of success without either statement being a lie. Assertions that cannot distinguish "absent" from "present-but-capitalized" are not assertions. Corrected to `rg -ni`.
- **Evidence must be pasted, never paraphrased.** The first draft of the evidence block above carried reconstructed line numbers and an invented table row, which would have made a real verification look stronger than it was. Replaced with literal output.
