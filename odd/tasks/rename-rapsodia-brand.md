# ODD Task — rename-rapsodia-brand

**Branch:** `odd/rename-rapsodia-brand` · **Worktree:** `../Cortex-odd-rename-rapsodia-brand`
**Base:** `main` @ `60d42c9` (slice 1 of the rename already merged as PR #29)
**TDD:** OFF — this repository has no test harness (`npm test` exits 1: "No test files found").
Functional checks only; no RED/GREEN cycle is claimed. Runner: none.

**This is PR 1 of the re-sequenced rename.** It supersedes the slicing recorded in
`odd/tasks/rename-rapsodia.md`. See `## Re-sequencing` below.

## Objective

Make the published product call itself **Rapsodia** everywhere a user can see it, and make the
two shipping agent identities follow. Slice 1 renamed the package, the binary and the program
name but deliberately flipped no behaviour and touched no user-facing string, so today the CLI
that ships as `rapsodia-code` still prints "Cortex" on every screen.

This PR changes **only strings a user reads**, plus the one code coupling that reads the
template's agent keys. It changes **no on-disk value and no persisted contract**, so it is inert
for every already-adopted project.

## Why

The publish was blocked on identity and slice 1 unblocked the mechanical half. The remaining
half is the brand the product shows. Leaving it would publish `rapsodia-code` printing
"Cortex Status", `Scaffold a new Cortex project` and `@Cortex-Planner` on a fresh scaffold.

## The brand scheme (decided here, applied mechanically)

Derived by mirroring the old precedent exactly. Old: package `cortex-brain`, binary `cortex`,
display **Cortex**, agents `cortex-*`, prose "Cortex 2.5". The family word of the new package
`rapsodia-code` is **Rapsodia**; the binary is `rapso`; agents follow the binary, as they did
before.

| Pattern | Becomes |
|---|---|
| `Cortex` in prose, headings, display and system name | `Rapsodia` |
| `Cortex 2.5` | `Rapsodia 2.5` |
| `cortex` as a command or binary invocation (`cortex close`, `cortex worktree create`) | `rapso close`, `rapso worktree create` |
| `@Cortex-Planner`, `@Cortex-Developer` | `@Rapso-Planner`, `@Rapso-Developer` |
| `cortex-planner`, `cortex-developer` as agent keys and file names | `rapso-planner`, `rapso-developer` |
| `CORTEX-PLANNER`, `CORTEX-DEVELOPER` in the ASCII diagrams | `RAPSO-PLANNER`, `RAPSO-DEVELOPER` |
| `CORTEX_IGNORE_ENTRIES` (internal const, not exported) | `RAPSO_IGNORE_ENTRIES` |
| `CortexConfig` (internal type, not exported) | `RapsodiaConfig` |
| `cortex-cli` (MCP `clientInfo.name`) | `rapso-cli` |
| `Cortex Brain Update` | `Rapsodia Update` |
| `` `cortex-${date}-${suffix}` `` (session id) | `` `rapso-${date}-${suffix}` `` |
| `cortex@template.local`, `Cortex Template` (scaffolded git identity) | `rapsodia@template.local`, `Rapsodia Template` |
| `Initial commit from Cortex template` | `Initial commit from Rapsodia template` |
| `# Cortex Session Prelude` | `# Rapsodia Session Prelude` |

**Both spellings are deliberate.** `Rapsodia` is the display/family word, `rapso` is the
command and identifier stem. This is the same split the codebase already used
(`Cortex` display / `cortex` command), not a new convention.

## Scope

### In scope

- `cli/src/template/**` — every identity string except the exclusions below.
- `cli/src/**` excluding `cli/src/template/**` — user-facing strings only (headings, messages,
  help descriptions) plus the internal renames listed in the scheme.
- `cli/src/engine/adopt.ts:76` — the coupling, see `## The hard coupling`.
- `odd/tasks/rename-rapsodia.md` — replace the stale slicing with a pointer to this plan.
- `odd/tasks/rename-rapsodia-brand.md` — this document.

### Out of scope, with reasons (do NOT "helpfully" fix these)

1. **`PROJECT_STATE_DIR_NAME` / `SESSIONS_DIR_NAME` values** (`cli/src/utils/state.ts:3-5`) and
   every `.cortex` state literal — `template/AGENTS.md:69` (`.cortex/prelude.md`),
   `template/scripts/generate-retrospective.sh:4` (`.cortex/retrospectives/`). **State-path PR.**
   Flipping the value here would split the value flip across two PRs.
2. **The `cortex-session` / `cortex-persona` skill names** — `template/AGENTS.md:6,50,72`,
   `template/SYSTEM-MAP.md:41,58`, `template/USER-GUIDE.md:32`,
   `template/.opencode/agents/rapso-planner.md:12,16`. **Skills PR.** Renaming a reference while
   the skill directory keeps its old name would break the reference. The directories live at
   `skills/cortex-persona` and `skills/cortex-session`, resolved by
   `cli/src/engine/worktree.ts:43` (`CANONICAL_SKILLS`). This document originally justified the
   deferral with "~10 projects hold absolute symlinks into them". Measured on 2026-09-17, that is
   false: the only links are **2 relative symlinks inside this repository's own gitignored
   `.opencode/skills/`**, and no project outside the pack holds one. See
   [Correction — the slice-3 blast radius](#correction--the-slice-3-blast-radius-2026-09-17).
3. **`# cortex:start` / `# cortex:end` / `# Cortex managed entries`**
   (`cli/src/engine/adopt.ts:63,67,68`). These markers are already persisted in every adopted
   project's `.gitignore`. Renaming them makes `mergeGitignore` stop matching and append a
   duplicate managed block. Invisible to users; zero value; real cost. **Keep.**
4. **`__managed_by: 'cortex'`** (`cli/src/engine/adopt.ts:80,81`). Persisted ownership metadata
   in every adopted project's `opencode.json`; it is what stops `adopt` from clobbering a
   project's own agent. **Keep.**
5. **`## Reporting Cortex Defects`** — `template/AGENTS.md:134-147` and
   `cli/src/engine/adopt.ts:40,43`. This heading names the **repository**, which is still
   `Cortex` and stays that way (renaming `~/Cortex` is out of scope for the whole change). Its
   body points at `https://github.com/Stefan-migo/Cortex/issues`, which is correct. Renaming the
   heading would also make `injectSections` (`adopt.ts:49`) miss the section already present in
   every adopted project's `AGENTS.md` and inject a duplicate. **Keep.**
6. **`cli/src/utils/defect.ts`** — same reason as 5: the prose and the URLs point at the
   repository. **Keep.**
7. **Old agent keys `cortex-planner` / `cortex-developer` already present in adopted projects.**
   This PR teaches `adopt` to claim the new `rapso-*` keys; it does not remove the old ones.
   **Migration PR.** See `## Known consequence`.
8. **The repository's own `AGENTS.md`, `.opencode/**`, `skills/**`, `wiki/**`.** Those are this
   repository's own configuration and dogfooding surface, not the shipped product. They follow
   the skills PR and the eventual folder rename.

## The hard coupling

`cli/src/engine/adopt.ts:76` reads the agent keys **out of the template**:

```ts
for (const name of ['cortex-planner', 'cortex-developer']) {
  current.agent[name] = { ...template.agent[name], __managed_by: 'cortex' };
}
```

Renaming the keys in `cli/src/template/opencode.json` without this line makes
`template.agent['rapso-planner']` `undefined`, and `adopt` writes empty agent stubs into the
consumer's `opencode.json`. The template keys and this loop **must move in the same commit**.
This is why the template is not a separately deliverable PR.

## Known consequence

`cli/src/engine/adopt.ts:124-128` never overwrites an existing file
(`if (!existsSync(target)) create; else plan.skipped.push(file)`); only `--force` writes over.
So after this PR, an already-adopted project that runs `adopt` keeps its old
`cortex-planner`/`cortex-developer` entries **and** receives the new `rapso-*` ones, giving it
two primary agents per role. Nothing triggers this by itself — `adopt` is a manual command and
this PR ships to nobody until it is published — but it is real and must be recorded, not
discovered. The migration PR resolves it by removing the old keys when
`__managed_by === 'cortex'`.

## Tasks

- [x] **T01** — Rename the two template agent files and their contents:
      `cli/src/template/.opencode/agents/cortex-planner.md` → `rapso-planner.md`,
      `cortex-developer.md` → `rapso-developer.md`. Apply the scheme inside them. Leave the
      `cortex-session` skill references alone (item 2 of the exclusions). **Delivered by PR #30.**
- [x] **T02** — Rename the template agent keys in `cli/src/template/opencode.json`
      (`cortex-planner` → `rapso-planner`, `cortex-developer` → `rapso-developer`) **and** the
      matching loop in `cli/src/engine/adopt.ts:76`, in the same commit. **Delivered by PR #30.**
- [x] **T03** — Apply the scheme to the rest of `cli/src/template/**`: `AGENTS.md`,
      `SYSTEM-MAP.md`, `USER-GUIDE.md`, `.opencode/mcp-template.json`,
      `.opencode/skills/bootstrap/SKILL.md`, `scripts/install-deps.sh`,
      `scripts/engram-export-wiki.sh`, `scripts/generate-retrospective.sh` (command name only,
      not the `.cortex/` path). **Delivered by PR #30.**
- [x] **T04** — Apply the scheme to the user-facing strings in `cli/src/**` excluding
      `template/**`: `commands/{adopt,analyze,close,init,install,start,status,update}.ts`,
      `engine/{context,manifest,project,session,worktree}.ts`,
      `utils/{config,mcp}.ts`, `index.ts`. Internal renames (`RAPSO_IGNORE_ENTRIES`,
      `RapsodiaConfig`) count as part of this. **Delivered by PR #30.**
- [x] **T05** — Update `odd/tasks/rename-rapsodia.md`: replace its `## Tasks — Slice 2` and
      `## Tasks — Slice 3` sections with a `## Re-sequencing` note pointing at this document and
      at the three-PR blast-radius plan, so the umbrella doc stops describing a slice layout
      that no longer exists. **Delivered by PR #30.**
- [x] **T06** — Verify with real output (see below), commit as reviewable work units, report. **Delivered by PR #30**; its body records the required verification.

## The re-sequencing

Slice 1 cut by folder, which left the CLI's own branding unassigned and created the `adopt.ts`
coupling. The plan is re-cut by **blast radius** instead:

| PR | Scope | Effect on adopted projects |
|---|---|---|
| 1 (this) | The visible brand: `template/**` + `cli/src` user-facing strings + the `adopt.ts` coupling | None. No on-disk value changes. |
| 2 | The on-disk state: flip `PROJECT_STATE_DIR_NAME` / `SESSIONS_DIR_NAME`, nest the session store, `.gitignore` rule, `.githooks/pre-commit` carve-out, with read-compat | Controlled read-compat |
| 3 | The skills: `skills/cortex-persona` → `rapso-persona`, `skills/cortex-session` → `rapso-session`, `CANONICAL_SKILLS`, `cortex-init.sh`'s hardcoded name list, and every reference in `template/**`, this repository's `AGENTS.md` and its tracked agents | **Local only.** Corrected 2026-09-17 — the ~10 Gen-1 projects holding absolute symlinks do not exist. Scope is this repository, plus one post-merge repair of its own 2 links. |

### Correction — the slice-3 blast radius (2026-09-17)

Slice 3 was deferred as "**Breaks symlinks — migrate explicitly**", in the order
`lumat-agent` → the 10 Gen-1 projects → self last. That premise was never re-measured, and the
filesystem does not support it:

```
$ find /home/stefan -maxdepth 9 -path '*/.opencode/skills/*' -type l -not -path '*/node_modules/*' | wc -l
7
$ find /home/stefan -maxdepth 9 -path '*/.opencode/skills/*' -type l | sort
/home/stefan/Cortex/.opencode/skills/cortex-persona
/home/stefan/Cortex/.opencode/skills/cortex-session
/home/stefan/Cortex/.opencode/skills/ponytail-audit
/home/stefan/Cortex/.opencode/skills/ponytail-debt
/home/stefan/Cortex/.opencode/skills/ponytail-help
/home/stefan/Cortex/.opencode/skills/ponytail-plan
/home/stefan/Cortex/.opencode/skills/ponytail-review

$ ls -la /home/stefan/repos/lumat-agent/.opencode/skills/cortex-session/
-rw-r--r--. 1 stefan stefan 7057 Sep 12 11:06 SKILL.md      # a copy, not a symlink
```

What that shows:

1. **No project outside this repository holds a link into `skills/`.** All 7 are local, and only
   **2** belong to the skills being renamed. `lumat-agent`, the only other project carrying the
   pack, tracks real copies — renaming the source directory cannot break it.
2. **The two link styles are not inconsistent, so there is no installer defect to fix.**
   `cortex-init.sh`'s `link_skill` (`cortex-init.sh:57-68`) builds `$src` from the absolute
   `$CORTEX_PACK_DIR`; `canonicalSkillsRoot` (`cli/src/engine/worktree.ts:49`) emits a relative
   `../../skills/<name>`. Each is correct for its own root — the relative form resolves only
   inside the pack repository, and the absolute form is what lets an installed project track pack
   updates. `worktree.ts` links at all only when the target already holds `skills/**`, which an
   adopted project does not.
3. **`lumat-agent` is a follow-up, not a blocker.** It keeps the old skill names until somebody
   re-provisions it, and it holds copies, so nothing dangles in the meantime.
4. **The `~/Cortex` lever (state document, exclusion 5) is where absoluteness actually costs
   something.** Renaming the folder breaks **8** links, all on this machine: the 7 above plus
   `/home/stefan/.local/bin/cortex`, this CLI's own shim. That is the real content of the deferral
   — not "~8 across 10 projects", and not a reason to change the installer.

This repository's own 2 links are the only thing the slice has to repair, and they are gitignored
local artifacts, so the PR cannot carry them; `cortex-init.sh` recreates them after the merge.
Creating the new links before the merge and deleting the old ones right after keeps the window at
zero — a dangling `.opencode/skills/` entry is skipped by the skill registry rather than fatal.
There is no cross-project migration step and no ordering constraint.

## Acceptance criteria

1. `cd cli && npm run typecheck` passes with the real output reported.
2. `cd cli && npm run build` passes and `cli/dist/index.js` is rebuilt.
3. `rg -n 'cortex|Cortex|CORTEX' cli/src/template` returns only the exclusions above: the
   `.cortex/` state paths, the `cortex-session`/`cortex-persona` skill references, and the
   `## Reporting Cortex Defects` section. Report the command and its real output.
4. `rg -n 'cortex|Cortex|CORTEX' cli/src --glob '!template/**'` returns only
   `utils/state.ts`'s three `.cortex` values, `utils/defect.ts`, and the kept markers in
   `engine/adopt.ts`. Report the real output.
5. **No behaviour change other than the strings:** an existing on-disk layout still works. Run a
   read-only dogfood cycle and report the actual output.
6. `npm pack --dry-run` still lists `src/template/**` (the PR #25 fix must not regress).
7. The renamed agent files are present and the old names are gone:
   `ls cli/src/template/.opencode/agents/` shows exactly `rapso-developer.md` and
   `rapso-planner.md`.
8. The worktree's untracked `.opencode/` install artifacts are **not** staged.
9. **The coupling holds:** `adopt` on a throwaway directory produces `rapso-planner` and
   `rapso-developer` entries in the consumer's `opencode.json` with real config (not empty
   stubs). Report the real dry-run output.

## Verification scenarios

Run from the worktree after `npm run build`.

1. **Typecheck** — `cd cli && npm run typecheck` → report exact output.
2. **Build** — `cd cli && npm run build` → report size.
3. **Template coverage** — `rg -n 'cortex|Cortex|CORTEX' cli/src/template` → only the three
   documented exclusion classes. Report the command and its output in full.
4. **CLI coverage** — `rg -n 'cortex|Cortex|CORTEX' cli/src --glob '!template/**'` → only the
   documented survivors.
5. **Coupling** — `node cli/dist/index.js adopt <tmpdir> --dry-run` (or a real adopt into a
   throwaway dir) → the plan/`opencode.json` names `rapso-planner` and `rapso-developer`, and
   the entries carry the template's real `model`/`permission` fields. This is correctness
   scenario 9.
6. **No regression** — `node cli/dist/index.js worktree list --root /home/stefan/Cortex`, and
   `node cli/dist/index.js --help`, and a read-only `status` inside this worktree. Compare
   against the pre-change output and report the diff.
7. **Tarball** — `cd cli && npm pack --dry-run` → `src/template/**` present, file count
   unchanged from the base (the count must not move: this PR renames files, adds none).
8. **Identity** — `node cli/dist/index.js --help` still shows `rapso`; `adopt --help` and
   `init --help` descriptions read Rapsodia, not Cortex.

## Constraints

- **Never stage the worktree's untracked `.opencode/` install artifacts**
  (`package.json`, `package-lock.json`, `tools/package-lock.json`). Use explicit paths.
- The `.githooks/pre-commit` Atomicity Gate rejects more than **5 files per commit**. Split by
  module area; no commit uses `--no-verify`.
- `cli/dist/` is gitignored and must be rebuilt in main after the merge before dogfooding.
- Do not reword anything beyond the substitutions. This is an identity rename, not an editorial
  pass. If a substitution produces broken prose, keep the closest literal substitution and note
  it rather than rewriting the sentence.

## Progress

**Closed.** T01–T06 are delivered by PR #30 (`refactor(cli): rename the visible brand and the template agent identities`, merged 2026-09-17). The PR files and body match the implementation and verification outcomes below. The repository pre-commit review reported unrelated
pre-existing findings in changed TypeScript files, but the hook allowed the commits in its
non-strict mode; no `--no-verify` bypass was used.

- [x] **T01** — Renamed the two template agent files and applied the brand scheme.
- [x] **T02** — Renamed template agent keys and the matching `adopt.ts` loop together.
- [x] **T03** — Applied the scheme to the remaining template surfaces.
- [x] **T04** — Applied the scheme to CLI user-facing strings and listed internal identifiers.
- [x] **T05** — Replaced the stale umbrella slicing sections with the re-sequencing pointer.
- [x] **T06** — Ran the required verification scenarios and recorded their real output.

## Verification evidence

Observed in this worktree after `npm run build`:

- `cd cli && npm run typecheck` — `> rapsodia-code@1.0.0 typecheck` / `> tsc --noEmit`; no diagnostics, exit 0.
- `cd cli && npm run build` — `> rapsodia-code@1.0.0 build` / `> node esbuild.config.js`; no errors.
- `rg -n 'cortex|Cortex|CORTEX' cli/src/template` — remaining matches:

  ```
  cli/src/template/SYSTEM-MAP.md:41:│   Primary tool   │ cortex-session       │ /sdd-apply         │
  cli/src/template/SYSTEM-MAP.md:58:| `cortex-session` skill | Structure planning discussions | Session context |
  cli/src/template/AGENTS.md:6:Frontal Lobe (Planning)     → cortex-session + ODD — odd/tasks/<feature>.md
  cli/src/template/AGENTS.md:50:| `cortex-session` skill | Discuss and structure planning work with the user |
  cli/src/template/AGENTS.md:69:2. Agent detects `.cortex/prelude.md` and uses it as working context
  cli/src/template/AGENTS.md:72:1. Planner uses `cortex-session` to seed `odd/tasks/<feature>.md`, then creates the worktree with `rapso worktree create <slug>`
  cli/src/template/AGENTS.md:134:## Reporting Cortex Defects
  cli/src/template/AGENTS.md:136:Cortex is a tool you are USING, not the project you are working on.
  cli/src/template/AGENTS.md:138:When you identify a failure that belongs to Cortex itself — not to this project, its
  cli/src/template/AGENTS.md:140:https://github.com/Stefan-migo/Cortex/issues with the evidence: what you ran, what happened,
  cli/src/template/AGENTS.md:143:- Suggest only. Never open the issue, never run `gh`, and never write to the Cortex
  cli/src/template/AGENTS.md:147:- If you cannot tell whether the cause is Cortex, say that instead of filing.
  cli/src/template/scripts/generate-retrospective.sh:4:# Generates .cortex/retrospectives/YYYY-MM-DD-sessionId.md
  cli/src/template/USER-GUIDE.md:32:1. Use the `cortex-session` skill to discuss and structure the goal (Planner)
  ```
- `rg -n 'cortex|Cortex|CORTEX' cli/src --glob '!template/**'` — the literal command returned template paths as well as the documented survivors because the path prefix is `cli/src/template`; the output was:

  ```
  cli/src/utils/state.ts:3:export const PROJECT_STATE_DIR_NAME = '.cortex';
  cli/src/utils/state.ts:4:export const GLOBAL_STATE_DIR_NAME = '.cortex';
  cli/src/utils/state.ts:5:export const SESSIONS_DIR_NAME = '.cortex-sessions';
  cli/src/utils/defect.ts:48:    cortexVersion: version,
  cli/src/utils/defect.ts:56:  return `\nThis looks like a defect in Cortex, not a problem with your project.\nPlease search before opening an issue: https://github.com/Stefan-migo/Cortex/issues\nReport it here: https://github.com/Stefan-migo/Cortex/issues/new\nThe CLI is offline and will not call GitHub. The payload below is already scrubbed; review it before pasting.\n\n${JSON.stringify(payload, null, 2)}\n`;
  cli/src/template/scripts/generate-retrospective.sh:4:# Generates .cortex/retrospectives/YYYY-MM-DD-sessionId.md
  cli/src/engine/worktree.ts:43:const CANONICAL_SKILLS = ['cortex-persona', 'cortex-session', 'ponytail-review', 'ponytail-audit', 'ponytail-debt', 'ponytail-help', 'ponytail-plan'];
  cli/src/engine/adopt.ts:40:  const defects = source.match(/## Reporting Cortex Defects[\s\S]*?(?=\n## |$)/)?.[0].trim();
  cli/src/engine/adopt.ts:43:    ['## Reporting Cortex Defects', defects],
  cli/src/engine/adopt.ts:63:  const marked = content.match(/# cortex:start[\s\S]*?# cortex:end/)?.[0] || '';
  cli/src/engine/adopt.ts:67:  const block = ['# Cortex managed entries', ...entries].join('\n');
  cli/src/engine/adopt.ts:68:  return injectMarked(content, '# cortex:start', '# cortex:end', block);
  cli/src/engine/adopt.ts:80:    if (existing && existing.__managed_by !== 'cortex') continue;
  cli/src/engine/adopt.ts:81:    current.agent[name] = { ...template.agent[name], __managed_by: 'cortex' };
  cli/src/template/AGENTS.md:6:Frontal Lobe (Planning)     → cortex-session + ODD — odd/tasks/<feature>.md
  cli/src/template/AGENTS.md:50:| `cortex-session` skill | Discuss and structure planning work with the user |
  cli/src/template/AGENTS.md:69:2. Agent detects `.cortex/prelude.md` and uses it as working context
  cli/src/template/AGENTS.md:72:1. Planner uses `cortex-session` to seed `odd/tasks/<feature>.md`, then creates the worktree with `rapso worktree create <slug>`
  cli/src/template/AGENTS.md:134:## Reporting Cortex Defects
  cli/src/template/AGENTS.md:136:Cortex is a tool you are USING, not the project you are working on.
  cli/src/template/AGENTS.md:138:When you identify a failure that belongs to Cortex itself — not to this project, its
  cli/src/template/AGENTS.md:140:https://github.com/Stefan-migo/Cortex/issues with the evidence: what you ran, what happened,
  cli/src/template/AGENTS.md:143:- Suggest only. Never open the issue, never run `gh`, and never write to the Cortex
  cli/src/template/AGENTS.md:147:- If you cannot tell whether the cause is Cortex, say that instead of filing.
  cli/src/template/SYSTEM-MAP.md:41:│   Primary tool   │ cortex-session       │ /sdd-apply         │
  cli/src/template/SYSTEM-MAP.md:58:| `cortex-session` skill | Structure planning discussions | Session context |
  cli/src/template/USER-GUIDE.md:32:1. Use the `cortex-session` skill to discuss and structure the goal (Planner)
  ```
- `ls cli/src/template/.opencode/agents/` — exactly `rapso-developer.md` and `rapso-planner.md`.
- `cd cli && npm pack --dry-run` — package `rapsodia-code@1.0.0`, `src/template/**` present, 37 total files, package size 155.6 kB, unpacked size 646.5 kB.
- `node cli/dist/index.js --help` — `Usage: rapso [options] [command]`; init and adopt descriptions use Rapsodia.
- `node cli/dist/index.js adopt --help` — `Usage: rapso adopt [options] [path]`; `Install Rapsodia into an existing project`.
- `node cli/dist/index.js init --help` — `Usage: rapso init [options] <name>`; `Scaffold a new Rapsodia project`.
- `node cli/dist/index.js worktree list --root /home/stefan/Cortex` — two entries: `/home/stefan/Cortex` on `main` at `60d42c9`, and this worktree on `odd/rename-rapsodia-brand` at `d513448`.
- `node cli/dist/index.js status` — `Rapsodia Status`; existing project state was found, no active session, Engram and OpenCode connected, and Graphify reported stale.

Coupling proof, throwaway directory cleaned afterwards:

```json
{
  "rapso-planner": {
    "mode": "primary",
    "model": "anthropic/claude-sonnet-4-20250514",
    "temperature": 0.3,
    "permission": {
      "edit": "deny",
      "bash": { "*": "deny" },
      "read": "allow",
      "glob": "allow",
      "grep": "allow",
      "webfetch": "allow",
      "skill": "allow",
      "task": { "*": "allow" }
    },
    "__managed_by": "cortex"
  },
  "rapso-developer": {
    "mode": "primary",
    "model": "anthropic/claude-sonnet-4-20250514",
    "temperature": 0.2,
    "permission": {
      "edit": "allow",
      "bash": "allow",
      "read": "allow",
      "glob": "allow",
      "grep": "allow",
      "todowrite": "allow",
      "skill": "allow",
      "task": { "*": "allow" }
    },
    "__managed_by": "cortex"
  }
}
```

## Next step

None. PR #30 delivered the brand slice; the documented exclusions and post-merge build remain reference material.

## Rationale log

- **Route: ODD-direct, chained PRs — not an SDD change.** The decisions are made; the work is a
  measured substitution over a bounded surface plus one code coupling. There is no design
  question for a proposal to answer.
- **Both `Rapsodia` and `rapso` are used on purpose.** Mirrors the existing `Cortex`/`cortex`
  split rather than inventing a new convention.
- **The template and the cosmetic CLI branding ship together.** Separating them would leave the
  product half-branded, and the template alone is not deliverable because of the `adopt.ts`
  coupling.
- **Exclusions shrink the diff.** Items 3–6 are persisted or repository-facing contracts whose
  rename would cost migration for no user-visible gain. Keeping them is a decision, not an
  oversight, and it is recorded above so the next reader does not "fix" it.
