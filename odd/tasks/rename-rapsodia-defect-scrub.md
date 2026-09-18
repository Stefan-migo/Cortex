# ODD Tasks — rename-rapsodia-defect-scrub

Worktree: `/home/stefan/rapsodia-code-odd-rename-rapsodia-defect-scrub`
Branch: `odd/rename-rapsodia-defect-scrub`
Base: `49a476d` (== `origin/main`, the squash merge of PR #46)
TDD: OFF — this repository has no test harness (`npm test` exits 1: "No test files found").
Functional checks only; no RED/GREEN cycle is claimed. Runner: none.

## Objective

Land the only item **deferred out of Bucket 3** of the Cortex → Rapsodia rename, together with the
pre-existing defect that the review gate surfaced on that same file:

1. `cli/src/utils/defect.ts:48` — `cortexVersion` → `rapsoVersion` (the Bucket 3 rename item).
2. Harden `scrub` so credential-shaped values stop reaching a payload the report calls
   "already scrubbed".
3. Stop the report text from promising a guarantee a heuristic scrub cannot give.

The first two travel together by necessity, not preference: the pre-commit gate (`gga`) reviews the
**whole** staged `*.ts` file, not the diff, so the one-line rename cannot land while the scrub still
fails review. That is exactly why Bucket 3 reverted this file to base and deferred it.

Deferral record: `odd/tasks/rename-rapsodia-commands.md` → *Deferred to a follow-up change*.
Evidence of the defects: Engram #4168 (scrub gap) and #4169 (scope decision).

## Problem

`formatDefectReport` builds a payload that a user is invited to paste into a **public GitHub issue**,
and the report string asserts that it is safe. Four verified inputs survived the original scrub (read
from the source and then executed, not inferred):

| Input | Mechanism | Result before |
|---|---|---|
| `--token=supersecret` | `scrubToken` matched none of its rules and returned the token verbatim (`return token;`, L32) | value survived |
| `Authorization: Bearer <token>` | `scrub` split on whitespace; the credential is a *separate* token that matched no rule | value survived |
| `file:///home/stefan/.ssh/id_rsa` | matched `HAS_SCHEME` (L12); `scrubUrl` only stripped userinfo and cut query/fragment | absolute path survived |
| `--cwd=/private/path` | the `=` prefix kept the token from starting with `/`, so the existing absolute-path rule never fired | path survived |

A user who trusts the line "The payload below is already scrubbed" can therefore publish a secret. The
defect is as much about the **false promise** as about the misses.

## Decisions taken (human, 2026-09-18)

Scope chosen: **acotado y verificable**, amended twice more, each time by explicit human decision after
being shown executed evidence.

Redact (a) the value of credential-named assignments, (b) the credential that follows
`Bearer` / `Token` / `Basic`, and (c) paths and URL paths. Keep scheme, host and the rest of the
message so the payload stays diagnostic. The report text is corrected in every case, because no
heuristic scrubber can honestly guarantee a payload is secret-free.

Rejected alternatives, recorded so they are not silently re-proposed:

- **Known-credential patterns** (JWT `eyJ…`, `ghp_`, `AKIA…`, `sk-…`): more coverage, never
  exhaustive, and the false positives degrade the diagnostics the report exists to carry.
- **Full URL redaction** (`<url>`): safer, but discards the endpoint, which is often the single most
  useful diagnostic in the message.

### Amendment 1 — `NAME=value` stays covered

Verification showed the rule authorized for `--flag=value` also matches `NAME=value`, because the name
pattern does not require a leading dash: `GITHUB_TOKEN=ghp_…` comes out as `GITHUB_TOKEN=<redacted>`.
Observed by executing the module. The first version of this doc recorded that form as *out of scope*;
the human re-decided after seeing the evidence and authorized keeping it covered. It is the same
structural rule — the name suggests a credential — not a value-shape heuristic.

Calibrated in the same pass: the credential word may appear in **any** segment of the name. Matching
only the last segment was implemented, measured, and rejected because it let
`AWS_SECRET_ACCESS_KEY=` through. `authorization` was removed from the word set because it was the one
entry that redacted plausible config flag names such as `--authorization-mode=`; real
`Authorization:` headers stay covered by the auth-scheme rule, which does not use the word set.

### Amendment 2 — the privacy contract is written into `AGENTS.md`

`gga` rejected the file three times with a **different** set of findings each round, even as each round
left the file strictly safer. Two of the third round's findings were not repo requirements: `AGENTS.md`
— the declared `RULES_FILE` — contained exactly one relevant rule (`NEVER commit secrets or
credentials`, L120) and **zero** mentions of hostname, privacy, sanitization or redaction, yet the
reviewer demanded hostnames be dropped, contradicting the scope the human had already chosen.

The human authorized fixing the gate's bar rather than chasing it: a bounded **Defect-Report Privacy
Contract** now lives in `AGENTS.md`, stating what `scrub` must redact and what a review must not
require it to redact. This follows the pattern the repository already used for markdown and
`opencode.json`, and the prescription in `.gga` itself: *"the rules it enforces must describe what this
repository actually requires."*

## In scope

**`cli/src/utils/defect.ts`**

- **T01** — `cortexVersion` → `rapsoVersion`. Nothing parses this key back (verified in Bucket 3), so
  already-filed reports keep the old key as a historical record.
- **T02** — credential-named assignments. `--flag=value`, `--flag value`, and `NAME=value`, when the
  name carries a credential word as any `-`/`_`-separated segment: `--token=`, `--secret=`,
  `--password=`, `--api-key=`, `--private-key=`, `--auth=`, `--credentials=`, `GITHUB_TOKEN=`,
  `AWS_SECRET_ACCESS_KEY=`. Placed **after** the cwd/home/path rules, so it can only fire on tokens
  that previously leaked verbatim.
- **T03** — the credential after an auth scheme. A pre-pass replaces the value following
  `Bearer` / `Token` / `Basic` (optionally after `Authorization:`), keeping the scheme keyword. The
  8-character gate that keeps prose readable is deliberate and is now stated in the contract.
- **T04** — `scrubUrl` keeps `scheme://` plus the authority with userinfo removed, and redacts
  everything after it. `file:///…` → `file://<redacted>`.
- **T05** — the report text states the scrub is best-effort and must not claim the payload is
  "already scrubbed".
- **T06** — quoted and multi-word values (`--token "secret value"`, `--api-key="a b c"`). A quoted
  credential counts as the whole value; a quoted non-credential value is scrubbed through the same
  rules, so a path embedded in prose (`--message="failed at /home/user/project/file"`) is redacted,
  while quoted non-sensitive prose is left byte-identical.
- **T07** — `errorName` now goes through `scrub`, like `command` and `message`.
- **T08** — paths inside a non-credential assignment (`--cwd=/private/path`), by reusing the same
  value rules for the assigned value.

**`AGENTS.md`** — the bounded Defect-Report Privacy Contract (Amendment 2).

## Out of scope

1. **Detecting unmarked secret shapes** — a bare credential with no name, no auth scheme and no URL.
   No shape-based heuristic is added; the contract records this explicitly, and the corrected report
   text is what covers it honestly.
2. **The scheme and host of a URL**, and **values shorter than 8 characters after an auth scheme**.
   Both are deliberate non-redactions, named in the contract so a review cannot demand them.
3. **`isExpected` / `ExpectedError` / `DefectContext`** — untouched. The graph confirms `defect.ts` is
   self-contained; its only external consumers are `cli/src/index.ts:12,101` and
   `cli/src/engine/worktree.ts:4` (which uses `ExpectedError` only).
4. **Bucket 4 surfaces** — `.cortex`, `.cortex-sessions`, `cortex-session/*`, `__managed_by: 'cortex'`,
   `# cortex:start`, `LEGACY_DEFECT_HEADING`. Deliberate compatibility, never renamed here. Verified:
   these are the only remaining `cortex` hits in `cli/src`.
5. **Consumer projects** — the sync step owns them, not this change.
6. **Historical records** — `odd/tasks/*.md`, `wiki/**`, `.rapsodia-code/sessions/**`.
7. **`cli/dist/`** — gitignored; rebuilt in `main` after the merge, before dogfooding.

## Constraints

- **Atomicity Gate**: at most 5 staged files per commit (`.githooks/pre-commit`). Three files —
  one commit.
- Never stage the untracked provisioning artifacts `.opencode/package.json`,
  `.opencode/package-lock.json`, `.opencode/tools/package-lock.json`.
- Never `--no-verify`; never bypass a hook.
- `cli/src` changes → **after the merge, `npm run build` must run in `cli/` in `main`** before
  dogfooding the CLI, because `cli/dist/` is gitignored and the merge does not update it.
- No CLI behavior change beyond the defect payload key and the scrub's redaction scope.

## Risks and observed findings

1. **The gate's enforcement is not deterministic.** `gga` parses the verdict from the opening lines of
   provider output, but the `opencode` provider runs as a full agent here, so the `STATUS:` line lands
   far past that window. On round 3 (`STATUS: FAILED`) and round 4 (`STATUS: PASSED`) it printed the
   same `Could not determine review status / Allowing commit (STRICT_MODE=false)` and exited 0. The
   round-4 gate result recorded below is therefore the reviewer's **verdict**, not a reliable block.
   This is the same class `.gga` already documents for `STRICT_MODE`.
2. **Accepted false positive, safe direction.** A credential word in any segment wins, so
   `--password-policy=loose` and `--secret-santa=` are redacted. Costs one value of diagnostics; the
   alternative (last-segment matching) was measured and rejected because it misses
   `AWS_SECRET_ACCESS_KEY=`.
3. **Auth-scheme false positive, safe direction.** The rule can redact the word after a lowercase
   "token"/"basic" when it is 8+ credential-charset characters (e.g. "token required").
4. **Known remaining gap (recorded, not fixed):** a bare unmarked secret is still visible. The contract
   and the best-effort report text are what keep the CLI honest about it.
5. **`gga` reviews the whole file.** Any future edit here must keep satisfying the contract, or the
   rename that Bucket 3 could not land gets re-blocked.
6. **Base drift inflates a naive diff — the PR #42 trap, measured.** While this branch sat on
   `49a476d`, `main` moved to `dbf1d1b` when PR #47 merged. A two-dot diff against the new
   `origin/main` then reported **9 files and 663 changed lines**, rendering Bucket 3's three renames
   **reversed** (`rapso-init.sh => cortex-init.sh`, and `odd/tasks/rename-rapsodia-commands.md` as a
   266-line deletion) — foreign content that scores a false `risk: high`. Measured side by side:
   two-dot `+353 / −310` versus three-dot `+320 / −11`. The branch was rebased onto `dbf1d1b` so both
   views agree. **Rule for any ODD branch: measure against the merge base, never head-to-head against
   a `main` that has advanced.**

## Tasks

- [x] **T01** — `cortexVersion` → `rapsoVersion`.
- [x] **T02** — credential-named assignment redaction (flags and `NAME=value`).
- [x] **T03** — auth-scheme credential redaction.
- [x] **T04** — `scrubUrl` keeps scheme+host and redacts the path.
- [x] **T05** — honest report text.
- [x] **T06** — quoted and multi-word value redaction.
- [x] **T07** — `errorName` scrubbed.
- [x] **T08** — paths inside non-credential assignments.
- [x] **T09** — bounded privacy contract in `AGENTS.md`.
- [x] **T10** — Checks and Progress (this doc).
- [x] **T11** — Committed, RDD-reviewed and approved. Rebased onto `dbf1d1b` after `main` advanced;
      the rebase made this branch head a new candidate, so it carries its own review. See Risks 6.

## Checks

Every check runs from the worktree root and its real output is recorded.

1. **Typecheck**: `cd cli && npm run typecheck` → exit 0.
2. **Build**: `cd cli && npm run build` → exit 0.
3. **Functional scenario, real execution.** The harness is bundled against the real module with the
   repository's own bundler (`cli/node_modules/.bin/esbuild`) into `cli/dist/scrub-check.js`
   (gitignored), so `formatDefectReport`'s `join(__dirname, '..', 'package.json')` resolves exactly as
   in production, and run with `node`. **27/27 assertions pass.** The harness is deleted after the run
   and never committed.
4. **Gate rehearsal**: `gga run` → reviewer verdict `STATUS: PASSED`, explicitly noting it "preserves
   diagnostic hosts". See Risk 1 for why the exit code is not a reliable block signal.
5. **Leak scan of the shipped promise**: `rg -n "already scrubbed|cortexVersion" cli/src` → no matches.
6. **Rename scan**: `rg -n -i "cortex" cli/src` → the only hits are Bucket 4 surfaces (`adopt.ts`
   markers, `state.ts` legacy dir names). No Bucket 3 hit remains.
7. **Diff size**: 3 files, **+314 / −11**, of which 239 lines are this doc. No path outside ## In scope.

## Acceptance criteria

- The four verified leaks are redacted, observed by executing the module (Check 3), not by reading.
- No regression in what already worked: cwd, home, bare absolute paths, URL userinfo.
- The defect payload declares `rapsoVersion`; `cortexVersion` no longer appears in `cli/src`.
- The report no longer promises that the payload is already scrubbed.
- The gate's bar is bounded and stated in `AGENTS.md`, so the rename Bucket 3 could not land is
  commit-able and stays so.
- `cli/src` typechecks and builds.

## Progress

- **2026-09-18 — worktree created with explicit human consent** (`rapso worktree create
  rename-rapsodia-defect-scrub --yes`), from `origin/main` == `49a476d`.
- **Doc created before the first source write**, as required.
- **T01–T08 implemented inline** — one file, already mapped before the first edit. The insertion point
  of the assignment rule is deliberate: after the cwd/home/path rules, it only changes behavior for
  tokens that previously leaked verbatim.
- **Check 1** — typecheck exit 0. **Check 2** — build exit 0.
- **Check 3** — harness, 27/27:
  `--token=`, `Bearer`, `Token`, `file://` path, credential flag shapes, space-separated flags,
  `--cwd=` path, `--cwd=` cwd path, non-credential flags untouched, config-style names untouched,
  compound credential names, `--password-policy=` (accepted FP), cwd prefix, bare absolute path, URL
  userinfo+path+query, URL-before-assignment ordering, env-style assignments, `rapsoVersion`,
  honest report text, scrubbed `errorName`, three quoted-credential forms, quoted path, quoted prose
  untouched, path embedded in a quoted value, path embedded in an unassigned quoted value.
- **Gate history — four rounds**, each with a strictly safer file:

  | Round | Findings | Outcome |
  |---|---|---|
  | 1 | space-separated flags, `--cwd=` path, `errorName` | FAILED (parsed) |
  | 2 | quoted multi-word values, 8-char gate, hostnames | FAILED (parsed) |
  | 3 | path embedded in a quoted value — grounded in the new contract | FAILED verdict, **not parsed → allowed** |
  | 4 | none | `STATUS: PASSED` |

  Round 3 is why `AGENTS.md` gained the bounded contract: rounds 1–2 were real gaps, round 2's hostname
  demand contradicted an explicit human decision, and the bar was moving. After the contract, the
  reviewer's finding was grounded in it and the remaining gap was the contract over-promising relative
  to the code — fixed in T06/T08.
- **Check 5** — `rg -n "already scrubbed|cortexVersion" cli/src` → no matches.
- **Check 6** — `rg -n -i "cortex" cli/src` → Bucket 4 only.
- **2026-09-18 — rebased onto `dbf1d1b`** after `main` advanced (PR #47 merged). The rebase was clean:
  zero conflicts and zero overlapping files — this change touches `AGENTS.md`,
  `cli/src/utils/defect.ts` and this doc, while Bucket 3 touched `.gitignore`, the three renamed files,
  `skills/rapso-session/SKILL.md` and `odd/tasks/rename-rapsodia-commands.md`. Post-rebase, the
  two-dot and three-dot diffs agree at 3 files, +320 / −11, and the false `risk: high` can no longer
  be produced. The rebase is a new candidate, so the burned receipt is superseded and this head carries
  the fresh review.
- **Next step** — the fresh review on this head, then push and PR (both need an explicit request).

### Commit log

- **`1f08327`** — `fix(defect): harden the defect-report scrub and finish the key rename` — 3 files
  (`AGENTS.md`, `cli/src/utils/defect.ts`, this doc), +320 / −11. `gga`: reviewer verdict `PASSED`.
  RDD: approved, authority burned, lineage `review-42859813641cb7b0`, 1 lens, 0 corrections.
- **Rebased onto `dbf1d1b`** (the squash merge of PR #47) after `main` moved. The rebase rewrote the
  commit, so this branch head is a new, unreviewed candidate: the burned receipt binds `1f08327` and
  base `49a476d`, and no longer covers it. See Risks 6. The head SHA is deliberately not written here
  — it is the SHA of the commit that contains this line.

## Next step after this change

Consumer sync against `projects.txt` with the renamed `scripts/rapso-sync.sh` — the last remaining step
of the rename. It must own the two gaps Bucket 3 recorded: stale `cortex-*` skills are never deleted,
and a stale installed `cortex-init.md` command is never removed.
