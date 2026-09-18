# ODD Task — cortex-adopt

**Branch:** `odd/cortex-adopt` · **Worktree:** `../Cortex-odd-cortex-adopt`

## Objective

Give Cortex a way to install itself into a project that **already exists**, without clobbering the project's own files, and leave a manifest so the existing `cortex update` keeps working afterwards.

## Problem

There is no path today. Verified against the owner's real projects:

- `cortex init` scaffolds a **new** project: it copies the whole template over the target, which would replace a project's own `AGENTS.md`, `opencode.json`, and `.gitignore`. It is replacement, not adoption.
- `cortex update` is manifest-aware and safe, but it **refuses without a manifest** (`cli/src/commands/update.ts:72-73`, "No Cortex manifest found"), and no existing project has one.
- `scripts/cortex-sync.sh` only copies `skills/*/SKILL.md` and migrates legacy `.cortex-sessions/`. That is exactly what `/home/stefan/repos/lumat-agent` received: skills present, but no manifest, no hooks, no `odd/`, and no ODD worktree rule in its `AGENTS.md`.

The result is worse than an untouched project: it looks like Cortex and is not. `projects.txt` even lists `/home/stefan/repos/lumat-agent-harness`, which has **zero** Cortex footprint — the sync never ran there, so the list is aspirational rather than descriptive.

## Discovery that shapes the design

The template's `.opencode/skills/` and the repository's root `skills/` are **disjoint sets**:

- `cli/src/template/.opencode/skills/` — `bootstrap`, `design-system`, `graphify`
- `skills/` — `cortex-persona`, `cortex-session`, `ponytail-audit`, `ponytail-debt`, `ponytail-help`, `ponytail-plan`, `ponytail-review`

So `cortex init` and `cortex-init.sh` deliver **different halves of Cortex**, and the CLI package ships only the template (`cli/package.json` `files`: `dist`, `src/template`). Adopt therefore delivers what the template actually contains. Unifying the two skill sources is a separate change and is **out of scope** here.

## Scope

New: `cli/src/commands/adopt.ts`, plus whatever engine module it needs. Modified: `cli/src/index.ts` (register the command), `cli/src/engine/manifest.ts` and `cli/src/commands/update.ts` (the manifest extension below).

Out of scope: unifying the two skill sources; the `package.json` `files` versus runtime-template mismatch; `projects.txt`; `cortex-init.sh`'s absolute paths; the retired `.specify/**` trees; and the rest of the Spec-Kit decommission.

## Command surface

```
cortex adopt [path]        # default: cwd
  --dry-run                # print the plan, change nothing
  --yes                    # skip prompts (accept owned-file refreshes)
  --force                  # allow a dirty git tree, and overwrite user-modified owned files
```

Idempotent by construction: re-running adopt re-injects the merged blocks and re-copies owned files under the same conflict rules as `update`.

## The policy table (the core decision)

Four classes. This table is the contract; every path in the template must fall into exactly one.

### Owned — copied from the template, hash-tracked in the manifest, refreshed by `update`

```
.opencode/agents/**
.opencode/plugins/**
.opencode/tools/**
.opencode/skills/**
.opencode/mcp-template.json
.opencode/package.json
.opencode/package-lock.json
.opencode/.gitignore
```

### Merged — injected into a file the PROJECT owns, inside markers. `update` rewrites only the marked region; everything outside is untouchable.

- **`AGENTS.md`** — Markdown markers:
  `<!-- cortex:start -->` … `<!-- cortex:end -->`, following the `<!-- gentle-ai:x -->` convention already used across this ecosystem.
  The block contains two project-agnostic **rules** lifted from the template's `AGENTS.md`: the `## ODD Worktrees` section and the `### 5-Step Execution Gate (MANDATORY)` block. It deliberately does **not** carry the descriptive sections (brain lobes, tool-belt, identities), which describe the template's own scaffold rather than obligations.
- **`.gitignore`** — `# cortex:start` … `# cortex:end`. HTML comments are invalid in a gitignore, so this file needs its own marker syntax. The block contains only the Cortex-relevant entries the project does not already have (for example `.cortex/`, `graphify-out/`, `wiki/graph/cache/`). Existing project entries are never removed or reordered.
- **`opencode.json`** — JSON cannot carry comments, so ownership is a field, matching the `__managed_by` convention already present in the owner's config (`__managed_by: "gentle-ai/sdd"`):
  - `agent.cortex-planner` and `agent.cortex-developer` are injected, each carrying `"__managed_by": "cortex"`. Cortex owns these two objects and refreshes them.
  - `mcp.engram` and `mcp.graphify` are **seeded**: added only when the key is absent, never overwritten.
  - The graphify plugin path is appended to the top-level `plugin` array only when missing. The path points at the **project's own** `.opencode/plugins/graphify.js`, computed at adopt time on the machine that will use it — never at the owner's Cortex pack directory, which is what `cortex-init.sh:136` does today.
  - `model`, `provider`, `permission`, `default_agent`, `small_model`, `share`, any other MCP server, any other agent, and every unknown key are **untouched**.
  - Detect which config file the project uses (root `opencode.json`, `.opencode/opencode.json`, or both) and merge into what exists; default to the root file when neither exists.

### Seeded — created only if absent, never overwritten

- `.cortex-sessions/` directory, plus its `.gitignore` entry
- `odd/tasks/.gitkeep` (a tracked placeholder, because an empty directory does not survive git)
- `.cortex/manifest.json` (written by adopt)

### Never — not delivered to existing projects

```
.specify/**
DESIGN.md
SYSTEM-MAP.md
USER-GUIDE.md
wiki/**
scripts/**
```

Rationale: scaffolding for a brand-new project, or documents a project with history already has in its own form. `.specify/**` is retired. Adopt never replaces `AGENTS.md`, `opencode.json`, `DESIGN.md`, or `.gitignore` wholesale — the merged classes are the only way it writes into them.

## Manifest extension

`ManifestFile` stays `{ path, hash }` so the shape is compatible. `Manifest` gains one optional field:

```ts
excludedPaths?: string[]   // template paths adopt deliberately did not install
```

Adopt records the `Never` set there. Without it, `detectChanges` would classify every `Never` template file as `added` and `cortex update` would offer to scaffold `DESIGN.md`, `wiki/`, `scripts/`, and `.specify/` into an adopted project.

`detectChanges` must ignore template files matching `excludedPaths`. `init` writes no `excludedPaths`, so its behaviour is unchanged. A missing or empty `excludedPaths` means the current behaviour exactly.

The manifest records **only the Owned files**, never the whole project tree: `generateManifest`'s current whole-tree scan would turn every one of the project's own files into a `deleted` entry.

## Safety

- A dirty git working tree is **reported, not refused**. The original design refused unless `--force`, and the end-to-end verification exposed why that is wrong: adopt itself leaves the tree dirty, so the second run of the most common operation (re-adopting to refresh) would have required `--force` every time. The structural protections already cover the real risk — adopt writes only its own tracked files and the marked blocks inside files the project owns, and a user-modified owned file is a prompted conflict — so the check informs instead of blocking.
- Never delete anything, ever.
- `--dry-run` prints the full plan — created, refreshed, injected, seeded, and skipped — and changes nothing.
- An Owned file that differs from its manifest hash is a `userModified` conflict: prompt, or overwrite with `--force`, mirroring `update`'s existing semantics.
- Report the final state honestly, including anything skipped.

## TDD

Mode: **off**. No test harness exists (zero test files, `npm test` exits 1). Functional verification is `npm run typecheck`, `npm run build`, and a real end-to-end run against a synthetic existing project, described under Tasks.

## Tasks

- [x] **T01** — Add the engine module: the policy table, the marker injection for Markdown, gitignore, and JSON, the seed logic, and the owned-file copy with substitution and hashing.
- [x] **T02** — Add `cli/src/commands/adopt.ts` with the surface above, and register it in `cli/src/index.ts`.
- [x] **T03** — Extend `Manifest` with `excludedPaths` and teach `detectChanges` to honour it.
- [x] **T04** — Verify end to end on a synthetic fixture, then commit as reviewable work units and open the PR. **Delivered by PR #13** (`feat(cli): add cortex adopt for existing projects`, merged 2026-09-17); its files and body match the adopt implementation and synthetic-fixture verification.

## Acceptance criteria, proven on a fixture

Build a fixture in a temp directory that imitates a real project: a git repo with its own `AGENTS.md` (with content that must survive), its own `opencode.json` (with its own `mcp` server, its own `model`, and an unrelated agent), its own `.gitignore` with project entries, one skill directory Cortex does not know (`component-adapter`), and one existing commit.

Then assert, with the literal output reported:

- The project's own `AGENTS.md` content is still present, and the marked Cortex block is appended.
- The project's own `opencode.json` keys (`model`, its own mcp server, its unrelated agent) are untouched, and `agent.cortex-*` with `__managed_by: "cortex"` is present.
- The project's own `.gitignore` entries are all still present, and the Cortex block is appended.
- The unknown skill directory still exists, untouched.
- `odd/tasks/.gitkeep`, `.cortex-sessions/`, and `.cortex/manifest.json` exist.
- No `DESIGN.md`, `SYSTEM-MAP.md`, `USER-GUIDE.md`, `wiki/`, `scripts/`, or `.specify/` was added.
- `grep -rn "/home/stefan"` over the adopted fixture finds nothing.
- Running adopt a **second** time changes nothing (idempotence) — verified by comparing the tree state, not by inference.
- `cortex update --check` in the adopted fixture reports nothing to add and never offers a `Never` path.

## Verification evidence

T04 is complete and delivered by PR #13. The required second `--yes` invocation is refused by the
dirty-tree safety rule after the first adoption; the idempotence run used `--yes --force`.

```text
$ node cli/dist/index.js adopt /tmp/opencode/adopt-fixture --dry-run
Cortex Adoption Plan (dry run)
──────────────────────────────
ℹ Created (15):
ℹ   .opencode/.gitignore
ℹ   .opencode/agents/cortex-developer.md
ℹ   .opencode/agents/cortex-planner.md
ℹ   .opencode/mcp-template.json
ℹ   .opencode/package-lock.json
ℹ   .opencode/package.json
ℹ   .opencode/plugins/graphify.js
ℹ   .opencode/skills/bootstrap/SKILL.md
ℹ   .opencode/skills/design-system/SKILL.md
ℹ   .opencode/skills/graphify/SKILL.md
ℹ   .opencode/tools/execute_script.ts
ℹ   .opencode/tools/package-lock.json
ℹ   .opencode/tools/package.json
ℹ   .opencode/tools/wiki-link.ts
ℹ   .opencode/tools/wiki-search.ts
ℹ Injected (3):
ℹ   AGENTS.md
ℹ   .gitignore
ℹ   opencode.json
ℹ Seeded (3):
ℹ   .cortex-sessions/.gitignore
ℹ   odd/tasks/.gitkeep
ℹ   .cortex/manifest.json
ℹ Skipped (0):
⚠ Dry run — no changes applied.

$ git -C /tmp/opencode/adopt-fixture status --short

$ node cli/dist/index.js adopt /tmp/opencode/adopt-fixture --yes
Cortex Adoption
───────────────
ℹ Created (15):
ℹ   .opencode/.gitignore
ℹ   .opencode/agents/cortex-developer.md
ℹ   .opencode/agents/cortex-planner.md
ℹ   .opencode/mcp-template.json
ℹ   .opencode/package-lock.json
ℹ   .opencode/package.json
ℹ   .opencode/plugins/graphify.js
ℹ   .opencode/skills/bootstrap/SKILL.md
ℹ   .opencode/skills/design-system/SKILL.md
ℹ   .opencode/skills/graphify/SKILL.md
ℹ   .opencode/tools/execute_script.ts
ℹ   .opencode/tools/package-lock.json
ℹ   .opencode/tools/package.json
ℹ   .opencode/tools/wiki-link.ts
ℹ   .opencode/tools/wiki-search.ts
ℹ Refreshed (0):
ℹ Injected (3):
ℹ   AGENTS.md
ℹ   .gitignore
ℹ   opencode.json
ℹ Seeded (3):
ℹ   .cortex-sessions/.gitignore
ℹ   odd/tasks/.gitkeep
ℹ   .cortex/manifest.json
ℹ Skipped (0):
✔ Cortex adopted successfully.

$ grep -n -E 'Existing Project Rules|must survive|cortex:start|cortex:end|ODD Worktrees|5-Step Execution Gate' AGENTS.md
1:# Existing Project Rules
3:This prose belongs to the existing project and must survive adoption.
5:<!-- cortex:start -->
6:## ODD Worktrees
10:### 5-Step Execution Gate (MANDATORY)
18:<!-- cortex:end -->

$ node -e "const c=require('./opencode.json'); console.log(JSON.stringify({model:c.model,projectServer:c.mcp['project-server'],projectAgent:c.agent['project-agent'],plannerManaged:c.agent['cortex-planner'].__managed_by,developerManaged:c.agent['cortex-developer'].__managed_by,plugin:c.plugin},null,2))"
{
  "model": "project/model",
  "projectServer": { "type": "local", "command": [ "project-server" ] },
  "projectAgent": { "mode": "primary", "model": "project/model" },
  "plannerManaged": "cortex",
  "developerManaged": "cortex",
  "plugin": [ "/tmp/opencode/adopt-fixture/.opencode/plugins/graphify.js" ]
}

$ grep -n -E 'media/|backups/|\.venv/|cortex:start|cortex:end|\.cortex/' .gitignore
1:media/
2:backups/
3:.venv/
5:# cortex:start
7:.cortex/
22:# cortex:end

$ sha256sum .opencode/skills/component-adapter/SKILL.md
d40535c2d4ea8110bd0e125a3fe9f8d351e70bbfd59a94110265a6e46658bdbd  .opencode/skills/component-adapter/SKILL.md

$ test -f odd/tasks/.gitkeep && test -d .cortex-sessions && test -f .cortex/manifest.json && printf 'all seeded paths exist\n'
all seeded paths exist

$ for p in DESIGN.md SYSTEM-MAP.md USER-GUIDE.md wiki scripts .specify; do test ! -e "$p" && printf '%s absent\n' "$p"; done
DESIGN.md absent
SYSTEM-MAP.md absent
USER-GUIDE.md absent
wiki absent
scripts absent
.specify absent

$ grep -rn '/home/stefan' . --exclude-dir=.git || true

$ node /home/stefan/Cortex-odd-cortex-adopt/cli/dist/index.js update --check
Cortex Brain Update
───────────────────

→ Comparing template with project
ℹ Template version: 1.0.0
ℹ Files tracked: 15
✔ Template is up to date

$ cd cli && npm run typecheck
> cortex-brain@1.0.0 typecheck
> tsc --noEmit

$ cd cli && npm run build
> cortex-brain@1.0.0 build
> node esbuild.config.js
Template copied: /home/stefan/Cortex-odd-cortex-adopt/cli/src/template → /home/stefan/Cortex-odd-cortex-adopt/cli/template
```

The exact second-run command required by the task produced:

```text
$ node cli/dist/index.js adopt /tmp/opencode/adopt-fixture --yes
✖ Working tree is dirty. Commit changes or use --force.
```

### The pre-commit review found three real problems in this change's own code, and all three were fixed

Unlike the earlier review that blocked on pre-existing debt in files this change does not author, this one returned findings about **the new code**, and all three were correct:

1. **`detectChanges` hashed the raw template while the manifest stores the hash of the substituted project file**, so any placeholder-bearing file would be reported as modified on every run. Investigated and confirmed as a **pre-existing bug that also affects `init` and `update`**: immediately after `cortex init` on a clean fixture, `update --check` reported `ℹ 8 file(s) have auto-updates pending` — every freshly created project is born "out of date". Fixed by adding `hashTemplateFile`, which mirrors `copyTemplate`'s text/binary rule, and by reconstructing the creation variables from the manifest.
   - Before: `ℹ 8 file(s) have auto-updates pending`
   - After: `✔ Template is up to date`
2. **Hardcoded `/` in path handling** — `adopt.ts` extracted the project name via `targetDir.split('/')`, and `manifest.ts` stripped the project prefix with `targetDir + '/'`. Both replaced with `basename()` and `relative()`.
3. **`mergeJson` could destroy project configuration** — a `plugin` key that existed but was not an array was silently replaced with `[]`, and a project agent sharing our name was overwritten unconditionally. Now a non-array `plugin` is left untouched, and an agent entry is only claimed when it is absent or already carries `__managed_by: "cortex"`.

Edge fixture proving fix 3, with a project whose `plugin` is an object and which already owns a `cortex-planner` of its own:

```text
plugin preservado tal cual: {"custom": true}
cortex-planner del proyecto intacto: {"mode": "primary", "model": "mine/model", "note": "PROJECT OWNED"}
cortex-developer inyectado: cortex
```

### Idempotence, without `--force`

Snapshot comparison of the whole adopted tree plus `git status --porcelain`, taken before and after a second `adopt --yes` with no `--force`:

```text
snapshot antes:   3f82941fd0521018869f49ff54746693
snapshot después: 3f82941fd0521018869f49ff54746693
✅ IDÉNTICOS
```

### `update` on the adopted project

```text
ℹ Template version: 1.0.0
ℹ Files tracked: 15
✔ Template is up to date
```
`excludedPaths` works: `update` reports nothing to add and never offers a `Never` path.

## Progress

**Closed.** T01–T04 complete and delivered by PR #13 (`feat(cli): add cortex adopt for existing projects`, merged 2026-09-17). The PR files and body match the implementation and verification above.

## Next step

None. PR #13 delivered the work units and opened the PR.

## Rationale log

- **Markers per format, not one syntax.** HTML comments are valid in Markdown, `#` is the only comment in a gitignore, and JSON has no comments at all — hence `__managed_by`, which the ecosystem already uses.
- **The manifest carries an explicit `excludedPaths` list rather than the code hardcoding Never-ness in two places.** `update` then needs one rule ("skip what the manifest excludes") instead of an embedded copy of the policy table.
- **Adopt records only Owned files.** A whole-tree manifest, which is what `generateManifest` produces for `init`, would mark every project-owned file as `deleted`.
- **The graphify plugin path points at the project, not at the Cortex pack.** `cortex-init.sh:136` embeds the owner's absolute pack path, which breaks on any other machine and is one of the reasons the current bootstrap is not portable.
- **The dirty-tree refusal was found to be wrong by running it, not by thinking about it.** It was in the approved design, and the fixture test is what proved it makes re-adoption impossible without `--force`. Recorded here because the same instinct — a guard that blocks the normal path — is worth distrusting elsewhere.
- **Fixing the hash comparison was in scope because adopt would have inherited it.** The mismatch is pre-existing and affects `init`/`update` today, but an adopt manifest written with substituted hashes would misreport exactly the same way, so leaving it would have shipped the bug into the new command as well. The fix lands in the shared code path instead of being special-cased for adopt.
