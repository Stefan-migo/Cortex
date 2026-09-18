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

The CLI ships the skills a generated project runs on, as template content under `.opencode/skills/`. `rapso init` writes them into a new project, `rapso adopt` installs them into an existing one, and `rapso update` refreshes them against the manifest.

| Skill | What it carries |
|---|---|
| `rapso-persona` | The Senior Architect identity, the Ponytail post-write check, the five-step execution gate, and Graphify integration |
| `rapso-session` | The structured planning-session protocol and its Engram capture rules |
| `ponytail-review`, `ponytail-audit`, `ponytail-debt`, `ponytail-help` | The post-write simplification check over written code, and its tooling |
| `bootstrap`, `design-system`, `graphify` | Project bootstrap, the UI design rules, and the knowledge-graph integration |

## License

MIT. See [LICENSE](LICENSE).
