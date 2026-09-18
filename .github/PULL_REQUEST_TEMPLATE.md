<!--
Rapsodia pull request template.

This repository has no CI enforcing any field below: there is no `.github/workflows`. These fields
are a review aid, not gates. Fill every heading; write `n/a` rather than deleting one.
-->

## Linked Issue

`Closes #N`, or `n/a` when the change was not tracked as an issue.

## PR Type

Check exactly one, then apply the matching `type:*` label. If the label does not exist in this
repository yet, create it or say so in the PR body.

- [ ] Bug fix — `type:bug`
- [ ] New feature — `type:feature`
- [ ] Documentation only — `type:docs`
- [ ] Code refactoring — `type:refactor`
- [ ] Maintenance/tooling — `type:chore`
- [ ] Breaking change — `type:breaking-change`

## Summary

1-3 bullets on what this PR does and why.

## Changes

| File | Change |
|------|--------|
| `path/to/file` | What changed |

## Test Plan

List the exact commands run and their real results. Never infer a pass from intent. Mark a check
`[ ]` with the reason when it could not be run.

- [ ] `<command>` → `<observed result>`

## Contributor Checklist

- [ ] Conventional commit messages
- [ ] No `Co-Authored-By` trailers
- [ ] Every commit within the 5-file Atomicity Gate (`.githooks/pre-commit`)
- [ ] No file outside the declared scope
- [ ] Exactly one `type:*` label

## Follow-ups

Known gaps, deferred work, or findings deliberately left out of this PR.
