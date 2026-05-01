# Wiki Schema

Conventions for the wiki's structure, page format, and maintenance.

## Directory Layout
```
wiki/
├── index.md        — Content catalog (required)
├── log.md          — Chronological record (required)
├── concepts/       — Technology/domain concept pages
├── entities/       — Code entity pages
├── sources/        — Source document summaries
├── sessions/       — Session summaries
├── decisions/      — Architecture Decision Records
├── dashboards/     — Automated dashboards
└── graph/          — Knowledge graph outputs
```

## Page Format
Every wiki page should follow this structure:

### Frontmatter (required)
```yaml
---
type: concept | entity | source | session | decision | dashboard
title: "Page Title"
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [tag1, tag2]
---
```

### Content Structure
- **Title**: H1 heading matching the page name
- **Summary**: 1-2 sentences (first paragraph after title)
- **Body**: Structured content with sections
- **See Also**: [[wikilinks]] to related pages at the bottom

## Naming Convention
- Files: `kebab-case-slug.md`
- Concepts: lowercase, descriptive (`attention-mechanism.md`)
- Entities: match code names (`UserService.md`, `auth-module.md`)
- Sources: short descriptive (`transformer-paper.md`)
- Sessions: `YYYY-MM-DD-brief-topic.md`
- Decisions: `NNN-title-slug.md` (sequential ADR numbers)

## Cross-Reference Rules
- Every page should have at least one inbound and one outbound [[wikilink]]
- Use [[Obsidian wikilinks]] syntax: `[[page-name]]` or `[[page-name|display text]]`
- Source claims must cite the wiki source page: `[[sources/source-name]]`
- Update links bidirectionally when adding new connections

## Frontmatter Fields by Type

### concept
- `type: concept`
- `tags:` — Domain tags
- `related:` — [[wikilinks]] to related concepts

### entity
- `type: entity`
- `kind:` — class | function | module | interface | type
- `source:` — File path in the codebase
- `depends_on:` — [[wikilinks]] to dependencies

### source
- `type: source`
- `title:` — Original document title
- `author:` — Original author
- `date:` — Original publication date
- `url:` — Original URL (if applicable)
- `tags:` — Topic tags

### session
- `type: session`
- `date:` — Session date
- `phase:` — Related planning phase

### decision
- `type: decision`
- `status:` — proposed | accepted | deprecated | superseded
- `date:` — Decision date
- `supersedes:` — ADR this replaces (if applicable)
