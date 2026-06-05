#!/usr/bin/env bash
# backup.sh — Snapshot cortex configuration before major changes
# Usage: ./scripts/backup.sh [name]
#   Creates a timestamped backup of all config files

set -euo pipefail

BACKUP_NAME="${1:-auto-$(date +%Y%m%d-%H%M%S)}"
BACKUP_DIR=".cortex/backups/$BACKUP_NAME"

echo "💾 Backup: Saving configuration snapshot to $BACKUP_DIR"

mkdir -p "$BACKUP_DIR"

# What we back up
FILES_TO_BACKUP=(
  "opencode.json"
  "AGENTS.md"
  "DESIGN.md"
  "SYSTEM-MAP.md"
  "USER-GUIDE.md"
  ".opencode/opencode.json"
)

for file in "${FILES_TO_BACKUP[@]}"; do
  if [ -f "$file" ]; then
    mkdir -p "$BACKUP_DIR/$(dirname "$file")"
    cp "$file" "$BACKUP_DIR/$file"
    echo "   ✓ $file"
  else
    echo "   - $file (not found, skipped)"
  fi
done

# Also backup the openharness config if it exists
if [ -d "openharness" ]; then
  cp -r openharness "$BACKUP_DIR/openharness" 2>/dev/null && echo "   ✓ openharness/"
fi

# Save current git HEAD
git rev-parse HEAD > "$BACKUP_DIR/HEAD" 2>/dev/null || true

echo ""
echo "✅ Backup complete: $BACKUP_DIR"
echo "   Restore with: ./scripts/rollback.sh $BACKUP_NAME"
