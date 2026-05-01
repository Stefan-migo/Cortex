---
name: session-memory
description: Cross-session persistence and recovery — restore context between OpenCode sessions
license: MIT
compatibility: opencode
metadata:
  workflow: session
  audience: all agents
---

## What It Does
Maintains continuity across OpenCode sessions. When a session ends or context is cleared, session-memory preserves the working state and can restore it.

## Session Lifecycle

### Session Start
1. Read `.planning/STATE.md` for current position
2. Read `wiki/log.md` for recent activity (last 10 entries)
3. Read `.planning/ROADMAP.md` for phase status
4. Check `wiki/sessions/` for the most recent session summary
5. Present a session-start summary:
   - Current phase and status
   - Last session summary
   - Open decisions or blockers
   - Suggested next action

### During Session
- Track significant changes in working memory
- Update `.planning/STATE.md` after major decisions
- Write important realizations to `wiki/sessions/{date}-{topic}.md`
- Save useful query answers to wiki

### Session End (Before Closing)
1. Summarize what was accomplished
2. Write session summary to `wiki/sessions/{date}-{slug}.md`:
   ```markdown
   # Session: {date}

   ## Work Done
   - {what was accomplished}

   ## Decisions Made
   - {decision with rationale}

   ## Open Questions
   - {questions for next session}

   ## Next Steps
   - {suggested next action}
   ```
3. Append to `wiki/log.md`:
   ```
   ## [YYYY-MM-DD] session | {Summary}
   ```
4. Update `.planning/STATE.md` with latest position

### Session Recovery (After /clear or new terminal)
1. Read `.planning/STATE.md` for current position
2. Read latest session summary from `wiki/sessions/`
3. Check `wiki/log.md` for what happened since last STATE.md update
4. Read `wiki/index.md` for relevant knowledge context
5. Reconstruct working context and present recovery summary

## Files Used
| File | Purpose |
|------|---------|
| `.planning/STATE.md` | Current position, decisions, blockers |
| `wiki/log.md` | Chronological activity record |
| `wiki/sessions/` | Detailed session summaries |
| `wiki/index.md` | Knowledge catalog |
| `.planning/ROADMAP.md` | Phase and milestone status |
