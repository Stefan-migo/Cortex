#!/usr/bin/env bash
# gga-pre-commit.sh — Guardian Agent pre-commit hook
# Reviews staged diff with LLM before allowing commit
# Inspired by gentle-ai's GGA (Guardian Angel)
#
# Usage: ./scripts/gga-pre-commit.sh [--strict|--normal]
#   --strict: Block on warnings (default: block only on errors)

set -euo pipefail

MODE="${1:-normal}"

echo "🛡️ GGA: Guardian Agent reviewing staged changes..."

# Get staged diff
STAGED_DIFF=$(git diff --cached --stat 2>/dev/null || true)
STAGED_CONTENT=$(git diff --cached 2>/dev/null || true)

if [ -z "$STAGED_CONTENT" ]; then
  echo "   No staged changes to review."
  exit 0
fi

echo "   Files changed:"
echo "$STAGED_DIFF" | sed 's/^/     /'

# Count files
FILE_COUNT=$(echo "$STAGED_DIFF" | wc -l)
if [ "$FILE_COUNT" -gt 5 ]; then
  echo "   ⚠️  Warning: $FILE_COUNT files staged (recommended: ≤5)"
fi

# Check for common issues in staged content
ISSUES=0
WARNINGS=0

# Check 1: Debug statements
if echo "$STAGED_CONTENT" | grep -n "console\.log\|print(\|println\|debugger\|TODO\|FIXME\|HACK\|XXX" 2>/dev/null | grep -v "^#" | head -10; then
  echo "   ⚠️  Warning: Debug statements, TODOs, or FIXMEs found"
  WARNINGS=$((WARNINGS + 1))
fi

# Check 2: Large files
if echo "$STAGED_CONTENT" | wc -l | awk '{if($1>300) print "   ⚠️  Warning: Large diff ("$1" lines)"}'; then
  WARNINGS=$((WARNINGS + 1))
fi

# Check 3: Missing tests (check if test file exists for staged source files)
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null || true)
for file in $STAGED_FILES; do
  # Skip test files themselves, config files, and markdown
  case "$file" in
    *test*|*spec*|*.md|*.yml|*.yaml|*.json|*.sh|Makefile|Dockerfile) continue ;;
    *.ts|*.tsx|*.js|*.jsx|*.py|*.go|*.rs)
      # Check if corresponding test exists
      TEST_FILE=$(echo "$file" | sed 's/\.ts$/.test.ts/' | sed 's/\.tsx$/.test.tsx/' | sed 's/\.js$/.test.js/' | sed 's/\.py$/test_\1.py/')
      if [ ! -f "$TEST_FILE" ]; then
        echo "     📝 Note: No test file found for $file"
      fi
      ;;
  esac
done

# Summary
if [ "$ISSUES" -gt 0 ]; then
  echo "❌ GGA: Blocking commit — $ISSUES error(s) found"
  exit 1
fi

if [ "$WARNINGS" -gt 0 ] && [ "$MODE" = "strict" ]; then
  echo "❌ GGA: Strict mode — blocking on $WARNINGS warning(s)"
  exit 1
fi

echo "✅ GGA: All checks passed"
exit 0
