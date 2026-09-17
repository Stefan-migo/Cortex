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
truth: `TEMPLATE_DIR = join(__dirname, '..', 'template')` resolves to `cli/dist/template`, which
the build produces from `cli/src/template`, and `cli/package.json` publishes `src/template`. The
tracked fossil `wiki/graph/graph.json` and `wiki/graph/GRAPH_REPORT.md` are deleted, and the
obsolete `wiki/graph/cache/` entry is dropped from `cli/src/template/.gitignore`.

## Tasks

- [ ] **WU1** — canonical graph path at all five call sites (D1).
- [ ] **WU2** — staleness from `built_at_commit` versus `HEAD` (D2).
- [ ] **WU3** — `try/finally` around all four MCP client lifecycles (D3).
- [ ] **WU4** — argv-based command execution, no shell interpolation (D4).
- [ ] **WU5** — template and this repository's own config, delete the tracked fossil, drop the
      dead imports (D5).
- [ ] **WU6** — full verification scenarios and delivery (review at the boundary, PR).

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
   812-node report is used.
5. No `MCPClient` child survives an error thrown between `initialize()` and `close()`, verified
   with a forced failure in both `context.ts` and `session.ts` lifecycles.
6. No `execSync` with an interpolated project-derived value remains in `status.ts`, `context.ts`
   or `session.ts`.
7. `opencode.json` (this repository) and `cli/src/template/opencode.json` point the graphify MCP
   server at `graphify-out/graph.json`, and no template doc names `wiki/graph/`.
8. `npm run typecheck` and `npm run build` pass in `cli/`, and the built `cli/dist/template`
   carries the new path.

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

- `cli/template/**` is byte-identical to `cli/src/template/**`, is not published
  (`files: ["dist", "src/template"]`) and is not read at runtime. Left untouched here; flagged
  for a ponytail pass. **If WU5 finds a real reader of `cli/template/**`, stop and report it.**
- `cli/src/engine/adopt.ts:16` `CORTEX_IGNORE_ENTRIES` still lists `wiki/graph/cache/`. That file
  is under active work in `odd/adopt-self-safety`; do not touch it.
- `graphify-out/` is gitignored, so Obsidian shows no graph under `wiki/` anymore. Accepted: the
  canonical artifact lives in `graphify-out/` and `graph.html` is generated there.
- The graphify MCP entry in `opencode.json` only takes effect after opencode restarts.

## Baseline

```
main 8da910a
graphify-out/graph.json   812 nodes, built_at_commit 8da910ab
wiki/graph/graph.json      21 nodes, tracked, stale
graphify 0.9.40
```

## Evidence log

_(filled in as work units complete)_
