# ODD Task — odd-v3-doc-alignment

**Branch:** `odd/odd-v3-doc-alignment` · **Worktree:** `../rapsodia-code-odd-odd-v3-doc-alignment`
**Base:** `origin/main` @ `54ab8cb`
**TDD:** OFF — this repository has no test harness (`cli/package.json` has no `lint` script; `cli/src` contains zero `*.test.ts`/`*.spec.ts`). Functional checks only; no RED/GREEN cycle is claimed. Runner: none.

## Objective

Make Rapsodia's documentation and agent-definition surface stop describing the world before Gentle AI v3 — where SDD was the default workflow and lint/tests always existed. Three symptoms of one root cause, and the shipped template carries all three.

## Root cause — the surface predates v3

Gentle AI v3.0.2 makes **ODD the default workflow**; SDD is a branch entered only by explicit request or accepted proposal, and `/sdd-verify` is **optional diagnostics**. Decision #3600 additionally fixed that code work is **born in a worktree** created from `origin/main`, and that `odd/tasks/<feature>.md` is created **inside** that worktree, committed on `odd/<slug>`, and reaches main through the PR (`AGENTS.md:163` is the authoritative rule).

Rapsodia's own docs, agents, and shipped template still say the opposite in three ways:

- **A — ordering**: the Session Flow puts task-doc creation *before* worktree creation.
- **B — SDD framing**: SDD is presented as the default/required feature path.
- **C — nonexistent tooling**: a blocking gate demands "lint + typecheck + tests" that do not exist in this repository.

### The divergence that makes this urgent

`AGENTS.md` (repo) already carries the corrected "no lint script / no test harness" wording at lines 115-119. **`cli/src/template/AGENTS.md:115,118` never received it.** `cli/src/engine/template.ts` copies the whole `cli/src/template/` tree recursively (`collectFiles`, no hard-coded file list), so **every project created by `rapso init` ships the false instructions** — including the consumer agent currently being provisioned on Windows.

## Scope

### In scope

Seven files. The repo's `.opencode/skills/rapso-persona/SKILL.md` is a **symlink** to its template counterpart, so it is one file, not two.

| # | File | Groups |
|---|------|--------|
| 1 | `AGENTS.md` | A, B, C |
| 2 | `cli/src/template/AGENTS.md` | A, B, C |
| 3 | `.opencode/agents/rapso-developer.md` | B, C |
| 4 | `cli/src/template/.opencode/agents/rapso-developer.md` | B, C |
| 5 | `cli/src/template/.opencode/skills/rapso-persona/SKILL.md` | B, C |
| 6 | `cli/src/template/USER-GUIDE.md` | B, C |
| 7 | `cli/src/template/SYSTEM-MAP.md` | B, C |

**Found during implementation — `.specify/` was decommissioned but still referenced.** `cli/src/template/.opencode/skills/rapso-persona/SKILL.md:113` pointed at `.specify/`. `spec-kit-decommission` deleted that tree, and its own acceptance criterion forbids any remaining reference in a shipped surface a user or agent can read. This is a class (c) instance and is fixed under T02.

### Out of scope, deliberately

- **`.opencode/agents/rapso-planner.md:13` and `rapso-session/SKILL.md:137` — not defects.** Both use "seeds" to mean *supplies input for* the task doc, not *creates it before the worktree*. The sweep that flagged them over-read the word. No edit.
- **Template omissions of repo-only policy.** The template deliberately omits the Defect-Report Privacy Contract, the Pull Request Policy, the Rapsodia defect-reporting section, and the graphify policy. Those describe Rapsodia's own code and repository; a consumer project must not inherit them. Not drift.
- **`{PROJECT_NAME}` / `{DATE}` placeholders.** `template.ts:35-38` substitutes `{PROJECT_NAME}`, `{PROJECT_NAME_KEBAB}`, `{DATE}`, `{YEAR}`. `cli/src/template/AGENTS.md:150` and `USER-GUIDE.md:10` carry them; neither is in the edited ranges. Preserve them untouched.
- **Agent frontmatter divergence (recorded, not fixed).** `.opencode/agents/rapso-planner.md:3` has `mode: primary`; the template counterpart has no `mode` field, and neither template agent declares one. This is a real repo↔template divergence but it is *not* an A/B/C finding, and whether OpenCode requires the field is unverified. See Follow-ups.

## Tasks

- [x] **T01 — Group A: correct the ODD ordering claim.**
  `AGENTS.md:72` and `cli/src/template/AGENTS.md:72`.
  Current: *"Planner uses `rapso-session` to seed `odd/tasks/<feature>.md`, then creates the worktree with `rapso worktree create <slug>`"*.
  Corrected: the Planner closes planning with an ODD handoff (`rapso-session`); **after** explicit per-feature human consent the implementation worktree is created first (`rapso worktree create <slug>`, from `origin/main`); the ODD task doc is then created **inside** that worktree, committed on `odd/<slug>`, and reaches main through the PR. This also removes the false implication that the read-only Planner creates the worktree.

- [x] **T02 — Group C: replace the nonexistent tooling.**
  Sites: `AGENTS.md:81`; `cli/src/template/AGENTS.md:81,115,118`; `.opencode/agents/rapso-developer.md:42-45,74,77` and its template counterpart; `cli/src/template/.opencode/skills/rapso-persona/SKILL.md:110`; `cli/src/template/USER-GUIDE.md:89`; `cli/src/template/SYSTEM-MAP.md:135`.
  Two distinct truths, not one wording:
  - **Repo files** state Rapsodia's real checks: `npm run typecheck`, `npm run build`, and concrete manual scenarios — no lint script, no test harness.
  - **Template files** ship to projects whose tooling is unknown, so they must be conditional and honest: run the checks the project actually configures; never claim a check or coverage that does not exist.

- [x] **T03 — Group B: reframe SDD as an opt-in branch.**
  Sites: `AGENTS.md:82`; `cli/src/template/AGENTS.md:82`; `.opencode/agents/rapso-developer.md:12-18,48-50` and its template counterpart; `cli/src/template/.opencode/skills/rapso-persona/SKILL.md:78`; `cli/src/template/USER-GUIDE.md:30-41,90`; `cli/src/template/SYSTEM-MAP.md:66,135-136,171-172`.
  ODD is the default; SDD is entered only on explicit request or accepted proposal; the spec-check step becomes conditional and `/sdd-verify` is named optional diagnostics. `SYSTEM-MAP.md:66` *"Every feature, every task. Always spec first, then build."* and `:171-172` *"GENTLE AI SDD … Every feature task"* are the strongest offenders.

- [ ] **T04 — Verify and deliver.** Verification and the work-unit commits are done — see Verification evidence. The PR is still pending explicit human authorization.

## Acceptance criteria

1. No A/B/C claim remains in any of the seven files.
2. The repo's five-step gate names only checks that exist; the template's gate is conditional and never mandates tooling a project may not have.
3. A real `rapso init` fixture shows the corrected wording in the generated `AGENTS.md`.
4. `npm run typecheck` and `npm run build` pass with real output recorded.
5. `{PROJECT_NAME}` and `{DATE}` placeholders survive untouched.

## Verification evidence

**Typecheck** — `npm run typecheck` (from `cli/`) → exit 0, no output.

**Build** — `npm run build` (from `cli/`) → exit 0.

**Residual scan** — no A/B/C claim remains in the seven edited files:

```
$ git grep -n -i "lint + typecheck|Run lint|Write tests alongside|sdd-verify after completion|Every feature, every task|Always spec first|Spec Execution (Gentle AI SDD)|then creates the worktree|.specify" -- AGENTS.md cli/src/template .opencode/agents
(vacío)
```

**Functional — the corrected text is what actually ships.** The `rapso` on `PATH` resolves to the **main** worktree's `cli/dist`, so the worktree's own CLI was run against a throwaway fixture:

```
$ node <worktree>/cli/dist/index.js init oddv3fixture --yes --no-git
Done! Project "oddv3fixture" created at /tmp/opencode/oddv3fixture
```

Read back from the generated files:

- `AGENTS.md:72` — the worktree-first ordering text is present.
- `AGENTS.md:81` — "the checks this project actually configures (typecheck, build, tests); never claim a check that does not exist".
- `AGENTS.md:82` — "SPEC CHECK — only when SDD was explicitly used".
- `AGENTS.md:115` — "Run the project's configured checks (typecheck, build, tests)".
- `USER-GUIDE.md:30,64,91,102` — ODD-default heading, opt-in SDD heading, corrected gate, ODD Frontal Lobe.
- `SYSTEM-MAP.md:41,50,66` — ODD task doc, ODD-default section, corrected "when to use".
- `{PROJECT_NAME}` → `oddv3fixture` and `{DATE}` → `2026-09-19` substituted correctly; the placeholders were preserved.
- `.specify` and the stale patterns: zero hits in the fixture.

**ASCII alignment** — the quick-reference table (lines 162-192) and the rewritten Frontal Lobe box (lines 10-15) each hold a single width. The identity-table header row (line 37) is off by two characters, but that is **pre-existing** and untouched by this change (`git diff` confirms only line 41 moved).

## Follow-ups, not in this change

- **`SYSTEM-MAP.md:37` pre-existing ASCII misalignment.** The identity-table header row is two characters short of its own border. Untouched here because it is not an A/B/C claim and rewriting it would blur this diff. Separate cosmetic fix.
- **Agent frontmatter divergence.** `.opencode/agents/rapso-planner.md:3` declares `mode: primary`; `cli/src/template/.opencode/agents/rapso-planner.md` does not, and neither template agent declares a mode. Verify whether OpenCode requires `mode` for a primary agent, then align. Separate change.
- **Projects already initialized keep the old text.** `rapso init` writes `AGENTS.md` only when absent, so existing consumer projects need a migration decision — same shape as the one recorded in `stale-integration-claims.md`.
- **`AGENTS.md:82`/Developer Step 4 vs. `/sdd-verify`.** Covered here by T03; recorded so it is not re-litigated.

## Rationale log

- **Fix the class, not the line.** `stale-integration-claims.md` already established this for false capability claims: *"correcting one false capability claim while leaving an identical one standing is incoherence dressed as scope discipline."* The same reasoning applies here — line 72 alone would leave the SDD framing and the nonexistent tooling standing.
- **Two truths for two audiences.** The repo and the template are not the same document. The repo may state Rapsodia's real tooling; the template must stay honest about a project it has never seen. Writing Rapsodia's specifics into the template would replace one false claim with another.
- **The symlink was verified, not assumed.** `readlink -f .opencode/skills/rapso-persona/SKILL.md` resolves to the template path, so the persona skill is one file and the plan counts it once.
- **The planner files were checked, not assumed.** The sweep flagged "seeds" as an ordering defect; reading the sentences showed the wording is correct. Dropped from scope.
