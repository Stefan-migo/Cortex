# ODD Tasks — cortex-defect-reporting

Worktree: `/home/stefan/Cortex-odd-cortex-defect-reporting`
Branch: `odd/cortex-defect-reporting`
Base: `545fe58` (main, after PR #18)

## Objective

When something fails and the failure belongs to Cortex itself, surface it and **suggest**
opening an issue on the Cortex repository, with diagnostics the reporter can paste. Never
open the issue, never act on the Cortex repository from a project workflow.

## Why

This session produced five defects in Cortex's own install surface — forged template
lockfiles, a plugin-ownership conflict, a duplicated plugin entry, an additive template
mirror, and `update` clobbering a file it does not own. Every one was found by reading code
and reasoning, and **none of them told the user anything**. The user hit the first one as
`npm error code EINTEGRITY` and `Command failed: npm ci`, which names neither Cortex nor a
next step.

Cortex has no defect-reporting surface at all today: no typed error for its own failures, no
mention of issues anywhere in the CLI, and nothing in `AGENTS.md` or the persona about
reporting defects.

## The classification problem

"Belongs to Cortex" is the crux. Cortex's thrown errors are mostly about the **user's**
state and environment, and reporting those as defects would be noise that destroys the
signal.

### D01 — Classify by anticipation, not by origin

**An error Cortex did not anticipate is a probable defect. An error Cortex raised to tell the
user what to do is not.**

That is the whole rule, and it is deliberately inverted from the obvious one:

- **Expected** — Cortex saw this condition coming and its message tells the user what to do:
  `CleanupRefusalError` (untracked artifacts would be lost), "Worktree path already exists",
  "Worktree does not belong to the requested main repository", "Merge marker does not
  identify the requested branch and SHA", "Expected merged SHA is not present on main",
  "No Cortex manifest found", and the provisioning install failure.
  These must **not** suggest an issue. They are Cortex working correctly.
- **Unanticipated** — anything else: an invariant violated, an unhandled shape, a
  `TypeError` inside Cortex's own code, a crash with no user-actionable exit.
  These are probable defects and **do** suggest an issue.

Why inverted: the obvious rule ("errors Cortex raises about itself are defects") cannot be
implemented, because nothing in the code distinguishes "this is my bug" from "you did
something I refuse". Marking the small set of *anticipated* errors is tractable and auditable;
guessing which internal errors are ours is not. It also fails safe: an unrecognised error is
surfaced rather than swallowed.

**Observable consequence:** a project whose `.cortex/manifest.json` has the wrong shape makes
`cortex update` throw an unhandled `TypeError`, so it reports a probable defect. That is
correct — Cortex should validate its own artifact, and today it does not.

### D02 — Two surfaces, and they cover different failures

The user chose both.

- **CLI (deterministic).** When a command throws an unanticipated error, print a defect block:
  what happened, where to report, where to search first, and a scrubbed diagnostics payload
  ready to paste. Covers every user, with or without an agent.
- **Agent (judgement).** A rule in `AGENTS.md` (root and template) and in the persona: when
  the agent identifies a defect belonging to Cortex, surface it and suggest the issue with
  the evidence. Covers what is found by reasoning, like all five defects above — none of
  which threw anything.

Neither surface is enough alone. The CLI cannot see a design defect that never throws; the
agent does not run for a user who is not using one.

### D03 — Suggest, never act

Both surfaces suggest only. No automatic issue creation, no `gh` invocation, no network call,
no write to the Cortex repository from a project workflow. The human decides, always.

The CLI is **offline**: it prints links, it does not search issues. Duplicate detection would
mean an authenticated GitHub call from a command that is otherwise offline, so the block
points at the issue list and says to search first.

### D04 — Scrub before printing

The diagnostics payload is printed to a terminal the user may paste anywhere, so it is
scrubbed at construction, not at the user's discretion:

- **Redacted:** absolute paths (the error message often contains one), the working directory,
  repository and project names, user names, host names, environment values, and credentials.
- **Included:** the Cortex version, the command name (never raw argv, which carries paths),
  Node version, platform and architecture, the error type, and the scrubbed message.
- The block states that the payload is already scrubbed and tells the user to review it
  before pasting.

## Scope

**In scope**

- `cli/src/utils/defect.ts` (new) — the anticipated-error marker, the scrubber, and the report
  formatter.
- `cli/src/index.ts` — a top-level handler that prints the defect block for unanticipated
  errors and stays silent for anticipated ones.
- `cli/src/engine/worktree.ts` — mark its anticipated throws as anticipated.
- `cli/src/commands/worktree.ts` — **added during reinforcement**, see T13 below.
- `AGENTS.md`, `cli/src/template/AGENTS.md` — the agent-side rule, so projects receive it.
- `skills/cortex-persona/SKILL.md` — the same rule for the orchestrator identity.
- `cli/src/engine/adopt.ts` — **added during verification**, see T10 below.
- `odd/tasks/cortex-defect-reporting.md`

**Out of scope**

- Automatic issue creation, and any network or `gh` call from the CLI.
- Duplicate detection. The block links the issue list instead.
- The gentle-ai provider-defect handoff, which is a separate contract with its own consent
  envelope.
- Validating `manifest.json`'s shape. D01 *exposes* that gap deliberately; closing it is its
  own change.

## Task checklist

- [x] **T01** — `cli/src/utils/defect.ts`: the anticipated marker plus `isExpected()`.
- [x] **T02** — `cli/src/utils/defect.ts`: `scrub()`, replacing absolute paths and the cwd.
- [x] **T03** — `cli/src/utils/defect.ts`: `formatDefectReport()` producing the block.
- [x] **T04** — `cli/src/index.ts`: the top-level handler.
- [x] **T05** — `cli/src/engine/worktree.ts`: mark the anticipated throws.
- [x] **T06** — Agent rule in `AGENTS.md` and the template's `AGENTS.md`.
- [x] **T07** — The same rule in `skills/cortex-persona/SKILL.md`.
- [x] **T08** — Verify the positive path and the negative path (see Checks).
- [x] **T09** — Update this document with observed evidence.
- [x] **T12** — `scrub()`: redact credentials in URLs and paths wrapped in quotes or brackets.
- [x] **T13** — Mark the anticipated throws that were still plain `Error`, and scrub the
      `command` field the payload claims is already scrubbed. See T13 below.

The agent rule must be **adjudicable**: a reviewer has to be able to tell whether it was
followed. It says when to suggest, when not to, and that the agent never opens the issue.
It must not become a rule that manufactures findings on unrelated work.

## Acceptance criteria

1. `cortex update` in a project whose `manifest.json` has a malformed shape prints the defect
   block, names Cortex, links the issue list, and includes a scrubbed payload.
2. The same command outside a Cortex project prints only "No Cortex manifest found" — **no**
   defect block.
3. `cortex worktree cleanup` refusing because untracked artifacts would be lost prints only
   its refusal — **no** defect block.
4. The printed payload contains no absolute path, no home directory, and no project name.
5. `npm run typecheck` and `npm run build` both exit 0.
6. The agent rule is present in the root `AGENTS.md`, the template's `AGENTS.md`, and the
   persona.
7. The anticipated refusals that were still plain `Error` — an invalid slug, a non-interactive
   consent refusal, and operating on the main worktree — print their message and **no** defect
   block.

## Checks

TDD mode: **off**. Source: `AGENTS.md` — no test harness, zero test files, `npm test` exits 1.

```bash
# static
(cd cli && npm run typecheck && npm run build)

# negative: anticipated error must NOT print the block
mkdir -p /tmp/opencode/not-cortex && cd /tmp/opencode/not-cortex
node <cli> update 2>&1 | grep -c "defect in Cortex"     # expect 0

# negative: a refusal must NOT print the block
# (construct a worktree with an untracked artifact that cleanup would lose)

# positive: a malformed manifest IS unanticipated
mkdir -p /tmp/opencode/bad-manifest/.cortex && cd /tmp/opencode/bad-manifest
printf '{"templateVersion":"1.0.0","files":"not-an-array"}\n' > .cortex/manifest.json
node <cli> update 2>&1 | tee /tmp/opencode/defect-out.txt
grep -c "defect in Cortex" /tmp/opencode/defect-out.txt   # expect 1
grep -Ec "/home/|/tmp/|/Users/" /tmp/opencode/defect-out.txt   # expect 0

# negative: the reclassified anticipated refusals must NOT print the block.
# Each input aborts before any git mutation: slug validation, consent, and the
# main-worktree assertion respectively. Run from a path where isMainWorktree() is true.
node <cli> worktree create Bad_Slug --yes              2>&1 | grep -c "defect in Cortex"  # expect 0
echo | node <cli> worktree create ok-slug              2>&1 | grep -c "defect in Cortex"  # expect 0
node <cli> worktree provision <main-worktree-path>     2>&1 | grep -c "defect in Cortex"  # expect 0

# the payload's `command` field must be scrubbed too, since the block claims it is
# (bundle to cli/dist/ so the module's ../package.json read resolves)
npx esbuild cli/src/utils/defect.ts --bundle --platform=node --format=cjs --outfile=cli/dist/scrub-probe.cjs
node -e 'const {formatDefectReport}=require("./cli/dist/scrub-probe.cjs");
         const out=formatDefectReport(new TypeError("boom"),{command:"/home/stefan/secret",cwd:"/home/stefan"});
         console.log(JSON.parse(out.slice(out.indexOf("{"))).command)'   # expect "<cwd>/secret"
```

## Verification evidence

Literal output from the required verification scenarios:

```text
> cortex-brain@1.0.0 typecheck
> tsc --noEmit


> cortex-brain@1.0.0 build
> node esbuild.config.js

Template copied: /home/stefan/Cortex-odd-cortex-defect-reporting/cli/src/template → /home/stefan/Cortex-odd-cortex-defect-reporting/cli/template

Cortex Brain Update
───────────────────
✖ No Cortex manifest found. Are you in a Cortex project directory?
0

Cortex Brain Update
───────────────────

→ Comparing template with project
Cannot read properties of undefined (reading 'replace')

This looks like a defect in Cortex, not a problem with your project.
Please search before opening an issue: https://github.com/Stefan-migo/Cortex/issues
Report it here: https://github.com/Stefan-migo/Cortex/issues/new
The CLI is offline and will not call GitHub. The payload below is already scrubbed; review it before pasting.

{
  "cortexVersion": "1.0.0",
  "command": "update",
  "nodeVersion": "v22.22.2",
  "platform": "linux",
  "architecture": "x64",
  "errorName": "TypeError",
  "message": "Cannot read properties of undefined (reading 'replace')"
}

EXIT=1
1
1
2
0
loss: odd/lost.txt
Refusing cleanup because untracked artifacts would be lost: odd/lost.txt
EXIT=1
0
```

Observed counts: negative 1 = `0`; positive defect = `1`; `issues/new` = `1`; preserved report-link count = `2`; absolute-path count = `0`; anticipated refusal defect count = `0`.

The required bundle scrub check produced this literal case table:

```text
ok home path in quotes: Failed to read "<home>/Cortex-odd-x/cli/src/index.ts"
ok URL credentials: Fatal: could not clone https://github.com/a/b
ok URL query secret: Callback failed: https://host/cb<redacted>
ok URL unchanged: See https://github.com/Stefan-migo/Cortex/issues for context
ok ordinary error unchanged: Cannot read properties of undefined (reading 'replace')
ok home path with location: at <home>/.local/share/cortex/file.js:12:5
ok cwd path: Project at <cwd> is broken
ok relative paths unchanged: Wrote ./dist/out.js and ../../peer/index.ts
ok bare project name unchanged: Refusing cleanup because untracked artifacts would be lost: odd/lost.txt
ok path in parentheses: (<home>/Cortex/file.ts)
10/10 cases passed
```

The required E2E commands produced these literal counts:

```text
0
1
0
```

### Reinforcement round (T13) — literal output

`npm run typecheck` and `npm run build` both exit 0 on the final source. The bundle scrub check
reported `ALL PASS` (10/10) and the payload `command` probe reported `command field ->
"<cwd>/secret-project"` / `PASS: command redacted`.

The reclassified anticipated refusals, run with `cli/dist/index.js`:

```text
=== 1. invalid slug (anticipated: input validation) ===
     msg: Slug must contain lowercase letters, numbers, and hyphens.
ok   invalid slug (defect blocks: 0)
=== 2. consent refusal, non-TTY (anticipated: safety refusal) ===
     msg: Consent is required; refusing non-interactive worktree creation.
ok   consent refusal (defect blocks: 0)
=== 3. assertNotMainWorktree (anticipated: wrong worktree) ===
     msg: Refusing to operate on the main worktree: /home/stefan/Cortex
ok   main worktree refusal (defect blocks: 0)
=== 4. regression: malformed manifest still IS a defect ===
ok   malformed manifest (defect blocks: 1)
     absolute paths in payload: 0
=== 5. regression: not a cortex project ===
ok   not a cortex project (defect blocks: 0)

RESULT: 5 passed, 0 failed
```

Note the third message prints an absolute path in the refusal. That is the refusal's own
unscrubbed output, which the CLI writes verbatim to stderr for anticipated errors by design;
the scrubber applies only to the defect payload. It is a real privacy consideration for that
line, and it is recorded here rather than silently fixed, because changing it would alter what
an anticipated error prints — a separate decision.

`git worktree list` afterwards showed only `main` and the change's own worktree, confirming the
reclassified paths never reached a mutation.

## Residual (accepted)

Three throws stay deliberately plain `Error`, i.e. they still report a probable Cortex defect:

- `cli/src/engine/worktree.ts` — `Invalid git worktree porcelain output.` is a violated
  invariant in Cortex's own parsing, not a user-actionable refusal.
- `cli/src/commands/worktree.ts` — the composite `... ; cleanup failed: ...` message. When
  provisioning fails **and** the rollback also fails, the state is dirty. Converting that to
  "expected" would hide the more severe case, and D01's inverted rule says an unrecognised
  error is surfaced rather than swallowed.
- Graph and `gentle-ai` subprocess failures, which are environment failures the CLI cannot
  classify from the message alone.

A project name is only redacted when it appears inside the cwd or home path. The scrubber has no
notion of the project's own name, so a name appearing bare in an error message still prints.

An anticipated refusal's own message is printed verbatim, including any absolute path in it
(observed with `Refusing to operate on the main worktree: /home/stefan/Cortex`). The scrubber
guards the defect payload only. Redacting refusal messages as well is a separate decision,
because it changes what Cortex prints in normal operation.

A **Cortex-caused** dependency-install failure does not produce the defect block, because
`installDependencies` failures are marked anticipated. The forged-lockfile defect from
PR #15 surfaced through exactly this path and would not have been reported by the CLI.

This is the accepted cost of the D01 rule. A registry outage and a Cortex-shipped invalid
lockfile are indistinguishable from the error message alone, and reporting every registry
failure as a Cortex defect would train users to ignore the block. The agent-side surface
covers this case instead: an agent that reads the lockfile and sees a fabricated integrity
hash identifies the defect by reasoning, which no CLI can do.

## Defects found after implementation

### T10 — The rule did not reach adopted projects

`markdownBlock()` in `cli/src/engine/adopt.ts` builds the surgical block that `cortex adopt`
injects into a project's `AGENTS.md`, and it extracted exactly two sections: `## ODD Worktrees`
and the 5-Step gate. The new rule was added as a **top-level `## Reporting Cortex Defects`**,
which that regex does not match.

So `cortex init` projects received the rule (they get a full template copy) and **`cortex adopt`
projects did not** — which is the exact opposite of D02's intent.

Fixed by adding a third match to `markdownBlock()`. `cli/src/engine/adopt.ts` was not in the
declared scope; it is now, because the objective ("so projects receive it") is unreachable
without it. Verified by adopting a fixture whose `AGENTS.md` holds project prose: the injected
block now carries all three sections and the prose survives.

### T11 — The persona section landed inside another heading

In `skills/cortex-persona/SKILL.md` the new section was inserted **between**
`## ODD and SDD Ponytail Boundary` and that heading's body, leaving the boundary heading empty
and its text dangling under the new one. Moved after the boundary's content, before
`## SDD Pipeline Integration`.

### T12 — The scrubber leaked what it claimed to redact

The scrubber returned scheme URLs unchanged, so credentials in
`https://user:token@host` and secrets in query strings such as
`https://host/cb?token=abc123` were printed. It also failed to recognize absolute paths wrapped
in quotes or brackets, such as `"/home/stefan/x.ts"` and `(/home/stefan/x.ts)`.

Fixed by stripping URL userinfo, replacing everything from the first `?` or `#` with
`<redacted>`, and unwrapping leading and trailing delimiters before applying the cwd, home, and
absolute-path replacements. The conservative query-string cutoff avoids false negatives from a
name-based sensitive-parameter denylist.

### T13 — The classification rule was only half applied

D01 makes "never report an anticipated refusal as a defect" the entire point of the change: the
value is the signal, and a false report trains the user to ignore the block. T05 marked the
throws in `cli/src/engine/worktree.ts`, but four anticipated paths were missed, and the payload
carried a field the block's own text claims is scrubbed:

- `assertNotMainWorktree()` still threw plain `Error`, so operating on the main worktree — a
  refusal Cortex raises deliberately, with a message that tells the user exactly what to do —
  printed a defect block and an issue link.
- The slug validator threw plain `Error`, so a typo in the user's own argument was reported as a
  probable Cortex defect.
- The non-interactive consent refusal in `cli/src/commands/worktree.ts` threw plain `Error`, so
  a deliberate safety refusal was reported as a defect.
- `formatDefectReport()` emitted `context.command` straight from `process.argv[2]` while the
  block states "The payload below is already scrubbed". D04 says the payload carries the command
  *name*, never raw argv, which carries paths.

Without this, the feature would tell users to open GitHub issues about Cortex for their own
invalid slug, their own non-interactive shell, and for running a command in the wrong worktree —
the exact noise D01 exists to prevent.

The gap was surfaced twice, independently: by the pre-commit review gate, which reported
`STATUS: FAILED` with these violations, and by the pending-plan entry recorded in Engram from the
implementing session ("convertir los `ExpectedError` faltantes (`assertNotMainWorktree` y otros)").

Fixed by marking those three throws `ExpectedError` and by scrubbing `command` inside
`formatDefectReport()`, so every caller gets it rather than each call site remembering to.
`cli/src/commands/worktree.ts` joins the declared scope; the objective is unreachable without it.

Deliberately **not** changed: the composite `...; cleanup failed: ...` throw, the porcelain
parse invariant, and graph/`gentle-ai` subprocess failures. See Residual for the reasoning.

## The pre-commit gate blocked this change's `adopt.ts` commit

`.githooks/pre-commit` ends with `gga run || exit 1`, and `.gga` sets
`FILE_PATTERNS="*.go,*.mod,*.ts,*.tsx,*.yaml,*.json"` with `RULES_FILE="AGENTS.md"`. `gga`
reviews every staged file matching those patterns **as a whole file**, not as a diff, so a 3-line
change to `cli/src/engine/adopt.ts` triggered a full review of that file.

It returned `STATUS: FAILED` with three findings, none of them introduced by this change:

1. `OWNED_PATHS` omits `.opencode/plugins/**`.
2. The manifest is rewritten from current target hashes even when a user-modified owned file was
   skipped, erasing the conflict baseline.
3. The plugin merge removes duplicate matching entries.

Findings 1 and 3 re-litigate deliberate decisions merged in PR #16 ("stop owning plugin files",
"dedupe the plugin entry"). Finding 2 was verified by reading the code and is **real**, and
pre-existing: `adoptProject()` records `hashFile(join(targetDir, file))` for every owned file, but
a file that drifted and was not overwritten with `--force`/`--yes` is only pushed to
`plan.skipped`. The manifest therefore adopts the user's modified content as the new baseline, and
the next run sees no drift — the conflict is silently forgotten.

**Authorized bypass, recorded rather than hidden.** The human explicitly authorized
`git commit --no-verify` for that one commit, scoped to those 3 lines, on the grounds that the
blocking findings pre-date this change and belong to a different one. The commit is
`ed39926 fix(adopt): deliver the defect rule to adopted projects`.

The evidence that the block was `adopt.ts`-specific and not a false alarm: staging only `*.md`
files passed the gate (exit 0, commit `c33800d`), while the same set plus `adopt.ts` failed.
Proving that also required care — `git add` does not unstage a file that is already staged, so the
first "markdown-only" attempt still contained `adopt.ts` and proved nothing until
`git restore --staged cli/src/engine/adopt.ts` was run.

The three findings, plus the defects listed under Follow-up, belong to the B7 family.

## Follow-up, not fixed here

Beyond the frame question below, two real defects found while investigating this change, both
pre-existing and both related to `cortex adopt`:

- **The conflict baseline is destroyed on skip.** See the manifest finding above.
- **`isDirty()` swallows every error and returns `false`.** A git failure — missing git, not a
  repository, permissions — reports "clean", in a function whose answer gates a destructive
  decision.

**The CLI payload carries no stack frame.** Locating a `TypeError` from its message alone is
hard: `Cannot read properties of undefined (reading 'replace')` names neither a file nor a
line. A frame would fix that, and it is deliberately out of scope for this change for two
reasons:

1. It is beyond D04, which lists what the payload includes.
2. It forces a scrubber decision, not just an addition. Today the scrubber replaces a whole
   absolute path with `<path>`, so a frame like `/home/x/cli/dist/index.js:1234:5` would
   become `<path>` — losing the line and column, which is the only useful part. Keeping them
   means preserving the basename and position while dropping directories, and that is a
   privacy trade-off worth deciding on purpose.

## Next step

Native review, then the Pull Request.
