import { existsSync, mkdirSync, renameSync } from 'fs';
import { join, relative } from 'path';

export const PROJECT_STATE_DIR_NAME = '.rapsodia-code';
// Global registry state has a different scope and its own migration; keep it unchanged here.
export const GLOBAL_STATE_DIR_NAME = '.cortex';
export const SESSIONS_DIR_NAME = '.rapsodia-code/sessions';
export const LEGACY_PROJECT_STATE_DIR_NAME = '.cortex';
export const LEGACY_SESSIONS_DIR_NAME = '.cortex-sessions';

export function stateDir(root: string): string {
  return join(root, PROJECT_STATE_DIR_NAME);
}

export function statePath(root: string, ...parts: string[]): string {
  return join(stateDir(root), ...parts);
}

export function sessionsDir(root: string): string {
  return join(root, SESSIONS_DIR_NAME);
}

export function resolveStateDir(root: string): string {
  const current = stateDir(root);
  return existsSync(current) ? current : join(root, LEGACY_PROJECT_STATE_DIR_NAME);
}

export function resolveStatePath(root: string, ...parts: string[]): string | null {
  const current = stateDir(root);
  if (existsSync(current)) return join(current, ...parts);
  const legacy = join(root, LEGACY_PROJECT_STATE_DIR_NAME);
  return existsSync(legacy) ? join(legacy, ...parts) : null;
}

export function resolveSessionsDir(root: string): string {
  const current = sessionsDir(root);
  return existsSync(current) ? current : join(root, LEGACY_SESSIONS_DIR_NAME);
}

export function migrateLegacyState(root: string): string[] {
  const moves: string[] = [];
  const projectState = join(root, LEGACY_PROJECT_STATE_DIR_NAME);
  const newState = stateDir(root);
  const legacySessions = join(root, LEGACY_SESSIONS_DIR_NAME);
  const newSessions = sessionsDir(root);

  if (existsSync(projectState) && !existsSync(newState)) {
    renameSync(projectState, newState);
    moves.push(`${relative(root, projectState)} -> ${relative(root, newState)}`);
  } else if (existsSync(projectState) && existsSync(newState)) {
    moves.push(`Skipped ${relative(root, projectState)}: ${relative(root, newState)} already exists`);
  }

  if (existsSync(legacySessions) && !existsSync(newSessions)) {
    mkdirSync(join(root, PROJECT_STATE_DIR_NAME), { recursive: true });
    renameSync(legacySessions, newSessions);
    moves.push(`${relative(root, legacySessions)} -> ${relative(root, newSessions)}`);
  } else if (existsSync(legacySessions) && existsSync(newSessions)) {
    moves.push(`Skipped ${relative(root, legacySessions)}: ${relative(root, newSessions)} already exists`);
  }

  return moves;
}
