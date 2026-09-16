import { cpSync, existsSync, lstatSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { basename, dirname, join, relative, resolve } from 'path';

export interface WorktreeRecord {
  path: string;
  head: string;
  branch?: string;
}

function git(root: string, args: string[]): string {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function gitPath(root: string, args: string[]): string {
  return resolve(root, git(root, args));
}

function commandAvailable(command: string): boolean {
  try { execFileSync('which', [command], { stdio: 'ignore' }); return true; } catch { return false; }
}

function repositoryRoot(root: string): string {
  const candidate = resolve(root);
  return resolve(git(candidate, ['rev-parse', '--show-toplevel']));
}

export function isMainWorktree(root: string): boolean {
  const candidate = resolve(root);
  return gitPath(candidate, ['rev-parse', '--git-dir']) ===
    gitPath(candidate, ['rev-parse', '--git-common-dir']);
}

export function assertNotMainWorktree(root: string): void {
  if (isMainWorktree(root)) {
    throw new Error(`Refusing to operate on the main worktree: ${resolve(root)}`);
  }
}

function worktreePath(slug: string, root: string): string {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) throw new Error('Slug must contain lowercase letters, numbers, and hyphens.');
  const main = repositoryRoot(root);
  return join(dirname(main), `${basename(main)}-sdd-${slug}`);
}

export async function createWorktree(slug: string, root: string): Promise<string> {
  const main = repositoryRoot(root);
  if (!isMainWorktree(main)) throw new Error('Worktree creation must start from the main worktree.');
  const target = worktreePath(slug, main);
  if (existsSync(target)) throw new Error(`Worktree path already exists: ${target}`);

  git(main, ['fetch', 'origin', 'main']);
  git(main, ['worktree', 'add', '-b', `sdd/${slug}`, target, 'origin/main']);
  const branch = `branch.sdd/${slug}`;
  for (const key of ['merge', 'remote', 'mergeOptions', 'pushRemote']) {
    try { git(main, ['config', '--unset', `${branch}.${key}`]); } catch { /* absent config is expected */ }
  }
  return target;
}

function copyIfPresent(source: string, target: string): void {
  if (existsSync(source)) {
    mkdirSync(dirname(target), { recursive: true });
    cpSync(source, target, { recursive: true });
  }
}

function installDependencies(directory: string): void {
  if (existsSync(join(directory, 'package.json')) && existsSync(join(directory, 'package-lock.json'))) {
    execFileSync('npm', ['ci'], { cwd: directory, stdio: 'inherit' });
  }
}

function refreshRegistry(worktree: string, mainRoot: string): void {
  if (commandAvailable('gentle-ai')) {
    execFileSync('gentle-ai', ['skill-registry', 'refresh', '--cwd', worktree], { cwd: worktree, stdio: 'ignore' });
  } else {
    const names = ['cortex-persona', 'cortex-session', 'ponytail-review', 'ponytail-audit', 'ponytail-debt', 'ponytail-help', 'ponytail-plan'];
    const rows = names
      .filter((name) => existsSync(join(worktree, 'skills', name, 'SKILL.md')))
      .map((name) => `| ${name} | ${join(worktree, '.opencode', 'skills', name, 'SKILL.md')} | project |`)
      .join('\n');
    mkdirSync(join(worktree, '.atl'), { recursive: true });
    writeFileSync(join(worktree, '.atl', 'skill-registry.md'), `# Skill Registry — worktree\n\nSource: ${mainRoot}\n\n| Name | Path | Scope |\n|------|------|-------|\n${rows}\n`);
  }
}

export function provisionWorktree(worktree: string, mainRoot: string): void {
  const target = repositoryRoot(worktree);
  const main = repositoryRoot(mainRoot);
  assertNotMainWorktree(target);
  if (target === main) throw new Error('Provisioning requires a separate worktree.');
  if (gitPath(target, ['rev-parse', '--git-common-dir']) !== gitPath(main, ['rev-parse', '--git-common-dir'])) {
    throw new Error('Worktree does not belong to the requested main repository.');
  }

  const graphSource = join(main, 'graphify-out');
  if (existsSync(graphSource) && existsSync(join(graphSource, 'GRAPH_REPORT.md'))) {
    const graphSnapshot = join(target, 'graphify-out');
    rmSync(graphSnapshot, { recursive: true, force: true });
    copyIfPresent(graphSource, graphSnapshot);
  }
  copyIfPresent(join(main, '.opencode', 'package.json'), join(target, '.opencode', 'package.json'));
  copyIfPresent(join(main, '.opencode', 'package-lock.json'), join(target, '.opencode', 'package-lock.json'));
  copyIfPresent(join(main, '.opencode', 'tools', 'package.json'), join(target, '.opencode', 'tools', 'package.json'));
  copyIfPresent(join(main, '.opencode', 'tools', 'package-lock.json'), join(target, '.opencode', 'tools', 'package-lock.json'));
  installDependencies(join(target, '.opencode'));
  installDependencies(join(target, '.opencode', 'tools'));

  const skillsDir = join(target, '.opencode', 'skills');
  mkdirSync(skillsDir, { recursive: true });
  for (const entry of ['cortex-persona', 'cortex-session', 'ponytail-review', 'ponytail-audit', 'ponytail-debt', 'ponytail-help', 'ponytail-plan']) {
    const link = join(skillsDir, entry);
    if (existsSync(link) || (() => { try { lstatSync(link); return true; } catch { return false; } })()) rmSync(link, { recursive: true, force: true });
    symlinkSync(join('..', '..', 'skills', entry), link);
  }

  copyIfPresent(join(main, 'commands'), join(target, '.opencode', 'commands'));
  refreshRegistry(target, main);
  for (const file of ['.env.local', 'projects.txt']) {
    const link = join(target, file);
    if (existsSync(link) || (() => { try { lstatSync(link); return true; } catch { return false; } })()) rmSync(link, { force: true });
    if (existsSync(join(main, file))) symlinkSync(relative(target, main) + '/' + file, link);
  }
  mkdirSync(join(target, '.cortex'), { recursive: true });
  writeFileSync(join(target, '.cortex', 'worktree.json'), JSON.stringify({ branch: git(target, ['branch', '--show-current']), source: main, provisionedAt: new Date().toISOString() }, null, 2) + '\n');
}

export function listWorktrees(root: string): WorktreeRecord[] {
  const output = git(repositoryRoot(root), ['worktree', 'list', '--porcelain']);
  return output.split('\n\n').filter(Boolean).map((block) => {
    const path = block.match(/^worktree (.+)$/m)?.[1];
    const head = block.match(/^HEAD (.+)$/m)?.[1];
    const branch = block.match(/^branch refs\/heads\/(.+)$/m)?.[1];
    if (!path || !head) throw new Error('Invalid git worktree porcelain output.');
    return { path, head, branch };
  });
}

export function cleanupWorktree(slug: string, root: string, remote: boolean): void {
  const main = repositoryRoot(root);
  const target = worktreePath(slug, main);
  git(main, ['worktree', 'remove', target]);
  git(main, ['branch', '-d', `sdd/${slug}`]);
  if (remote) git(main, ['push', 'origin', '--delete', `sdd/${slug}`]);
}
