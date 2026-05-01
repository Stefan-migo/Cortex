---
name: wiki-query
description: Query patterns for navigating and synthesizing information from the wiki
license: MIT
compatibility: opencode
metadata:
  workflow: knowledge
  audience: all agents
---

## What It Does
Provides patterns for querying the wiki to answer questions with cited, synthesized responses.

## Query Process

### 1. Navigate via Index
Start with `wiki/index.md` to discover relevant pages:
- Scan the catalog for matching concepts, entities, or sources
- Note page locations for drill-down

### 2. Drill Into Pages
Read the most relevant pages:
- Concept pages for domain understanding
- Entity pages for code structure
- Source pages for evidence
- Decision pages for rationale

### 3. Synthesize
Combine information across pages:
- Connect related concepts
- Note conflicting claims
- Trace decision history
- Build a comprehensive answer

### 4. Cite Sources
Every claim in the answer should cite:
- The wiki page it came from ([[page]])
- The original source if available

### 5. File Useful Answers Back
If the query produced a valuable synthesis:
- Save it as a new wiki page in the appropriate section
- Add it to `wiki/index.md`
- Append to `wiki/log.md`

## Query Patterns

### Pattern 1: Concept Deep-Dive
"What do we know about {X}?"
1. Find relevant pages in index.md
2. Read concept pages
3. Check related decisions and entities
4. Synthesize with citations

### Pattern 2: Decision History
"Why was {decision} made?"
1. Find the ADR in wiki/decisions/
2. Check context and alternatives
3. Read related concept pages
4. Present the timeline and rationale

### Pattern 3: Cross-Domain Synthesis
"How does {A} relate to {B}?"
1. Read both concept pages
2. Find decision pages that mention both
3. Check entity pages for implementation connections
4. Look for source pages that discuss both
5. Synthesize the relationship

### Pattern 4: Status Check
"What's the current state of {feature}?"
1. Read .planning/ROADMAP.md
2. Check .planning/STATE.md for blockers
3. Review relevant wiki/sessions/ entries
4. Look at wiki/dashboards/ for automated status
