import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, dirname, join, relative, resolve } from 'path';
import { collectFiles, hashFile, hashTemplateFile, substituteVariables, TemplateOptions } from './template';
import { Manifest, ManifestFile } from './manifest';
import { migrateLegacyState, sessionsDir, statePath, PROJECT_STATE_DIR_NAME } from '../utils/state';

export const OWNED_PATHS = [
  '.opencode/agents/**', '.opencode/tools/**',
  '.opencode/skills/**', '.opencode/mcp-template.json', '.opencode/package.json',
  '.opencode/package-lock.json', '.opencode/.gitignore',
];

export const NEVER_PATHS = ['DESIGN.md', 'SYSTEM-MAP.md', 'USER-GUIDE.md', 'wiki/**', 'scripts/**'];

const RAPSO_IGNORE_ENTRIES = [
  // The nested sessions store is already covered by the state directory contents rule.
  `${PROJECT_STATE_DIR_NAME}/`, 'graphify-out/',
  '.opencode/tools/node_modules/', '.engram/', '.obsidian/workspace.json',
  '.obsidian/workspace', '__pycache__/', '*.pyc',
  '*.pyo', '.pytest_cache/', '.ruff_cache/', '.mypy_cache/',
];

export interface AdoptPlan { created: string[]; refreshed: string[]; conflicting: string[]; injected: string[]; seeded: string[]; skipped: string[]; }

interface AdoptOptions { dryRun?: boolean; yes?: boolean; force?: boolean; }

function matches(path: string, pattern: string): boolean {
  if (pattern.endsWith('/**')) return path === pattern.slice(0, -3) || path.startsWith(pattern.slice(0, -2));
  return path === pattern;
}

function isOwned(path: string): boolean { return OWNED_PATHS.some((pattern) => matches(path, pattern)); }

function getDate(): string { return new Date().toISOString().split('T')[0]; }

function markdownSections(templateDir: string, options: TemplateOptions): Array<[string, string]> {
  const source = substituteVariables(readFileSync(join(templateDir, 'AGENTS.md'), 'utf-8'), options);
  const gate = source.match(/### 5-Step Execution Gate \(MANDATORY\)[\s\S]*?(?=\n### |\n## |$)/)?.[0].trim();
  const worktrees = source.match(/## ODD Worktrees[\s\S]*?(?=\n## |$)/)?.[0].trim();
  const defects = source.match(/## Reporting Cortex Defects[\s\S]*?(?=\n## |$)/)?.[0].trim();
  return [
    ['## ODD Worktrees', worktrees],
    ['## Reporting Cortex Defects', defects],
    ['### 5-Step Execution Gate (MANDATORY)', gate],
  ].filter((section): section is [string, string] => Boolean(section[1]));
}

function injectSections(content: string, sections: Array<[string, string]>): { content: string; changed: boolean } {
  const missing = sections.filter(([heading]) => !content.split(/\r?\n/).some((line) => line.trim() === heading));
  if (missing.length === 0) return { content, changed: false };
  const suffix = missing.map(([, section]) => section).join('\n\n');
  return { content: `${content.replace(/\s*$/, '')}\n\n${suffix}\n`, changed: true };
}

function injectMarked(content: string, start: string, end: string, block: string): { content: string; changed: boolean } {
  const marker = new RegExp(`${start}[\\s\\S]*?${end}`);
  const replacement = `${start}\n${block}\n${end}`;
  if (marker.test(content)) return { content: content.replace(marker, replacement), changed: content.replace(marker, replacement) !== content };
  return { content: `${content.replace(/\s*$/, '')}\n\n${replacement}\n`, changed: true };
}

function mergeGitignore(content: string): { content: string; changed: boolean } {
  const marked = content.match(/# cortex:start[\s\S]*?# cortex:end/)?.[0] || '';
  const outside = content.replace(marked, '');
  const existingOutside = new Set(outside.split(/\r?\n/).map((line) => line.trim()));
  const entries = RAPSO_IGNORE_ENTRIES.filter((entry) => !existingOutside.has(entry));
  const block = ['# Cortex managed entries', ...entries].join('\n');
  return injectMarked(content, '# cortex:start', '# cortex:end', block);
}

function mergeJson(content: string, targetDir: string, templateDir: string): { content: string; changed: boolean } {
  const current = JSON.parse(content || '{}') as Record<string, any>;
  const template = JSON.parse(readFileSync(join(templateDir, 'opencode.json'), 'utf-8')) as Record<string, any>;
  const before = JSON.stringify(current);
  current.agent = current.agent || {};
  for (const name of ['rapso-planner', 'rapso-developer']) {
    const existing = current.agent[name] as Record<string, any> | undefined;
    // Only claim an entry that is absent or already ours. A project agent that happens to
    // share our name is the project's, and silently replacing it would destroy configuration.
    if (existing && existing.__managed_by !== 'cortex') continue;
    current.agent[name] = { ...template.agent[name], __managed_by: 'cortex' };
  }
  current.mcp = current.mcp || {};
  for (const name of ['engram', 'graphify']) if (!(name in current.mcp)) current.mcp[name] = template.mcp[name];
  const plugin = '.opencode/plugins/graphify.js';
  // A `plugin` key that is present but not an array belongs to the project; replacing it with
  // an empty array would drop whatever it holds. Only ever seed or extend an array.
  if (Array.isArray(current.plugin)) {
    const pluginIdentity = resolve(targetDir, plugin);
    let found = false;
    current.plugin = current.plugin.filter((entry) => {
      if (typeof entry !== 'string' || resolve(targetDir, entry) !== pluginIdentity) return true;
      if (found) return false;
      found = true;
      return true;
    });
    if (!found && existsSync(join(targetDir, plugin))) current.plugin.push(plugin);
  } else if (current.plugin === undefined && existsSync(join(targetDir, plugin))) current.plugin = [plugin];
  const output = JSON.stringify(current, null, 2) + '\n';
  return { content: output, changed: JSON.stringify(current) !== before };
}

function writeFile(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf-8');
}

export function adoptProject(targetDir: string, options: AdoptOptions, templateDir: string): AdoptPlan {
  for (const move of migrateLegacyState(targetDir)) console.log(`State migration: ${move}`);
  const projectName = basename(targetDir) || 'project';
  const templateOptions: TemplateOptions = { projectName, projectType: 'default', date: getDate(), year: new Date().getFullYear().toString() };
  const plan: AdoptPlan = { created: [], refreshed: [], conflicting: [], injected: [], seeded: [], skipped: [] };
  const manifestPath = statePath(targetDir, 'manifest.json');
  let oldManifest: Manifest | undefined;
  if (existsSync(manifestPath)) {
    try { oldManifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Manifest; }
    catch { oldManifest = undefined; }
  }
  const oldHashes = new Map((oldManifest?.files || []).map((file) => [file.path, file.hash]));

  for (const file of collectFiles(templateDir, templateDir).filter(isOwned)) {
    const source = join(templateDir, file);
    const target = join(targetDir, file);
    const content = file.endsWith('.gitkeep') ? readFileSync(source) : substituteVariables(readFileSync(source, 'utf-8'), templateOptions);
    if (!existsSync(target)) {
      plan.created.push(file);
      if (!options.dryRun) { mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, content); }
    } else if (hashTemplateFile(source, templateOptions) === hashFile(target)) {
      plan.skipped.push(file);
    } else if (oldHashes.get(file) === hashFile(target)) {
      plan.refreshed.push(file);
      if (!options.dryRun) writeFileSync(target, content);
    } else {
      plan.conflicting.push(file);
      if (!options.dryRun && options.force) writeFileSync(target, content);
    }
  }

  const agentsPath = join(targetDir, 'AGENTS.md');
  const ignorePath = join(targetDir, '.gitignore');
  const configs = [join(targetDir, 'opencode.json'), join(targetDir, '.opencode/opencode.json')].filter((path) => existsSync(path));
  if (configs.length === 0) configs.push(join(targetDir, 'opencode.json'));
  const merges: Array<[string, { content: string; changed: boolean }]> = [];
  merges.push([agentsPath, injectSections(existsSync(agentsPath) ? readFileSync(agentsPath, 'utf-8') : '', markdownSections(templateDir, templateOptions))]);
  merges.push([ignorePath, mergeGitignore(existsSync(ignorePath) ? readFileSync(ignorePath, 'utf-8') : '')]);
  for (const path of configs) merges.push([path, mergeJson(existsSync(path) ? readFileSync(path, 'utf-8') : '', targetDir, templateDir)]);
  for (const [path, result] of merges) {
    const label = relative(targetDir, path);
    if (!result.changed) plan.skipped.push(label);
    else { plan.injected.push(label); if (!options.dryRun) writeFile(path, result.content); }
  }

  for (const [path, content] of [[join(sessionsDir(targetDir), '.gitignore'), '*\n'], [join(targetDir, 'odd/tasks/.gitkeep'), ''],] as const) {
    if (existsSync(path)) plan.skipped.push(relative(targetDir, path));
    else { plan.seeded.push(relative(targetDir, path)); if (!options.dryRun) writeFile(path, content); }
  }
  if (!options.dryRun) {
    const files: ManifestFile[] = collectFiles(templateDir, templateDir).filter(isOwned).map((file) => ({ path: file, hash: hashTemplateFile(join(templateDir, file), templateOptions) }));
    writeFile(manifestPath, JSON.stringify({ templateVersion: '1.0.0', createdAt: getDate(), projectName, files, excludedPaths: NEVER_PATHS }, null, 2) + '\n');
  }
  if (oldManifest) plan.skipped.push(join(PROJECT_STATE_DIR_NAME, 'manifest.json'));
  else plan.seeded.push(join(PROJECT_STATE_DIR_NAME, 'manifest.json'));
  return plan;
}

export function isDirty(targetDir: string): boolean | undefined {
  try { return execFileSync('git', ['status', '--porcelain'], { cwd: targetDir, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim().length > 0; }
  catch { return undefined; }
}
