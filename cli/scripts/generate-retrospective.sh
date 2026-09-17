#!/bin/bash
# scripts/generate-retrospective.sh
# Called by: cortex close --retrospective
# Generates .rapsodia-code/retrospectives/YYYY-MM-DD-sessionId.md
cortex close --retrospective "$@"
