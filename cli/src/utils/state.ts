import { join } from 'path';

export const PROJECT_STATE_DIR_NAME = '.cortex';
export const GLOBAL_STATE_DIR_NAME = '.cortex';
export const SESSIONS_DIR_NAME = '.cortex-sessions';

export function stateDir(root: string): string {
  return join(root, PROJECT_STATE_DIR_NAME);
}

export function statePath(root: string, ...parts: string[]): string {
  return join(stateDir(root), ...parts);
}

export function sessionsDir(root: string): string {
  return join(root, SESSIONS_DIR_NAME);
}
