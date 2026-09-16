import { Command } from 'commander';
import { cleanupWorktree, createWorktree, listWorktrees, provisionWorktree } from '../engine/worktree';

interface CreateOptions { yes?: boolean; root?: string }

function rootOf(root?: string): string { return root || process.cwd(); }
function output(value: unknown): void { console.log(JSON.stringify(value)); }

async function create(slug: string, options: CreateOptions): Promise<void> {
  if (!options.yes) {
    if (!process.stdin.isTTY) throw new Error('Consent is required; refusing non-interactive worktree creation.');
    process.stdout.write(`Create and provision worktree sdd/${slug}? (y/N): `);
    const accepted = await new Promise<boolean>((resolve) => {
      process.stdin.once('data', (data) => {
        resolve(['y', 'yes'].includes(data.toString().trim().toLowerCase()));
      });
    });
    if (!accepted) { output({ accepted: false, created: false }); return; }
  }
  const root = rootOf(options.root);
  const path = await createWorktree(slug, root);
  try {
    provisionWorktree(path, root);
  } catch (error) {
    try { cleanupWorktree(slug, root, false); } catch { /* preserve the provisioning failure */ }
    throw error;
  }
  output({ accepted: true, created: true, path, branch: `sdd/${slug}` });
}

export function worktreeCommand(): Command {
  const command = new Command('worktree').description('Create and manage isolated SDD worktrees');
  command.command('create').argument('<slug>').option('--yes', 'confirm creation without prompting').option('--root <path>', 'main repository root').action(create);
  command.command('provision').argument('<path>').option('--root <path>', 'main repository root').action((path, options: { root?: string }) => {
    provisionWorktree(path, rootOf(options.root)); output({ provisioned: true, path });
  });
  command.command('list').option('--root <path>', 'repository root').action((options: { root?: string }) => output(listWorktrees(rootOf(options.root))));
  command.command('cleanup').argument('<slug>').option('--remote', 'delete the remote branch').option('--root <path>', 'main repository root').action((slug, options: { remote?: boolean; root?: string }) => {
    cleanupWorktree(slug, rootOf(options.root), options.remote === true); output({ cleaned: true, slug });
  });
  return command;
}
