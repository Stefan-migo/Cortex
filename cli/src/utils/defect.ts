import { readFileSync } from 'fs';
import { join } from 'path';

export class ExpectedError extends Error {}

export function isExpected(error: unknown): boolean {
  return error instanceof ExpectedError;
}

const LEADING = /^[("'`\[{<]*/;
const TRAILING = /[)"'\]}.,;!?]+$/;
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

function scrubUrl(value: string): string {
  const signed = value.replace(/^([a-z][a-z0-9+.-]*:\/\/)[^/@\s]*@/i, '$1');
  const cut = signed.search(/[?#]/);
  return cut === -1 ? signed : `${signed.slice(0, cut)}<redacted>`;
}

function scrubToken(token: string, cwd: string, home: string): string {
  const leading = token.match(LEADING)?.[0] ?? '';
  const rest = token.slice(leading.length);
  const trailing = rest.match(TRAILING)?.[0] ?? '';
  const value = trailing ? rest.slice(0, -trailing.length) : rest;
  if (!value) return token;
  const wrap = (s: string) => `${leading}${s}${trailing}`;

  if (HAS_SCHEME.test(value)) return wrap(scrubUrl(value));
  if (value === cwd || value.startsWith(`${cwd}/`)) return wrap(`<cwd>${value.slice(cwd.length)}`);
  if (home && (value === home || value.startsWith(`${home}/`))) return wrap(`<home>${value.slice(home.length)}`);
  if (/^(?:\/|[A-Za-z]:[\\/])/.test(value)) return wrap('<path>');
  return token;
}

export function scrub(text: string, cwd = process.cwd()): string {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
  return text.split(/(\s+)/).map((token) => token.trim() ? scrubToken(token, cwd, home) : token).join('');
}

export interface DefectContext { command: string; cwd?: string }

export function formatDefectReport(error: unknown, context: DefectContext): string {
  const cwd = context.cwd ?? process.cwd();
  const message = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name : 'UnknownError';
  const version = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')).version;
  const payload = {
    cortexVersion: version,
    command: scrub(context.command, cwd),
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    errorName: name,
    message: scrub(message, cwd),
  };
  return `\nThis looks like a defect in Cortex, not a problem with your project.\nPlease search before opening an issue: https://github.com/Stefan-migo/Cortex/issues\nReport it here: https://github.com/Stefan-migo/Cortex/issues/new\nThe CLI is offline and will not call GitHub. The payload below is already scrubbed; review it before pasting.\n\n${JSON.stringify(payload, null, 2)}\n`;
}
