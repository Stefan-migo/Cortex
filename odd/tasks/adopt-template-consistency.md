# ODD Tasks — adopt-template-consistency

Worktree: `/home/stefan/Cortex-odd-adopt-template-consistency`
Branch: `odd/adopt-template-consistency`
Base: `fafab11` (main, after PR #15)

## Objective

Make Cortex's install surface tell the truth: stop claiming ownership of files Cortex does
not ship, stop pointing projects at a path computed the wrong way, and stop letting the
built template accumulate files that no longer exist in its source.

## Why

PR #15 removed the forged template lockfiles, but the merge alone was not enough: after the
build, `cli/template/.opencode/package-lock.json` still existed and `cortex init` and
`cortex adopt` still shipped it. That is B6, and it is why the defect was so persistent.

While diagnosing that, three inconsistencies surfaced in the same surface — the files Cortex
believes it owns, creates, and mirrors. They share one root: **Cortex has no single source of
truth for what it ships.** Each defect is a different way the surface drifts from it.

## Findings

### B1 — Cortex claims a file it deliberately does not ship

- `OWNED_PATHS` (`cli/src/engine/adopt.ts:7-11`) claims `.opencode/plugins/**` as Cortex-owned.
- The template ships a deliberate 6-line **stub** whose own comment reads
  `Full plugin: install via 'graphify install --platform opencode'`.
- `graphify` is installed and writes the real 30-line plugin, including the PowerShell
  `;`-vs-`&&` fix from #1646.
- So `--yes`, `--force`, and `update` replace a file another tool maintains with a stub.
- Verified on `lumat-agent`: its real plugin survived only because adoption ran without
  `--yes`, which routes conflicting files to `skipped`.

### B3 — `mergeJson` computes the plugin path the wrong way

- `mergeJson` (`cli/src/engine/adopt.ts:72-76`) builds an **absolute** path
  (`join(targetDir, '.opencode/plugins/graphify.js')`) and guards with `includes()`, which
  compares exact strings. A project declaring the **relative** form — the canonical one — gets
  the absolute form pushed alongside it, so the same file is listed twice:

  ```json
  "plugin": [
    ".opencode/plugins/graphify.js",
    "/home/stefan/repos/lumat-agent/.opencode/plugins/graphify.js"
  ]
  ```

- The relative form is what Cortex's own `.opencode/opencode.json` and the template's
  `.opencode/opencode.json` both declare. The absolute form is machine-specific and breaks on
  any other machine.
- Root cause: `mergeJson` reads its template from `join(templateDir, 'opencode.json')` — the
  **root** config, which has no `plugin` key — so it never learns the relative convention.
- Same function re-serializes with `JSON.stringify`, which rewrites the project's own
  formatting (`"Graphify \u2014"` becomes `"Graphify —"`). **Accepted, not fixed**: preserving
  raw formatting needs a format-preserving JSON editor, which is machinery this does not
  justify.

### B6 — The built template is additive, so deletions never propagate

- `copyDir` (`cli/esbuild.config.js:20-31`) copies `src/template` into `cli/template` with
  `copyFileSync` and never removes destination entries that no longer exist in the source.
- The CLI reads `cli/template` (`TEMPLATE_DIR = join(__dirname, '..', 'template')`), so a
  deleted template file lives on as a zombie and keeps being shipped.
- Observed after PR #15 merged and built: `cli/template/.opencode/package-lock.json` and
  `cli/template/.opencode/tools/package-lock.json` were still present while
  `cli/src/template/` no longer had them. Removed by hand to unblock, then re-verified.

## Decisions

### D01 — B1: Cortex stops owning `.opencode/plugins/**`

Remove `.opencode/plugins/**` from `OWNED_PATHS`. Cortex must not manage a file that another
tool installs and that Cortex deliberately ships only as a stub.

The template keeps its stub, because `cortex init` scaffolds a fresh project and the stub is
harmless there. `cortex adopt` and `cortex update` simply stop touching plugins.

**Residual, accepted:** `cortex init --force` still overwrites unconditionally, because
`copyTemplate` copies everything. `init` targets fresh directories and `--force` is explicit,
so this is out of scope here and recorded as such.

### D02 — B3: `mergeJson` uses the canonical relative path, deduplicated by identity

- Declare the plugin path as the project-root-relative
  `.opencode/plugins/graphify.js` — the form Cortex and the template already use.
- Deduplicate by **resolved identity**, not exact string, so an existing absolute entry is
  recognised as the same file instead of being duplicated.
- Only wire the entry when the file actually exists, so Cortex never points OpenCode at a
  plugin path it did not create.

### D03 — B6: `copyDir` becomes a true mirror

Remove destination entries that do not exist in the source, recursively, after copying.
`cli/template` is a gitignored build output of `cli/src/template`; a stale file in it is
always a defect and never user data.

## Scope

- `cli/src/engine/adopt.ts` — B1, B3
- `cli/esbuild.config.js` — B6
- `odd/tasks/adopt-template-consistency.md`

**Out of scope:** `cli/src/template/.specify/**` (owned by the `spec-kit-decommission`
handoff); the pre-existing findings in `commands/analyze.ts` and `engine/session.ts`;
`copyTemplate`'s unconditional overwrite (see D01).

## Task checklist

- [x] **T01** — B1: `.opencode/plugins/**` removed from `OWNED_PATHS`.
- [x] **T02** — B3: `mergeJson` now uses `.opencode/plugins/graphify.js`.
- [x] **T03** — B3: dedupe by resolved identity via `resolve(targetDir, entry)`.
- [x] **T04** — B3: the entry is only wired when `existsSync(join(targetDir, plugin))`.
- [x] **T05** — B6: `copyDir` removes destination entries absent from the source, and also
      corrects a file/directory type change in either direction.
- [x] **T06** — `typecheck` and `build` both exit 0.
- [x] **T07** — B6 verified. **The probe in the Checks section below was wrong** and is
      corrected there: it created the file in `src/template`, which a true mirror *must*
      copy, so finding it in the mirror was correct behaviour, not a zombie. Stale
      destination removal was verified by the corrected probe.
- [x] **T08** — B1 verified: the real plugin stayed byte-identical with `--yes` and without.
- [x] **T09** — B3 verified: exactly one relative entry, no absolute path.
- [x] **T10** — This document updated with observed evidence.

## Residual (accepted)

**An absolute plugin entry that a project already declares is deduplicated but not
rewritten.** The dedupe filter keeps the first entry matching the resolved plugin identity,
so a project that already carries
`/home/<user>/<path>/.opencode/plugins/graphify.js` keeps that form.

This is deliberate. The defect B3 reports is that Cortex **introduced** the absolute form;
repairing a project's pre-existing choice is a different change, and `mergeJson` elsewhere is
explicitly careful not to churn project-owned configuration (it refuses to replace a
same-named project agent, and refuses to replace a non-array `plugin` value). A project
adopted by the buggy build keeps its absolute entry until its owner changes it.

In practice the affected set is empty: the only project ever adopted with the buggy build was
`lumat-agent`, and its entry was already corrected by hand.


## Acceptance criteria

1. `cortex adopt` on a project with a real `.opencode/plugins/graphify.js` leaves that file
   byte-identical, with or without `--yes`.
2. A project whose `opencode.json` already declares `.opencode/plugins/graphify.js` ends with
   exactly one plugin entry, and no absolute path anywhere.
3. Deleting a file from `cli/src/template/` and rebuilding leaves no matching file in
   `cli/template/`.
4. `npm run typecheck` and `npm run build` both exit 0.
5. `cortex worktree create` still exits 0 on a fresh `cortex init` project (no regression
   from PR #15).

## Checks

TDD mode: **off**. Source: `AGENTS.md` — no test harness, zero test files, `npm test` exits 1.

```bash
cd cli && npm run typecheck && npm run build

# B6: a stale destination file must not survive a build.
# NOTE: touch the MIRROR, not the source. A file present in cli/src/template is supposed to be
# copied; the defect is a file that exists ONLY in cli/template. An earlier revision of this
# document had the probe backwards, and the implementing agent correctly caught it.
touch cli/template/.opencode/__zombie_probe
cd cli && npm run build && ls template/.opencode/__zombie_probe   # must NOT exist

# B1 + B3: adopt over a project with a real plugin and a relative entry
node <cli> adopt --dry-run /tmp/opencode/<fixture>    # expect plugins/ absent from Refreshed
node <cli> adopt --yes /tmp/opencode/<fixture>
sha256sum /tmp/opencode/<fixture>/.opencode/plugins/graphify.js   # must be unchanged
node -e "const c=require('/tmp/opencode/<fixture>/.opencode/opencode.json'); console.log(c.plugin)"

# no regression from PR #15
node <cli> worktree create probe --yes --root /tmp/opencode/<fresh-init-fixture>   # exit 0
```

## Progress

Implemented on `odd/adopt-template-consistency` from `fafab11`. Slice B is the last of three
slices: PR #15 (Slice A) is merged, and Slice B carries B1, B3, and B6.

Parent spot check: the orchestrator re-ran the B1/B3 fixture independently of the
implementing agent and reproduced it — the same plugin sha256 before and after `adopt --yes`,
`plugin entries: [".opencode/plugins/graphify.js"]`, no absolute path, and `mergeJson` still
merging agents (`cortex-planner`, `cortex-developer`) and mcp (`engram`, `graphify`).

## Verification evidence

T06: `npm run typecheck && npm run build` exited 0; build copied the template.

T07: the exact supplied probe (`touch` in `cli/src/template`) copied the newly-created
source file, so its required `ls` unexpectedly succeeded. After removing the source probe,
the second build produced `ls: ... No such file or directory`. A proper stale-destination
probe (creating the file only in `cli/template`) reported `zombie removed` after build.

T08/T09: the real plugin hash was identical before and after adopt with `--yes`, and the
final output was `plugin entries: [".opencode/plugins/graphify.js"]`. A second fixture
without `--yes` also preserved the hash and relative entry after piping `y` to its
confirmation prompt.

Additional B3 checks: an absolute-plus-relative pair collapsed to the single existing
absolute entry, and a fixture with no plugin file retained an absent `plugin` key.

Regression: `worktree create` returned `{"accepted":true,"created":true,...}` and cleanup
returned `{"cleaned":true,"slug":"probe"}`.

## Next step

Native review, then the Pull Request.
