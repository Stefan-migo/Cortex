import { accessSync, constants } from 'fs';
import { execFileSync as nodeExecFileSync, spawn as nodeSpawn, ChildProcess, SpawnOptions, ExecFileSyncOptions } from 'child_process';
import { delimiter, isAbsolute, join, extname } from 'path';

const WINDOWS_SHIMS = new Set(['.cmd', '.bat']);
const WINDOWS_METACHARACTERS = /[&|<>^()]/g;

function pathEntries(): string[] {
  return (process.env.PATH || '').split(delimiter).filter(Boolean);
}

function isFile(path: string): boolean {
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/** Resolve a command using PATH and, on Windows, PATHEXT. */
export function resolveExecutable(command: string): string | null {
  const extensions = process.platform === 'win32'
    ? (process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';')
    : [''];
  const candidates = isAbsolute(command) || command.includes('/') || command.includes('\\')
    ? [command]
    : pathEntries().map((entry) => join(entry, command));

  for (const candidate of candidates) {
    for (const extension of extensions) {
      const hasWindowsExtension = process.platform === 'win32' &&
        extensions.some((known) => candidate.toLowerCase().endsWith(known.toLowerCase()));
      const path = extension && process.platform === 'win32' && !hasWindowsExtension
        ? `${candidate}${extension}`
        : candidate;
      if (isFile(path)) return path;
    }
  }
  return null;
}

function escapeCmdArgument(argument: string): string {
  if (argument.includes('\0') || /[\r\n]/.test(argument)) {
    throw new Error('Cannot safely pass an argument containing NUL or newline to cmd.exe.');
  }

  // Implemented: Windows command-line quoting (spaces and quotes), caret escaping for
  // cmd.exe metacharacters (& | < > ^ ( )), and doubled percent signs for cmd.exe's
  // percent-expansion pass. Not implemented: delayed-expansion escaping for `!`, or
  // every historical cmd.exe parsing quirk; reject those inputs rather than guessing.
  if (argument.includes('!')) {
    throw new Error('Cannot safely pass an argument containing ! to cmd.exe.');
  }

  let quoted = '"';
  let backslashes = 0;
  for (const character of argument) {
    if (character === '\\') {
      backslashes++;
      continue;
    }
    if (character === '"') {
      quoted += '\\'.repeat(backslashes * 2 + 1) + '"';
      backslashes = 0;
      continue;
    }
    quoted += '\\'.repeat(backslashes);
    backslashes = 0;
    quoted += character === '%' ? '%%' : character;
  }
  quoted += '\\'.repeat(backslashes * 2) + '"';

  return quoted.replace(WINDOWS_METACHARACTERS, '^$&');
}

function windowsInvocation(command: string, args: string[]): { command: string; args: string[] } | null {
  const resolved = resolveExecutable(command) || command;
  if (!WINDOWS_SHIMS.has(extname(resolved).toLowerCase())) return null;
  const commandLine = [resolved, ...args].map(escapeCmdArgument).join(' ');
  return {
    command: process.env.ComSpec || 'cmd.exe',
    args: ['/d', '/s', '/c', `"${commandLine}"`],
  };
}

export function execFileSync<T extends ExecFileSyncOptions = ExecFileSyncOptions>(
  command: string,
  args: string[] = [],
  options?: T,
): any {
  if (process.platform !== 'win32') {
    return options === undefined ? nodeExecFileSync(command, args) : nodeExecFileSync(command, args, options as any);
  }
  const invocation = windowsInvocation(command, args);
  if (!invocation) return options === undefined ? nodeExecFileSync(command, args) : nodeExecFileSync(command, args, options as any);
  return nodeExecFileSync(invocation.command, invocation.args, {
    ...options,
    windowsVerbatimArguments: true,
  } as any) as ReturnType<typeof nodeExecFileSync>;
}

export function spawn(command: string, args: string[] = [], options?: SpawnOptions): ChildProcess {
  if (process.platform !== 'win32') return options === undefined ? nodeSpawn(command, args) : nodeSpawn(command, args, options);
  const invocation = windowsInvocation(command, args);
  if (!invocation) return options === undefined ? nodeSpawn(command, args) : nodeSpawn(command, args, options);
  return nodeSpawn(invocation.command, invocation.args, {
    ...options,
    windowsVerbatimArguments: true,
  });
}
