#!/usr/bin/env bash
# cortex-sync.sh — push the Cortex pack into every project on your list.
#
# For each project it:
#   1. Copies the pack's skills into <project>/.opencode/skills/ (overwrite).
#   2. Migrates legacy flat .cortex-sessions/ into open|ready-for-sdd|archived.
#
# Idempotent. Git is your backup: review `git diff` before committing.
#
# Usage: scripts/cortex-sync.sh [--dry-run] [--projects <file>]
#
# Project list format (default: <pack>/projects.txt):
#   one path per line, '#' starts a comment, '~' expands to $HOME.

set -euo pipefail
shopt -s nullglob

PACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECTS_FILE="$PACK_DIR/projects.txt"
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)  DRY_RUN=1; shift ;;
    --projects) PROJECTS_FILE="${2:?--projects needs a file}"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

run() {
  if [[ $DRY_RUN -eq 1 ]]; then printf '    [dry-run] %s\n' "$*"; else "$@"; fi
}

[[ -f "$PROJECTS_FILE" ]] || { echo "Project list not found: $PROJECTS_FILE" >&2; exit 1; }

# Copy the pack's skills over the project's copies. Project-local skills that
# the pack does not own (e.g. component-adapter) are left untouched.
sync_skills() {
  local target="$1/.opencode/skills"
  [[ -d "$target" ]] || { echo "  - no .opencode/skills, skipped"; return 0; }
  local src name dest
  for src in "$PACK_DIR"/skills/*/; do
    name="$(basename "$src")"
    [[ -f "$src/SKILL.md" ]] || continue
    dest="$target/$name"
    [[ -L "$dest" ]] && run rm -f "$dest"
    run mkdir -p "$dest"
    run cp "$src/SKILL.md" "$dest/SKILL.md"
    echo "    skill: $name"
  done
}

# Legacy flat sessions -> open|ready-for-sdd|archived. Idempotent.
migrate_sessions() {
  local root="$1/.cortex-sessions"
  [[ -d "$root" ]] || { echo "  - no .cortex-sessions, skipped"; return 0; }
  run mkdir -p "$root/open" "$root/ready-for-sdd" "$root/archived"
  local d name dest moved=0
  for d in "$root"/*/; do
    name="$(basename "$d")"
    case "$name" in open|ready-for-sdd|archived) continue ;; esac
    if [[ -f "$d/session.md" && ! -f "$d/report.md" ]]; then
      dest="$root/open/$name"
    else
      dest="$root/archived/$name"
    fi
    run mv "$d" "$dest"
    echo "    session: $name -> $(basename "$(dirname "$dest")")/"
    moved=$((moved + 1))
  done
  [[ $moved -eq 0 ]] && echo "    session: already migrated"
  return 0
}

echo "Cortex sync"
echo "  pack: $PACK_DIR"
echo "  list: $PROJECTS_FILE"
[[ $DRY_RUN -eq 1 ]] && echo "  mode: dry-run (nothing is written)"
echo

while IFS= read -r raw || [[ -n "$raw" ]]; do
  line="${raw%%#*}"
  line="$(printf '%s' "$line" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
  [[ -z "$line" ]] && continue
  project="${line/#\~/$HOME}"
  echo "▶ $project"
  if [[ ! -d "$project" ]]; then
    echo "  - not found, skipped"
    echo
    continue
  fi
  sync_skills "$project"
  migrate_sessions "$project"
  echo
done < "$PROJECTS_FILE"

echo "Done."
