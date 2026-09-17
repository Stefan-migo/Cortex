import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { GLOBAL_STATE_DIR_NAME } from './state';

interface RapsodiaConfig {
  lastProject?: string;
  projects?: string[];
}

const CONFIG_DIR = join(homedir(), GLOBAL_STATE_DIR_NAME);
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function readConfig(): RapsodiaConfig {
  ensureConfigDir();
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw) as RapsodiaConfig;
  } catch {
    return {};
  }
}

export function writeConfig(config: RapsodiaConfig): void {
  ensureConfigDir();
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export function addProject(name: string): void {
  const config = readConfig();
  config.lastProject = name;
  if (!config.projects) config.projects = [];
  if (!config.projects.includes(name)) {
    config.projects.push(name);
  }
  writeConfig(config);
}
