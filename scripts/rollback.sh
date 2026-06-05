#!/usr/bin/env bash
# rollback.sh — Restore cortex configuration from backup
# Usage: ./scripts/rollback.sh <name>
#   Restores files from .cortex/backups/<name>/

set -euo pipefail

BACKUP_NAME="${1:?Usage: rollback.sh <backup-name>}"
BACKUP_DIR=".cortex/backups/$BACKUP_NAME"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ Error: Backup not found: $BACKUP_DIR"
  echo "   Available backups:"
  ls -1 ".cortex/backups/" 2>/dev/null || echo "   (no backups found)"
  exit 1
fi

echo "♻️  Rollback: Restoring from $BACKUP_DIR"

# Show backup metadata
if [ -f "$BACKUP_DIR/HEAD" ]; then
  HEAD_HASH=$(cat "$BACKUP_DIR/HEAD")
  echo "   Backup was taken at git commit: $HEAD_HASH"
fi

echo ""
echo "   Files to restore:"
find "$BACKUP_DIR" -type f -not -name "HEAD" | sed "s|$BACKUP_DIR/||" | sed 's/^/   ✓ /'

echo ""
read -p "   Continue with restore? [y/N] " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "   Cancelled."
  exit 0
fi

# Restore files
find "$BACKUP_DIR" -type f -not -name "HEAD" | while read -r file; do
  REL_PATH="${file#$BACKUP_DIR/}"
  TARGET_DIR=$(dirname "$REL_PATH")
  mkdir -p "$TARGET_DIR"
  cp "$file" "$REL_PATH"
  echo "   Restored: $REL_PATH"
done

echo ""
echo "✅ Rollback complete: $BACKUP_NAME"
echo "   If you also need to revert code changes, use: git revert HEAD"
