#!/usr/bin/env bash
set -euo pipefail

CORTEX_PACK_DIR="${CORTEX_PACK_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
PROJECT_DIR="${1:-.}"
PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"

echo "🧠 Inicializando Cortex en $(basename "$PROJECT_DIR")"
echo ""

# ─── 1. Check prerequisites ────────────────────────────────────────────────
echo "🔍 Verificando prerequisites..."

if ! command -v opencode &>/dev/null; then
  echo "  ⚠️  opencode no encontrado. Instalálo primero."
fi

if ! command -v engram &>/dev/null; then
  echo "  ⚠️  engram no encontrado. Corré: gentle-ai install --agent opencode"
fi

echo ""

# ─── 2. Link skills to project ─────────────────────────────────────────────
echo "📂 Instalando skills Cortex..."

mkdir -p "$PROJECT_DIR/.opencode/skills"

# Cortex persona skill
if [ -d "$CORTEX_PACK_DIR/skills/cortex-persona" ]; then
  TARGET="$PROJECT_DIR/.opencode/skills/cortex-persona"
  if [ ! -L "$TARGET" ] && [ ! -d "$TARGET" ]; then
    ln -sf "$CORTEX_PACK_DIR/skills/cortex-persona" "$TARGET"
    echo "  ✅ cortex-persona skill instalado"
  else
    echo "  ✅ cortex-persona skill ya existe"
  fi
fi

# Ponytail extra skills
for skill in ponytail-review ponytail-audit ponytail-debt ponytail-help; do
  TARGET="$PROJECT_DIR/.opencode/skills/$skill"
  SRC="$CORTEX_PACK_DIR/skills/$skill"
  if [ -d "$SRC" ]; then
    if [ ! -L "$TARGET" ] && [ ! -d "$TARGET" ]; then
      ln -sf "$SRC" "$TARGET"
      echo "  ✅ $skill skill instalado"
    else
      echo "  ✅ $skill skill ya existe"
    fi
  fi
done

echo ""

# ─── 3. Initialize Graphify ────────────────────────────────────────────────
echo "📊 Configurando Graphify..."

if command -v graphify &>/dev/null; then
  if [ ! -f "$PROJECT_DIR/graphify-out/GRAPH_REPORT.md" ]; then
    echo "  Construyendo grafo de conocimiento inicial..."
    (cd "$PROJECT_DIR" && graphify . --quiet 2>&1 || true)
    echo "  ✅ Grafo listo en graphify-out/"
    echo "  💡 Reconstruí con: graphify . --watch"
  else
    echo "  ✅ Grafo existente en graphify-out/"
    echo "  💡 Actualizá con: graphify . --watch (solo AST, sin costo)"
  fi
else
  echo "  ⚠️  graphify no encontrado. Instalálo con:"
  echo "     pip install graphify          # o"
  echo "     brew install graphify         # si está en un tap"
fi

echo ""

# ─── 4. Check opencode.json ────────────────────────────────────────────────
echo "⚙️  Verificando configuración de OpenCode..."

OPCODE_JSON="$PROJECT_DIR/opencode.json"
if [ -f "$OPCODE_JSON" ]; then
  echo "  ✅ opencode.json encontrado"
  echo "  💡 Si querés usar este projecto con cortex-planner, asegurate"
  echo "     de que la sección agent contenga cortex-planner y cortex-developer."
else
  echo "  ⚠️  No hay opencode.json en el proyecto."
  echo "     Creá uno o copiá el template desde $CORTEX_PACK_DIR/project-templates/"
fi

echo ""

# ─── 5. Suggest /sdd-init ──────────────────────────────────────────────────
echo "🎯 ¡Cortex listo en $(basename "$PROJECT_DIR")!"
echo ""
echo "Próximos pasos:"
echo "  1. Abrí OpenCode en este directorio"
echo "  2. Ejecutá /sdd-init para inicializar SDD"
echo "  3. ¡A codificar!"
# ─── 6. Install cortex-init command ─────────────────────────────────────────
echo "🔗 Instalando comando /cortex-init..."

mkdir -p "$PROJECT_DIR/.opencode/commands"
CMD_SRC="$CORTEX_PACK_DIR/commands/cortex-init.md"
CMD_TARGET="$PROJECT_DIR/.opencode/commands/cortex-init.md"
if [ -f "$CMD_SRC" ]; then
  if [ ! -f "$CMD_TARGET" ]; then
    cp "$CMD_SRC" "$CMD_TARGET"
    echo "  ✅ /cortex-init command instalado"
  else
    echo "  ✅ /cortex-init command ya existe"
  fi
fi

echo ""
echo "Comandos rápidos:"
echo "  graphify . --watch     → mantener grafo actualizado"
echo "  graphify query \"...\"   → consultar el grafo"
