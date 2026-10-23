---
name: curriculum-indexer
description: Build or refresh INDEX.md — the concept-level map of the curriculum (topic → section → lesson, each with a 1–2 sentence summary naming the vocabulary taught, plus the goals from its frontmatter). Source of truth is assets/manifest.js; changed lessons are found with git. Use when the user says "update/refresh/rebuild the index", "is INDEX.md current?", "what changed since the index was built?", or after add-lesson finishes. Not for answering "what topics exist" — read INDEX.md for that.
---

# Curriculum indexer

`INDEX.md` is how the tutor agent (and the learner) find *where a concept lives* without opening
every file. Entries name concepts by the vocabulary a practitioner would search for. The structure comes
from the manifest; the summaries come from reading the lesson **sources** (`src/**/*.md`, never the
generated `content/` HTML).

## Inputs

- `assets/manifest.js` → `CURRICULUM.topics[].sections[].lessons[]` (order, titles, paths). Import it:
  `node -e "import('./assets/manifest.js').then(m => console.log(JSON.stringify(m.allLessons().map(l => [l.id, l.src, l.title]))))"`
- Each source's frontmatter (`title`, `goals`), its `##` headings, and the block types present (`grep -n '^::: ' <src>`).
- The existing `INDEX.md` (update mode).

## Update mode (default when `INDEX.md` exists)

1. **Manifest ↔ index diff**: lessons in the manifest with no entry → *added*; entries with no manifest lesson → *removed*; section/topic placement differs → *moved*.
2. **Changed lessons** since the index was last written:
   ```bash
   git diff --name-only $(git log -1 --format=%H -- INDEX.md) -- src/
   ```
   (if `INDEX.md` has no commits yet, treat every lesson as changed). Include uncommitted changes (`git status --short src/`).
3. Report before writing:
   ```
   Added:    d1c  src/dsa/foundations/d1c-….md
   Removed:  d9z
   Moved:    d2a  foundations → sorting
   Changed:  d1b  (+stepper, +2 exercises)
   Unchanged: 1
   ```
4. If the user only asked whether it's current / what's new — **stop here**.
5. Otherwise rewrite `INDEX.md`: regenerate the skeleton from the manifest, **reuse existing summaries verbatim for unchanged lessons**, write new summaries only for added/changed ones (read those files fully). Consistency across runs is a feature.

Also run `npm run build` and surface manifest↔source mismatches in the report — a source that isn't in the manifest is invisible to the site.

## Fresh build

Read every lesson (one section at a time; for >80 lessons, one subagent per topic, merged at the end) and write all summaries.

## Output format

```markdown
# Curriculum Index

_One paragraph: what this curriculum teaches, who it's for, the arc, how to open it._

<How to read this file; pointer to manifest/README/CLAUDE.>

---

## Data structures & algorithms (2 lessons) — `src/dsa/`

_Topic desc from the manifest._ · time

### Foundations — `foundations/`

- **d1b — Binary search and its invariant** — Lower/upper bound, the `[lo, hi)` invariant, `lo < hi` vs `lo <= hi`, overflow-safe midpoint, binary search on the answer; `bisect_left` bridge.
- **d1c — …** — …
```

### Summary rules

- **Vocabulary test.** A learner searching for "loop invariant" or "amortized" must find the lesson from the summary alone. "Covers advanced types" fails.
- **What the learner can do**, not what is discussed. "Pick `<` vs `<=` from the invariant" beats "introduces binary search variants".
- **1–2 sentences.** Mention the interactive pieces only when they're the point ("steps through each probe", "fix-the-infinite-loop exercise").
- No "this lesson covers", "we'll explore". Match the terse voice of the lessons.
- Preserve manifest order. Never alphabetize.

## Pitfalls

- Don't index `README.md`, `CLAUDE.md`, `.claude/`, `assets/`, `scripts/`, `tests/`, `archive/` — link once, don't enumerate.
- Don't mirror the filesystem; the index is a content map. Section and topic headers come from manifest titles, with the slug in backticks for navigation.
- Don't paraphrase stable entries. If a lesson didn't change, its line doesn't change.
