# cortex + OpenHarness — Quickstart

## 5 minutos para empezar

```bash
# 1. Instalar OpenHarness
pip install openharness-ai

# 2. Configurar provider (elige Claude, OpenAI, Copilot, etc.)
oh setup

# 3. Lanzar!
cd /home/stefan/CortexPlugin
oh
```

OpenHarness detecta automáticamente `AGENTS.md` de cortex y carga la arquitectura de lóbulos.

## Con Engram + Graphify

```bash
# En otra terminal, asegúrate que Engram y Graphify estén corriendo
engram mcp
graphify mcp

# Luego lanza oh con la config MCP
oh --mcp-config openharness/mcp-config.json
```

## Modo no-interactivo (scripts)

```bash
oh -p "Haz un análisis del código en src/"
oh -p "Explícame la estructura de lobulos" --output-format text
```

## Solución de problemas

| Problema | Solución |
|----------|----------|
| `oh: command not found` | `pip install openharness-ai` o `uv run oh` |
| Provider not configured | `oh setup` |
| MCP server not connecting | Verifica que `engram mcp` funciona aparte |
| Skills not loading | Copia skills a `~/.openharness/skills/` |
