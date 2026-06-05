#!/usr/bin/env bash
# sdd-init.sh — Initialize a new SDD feature
# Usage: ./scripts/sdd-init.sh <feature-name> [description]

set -euo pipefail

FEATURE_NAME="${1:?Usage: sdd-init.sh <feature-name> [description]}"
DESCRIPTION="${2:-No description provided}"
FEATURE_DIR=".specify/features/$FEATURE_NAME"

if [ -d "$FEATURE_DIR" ]; then
  echo "Error: Feature '$FEATURE_NAME' already exists at $FEATURE_DIR"
  exit 1
fi

mkdir -p "$FEATURE_DIR"

# Create initial proposal placeholder
cat > "$FEATURE_DIR/proposal.md" << EOF
# $FEATURE_NAME

## Description
$DESCRIPTION

## User Stories
- 

## Acceptance Criteria
- [ ] 

## Risks & Edge Cases
- 

---

*Created by SDD init on $(date +%Y-%m-%d)*
EOF

echo "✅ SDD feature initialized: $FEATURE_DIR"
echo "   Next: Write proposal.md → run speckit.specify"
