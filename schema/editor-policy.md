# Editorial Policy

Source quality thresholds and ingestion criteria for the wiki.

## Source Quality Thresholds
Sources are scored on a 0-10 scale across these dimensions:

| Dimension | Description |
|-----------|-------------|
| Relevance | How directly does this apply to the project? |
| Authority | Is the source credible and trustworthy? |
| Recency | Is the information current enough? |
| Depth | Does it provide meaningful detail? |
| Actionability | Can we use this information? |

### Scoring
- **8-10**: Ingest immediately. High-quality, directly relevant.
- **5-7**: Ingest with caveats. Note confidence level.
- **3-4**: Flag for user review. May be worth keeping.
- **0-2**: Reject. Not useful for the project.

## Domain-Specific Policies

### Code Repositories
- AST-extractable code is always ingested (deterministic, no LLM cost)
- Documentation within repos is ingested at full depth
- Comment rationale (`# NOTE:`, `// WHY:`) is extracted as priority

### Technical Articles / Blog Posts
- Must be from reputable sources (established authors, publications)
- Code samples within articles are extracted alongside prose
- Tutorials are ingested at summary level unless directly relevant

### Academic Papers
- Prefer recent (≤3 years) for fast-moving fields
- Older papers accepted as foundational references
- Citation chains are tracked for provenance

### AI-Generated Content
- Flagged with `generated: true` in frontmatter
- Subject to higher verification standards
- Claims must be cross-referenced with authoritative sources

### Social Media / Forums
- Only ingest if they contain unique, verifiable technical insights
- Individual opinions are noted as such
- Stack Overflow answers marked with vote count context

## Contradiction Handling
When a new source contradicts existing wiki content:
1. Flag both claims in their respective pages
2. Add a note to `wiki/index.md` under a "Contradictions" section
3. Do not delete or overwrite the existing claim — present both
4. If possible, research to determine which is correct
5. Once resolved, update pages and archive the contradiction note

## Editorial Process
1. User drops source in `raw/`
2. Agent evaluates quality score (this policy)
3. If accepted: Ingest (summarize, cross-ref, index)
4. If borderline: Flag for user review before ingestion
5. If rejected: Move to `raw/rejected/` with rationale note
