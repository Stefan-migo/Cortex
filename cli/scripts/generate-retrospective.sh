#!/bin/bash
# scripts/generate-retrospective.sh
# Called by: rapso close --retrospective
# Generates .rapsodia-code/retrospectives/YYYY-MM-DD-sessionId.md
rapso close --retrospective "$@"
