# mcp client lifecycle — settle what the process can no longer answer

Status: in progress · Date: 2026-09-19 · Branch: `odd/ship-gitignore` ·
Worktree: `../rapsodia-code-odd-ship-gitignore` · Base: `origin/main` `2e73cbc`

## Objective

`MCPClient` must fail with the cause when it fails, instead of letting callers wait out a timer or
crash opaquely.

## Problem — found by the review gate, not by a user

`gga` reviewed `cli/src/utils/mcp.ts` because the `1.0.1` bump touched one string in it, and
returned `STATUS: FAILED` with five findings. All five are pre-existing: `rapsodia-code@1.0.0` on
npm ships them. Touching a file for a version string brought the whole file into review.

| # | Finding | Where |
|---|---|---|
| 1 | A clean child exit leaves in-flight requests unresolved until their timer fires | `exit` handler |
| 2 | `close()` kills the process but settles nothing and clears no timers | `close()` |
| 3 | `stderr` is piped and never consumed — a full pipe blocks the server | `initialize()` |
| 4 | Malformed JSON, stdin errors and notification-write failures are swallowed | line handler, stdin handler, `sendNotification` |
| 5 | `callTool()` asserts `process!.stdin!` and throws an opaque runtime error outside its contract | `callTool()` |

## Evidence — the same suite against the previous file and this one

`mcp.ts` is not exported from the bundle, so the suite was bundled with esbuild against both the
current source and a copy of the previous revision, driven by fake MCP servers.

```text
case                                    | before                                    | after
----------------------------------------+-------------------------------------------+--------------------------------------
A: clean exit with a call in flight     | rejected only after 5015ms (the 5s timer) | rejected in 12ms
B: close() with a call in flight        | hung past close                           | settled in 1ms
C: callTool before initialize           | opaque: Cannot read properties of null    | clear: "MCP client is not initialized"
D: callTool after close                 | opaque: Cannot read properties of null    | clear: "MCP client is not initialized"
E: 1MB of stderr from a Node server     | handshake completed in 310ms              | handshake completed in 309ms
E2: 360KB of stderr from a shell server | blocked: MCP initialize timed out         | handshake completed in 311ms
F: a line that is not JSON              | answer still correlated                   | answer still correlated, now warned
```

Two things this table says that are worth keeping:

- **Case E does not reproduce, and case E2 does.** A Node server buffers `stderr` in user space, so
  it never blocks on a full pipe and the missing drain costs nothing. A non-Node server blocks on
  the write. The first version of this check used a Node server and passed on both revisions, which
  would have been a claim of a fix with no failure to point at.
- **Case F is a visibility fix, not a behaviour fix.** The answer was always correlated; what
  changed is that the server's protocol violation is now reported instead of dropped.

## Authorized scope

- `cli/src/utils/mcp.ts` — the five findings above.
- `odd/tasks/mcp-client-lifecycle.md` — this document.

Out of scope, with reasons:

1. **A test harness.** This repository has none and the standards say not to require tests until one
   is deliberately introduced. The suite above was temporary and was deleted.
2. **Capturing `stderr` for diagnostics.** Draining fixes the block; keeping a bounded tail for error
   messages is a separate improvement, not this one.
3. **Retrying or reconnecting a dead server.** A different feature.

## Tasks

- [x] **T01** — the `exit` handler rejects every in-flight request, a clean exit included.
- [x] **T02** — `close()` settles in-flight requests through the same path.
- [x] **T03** — `stderr` is drained.
- [x] **T04** — a malformed line is warned about; a stdin error rejects; `sendNotification` no longer
      swallows and its caller fails the handshake instead of throwing out of the readline handler.
- [x] **T05** — `callTool()` checks the process instead of asserting it, and a write that throws is
      removed from `pending` rather than left to time out.
- [x] **T06** — checks recorded above.
- [ ] **T07** — pending: commit; PR is `#52`.

## Rationale log

- **Fix the cause in the error, not the symptom in the timer.** Every finding is the same shape: a
  caller waits five seconds to learn something the client already knew, or crashes with a message
  about `null`. Settling on exit and closing is what makes the message name the cause.
- **`code !== 0` still drives `outerReject`.** A clean exit rejects the in-flight requests through
  `rejectAll`, which is the honest outcome, but it is not by itself an initialization failure.
- **The reproduction is part of the evidence.** Case E passing on both revisions is recorded above
  rather than quietly dropped, because a fix with no reproducible failure is a claim, not a result.
