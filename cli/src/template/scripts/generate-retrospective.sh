#!/bin/bash
# scripts/generate-retrospective.sh
# Called by: rapso close --retrospective
# Generates .cortex/retrospectives/YYYY-MM-DD-sessionId.md
rapso close --retrospective "$@"
