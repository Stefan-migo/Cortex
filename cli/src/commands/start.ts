import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { info, success, warn, error, heading } from '../utils/logger';
import { generateSessionId, openSession, getSessionInfo } from '../engine/session';
import { buildPrelude } from '../engine/context';

interface StartOptions {
  prelude?: boolean;
  dryRun?: boolean;
  open?: boolean;
}

function findProjectRoot(dir: string): string | null {
  const manifestPath = join(dir, '.cortex', 'manifest.json');
  const sessionPath = join(dir, '.cortex', 'session.json');
  if (existsSync(manifestPath) || existsSync(sessionPath)) {
    return dir;
  }

  const parent = join(dir, '..');
  if (parent === dir) return null;
  return findProjectRoot(parent);
}

function readProjectName(projectDir: string): string {
  const manifestPath = join(projectDir, '.cortex', 'manifest.json');
  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      return manifest.projectName || 'unknown';
    } catch {
    }
  }
  return 'unknown';
}

export async function startCommand(options: StartOptions): Promise<void> {
  heading('Cortex Session Start');

  const projectDir = findProjectRoot(process.cwd());
  if (!projectDir) {
    error('Not inside a Cortex project. Run `cortex init <name>` first.');
    process.exit(1);
  }

  const projectName = readProjectName(projectDir);
  info(`Project: ${projectName}`);
  info(`Directory: ${projectDir}`);

  const existingSession = getSessionInfo(projectDir);
  if (existingSession) {
    warn(`Active session found: ${existingSession.sessionId}`);
    info('Run `cortex close` to finalize it before starting a new one.');
    const proceed = await new Promise<boolean>((resolve) => {
      process.stdout.write('Start a new session anyway? (y/N): ');
      process.stdin.once('data', (data) => {
        const answer = data.toString().trim().toLowerCase();
        resolve(answer === 'y' || answer === 'yes');
      });
    });
    if (!proceed) {
      info('Aborted.');
      process.exit(0);
    }
  }

  const sessionId = generateSessionId();
  info(`Session ID: ${sessionId}`);

  if (options.dryRun) {
    heading('Dry Run — No Actions Taken');
    info('The following would happen:');
    info('  1. Generate session ID');
    info('  2. Open Engram session via MCP (mem_session_start)');
    info('  3. Write .cortex/session.json');
    if (options.prelude !== false) {
      info('  4. Build context prelude (.cortex/prelude.md):');
      info('     - Engram recent context');
      info('     - Graphify codebase report');
      info('     - Spec-Kit current tasks/plans');
      info('     - Project manifest info');
      info('  5. Keep the prelude in ignored .cortex/ local state');
    } else {
      info('  4. Skip context prelude (--no-prelude)');
    }
    info(`  ${options.prelude !== false ? 6 : 5}. Launch opencode in project directory`);
    info('  7. After opencode exits, print finalization instructions');
    return;
  }

  await openSession(projectDir, sessionId);

  if (options.prelude !== false) {
    await buildPrelude(projectDir, projectName);
  }

  if (options.open === false) {
    heading('Session Prepared (--no-open)');
    success('Session started without launching OpenCode');
    info(`Session ID: ${sessionId}`);
    info('Run `opencode` manually, then `cortex close` when done.');
    return;
  }

  if (!process.stdout.isTTY) {
    warn('Not a TTY terminal — OpenCode may not display correctly.');
    warn('Use --no-open to prepare the session without launching.');
  }

  heading('Launching OpenCode');
  info(`Session: ${sessionId}`);
  info('OpenCode will open in the project directory.');
  info('');

  const child = spawn('opencode', [], {
    cwd: projectDir,
    stdio: 'inherit',
    env: { ...process.env },
  });

  child.on('error', (err: Error) => {
    error(`Failed to launch OpenCode: ${err.message}`);
    info('Make sure OpenCode is installed and available on PATH.');
    process.exit(1);
  });

  child.on('exit', (code: number | null) => {
    heading('Session End');
    if (code === 0) {
      success('OpenCode session completed');
    } else {
      warn(`OpenCode exited with code ${code}`);
    }
    info('Run `cortex close` to finalize the session.');
    process.exit(code === null ? 1 : code);
  });
}
