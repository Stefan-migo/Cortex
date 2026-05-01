---
name: wiki-lint
description: Health checks and contradiction detection for the wiki knowledge base
license: MIT
compatibility: opencode
metadata:
  workflow: knowledge
  audience: lint-agent
---

## What It Does
Periodically audits the wiki for contradictions, orphans, broken links, stale claims, and missing pages.

## Health Checks

### 1. Contradictions
Find claims that conflict across pages:
- Scan pages in the same topic area
- Compare claims about the same concept or entity
- Flag direct contradictions
- Flag nuance differences that could confuse

### 2. Orphan Pages
Pages with no inbound [[wikilinks]]:
- Check each page's backlinks
- Identify orphans (zero inbound links)
- Suggest pages that should link to them

### 3. Broken Wikilinks
[[wikilinks]] that point to non-existent pages:
- Scan all pages for link patterns: `[[page]]` or `[[page|alias]]`
- Verify the target exists
- Report broken links with source file and line

### 4. Missing Pages
Concepts mentioned but lacking their own page:
- Look for cross-references to non-existent pages
- Check if the concept is significant enough for its own page
- Suggest creation

### 5. Stale Claims
Claims that may be outdated:
- Check source dates against claim dates
- Flag claims from old sources that newer sources may supersede
- Note when a decision has been superseded by a newer ADR

### 6. Index Gaps
Pages not listed in `wiki/index.md`:
- Cross-reference actual pages against the index
- Report unlisted pages
- Flag pages listed in index but missing from disk

## Output Format
```
## Wiki Lint Report: {date}

### Critical
- Contradiction: {page A} says X, {page B} says Y — {file}:{line}

### Warnings
- Orphan: {page} has no inbound links
- Broken link: [[{page}]] in {file}:{line}
- Stale: {claim} from {date} may be superseded

### Suggestions
- Create page for: {concept}
- Add to index: {page}
```

## Frequency
- Quick lint: After every significant wiki change
- Full lint: Weekly
- Deep lint with web search: Monthly
