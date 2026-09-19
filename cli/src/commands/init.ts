import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { copyTemplate, TemplateOptions } from '../engine/template';
import { writeProjectIgnores } from '../engine/gitignore';
import { generateManifest } from '../engine/manifest';
import { info, success, warn, error, step, heading } from '../utils/logger';
import { addProject } from '../utils/config';
import { PROJECT_STATE_DIR_NAME } from '../utils/state';

interface InitOptions {
  template?: string;
  git?: boolean;
  yes?: boolean;
  force?: boolean;
}

function validateProjectName(name: string): string | null {
  if (!name || name.length === 0) return 'Project name cannot be empty';
  if (/[\s]/.test(name)) return 'Project name cannot contain spaces';
  if (/[<>:"/\\|?*\x00-\x1f]/.test(name)) return 'Project name contains invalid characters';
  if (name === '.' || name === '..') return 'Project name cannot be . or ..';
  if (/^[.-]/.test(name)) return 'Project name cannot start with . or -';
  return null;
}

function getDate(): string {
  return new Date().toISOString().split('T')[0];
}

export async function initCommand(name: string, options: InitOptions): Promise<void> {
  const validationError = validateProjectName(name);
  if (validationError) {
    error(validationError);
    process.exit(1);
  }

  const targetDir = join(process.cwd(), name);

  if (existsSync(targetDir)) {
    if (!options.force) {
      error(`Directory "${name}" already exists. Use --force to overwrite.`);
      process.exit(1);
    }
    warn(`Directory "${name}" already exists. Overwriting...`);
    // Remove stale .git so git init works cleanly
    const oldGitDir = join(targetDir, '.git');
    if (existsSync(oldGitDir)) {
      rmSync(oldGitDir, { recursive: true, force: true });
    }
  }

  const templateType = (options.template as TemplateOptions['projectType']) || 'default';

  heading(`Creating new Rapsodia project: ${name}`);

  const templateOptions: TemplateOptions = {
    projectName: name,
    projectType: templateType,
    date: getDate(),
    year: new Date().getFullYear().toString(),
  };

  step('Copying template files');
  const copiedFiles = copyTemplate(targetDir, templateOptions);
  // npm never publishes a file named `.gitignore`, so no template can carry one and the CLI writes
  // them here. See engine/gitignore.ts for why the content lives in code.
  const writtenIgnores = writeProjectIgnores(targetDir);
  success(`Copied ${copiedFiles.length + writtenIgnores.length} files`);

  step('Generating manifest');
  generateManifest(targetDir, templateOptions);
  success(`${PROJECT_STATE_DIR_NAME}/manifest.json created`);

  step('Initializing git repository');
  if (options.git !== false) {
    try {
      execSync('git init', { cwd: targetDir, stdio: 'pipe' });
      try {
        execSync('git config user.email rapsodia@template.local', { cwd: targetDir, stdio: 'pipe' });
        execSync('git config user.name "Rapsodia Template"', { cwd: targetDir, stdio: 'pipe' });
      } catch {
        // user config might already be set globally, that's fine
      }
      execSync('git add -A', { cwd: targetDir, stdio: 'pipe' });
      execSync('git commit -m "Initial commit from Rapsodia template"', {
        cwd: targetDir,
        stdio: 'pipe',
      });
      success('Git repository initialized with initial commit');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // "nothing to commit" is harmless — only warn on real failures
      if (msg.includes('nothing to commit')) {
        success('Git repository already initialized');
      } else {
        warn(`Git init skipped: ${msg}`);
      }
    }
  } else {
    info('Skipping git init (--no-git)');
  }

  addProject(name);

  heading('Done!');
  info(`Project "${name}" created at ${targetDir}`);
  info('');
  info('Next steps:');
  info(`  cd ${name}`);
  info('  rapso install     # Check and install dependencies');
  info('  opencode          # Launch the agent');
}
