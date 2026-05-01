---
name: wiki-ingest
description: Guide for ingesting sources into the wiki — extract, summarize, cross-reference, and index
license: MIT
compatibility: opencode
metadata:
  workflow: knowledge
  audience: ingest-agent
---

## What It Does
Processes source documents from `raw/` and integrates them into the persistent wiki knowledge base.

## Ingestion Steps

### 1. Read the Source
Read the source document from `raw/`. Understand its type:
- **Article/Paper**: Full content, extract key claims
- **Code**: Architecture, patterns, rationale
- **Transcript**: Decisions, reasoning, context
- **Image/Media**: Visual information, diagrams

### 2. Extract Key Information
Identify:
- Core concepts mentioned
- Entities (people, systems, components)
- Claims and their evidence
- Relationships between concepts
- Contradictions with existing wiki content (check first!)

### 3. Write Source Summary
Create a page in `wiki/sources/{slug}.md`:
- Frontmatter: type, title, author, date, tags
- 2-3 sentence summary
- Key points with citations
- Relevance to the project
- [[wikilinks]] to related concepts/entities

### 4. Update Concept Pages
For each concept in the source:
- Find or create the page in `wiki/concepts/`
- Add new information with source citation
- Update synthesis if the new info changes the picture

### 5. Update Entity Pages
For each entity (function, class, module) mentioned:
- Find or create the page in `wiki/entities/`
- Update with new relationships or usage context

### 6. Cross-Reference
- Add bidirectional [[wikilinks]] between the source page and all related pages
- Update `wiki/index.md` to include any new pages

### 7. Update Log
Append to `wiki/log.md`:
```
## [YYYY-MM-DD] ingest | {Title}
Ingested {source}. Updated {N} wiki pages. Flagged {M} contradictions.
```

### 8. Flag Contradictions
If the new source conflicts with existing wiki pages:
- Note the contradiction in the log entry
- Add a note to both affected pages
- Report to the user for resolution

## Templates
### Source Page
```
---
type: source
title: "{Title}"
author: {Author}
date: {YYYY-MM-DD}
tags: [{tag1, tag2}]
---

# {Title}

{Summary}

## Key Points
- {point}
- {point}

## Relevance
{How this connects}

## See Also
- [[related-concept]]
```
