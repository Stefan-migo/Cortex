---
id: 74
type: bugfix
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-08 14:58:43"
updated_at: "2026-05-08 14:58:43"
revision_count: 1
tags:
  - cortexplugin
  - bugfix
aliases:
  - "Fix: force overwrite in cortex init"
---

# Fix: force overwrite in cortex init

**What**: Fixed two issues in cortex init --force: (1) stale .git directory caused git commit to fail on force overwrite — fix removes old .git before re-initializing. (2) harmless "nothing to commit" git error was showing as warning — fix treats it as success.

**Where**: /home/stefan/CortexPlugin/cli/src/commands/init.ts — rmSync for old .git directory, improved git error handling

**Learned**: Force overwrite of a project directory needs to clean up .git to get a clean history. Git's "nothing to commit" exit code 1 shouldn't be treated as a real failure.

---
*Session*: [[session-manual-save-cortexplugin]]
