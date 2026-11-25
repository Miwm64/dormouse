# Git Rules

## Branch names
Must be `master`, `develop`, or `<type>/...` (e.g. `feat/login`).

## Commit subjects
Format: `<type>(scope)!: description`
- **Type**: `build | chore | ci | docs | feat | fix | perf | refactor | revert | style | test`
- **Scope**: optional
- **`!`**: optional (for breaking change)
- **Max length**: 72 chars

## PR titles
Same format as commit subjects.

## Commit body
Max **100 chars** per line.

## PR merging
**Squash** by default.
Exceptions: a couple of meaningful commits, or `develop → master` merges.

## Enforcement
`gitlint-action@v1.2.0` — CI fails on violation.