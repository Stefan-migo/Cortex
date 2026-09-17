# ODD Task — publish-surface

**Branch:** `odd/publish-surface` · **Worktree:** `../Cortex-odd-publish-surface`
**Base:** `origin/main` @ `1c4d956` (state rename merged as PR #33)
**TDD:** OFF — this repository has no test harness (`npm test` exits 1: "No test files found").
Functional checks only; no RED/GREEN cycle is claimed. Runner: none.

## Objective

Make the published artifact and the repository's public front pages tell the truth about
`rapsodia-code`.

Today `npm install -g rapsodia-code` delivers a tarball whose README — which *is* the npm
package page — documents `cortex-brain`, `npm install -g cortex-brain`, `cortex init` and
`cd cortex/cli`. The repository's own README describes a different product entirely (a Gentle AI
skill pack), advertises an MIT license badge pointing at a `LICENSE` file that does not exist,
and never tells anyone how to install the CLI.

None of this is code behaviour. It is the surface a new user meets first, and it is the last
thing standing between this repository and a publish that does not embarrass itself.

## Why

Audit on 2026-09-17 (Engram observation #4012), verified by running the real package:

- The publish path itself **works**: a faithful install-layout simulation copies 36 files,
  prints `✔ Copied 36 files` and `Usage: rapso`. The PR #25 fix holds.
- The remaining gap is exactly the surface. `npm pack --dry-run` in `cli/` reports
  `npm notice 961B README.md` — the stale one — and no license file.
- The brand PR (#30) cut its scope **by folder** (`cli/src/template/**`, `cli/src/**`,
  `adopt.ts`). Both READMEs live in neither folder, so no rename slice ever owned them. It is a
  structural gap in the blast-radius cut, not an oversight in any single slice.

## Measured surface (verified against `1c4d956`, not estimated)

- **`cli/README.md`** — 961 B, ships inside the tarball. Carries `cortex-brain`,
  `npm install -g cortex-brain`, `cd cortex/cli`, eight `cortex <cmd>` rows in its command
  table, and a `## Build` block that promotes the repository's own build commands to package
  consumers.
- **`README.md`** (root, 83 lines) — title `Cortex`, subtitle "Skill pack for Gentle AI",
  badge `<img src="LICENSE">` pointing at a file that does not exist, Quick Start built on
  `git clone` + `cp Cortex/commands/cortex-init.md` + `/cortex-init`, and a `## License`
  section claiming MIT with no license file anywhere.
- **No `LICENSE`** at the repository root or in `cli/`; `cli/package.json` has no `license`
  field; the tarball carries no license file.
- **`cli/package.json`** — present: `name`, `version`, `description`, `preferGlobal`, `bin`,
  `files`, `scripts`, `dependencies`, `devDependencies`. Absent: `license`, `repository`,
  `homepage`, `bugs`, `keywords`, `author`, `engines`.
- **`dependencies` are already inlined in the bundle.** `commander`, `chalk` and `ora` are
  bundled by esbuild (`bundle: true`, `cli/esbuild.config.js`); `grep -c commander
  cli/dist/index.js` → 34, all internal `__commonJS` wrappers. Consumers install three packages
  the shipped bundle already contains.

## Scope

Authorized:

- `cli/README.md`, `README.md`, `LICENSE`, `cli/LICENSE`
- `cli/package.json` and `cli/package-lock.json` (only if metadata drift requires regeneration)
- `odd/tasks/publish-surface.md` — this document

## Out of scope, with reasons (do NOT "helpfully" fix these)

1. **`.opencode/node_modules` is never installed by `init`** (finding B5, confirmed here by
   simulation: `ls demo/.opencode/node_modules` → no such directory, while
   `.opencode/package.json` and three tools import `@opencode-ai/plugin`). This is real and it
   reaches a new user. It is excluded because its fix lives in `cli/src/**`
   (`engine/deps.ts`, `commands/install.ts`, `engine/worktree.ts`), which is exactly the
   surface the rename slices own. **Recorded here; its own change.**
2. **The `cortex-persona` / `cortex-session` skill names** in the root README. Slice 3 renames
   those directories. This document accepts that the root README will be touched a second time
   for those names only, and says so rather than pretending the README is final.
3. **CI and publish automation.** `.github/workflows/` does not exist, so publishing is manual
   and needs `npm login`/token. That is process, not artifact, and it is a decision to make at
   release time.
4. **`cli/template/`** — an untracked, gitignored stale duplicate of the template that still
   carries `.specify/` on disk. It is not in `files` and does not ship. Report only.
5. **`"test": "vitest run"` with an empty `cli/test/`** → `npm test` exits 1 for anyone who
   clones. Same family as the repository's documented "no test harness" state.
6. **`odd/tasks/worktree-naming.md`** and the other stale task-doc checkboxes sitting in
   `main`'s working tree. That is the bookkeeping sweep, explicitly not this change.

## Tasks

- [ ] **T01** — Rewrite `cli/README.md` as the npm package page for `rapsodia-code` / `rapso`:
      the real install line, a command table copied from `node dist/index.js --help`, the Node
      requirement, and a link to the repository. The repository-internal build instructions
      move to a clearly marked "from source" section or disappear.
- [ ] **T02** — Rewrite the root `README.md` around the product that actually ships: what
      `rapso` does (scaffold, manage, analyze, ODD worktrees), install, quick start, command
      table, and the skill pack's real current role. Replace or remove the dead `LICENSE`
      badge. Keep skill names as they are today (exclusion 2).
- [ ] **T03** — Add `LICENSE` (MIT) at the root **and** in `cli/` so the tarball carries it, and
      add `"license": "MIT"` to `cli/package.json`. The copyright holder is a **pending user
      decision** — no name is invented here.
- [ ] **T04** — `cli/package.json` metadata: add `license`, `repository`, `homepage`, `bugs`,
      `keywords`, `engines` (node >=18, matching esbuild's target); drop the deprecated
      `preferGlobal`; reclassify the already-bundled `dependencies` as `devDependencies` **only
      after** the scenario-6 bundle check proves nothing requires them at runtime.
- [ ] **T05** — Run the verification scenarios and record real output. Commit as reviewable work
      units (one concern each, ≤5 files per commit, no `--no-verify`).
- [ ] **T06** — Report.

## Acceptance criteria

1. `cd cli && npm pack --dry-run` lists the new `README.md` and a `LICENSE`; name, version and
   `bin` are unchanged. Report the notice lines.
2. No `cortex-brain`, `npm install -g cortex-brain`, `cortex init` or `cd cortex/cli` remains in
   `cli/README.md`. Report the `rg` command and its output.
3. The root `README.md` installs with `npm install -g rapsodia-code`, and its command table
   matches `node cli/dist/index.js --help` verbatim.
4. `rg -n 'cortex|Cortex' README.md cli/README.md` returns only the skill names slice 3 owns and
   repository-identity mentions (`github.com/Stefan-migo/Cortex`), which stay.
5. `cd cli && npm ci` still succeeds after any lockfile-touching change; if the lockfile must be
   regenerated, `npm ci` succeeds afterwards. Report the real output.
6. If T04's dependency reclassification lands: `cd cli && npm run build` then
   `node dist/index.js --help` still work. Report the command and its output.
7. Every `LICENSE` file exists and the `license` field agrees with it.
8. The worktree's untracked `.opencode/` install artifacts are **not** staged.

## Verification scenarios

Run from the worktree. `STATE_CLI="node $PWD/cli/dist/index.js"`.

1. **Tarball** — `cd cli && npm pack --dry-run` → report the README and LICENSE notice lines.
2. **Stale-string coverage** — `rg -n 'cortex-brain|cd cortex/cli|\bcortex init\b' cli/README.md`
   → expect no matches. Report the command and output.
3. **Help fidelity** — `node cli/dist/index.js --help` → the README tables must match it; report
   both side by side.
4. **Install integrity** — `cd cli && npm ci` → exit code and output tail.
5. **Fresh-install smoke** — rebuild the packed layout in a temp dir (`dist/`, `package.json`,
   `README.md`, `LICENSE`, `src/template`), run `node dist/index.js init demo --no-git --yes`,
   and report the file count plus the `Rapsodia` brand lines. Baseline from observation #4012:
   36 files copied, 37 files total.
6. **Bundle self-sufficiency** (only if T04 reclassifies dependencies) — move `cli/node_modules`
   aside, rebuild, run `node dist/index.js --help`; report the real output.
7. **Staging discipline** — `git status --short` → only the intended paths.

## Constraints

- The `.githooks/pre-commit` Atomicity Gate rejects more than **5 files per commit**. Split by
  concern; no `--no-verify` bypass.
- **Never stage the worktree's untracked `.opencode/` install artifacts**
  (`.opencode/package.json`, `.opencode/package-lock.json`,
  `.opencode/tools/package-lock.json`). `.opencode/.gitignore` does not reach worktrees. Use
  explicit paths when staging.
- Every command written into a README must exist in the real `--help` output. Documentation does
  not get to describe commands the CLI lacks.
- Do not invent the LICENSE copyright holder.
- `cli/dist/` is gitignored and was rebuilt in `main` at `1c4d956` (222877 bytes) before this
  worktree was created.

## Progress

Worktree created from `origin/main` @ `1c4d956` with `rapso worktree create publish-surface
--yes`. T01–T06 open. No source write yet.

## Next step

Parent decision on the LICENSE copyright holder, then T01–T03 (the surfaces), then T04
(metadata), then T05 (verification).

## Rationale log

- **Route: ODD-direct, single PR — not an SDD change.** There is no design question. The
  replacement content is determined by the shipped CLI's real `--help` output and by the
  product decision already recorded in the rename documents.
- **Why this runs before the remaining rename slices.** Nothing in scope touches `cli/src/**`,
  so it is file-disjoint from every remaining rename slice; and it is the surface a publisher
  and a new user meet first. Items whose fix lives in `cli/src/**` are deferred for exactly that
  reason (exclusion 1).
- **Why the root README is in scope even though slice 3 will touch its skill names.** Today it
  describes a different product and links a missing file. Deferring it would leave the public
  page false for the whole rename window, which is worse than a documented second touch limited
  to skill names.
- **Why dependency reclassification is conditional.** The bundle check is what makes it safe;
  without that evidence, moving `commander`/`chalk`/`ora` out of `dependencies` would be a guess.
