# rapsodia-code

`rapso` is the command-line interface for scaffolding and managing Rapsodia project workflows. It also manages sessions, project adoption, analysis, and isolated ODD worktrees.

## Install

```bash
npm install -g rapsodia-code
```

Node.js 18 or newer is required.

## Quick start

```bash
rapso init demo --no-git --yes
rapso status
```

## Commands

| Command | Description |
|---------|-------------|
| `rapso init [options] <name>` | Scaffold a new Rapsodia project |
| `rapso install [options]` | Check and install dependencies |
| `rapso start [options]` | Start a session: load context and launch opencode |
| `rapso close [options]` | Close a session: summarize, export, cleanup |
| `rapso status [options]` | Show brain health overview |
| `rapso update [options]` | Update brain template from latest version |
| `rapso adopt [options] [path]` | Install Rapsodia into an existing project |
| `rapso analyze [options]` | Analyze session patterns and suggest improvements |
| `rapso worktree` | Create and manage isolated ODD worktrees |

Run `rapso <command> --help` for command-specific options. Run `rapso worktree --help` for its worktree operations.

## Repository

Source code and issue tracking: [github.com/Stefan-migo/Cortex](https://github.com/Stefan-migo/Cortex)

## License

MIT. See [LICENSE](LICENSE).
