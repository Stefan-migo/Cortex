# Rapsodia

Rapsodia is the project workflow CLI published as [`rapsodia-code`](https://www.npmjs.com/package/rapsodia-code). Its `rapso` command scaffolds projects, manages sessions and dependencies, analyzes session patterns, installs Rapsodia into existing projects, and creates isolated ODD worktrees.

The repository is [Rapsodia](https://github.com/Stefan-migo/rapsodia-code).

## Install

```bash
npm install -g rapsodia-code
```

Node.js 18 or newer is required.

## Quick start

Create a project without interactive prompts or a Git repository:

```bash
rapso init demo --no-git --yes
rapso status
```

For an existing project, install the workflow files in place:

```bash
rapso adopt --yes
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

## Included skill pack

The repository also contains the skill pack used by generated projects. It provides the `rapso-persona` and `rapso-session` skills, Ponytail review skills, Graphify integration, Engram memory guidance, and the five-step execution gate. The CLI is the supported installation path for the project files; the skill pack is maintained here as the template content that Rapsodia manages.

## License

MIT. See [LICENSE](LICENSE).
