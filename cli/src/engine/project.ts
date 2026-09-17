import { existsSync, readFileSync } from 'fs';
import { basename, join } from 'path';
import type { Manifest } from './manifest';
import { stateDir, statePath } from '../utils/state';

interface WorktreeMarker {
  source?: string;
}

/**
 * The main project a provisioned ODD worktree was created from, if this root is one.
 * `provisionWorktree` records it there so a worktree never needs its own manifest.
 */
function worktreeSource(root: string): string | null {
  const markerPath = statePath(root, 'worktree.json');
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
  const cortexDir = stateDir(dir);
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
 * The directory that owns the project metadata: the `source` a provisioned worktree
 * recorded, or the root itself. A worktree's own directory name is the slug, never the
 * project name, so the fallback below has to read it from here.
 */
function projectHome(root: string): string {
  return worktreeSource(root) || root;
}

/**
 * The graph artifacts of the checkout this root is, not of its source project.
 * `provisionWorktree` copies `graphify-out/` into a worktree and `graphify update .`
 * refreshes it there, so a worktree owns its graph. Resolving through `projectHome`
 * would read the main project's graph and compare it against the worktree's HEAD,
 * which can never match and would report a permanent, unrefreshable staleness.
 */
export function resolveGraphifyPaths(root: string): { graphJson: string; graphReport: string } {
  const graphDir = join(root, 'graphify-out');
  return {
    graphJson: join(graphDir, 'graph.json'),
    graphReport: join(graphDir, 'GRAPH_REPORT.md'),
  };
}

/**
 * Project metadata is owned by the main project and never copied into a worktree,
 * so a worktree resolves it through the `source` its provisioning recorded. Returns the
 * first manifest path that both exists and parses, so a caller that needs the file agrees
 * with a caller that needs its content.
 */
export function resolveProjectManifestPath(root: string): string | null {
  for (const candidate of [root, worktreeSource(root)]) {
    if (!candidate) continue;
    const manifestPath = statePath(candidate, 'manifest.json');
    if (!existsSync(manifestPath)) continue;
    try {
      JSON.parse(readFileSync(manifestPath, 'utf-8'));
      return manifestPath;
    } catch {
      // A corrupt manifest must not abort the session; keep looking.
    }
  }
  return null;
}

export function resolveProjectManifest(root: string): Manifest | null {
  const manifestPath = resolveProjectManifestPath(root);
  if (!manifestPath) return null;
  try {
    return JSON.parse(readFileSync(manifestPath, 'utf-8')) as Manifest;
  } catch {
    // The file could be replaced between resolution and read; a session must still start.
    return null;
  }
}

/**
 * `adopt` and `init` record the project's directory name as its `projectName`, so that is
 * the fallback when no manifest resolves. It keeps the invariant this module exists for:
 * a worktree and its `source` always resolve to the same name.
 */
export function readProjectName(root: string): string {
  return resolveProjectManifest(root)?.projectName || basename(projectHome(root));
}
