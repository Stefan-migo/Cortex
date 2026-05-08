#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init';
import { installCommand } from './commands/install';
import { startCommand } from './commands/start';
import { closeCommand } from './commands/close';
import { statusCommand } from './commands/status';
import { updateCommand } from './commands/update';
import { analyzeCommand } from './commands/analyze';

const program = new Command();

program
  .name('cortex')
  .description('Cortex brain manager — scaffold and manage Cortex projects')
  .version('1.0.0');

program
  .command('init')
  .description('Scaffold a new Cortex project')
  .argument('<name>', 'project name')
  .option('--template <type>', 'project template type (default, api, web, cli, lib)', 'default')
  .option('--no-git', 'skip git init')
  .option('--yes', 'skip prompts (auto mode)')
  .option('--force', 'overwrite existing directory')
  .action(async (name, options) => {
    await initCommand(name, options);
  });

program
  .command('install')
  .description('Check and install dependencies')
  .option('--check', 'check only, do not install')
  .action(async (options) => {
    await installCommand(options);
  });

program
  .command('start')
  .description('Start a session: load context and launch opencode')
  .option('--no-prelude', 'skip context pre-load')
  .option('--no-open', 'prepare session without launching opencode')
  .option('--dry-run', 'show what would happen without launching')
  .action(async (options) => {
    await startCommand(options);
  });

program
  .command('close')
  .description('Close a session: summarize, export, cleanup')
  .option('--message <text>', 'session summary text')
  .option('--no-export', 'skip wiki export')
  .option('--retrospective', 'generate session retrospective')
  .action(async (options) => {
    await closeCommand(options);
  });

program
  .command('status')
  .description('Show brain health overview')
  .option('--json', 'output as JSON')
  .action(async (options) => {
    await statusCommand(options);
  });

program
  .command('update')
  .description('Update brain template from latest version')
  .option('--dry-run', 'show changes without applying')
  .option('--force', 'auto-apply all changes')
  .option('--check', 'check if updates are available')
  .action(async (options) => {
    await updateCommand(options);
  });

program
  .command('analyze')
  .description('Analyze session patterns and suggest improvements')
  .option('--json', 'output as JSON')
  .option('--sessions <n>', 'number of sessions to analyze', '10')
  .option('--dry-run', 'show what analysis would do without running')
  .action(async (options) => {
    await analyzeCommand(options);
  });

program.parse(process.argv);
