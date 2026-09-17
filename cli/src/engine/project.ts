import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { Manifest } from './manifest';

interface WorktreeMarker {
  source?: string;
}

/**
 * The main project a provisioned ODD worktree was created from, if this root is one.
 * `provisionWorktree` records it there so a worktree never needs its own manifest.
 */
function worktreeSource(root: string): string | null {
  const markerPath = join(root, '.cortex', 'worktree.json');
  if (!existsSync(markerPath)) return null;
  try {
    const marker = JSON.parse(readFileSync(markerPath, 'utf-8')) as WorktreeMarker;
    return typeof marker.source === 'string' ? marker.source : null;
  } catch {
    return null;
  }
}

/**
 * Walk up until a directory owns local Cortex state. A provisioned ODD worktree counts:
 * it has no manifest of its own, but it is where the session has to run.
 */
export function findProjectRoot(dir: string): string | null {
  const cortexDir = join(dir, '.cortex');
  if (
    existsSync(join(cortexDir, 'manifest.json')) ||
    existsSync(join(cortexDir, 'session.json')) ||
    existsSync(join(cortexDir, 'worktree.json'))
  ) {
    return dir;
  }

  const parent = join(dir, '..');
  if (parent === dir) return null;
  return findProjectRoot(parent);
}

/**
 * Project metadata is owned by the main project and never copied into a worktree,
 * so a worktree resolves it through the `source` its provisioning recorded.
 */
export function resolveProjectManifest(root: string): Manifest | null {
  for (const candidate of [root, worktreeSource(root)]) {
    if (!candidate) continue;
    const manifestPath = join(candidate, '.cortex', 'manifest.json');
    if (!existsSync(manifestPath)) continue;
    try {
      return JSON.parse(readFileSync(manifestPath, 'utf-8')) as Manifest;
    } catch {
      // A corrupt manifest must not abort the session; keep looking.
    }
  }
  return null;
}

export function readProjectName(root: string): string {
  return resolveProjectManifest(root)?.projectName || 'unknown';
}
