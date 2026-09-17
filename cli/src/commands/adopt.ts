import { existsSync } from 'fs';
import { resolve, join } from 'path';
import * as readline from 'readline';
import { adoptProject, isDirty } from '../engine/adopt';
import { error, heading, info, success, warn } from '../utils/logger';

interface AdoptOptions { dryRun?: boolean; yes?: boolean; force?: boolean; }
const TEMPLATE_DIR = join(__dirname, '..', 'template');

function promptYesNo(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolveAnswer) => rl.question(`${question} (y/N): `, (answer) => { rl.close(); resolveAnswer(/^y(es)?$/i.test(answer.trim())); }));
}

export async function adoptCommand(path: string | undefined, options: AdoptOptions): Promise<void> {
  const targetDir = resolve(path || process.cwd());
  if (!existsSync(targetDir)) { error(`Directory not found: ${targetDir}`); process.exit(1); }
  if (isDirty(targetDir)) {
    // A hard refusal here would make adopt impossible to re-run: adopt itself leaves the
    // working tree dirty, so the second run would always need --force. The structural
    // protections already cover the real risk — adopt writes only its own tracked files and
    // the marked blocks inside files the project owns, and a user-modified owned file is a
    // conflict that is prompted for. So this informs instead of blocking.
    warn('Working tree is dirty. Cortex writes only its own tracked files and the marked blocks inside files you own, so uncommitted work elsewhere is left alone.');
  }
  if (!options.yes && !options.dryRun && !(await promptYesNo(`Adopt Cortex into "${targetDir}"?`))) { info('Adoption cancelled.'); return; }
  const plan = adoptProject(targetDir, options, TEMPLATE_DIR);
  heading(options.dryRun ? 'Cortex Adoption Plan (dry run)' : 'Cortex Adoption');
  for (const [label, items] of [['Created', plan.created], ['Refreshed', plan.refreshed], ['Injected', plan.injected], ['Seeded', plan.seeded], ['Skipped', plan.skipped]] as const) {
    info(`${label} (${items.length}):`); items.forEach((item) => info(`  ${item}`));
  }
  if (options.dryRun) warn('Dry run — no changes applied.'); else success('Cortex adopted successfully.');
}
