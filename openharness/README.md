# OpenHarness — cortex Runtime Alternativo

OpenHarness es un runtime de agente standalone (Python). No depende de OpenCode.

## Requisitos

- Python 3.10+
- Node.js 18+ (para la TUI React)
- API key de Claude, OpenAI, Copilot, o compatible

## Instalación

```bash
# Opción 1: pip
pip install openharness-ai

# Opción 2: one-click (Linux/macOS)
curl -fsSL https://raw.githubusercontent.com/HKUDS/OpenHarness/main/scripts/install.sh | bash
```

## Configuración

```bash
oh setup
```
Esto lanza un asistente interactivo para elegir provider (Claude, OpenAI, Copilot, etc.).

## Cómo usar cortex con OpenHarness

### Opción 1: System Prompt (recomendado)

OpenHarness inyecta automáticamente `AGENTS.md` del proyecto si existe. cortex ya tiene AGENTS.md con toda la arquitectura de lóbulos.

```bash
# Desde la raíz del proyecto cortex
cd /home/stefan/CortexPlugin

# Lanzar OpenHarness — detecta AGENTS.md automáticamente
oh
```

### Opción 2: Con MCP servers (Engram + Graphify)

```bash
# Lanzar con configuración MCP
oh --mcp-config openharness/mcp-config.json
```

### Opción 3: Modo no-interactivo

```bash
oh -p "Explícame la arquitectura de este proyecto"
```

## Skills disponibles

OpenHarness descubre skills automáticamente desde:
- `~/.openharness/skills/<skill>/SKILL.md`
- `~/.claude/skills/<skill>/SKILL.md`
- `<proyecto>/.openharness/skills/<skill>/SKILL.md`

Para instalar los skills de cortex globalmente:

```bash
mkdir -p ~/.openharness/skills
cp -r openharness/skills/* ~/.openharness/skills/
```

## Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `oh` | Lanzar TUI interactiva |
| `oh -p "prompt"` | Modo no-interactivo |
| `oh --dry-run` | Vista previa sin ejecutar |
| `oh setup` | Configurar provider |
| `oh provider list` | Listar providers |
| `oh provider use <name>` | Cambiar provider activo |
| `oh -s "system prompt"` | System prompt personalizado |

## Diferencia con OpenCode

| Aspecto | OpenCode (default) | OpenHarness |
|---------|-------------------|-------------|
| Runtime | Node.js + TS | Python |
| Config | .opencode/ | oh setup |
| Skills | .opencode/skills/ | .openharness/skills/ |
| MCP | opencode.json | --mcp-config JSON |
| TUI | Terminal nativa | React/Ink TUI |
| Plugins | anthropic/claude-code | Compatible |
