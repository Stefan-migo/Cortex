#!/usr/bin/env bash
set -euo pipefail

CORTEX_PACK_DIR="${CORTEX_PACK_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"

# Parse flags
INSTALL_GLOBAL=false
POSITIONAL_ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --install-global)
      INSTALL_GLOBAL=true
      shift
      ;;
    *)
      POSITIONAL_ARGS+=("$1")
      shift
      ;;
  esac
done

PROJECT_DIR="${POSITIONAL_ARGS[0]:-.}"
PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"

# ─── 0. Global install (--install-global flag) ──────────────────────────────
if [ "$INSTALL_GLOBAL" = true ]; then
  GLOBAL_CMD_DIR="${HOME}/.config/opencode/commands"
  mkdir -p "$GLOBAL_CMD_DIR"
  if [ -f "$CORTEX_PACK_DIR/commands/cortex-init.md" ]; then
    cp "$CORTEX_PACK_DIR/commands/cortex-init.md" "$GLOBAL_CMD_DIR/cortex-init.md"
    echo "✅ /cortex-init command instalado globalmente en $GLOBAL_CMD_DIR"
    echo ""
  fi
fi

echo "🧠 Inicializando Cortex en $(basename "$PROJECT_DIR")"
echo ""

# ─── 1. Check prerequisites ────────────────────────────────────────────────
echo "🔍 Verificando prerequisites..."
MISSING=""
if ! command -v opencode &>/dev/null; then
  echo "  ⚠️  opencode no encontrado."
  MISSING=1
fi
if ! command -v engram &>/dev/null; then
  echo "  ⚠️  engram no encontrado. Corré: gentle-ai install --agent opencode"
  MISSING=1
fi
echo ""

# ─── 2. Link skills to project ─────────────────────────────────────────────
echo "📂 Instalando skills Cortex..."

mkdir -p "$PROJECT_DIR/.opencode/skills"

link_skill() {
  local name="$1"
  local src="$CORTEX_PACK_DIR/skills/$name"
  local target="$PROJECT_DIR/.opencode/skills/$name"
  if [ -f "$src/SKILL.md" ]; then
    if [ -d "$target" ] && [ ! -L "$target" ]; then
      echo "  ⚠️  $name existe como directorio local — no se sobreescribe"
    else
      ln -sf "$src" "$target" && echo "  ✅ $name skill instalado"
    fi
  fi
}

link_skill "rapso-persona"
link_skill "ponytail-plan"
for s in ponytail-review ponytail-audit ponytail-debt ponytail-help; do
  link_skill "$s"
done
link_skill "rapso-session"

echo ""

# ─── 3. Build Graphify graph ───────────────────────────────────────────────
echo "📊 Configurando Graphify..."

if command -v graphify &>/dev/null; then
  if [ ! -f "$PROJECT_DIR/graphify-out/GRAPH_REPORT.md" ]; then
    echo "  Construyendo grafo de conocimiento inicial..."
    (cd "$PROJECT_DIR" && graphify . --quiet 2>&1 || true)
    echo "  ✅ Grafo listo en graphify-out/"
  else
    echo "  ✅ Grafo existente en graphify-out/"
  fi
  echo "  💡 Actualizá con: graphify . --watch (solo AST, sin costo)"
else
  echo "  ⚠️  graphify no encontrado. Instalálo: pip install graphify"
fi

echo ""

# ─── 4. Add Graphify MCP to project opencode.json ──────────────────────────
if [ "${CORTEX_WORKTREE_PROVISION:-false}" = true ]; then
  echo "  ⏭️  Skipping legacy tracked-config mutation for worktree provisioning"
else
echo "🔌 Agregando Graphify MCP a la configuración de OpenCode..."

mkdir -p "$PROJECT_DIR/.opencode"
MCP_FILE="$PROJECT_DIR/.opencode/opencode.json"

# Leer config existente o crear nueva
if [ -f "$MCP_FILE" ]; then
  EXISTING=$(cat "$MCP_FILE")
else
  EXISTING='{"$schema":"https://opencode.ai/config.json"}'
fi

# Merge Graphify MCP usando Python
echo "$EXISTING" > "$PROJECT_DIR/.opencode/_cortex_mcp_tmp.json"
python3 -c "
import json, os

src = '$PROJECT_DIR/.opencode/_cortex_mcp_tmp.json'
with open(src) as f:
    data = json.load(f)

project_dir = '$PROJECT_DIR'
cortex_dir = '$CORTEX_PACK_DIR'

mcp = data.setdefault('mcp', {})
if 'graphify' not in mcp:
    mcp['graphify'] = {
        'type': 'local',
        'enabled': True,
        'command': ['graphify', 'mcp', '--project-dir', project_dir],
        '_description': 'Graphify — knowledge graph queries via MCP'
    }

plugin_path = os.path.join(cortex_dir, '.opencode/plugins/graphify.js')
if os.path.exists(plugin_path) and 'plugin' not in data:
    data['plugin'] = [plugin_path]

with open(src, 'w') as f:
    json.dump(data, f, indent=2)
"
mv "$PROJECT_DIR/.opencode/_cortex_mcp_tmp.json" "$MCP_FILE"
echo "  ✅ Graphify MCP agregado a .opencode/opencode.json"
fi

echo ""

# ─── 5. Create AGENTS.md with persona reference ────────────────────────────
echo "📝 Creando AGENTS.md con identidad Cortex..."

AGENTS_FILE="$PROJECT_DIR/AGENTS.md"
if [ ! -f "$AGENTS_FILE" ]; then
  cat > "$AGENTS_FILE" << 'PERSONA'
<!--
gentle-ai:persona
-->
## Rules

- Never add "Co-Authored-By" or AI attribution to commits. Use conventional commits only.
- This project uses the Cortex skill pack. `rapso-persona` is linked into `.opencode/skills/`,
  so it appears in the session's skill list and the skill-loading check below applies to it.
- For detailed persona rules, see .opencode/skills/rapso-persona/SKILL.md

## Contextual Skill Loading (MANDATORY)

The session's skill list is authoritative. Before responding, check whether the request matches a
listed skill and read that skill's `SKILL.md` first; load
`.opencode/skills/rapso-persona/SKILL.md` at the start of every session. That skill defines:
- Senior architect identity (Rioplatense Spanish in chat, English in artifacts)
- Ponytail over-engineering rules (YAGNI → stdlib → native → one line → minimum)
- 5-Step Execution Gate (Graph Check → Atomic Commit → Verify → Spec Check → Finalize)
- Graphify knowledge graph integration
- Graphify before code work; Ponytail rules while writing code (ODD's Implement step)
- See rapso-persona/SKILL.md → "SDD Pipeline Integration" section

## Skills

| Command | What it does |
|---------|-------------|
| `/rapso-session` | Planning sessions with automatic decision capture to Engram |
| `/ponytail-plan` | Review plans/designs/tasks for over-engineering |
| `/ponytail-review` | Review code diff for over-engineering |
| `/ponytail-audit` | Audit full repo for bloat |
| `/ponytail-debt` | Harvest `ponytail:` shortcuts into a debt ledger |
| `/ponytail-help` | Quick-reference card for all ponytail commands |
PERSONA
  echo "  ✅ AGENTS.md creado con referencia a rapso-persona"
else
  echo "  ✅ AGENTS.md ya existe — no se sobreescribe"
fi

echo ""

# ─── 6. Refresh skill registry ─────────────────────────────────────────────
echo "🗂️  Actualizando skill registry..."

# Escribir .atl/skill-registry.md directamente
mkdir -p "$PROJECT_DIR/.atl"
export SKILLS_BASE="$PROJECT_DIR/.opencode/skills"
export CORTEX_SRC="$CORTEX_PACK_DIR"
export SKILL_REGISTRY_FILE="$PROJECT_DIR/.atl/skill-registry.md"

python3 << 'PYEOF'
import os

skills_base = os.environ['SKILLS_BASE']
cortex_src = os.environ['CORTEX_SRC']
reg_path = os.environ['SKILL_REGISTRY_FILE']

registry = []
for name in ['rapso-persona', 'rapso-session', 'ponytail-review', 'ponytail-audit', 'ponytail-debt', 'ponytail-help', 'ponytail-plan']:
    skill_file = os.path.join(skills_base, name, 'SKILL.md')
    if os.path.exists(skill_file):
        registry.append({
            'name': name,
            'path': skill_file,
            'scope': 'project'
        })

with open(reg_path, 'w') as f:
    f.write('# Skill Registry — cortex-init\n\n')
    f.write(f'Source: Cortex pack at {cortex_src}\n')
    f.write(f'Indexed: {len(registry)} skills\n\n')
    f.write('| Name | Path | Scope |\n')
    f.write('|------|------|-------|\n')
    for s in registry:
        f.write(f'| {s["name"]} | {s["path"]} | {s["scope"]} |\n')
    f.write('\n')
    f.write('<!-- generated by cortex-init.sh -->\n')

print(f'  ✅ {len(registry)} skills indexados en .atl/skill-registry.md')
PYEOF

# También intentar con gentle-ai si está disponible
if command -v gentle-ai &>/dev/null; then
  gentle-ai skill-registry refresh --cwd "$PROJECT_DIR" 2>/dev/null && \
    echo "  ✅ gentle-ai skill-registry refresheado" || true
fi

# Agregar .atl/ y .rapsodia-code/sessions/ al .gitignore
GITIGNORE="$PROJECT_DIR/.gitignore"
ensure_gitignore() {
  local pattern="$1"
  if [ -f "$GITIGNORE" ]; then
    if ! grep -qF "$pattern" "$GITIGNORE" 2>/dev/null; then
      echo "$pattern" >> "$GITIGNORE"
      echo "  ✅ $pattern agregado a .gitignore"
    fi
  else
    echo "$pattern" > "$GITIGNORE"
    echo "  ✅ .gitignore creado con $pattern"
  fi
}
ensure_gitignore '/.atl/'
ensure_gitignore '/.rapsodia-code/sessions/'

echo ""

# ─── 7. Install /cortex-init command in project ────────────────────────────
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

# ─── 8. Summary and next steps ─────────────────────────────────────────────
echo "🎯 ¡Cortex listo en $(basename "$PROJECT_DIR")!"
echo ""
echo "Resumen:"
echo "  Skills:      $(ls -d "$PROJECT_DIR/.opencode/skills/"*/ 2>/dev/null | wc -l) enlazados"
echo "  Graphify:    $(test -f "$PROJECT_DIR/graphify-out/GRAPH_REPORT.md" && echo '✅ listo' || echo '⚠️  pendiente')"
echo "  MCP config:  $(test -f "$MCP_FILE" && echo '✅ configurado' || echo '⚠️  pendiente')"
echo "  AGENTS.md:   $(test -f "$AGENTS_FILE" && echo '✅ creado' || echo '⚠️  pendiente')"
echo "  Registry:    $(test -f "$SKILL_REGISTRY_FILE" && echo '✅ indexado' || echo '⚠️  pendiente')"
echo ""
echo "Próximos pasos:"
echo "  1. Abrí OpenCode en este directorio"
echo "  2. Ejecutá /sdd-init para inicializar SDD"
echo "  3. ¡A codificar!"
echo ""
echo "Comandos rápidos:"
echo "  graphify . --watch     → mantener grafo actualizado"
echo "  graphify query \"...\"   → consultar el grafo"
echo "  /rapso-session         → sesión de planeamiento con captura automática"
echo "  /ponytail-plan         → revisar sobreingeniería en planes/diseños/tareas"
echo "  /ponytail-review       → revisar sobreingeniería"
echo "  /ponytail-audit        → auditar bloat del repo"
