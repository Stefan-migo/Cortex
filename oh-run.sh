#!/usr/bin/env bash
# oh-run.sh — Lanzar cortex con OpenHarness
# Usage: ./oh-run.sh [--mcp]

set -euo pipefail

MCP_FLAG=""

if [ "${1:-}" = "--mcp" ]; then
  MCP_FLAG="--mcp-config openharness/mcp-config.json"
  echo "🔌 Starting with MCP (Engram + Graphify)..."
fi

echo "🧠 cortex + OpenHarness"
echo "   AGENTS.md detected automatically"
echo ""

oh $MCP_FLAG
