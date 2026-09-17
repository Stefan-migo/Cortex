# ODD Task — graphify-path-and-hardening

**Branch:** `odd/graphify-path-and-hardening` · **Worktree:** `../Cortex-odd-graphify-path-and-hardening`
**Base:** `origin/main` @ `8da910a` (includes PR #21)
**TDD:** OFF — this repository has no test harness (`npm test` exits 1: "No test files found").
Functional checks only; no RED/GREEN cycle is claimed.

## Objective

Fix the root cause behind the second standards review of the session/manifest engine: every
Cortex surface must read the graph artifact that graphify actually writes, report staleness
truthfully, and stop leaking MCP child processes and shell interpolation.

## Problem — the graph path convention is dead

graphify 0.9.40 writes `graphify-out/` and defaults to it in every command:

```
$ graphify --help
  --graph <path>   path to graph.json (default graphify-out/graph.json)
  --purge          also delete graphify-out/ directory
```

Nothing in this repository writes `wiki/graph/`; that path only ever came from older graphify
versions. It survives in readers and in the shipped template:

| Surface | Evidence at `8da910a` |
| --- | --- |
| status | `cli/src/commands/status.ts:113` — `join(projectDir, 'wiki', 'graph', 'graph.json')` |
| context | `cli/src/engine/context.ts:130` (json), `:190` (report) |
| session | `cli/src/engine/session.ts:172` — presence check |
| close | `cli/src/commands/close.ts:119` — retrospective warning |
| MCP, this repo | `opencode.json:50` — `graphify.serve wiki/graph/graph.json` |
| MCP, template | `cli/src/template/opencode.json:48` — same, shipped into every project |
| template docs | `cli/src/template/.opencode/skills/graphify/SKILL.md:22-24,60`, `SYSTEM-MAP.md:78,83`, `USER-GUIDE.md:75`, `.opencode/agents/cortex-developer.md:21` |

Measured divergence:

- `graphify-out/graph.json` — 812 nodes, carries `built_at_commit: 8da910ab`.
- `wiki/graph/graph.json` — 21 nodes, no `built_at_commit`, **tracked in git**.

Internal contradiction already shipped: `provisionWorktree` copies `graphify-out/` into new
worktrees (`cli/src/engine/worktree.ts:214`), while every reader looks at `wiki/graph/`.

Consequences:

1. The graphify MCP server wired in `opencode.json` serves the 21-node fossil, so `query_graph`
   returns stale structure — the parietal lobe is blind in this repository.
2. `status` computes staleness from a meaningless mtime comparison.
3. `context` injects the old report into the session prelude.
4. `close --retrospective` warns "Graphify report not found" even when the canonical graph exists.
5. Every project generated from the template inherits a dead graphify MCP server.

## Verified findings (evidence from `8da910a`)

- **F1 (PARTIAL, wider than reported).** The two consumers agree with each other on `wiki/graph`,
  so they never disagreed with each other; both are wrong against the canonical artifact. Five
  call sites, not three — `close.ts:119` was missed by the review. No fallback to the old path
  is needed: no project on this machine has a populated `wiki/graph/` outside this repository.
- **F2 REAL.** Staleness compares the graph mtime to the manifest mtime (`status.ts:116-120`,
  `project.ts:58-70`). It cannot observe source changes, and a missing manifest leaves `stale`
  undefined by accident. The canonical graph carries `built_at_commit`, so an exact comparison
  is available.
- **F3 REAL.** `MCPClient.close()` is not in a `finally` at four lifecycles: `context.ts:64-67`,
  `context.ts:137-176`, `session.ts:33-36`, `session.ts:74-96`. The client spawns a child
  (`cli/src/utils/mcp.ts:24`); a throw before `close()` leaves that child alive. `close()` itself
  is null-safe and cannot throw (`mcp.ts:113-121`), so `finally` is safe even when
  `initialize()` rejects.
- **F4 REAL.** Project-derived values are interpolated into shell strings: `status.ts:56`
  (`args.join(' ')`), `status.ts:133`, `context.ts:106`, `session.ts:105`.
- **F5 REAL.** `status.ts:4` imports `info, success, warn, error, heading`; only `heading` is used.

## Design decisions

**D1 — the canonical graph location is `graphify-out/`.** Resolve it once through the shared
helpers module, `cli/src/engine/project.ts`, which already hosts `resolveProjectManifestPath`
and `projectHome`, instead of repeating a join at five call sites. Keep the helper free of
speculation: it returns the two paths the callers need.

**D2 — staleness is `built_at_commit` versus `HEAD`.** Read `built_at_commit` from
`graphify-out/graph.json` and compare it with the project's `git rev-parse HEAD`. `stale` is
`true` when they differ and **`undefined`** when the field is absent, the JSON cannot be
parsed, or the project is not a git repository. Never report freshness without evidence.
Note: after a commit in a worktree the graph is genuinely stale until refreshed. That is the
documented post-delivery refresh step, not a defect.

**D3 — every MCP client lifecycle runs inside `try/finally`,** with `await client.close()` in the
`finally` of all four sites. No new abstraction: the existing client is already null-safe.

**D4 — no project-derived data in shell strings.** Use `execFileSync(command, args, options)`,
as `cli/src/engine/adopt.ts:1` already does. `runTool` (`status.ts:54-60`) becomes argv-based.

**D5 — the template is part of the fix, not just the CLI.** `cli/src/template/**` is the source of
truth. The tracked fossil `wiki/graph/graph.json` and `wiki/graph/GRAPH_REPORT.md` are deleted,
the obsolete `wiki/graph/cache/` entry is dropped from `cli/src/template/.gitignore`, and the two
`wiki/graph/.gitkeep` placeholders go with the dead directory.

> **Correction (verified during WU5).** This decision originally claimed that
> `TEMPLATE_DIR = join(__dirname, '..', 'template')` resolves to `cli/dist/template`. It does not.
> The bundle is a single `cli/dist/index.js`, so `__dirname` is `cli/dist` and `TEMPLATE_DIR`
> resolves to **`cli/template`** — and `cli/esbuild.config.js:16-18` is what produces it, copying
> `cli/src/template` to `cli/template`. That directory is gitignored (`cli/.gitignore:3`), is not
> tracked, and is regenerated by every build. The out-of-scope note below that called
> `cli/template/**` "not read at runtime" was therefore wrong: it **is** the runtime template, read
> by `adopt.ts`, `update.ts` and `engine/template.ts`. The task doc's stop-condition fired, and the
> finding removes the concern rather than adding one: there is no second copy to keep in sync,
> because the build owns it. No manual edit to `cli/template/**` is possible or needed.

## Tasks

- [x] **WU1** — canonical graph path at all five call sites (D1). `d1cd67d`
- [x] **WU2** — staleness from `built_at_commit` versus `HEAD` (D2). `1b2f528`
- [x] **WU3** — `try/finally` around all four MCP client lifecycles (D3). `07def53`
- [x] **WU4** — argv-based command execution, no shell interpolation (D4). `96aa363`
- [x] **WU5** — template and this repository's own config, delete the tracked fossil, drop the
      dead imports (D5). Four commits: `f93793e` (this repo's surfaces), `0a30d1d` (template
      config and agent surfaces), `1c68037` (template docs and `.gitignore`), `8860463`
      (deletions).
- [x] **WU6** — verification scenarios complete, see the evidence log below. Delivery is not
      done: the branch is rebased onto `origin/main` and ready, but no PR is open.

Outside the original six, three changes were authorised during the work:

- `b6c704d` — `.gga` excludes `opencode.json` from review (see the correction under
  **Evidence log → gate**).
- `64c0b90` — `cli/src/engine/adopt.ts` drops `wiki/graph/cache/` from `CORTEX_IGNORE_ENTRIES`.
  The note that reserved this file for `odd/adopt-self-safety` expired: #22 and #23 both merged.
- `bfee87f` — `resolveGraphifyPaths` reads the checkout's own graph, not its source project's.
  A defect WU1 introduced and WU6 caught; see **Evidence log → F6**.

Each of WU1..WU5 ends with `npm run typecheck` and `npm run build` in `cli/`, then one work-unit
commit. WU6 runs the scenarios below.

## Acceptance criteria

1. `cortex status` in this repository reports graphify as present, and `stale` is derived from
   `built_at_commit` versus `HEAD`, not from a manifest mtime.
2. After a commit without a graph refresh, `status` reports `stale: true`; after
   `graphify update .` it reports `stale: false`.
3. A graph without `built_at_commit`, an unparsable graph, or a non-git project yields
   `stale: undefined` — never `false`.
4. `cortex context` and the session prelude no longer inject the 21-node report; the canonical
   report in `graphify-out/` is used. **Corrected:** there is no `cortex context` command; the
   prelude is built by `cli/src/engine/context.ts` when `start` runs. Verified structurally (see
   evidence log, S5), not by invoking a command.
5. No `MCPClient` child survives an error thrown between `initialize()` and `close()`, verified
   with a forced failure in both `context.ts` and `session.ts` lifecycles.
6. No `execSync` with an interpolated project-derived value remains in `status.ts`, `context.ts`
   or `session.ts`.
7. `opencode.json` (this repository) and `cli/src/template/opencode.json` point the graphify MCP
   server at `graphify-out/graph.json`, and no template doc names `wiki/graph/`.
8. `npm run typecheck` and `npm run build` pass in `cli/`, and the generated `cli/template`
   carries the new path. **Corrected:** the build writes `cli/template`, not `cli/dist/template`
   (see the correction under D5).

## Verification scenarios (WU6)

Run from the worktree with the freshly built bundle, `node cli/dist/index.js`.

1. **Canonical read** — `node cli/dist/index.js status` in this worktree reports Graphify present
   and derives staleness from `built_at_commit` versus `HEAD`.
2. **Staleness true** — `git commit --allow-empty -m "chore: staleness probe"`, then `status`
   reports `stale: true`; `git reset --hard HEAD~1` afterwards.
3. **Staleness false** — `graphify update .` then `status` reports `stale: false`.
4. **Evidence-free case** — a copy of the graph with `built_at_commit` removed, and a non-git
   directory, both yield `stale: undefined` (never `false`), with no crash.
5. **No injected fossil** — the prelude/context output no longer contains the 21-node report.
6. **MCP leak** — force a failure between `initialize()` and `close()` in each of the four
   lifecycles and confirm no child process survives.
7. **No interpolation** — grep the three files for interpolated `execSync`; the remaining
   commands are constant strings or argv-based.

## Out of scope / follow-ups

- ~~`cli/template/**` is byte-identical to `cli/src/template/**`, is not published and is not read
  at runtime. Left untouched here; flagged for a ponytail pass. **If WU5 finds a real reader of
  `cli/template/**`, stop and report it.**~~ **Resolved, premise false.** `cli/template/**` is the
  generated runtime template (`cli/dist/index.js` → `__dirname` = `cli/dist` → `cli/template`),
  produced by `cli/esbuild.config.js:16-18` and gitignored. It is read at runtime by `adopt.ts`,
  `update.ts` and `engine/template.ts`. Nothing needs a ponytail pass here and nothing can be
  hand-edited into it; the build regenerates it. See the correction under D5.
- ~~`cli/src/engine/adopt.ts:16` `CORTEX_IGNORE_ENTRIES` still lists `wiki/graph/cache/`. That file
  is under active work in `odd/adopt-self-safety`; do not touch it.~~ **Resolved.** That reservation
  covered an active worktree, and both adopt changes (#22, #23) have since merged, so the file was
  unowned. Removed in `64c0b90` with the user's approval: leaving it made `cortex adopt` keep
  injecting the dead path into every adopted project's managed `.gitignore` block, disagreeing with
  the template `.gitignore` fixed by WU5.
- `graphify-out/` is gitignored, so Obsidian shows no graph under `wiki/` anymore. Accepted: the
  canonical artifact lives in `graphify-out/` and `graph.html` is generated there.
- The graphify MCP entry in `opencode.json` only takes effect after opencode restarts.
- Historical exports under `wiki/engram/**` still mention `wiki/graph/`. They are frozen records of
  past sessions, not live surfaces; left untouched.
- **Unresolved, needs a decision — npm packaging.** `cli/package.json` publishes
  `files: ["dist", "src/template"]`, but at runtime `TEMPLATE_DIR` resolves to `cli/template`,
  which is not in that list. An install from a published tarball would have no `template/`
  directory, so `cortex update` would fail `Template directory not found` and `cortex adopt` would
  have nothing to scaffold from. The mechanism is verified by reading the three constants above; it
  was not triggered because this repository runs from a checkout. Not filed anywhere. Outside this
  task's scope, raised for the maintainer's decision.

## Baseline

```
main 8da910a
graphify-out/graph.json   812 nodes, built_at_commit 8da910ab
wiki/graph/graph.json      21 nodes, tracked, stale
graphify 0.9.40
```

## Evidence log

Baseline rebased onto `origin/main` @ `2de2d78` (includes #21, #22 and #23), so the
`adopt.ts` reservation in the out-of-scope section no longer applied. graphify 0.9.40.
**TDD OFF:** the repository has no test harness; `npm test` exits 1. No RED/GREEN cycle is
claimed anywhere below.

Every commit in this list ran `npm run typecheck` and `npm run build` in `cli/` immediately
before it. Both commands passed every time; that is the functional gate, together with the
scenarios in this section.

### Gate correction

The first WU5 attempt was rejected by the GGA pre-commit hook:

```
CODE REVIEW FAILED
- opencode.json: missing agent.gentle-orchestrator.model
- opencode.json: missing default_agent
- opencode.json: neither configured agent explicitly grants question permission
```

These are false positives at project level. `~/.config/opencode/opencode.json` already sets
`default_agent: "gentle-orchestrator"`, `agent.gentle-orchestrator.model: "openai/gpt-5.6-luna"`
and `question: "allow"`; a project config inherits them and is correct not to repeat them. The
hook reviews a config file as a whole and applies an opencode-config checklist, so the same
findings fire on any edit to any opencode config here, including `cli/src/template/opencode.json`.
Adding those keys to the project or template config would duplicate global config into every
generated project and pin a Gentle AI agent the template never defines, so it was not done.

Resolved by excluding `opencode.json` from review in `.gga` (`b6c704d`), on the same reasoning as
the markdown exclusion already documented there. `gga` matches a non-`*` exclude pattern against
the file's basename, so one entry covers the root config and the template's. Also verified while
diagnosing: `gga` collects staged files with `--diff-filter=ACM`, so **staged deletions are never
reviewed** — the fossil deletion never needed an exemption.

### Commits

```
bfee87f  fix(graphify): read the graph of this checkout, not of its source project
64c0b90  fix(adopt): stop writing the dead wiki graph cache entry
8860463  chore: remove obsolete wiki graph artifacts
1c68037  fix(template): remove obsolete graphify cache path
0a30d1d  fix(template): point graphify MCP surfaces at canonical output
f93793e  fix(graphify): point this repo's graph surfaces at graphify-out
b6c704d  chore(gga): stop reviewing opencode configs for keys they inherit
07def53  fix: close MCP clients in finally blocks
96aa363  fix(cli): pass argv to child processes instead of shell strings
1932515  docs(odd): add graphify-path-and-hardening task record
1b2f528  fix(cli): compute graph staleness from built_at_commit
d1cd67d  fix(graphify): use canonical artifact paths
```

### Verification scenarios (WU6)

Run from the worktree with the freshly built `node cli/dist/index.js`.

**S1 — canonical read: PASS.** `status --json` reports `{"exists":true,"stale":true}`. Proven to
be the worktree pair, not main's: worktree graph `built_at_commit = 64c0b90`, worktree
`HEAD = bfee87f`; main graph `built_at_commit = 2de2d78`, main `HEAD = 2de2d78`. `true` follows
from the worktree graph being older than the worktree HEAD, and is not derivable from main's pair,
whose values are equal.

**S2 — staleness true: PASS.** `git commit --allow-empty -m "chore: staleness probe"` moved HEAD
to `4abe7ca` and `status` reported `stale: true` plus `Graph stale — run graphify update`.
`git reset --hard HEAD~1` restored `bfee87f`, after which `status` reported `stale: false`. The
first attempt at this scenario reported stale on both sides because the graph had not yet been
refreshed past `64c0b90` — an ordering artefact of running S2 before S3, not a defect.

**S3 — staleness false: PASS.** `graphify update .` rebuilt the graph and recorded
`built_at_commit = bfee87f`; `status` then reported `✅ Up to date` / `stale: false`. This scenario
failed before `bfee87f` and is the proof that the F6 fix works.

**S4 — evidence-free cases: PASS.** A graph with no `built_at_commit` and a directory that is not
a git repository both produced `⚠️ Freshness unknown — graph has no verifiable commit evidence`,
with `stale` **omitted** from the JSON (undefined, never `false`), and no crash. Note for anyone
repeating this: a bare temp directory is not recognised by `findProjectRoot`; a
`.cortex/manifest.json` has to exist for the fixture to be seen as a project.

**S5 — no injected fossil: PARTIALLY EXECUTED.** There is no `cortex context` command
(`error: unknown command 'context'`); the prelude is built by `cli/src/engine/context.ts` when
`start` runs, and running `start` would write worktree state, so it was not invoked. Verified
instead, structurally and on the filesystem: `wiki/graph/` no longer exists, `graphify-out/`
carries both `graph.json` and `GRAPH_REPORT.md`, and both `opencode.json` and the template's point
the MCP server at `graphify-out/graph.json`. `context.ts` reads `resolveGraphifyPaths(...).graphReport`
for its static fallback and passes `graphJson` to the MCP client, so the fossil cannot be reached.
This is a code-and-filesystem verification, not an executed scenario.

**S6 — MCP child cannot leak: PASS, empirically and structurally.** A shim placed earlier on
`PATH` completed the MCP `initialize` handshake and then stopped answering `tools/call`, forcing
timeouts in both the `context`/`start` and `close` lifecycles. `pgrep -af "engram|graphify.serve"`
before and after showed no surviving shim child in either run, and both runs exited 0. Structurally,
all four lifecycles (`context.ts` `fetchEngramContext` and `fetchGraphifyContext`, `session.ts`
`openSession` and `closeSession`) carry `} finally { await client.close(); }`, and `close()` cannot
throw (`this.rl?.close()`, a guarded `kill`, then nulling both fields), so the `finally` cannot
mask the original error.

**S7 — no interpolation: PASS.** `grep -nE 'execSync\([^)]*\$\{|execSync\(`'` over `status.ts`,
`context.ts` and `session.ts` returned nothing. The five surviving invocations are all
`execFileSync` with an argument array: `git rev-parse HEAD` and `runTool` in `status.ts`,
`engram context` in `context.ts`, and the wiki export script and `engram obsidian-export` in
`session.ts`.

### Findings raised by this work

- **F6 (new, found by WU6, fixed in `bfee87f`).** `resolveGraphifyPaths` resolved the graph through
  `projectHome(root)`, so inside a worktree it read the **main** project's graph while
  `graphStaleness` compared it against the **worktree's** `HEAD`. Those values can never match, so
  `status` in any worktree reported a permanently stale graph that no local refresh could clear —
  and the scenario this task specifies for the `false` case could not pass. A worktree owns its
  graph: `provisionWorktree` copies `graphify-out/` into it (`worktree.ts:214-219`) and
  `graphify update .` refreshes it there, while `mergeWorktree` separately refreshes main's
  (`worktree.ts:299`). The helper now uses `join(root, 'graphify-out')`. Plain projects are
  unaffected because `projectHome(root)` is `root` when there is no `.cortex/worktree.json`
  marker. This was introduced by WU1 and would have shipped unnoticed without the worktree
  scenario.
- `cortex context` does not exist as a command; acceptance criterion 4 was reworded accordingly.
- The build writes `cli/template`, not `cli/dist/template`; D5 and acceptance criterion 8 were
  corrected.
