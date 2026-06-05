# GGA — Guardian Agent

GGA (Guardian Agent) is a pre-commit hook that reviews staged changes before allowing commits. Inspired by gentle-ai's Guardian Angel.

## Purpose
- Catch debug statements (console.log, TODO, FIXME) before they reach the repo
- Enforce atomic commits (≤5 files per commit)
- Detect missing tests
- Flag unusually large diffs

## Installation

GGA is installed automatically by the git hooks configuration:
```bash
git config core.hooksPath .githooks
```

## Modes

| Mode | Command | Behavior |
|------|---------|----------|
| Normal | `scripts/gga-pre-commit.sh --normal` | Blocks on errors, warns on warnings |
| Strict | `scripts/gga-pre-commit.sh --strict` | Blocks on errors AND warnings |

## Skipping GGA

In rare cases (WIP commits, experimental branches), skip GGA:
```bash
git commit --no-verify -m "wip: experimental"
```

## Customization

Edit `.githooks/pre-commit` or `scripts/gga-pre-commit.sh` to add/remove checks.
