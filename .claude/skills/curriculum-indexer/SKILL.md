---
name: curriculum-indexer
description: Build or refresh INDEX.md — a tree-structured, concept-level map of a teaching/curriculum repo. Each lesson gets a 1–2 sentence summary that names concepts by vocabulary so learners can target specific topics without opening every file. Also detects what's been added, changed, or removed since the last index was built. Use this skill whenever the user says "make / build / update / refresh the index", "summarize the curriculum", "what's in this teaching repo", "list all topics", "what's new?", or wants a table-of-contents view of lesson material. Excludes code/build folders (node_modules, dist, build, .git, etc.); focuses exclusively on HTML / Markdown teaching content.
---

# Curriculum Indexer

Builds a scannable, tree-structured index of a teaching repository so learners and contributors can find specific concepts without opening every file. The output is **concept-focused**, not file-focused: each entry explains what a learner will know after reading the lesson, named by the vocabulary they'd actually search for.

## When to run

- User asks to "make / build / update / refresh the index"
- User asks "what's in this curriculum?" / "list the topics" / "summarize the content"
- After lessons are added, to check whether `INDEX.md` needs updating
- On first arrival in an unfamiliar teaching repo, to orient

## What counts as teaching content

**Include:**
- HTML lesson pages (usually `<article>` / `<section>` with headings)
- Markdown docs (`.md`, `.mdx`) that explain concepts
- Notebooks (`.ipynb`) if expository

**Exclude:**
- Build / cache folders: `node_modules/`, `.git/`, `dist/`, `build/`, `out/`, `.next/`, `.cache/`, `coverage/`
- Pure source folders: `src/`, `lib/`, `app/` — unless the repo explicitly documents lessons there
- Shared asset folders: `assets/`, `public/`, `static/` (unless they contain prose)
- `package.json`, `tsconfig.json`, lockfiles, configs
- `README.md`, `CONTRIBUTING.md`, `LICENSE` — these are **metadata**; link once in the intro, don't index their sections
- Plugin / tool directories like `.claude/`, `.vscode/`

If you're unsure whether a folder is code or content, peek at one or two files. Teaching content is mostly prose with embedded examples; code is mostly source.

## How to build the index

1. **Find teaching files** using Glob with the include/exclude rules above.
2. **Find sectioning.** Most teaching repos group lessons into ordered folders (`01-foo`, `part-1-intro`, `module-a`). Preserve on-disk order — it encodes the intended learning sequence.
3. **Per file, extract:**
   - Title — usually `<h1>` or first `#`
   - Top-level headings — `<h2>` / `##` for subtopics
   - The actual point — enough prose to understand what a learner will know after finishing
4. **Write the summary** using the vocabulary test (below).
5. **Assemble `INDEX.md`** at the repo root.

Prefer reading content over trusting filenames. Filenames are lossy; content isn't.

## Output format

Write `INDEX.md` at the repo root. Structure:

```markdown
# Curriculum Index

_One paragraph: what this curriculum teaches, who it's for, the learning arc._

See [`README.md`](./README.md) for setup and contribution notes.

---

## Part 1 — <Section Title> (N lessons)

_One-sentence summary of the part as a whole._

- **1a — Lesson Title** — One-to-two sentence summary naming concepts by vocabulary (e.g., "closures, hoisting, TDZ, `this` binding, class field arrows").
  - Subtopic — brief note (only when the lesson holds separable searchable concepts)
- **1b — Next Lesson Title** — Summary.

## Part 2 — <Next Section> (N lessons)

_Summary._

- **2a — ...** — Summary.
```

### Summary rules

- **Name concepts by vocabulary.** A learner searching for "discriminated unions" or "`unstable_cache`" must be able to find the lesson from the summary alone. Vague summaries like "covers advanced types" fail the test.
- **Say what the learner will be able to do, not what you'll discuss.** "Write typed Express middleware with declaration merging" beats "introduces middleware typing".
- **1–2 sentences. No more.** If you need three, split into subtopics.
- **Cut fluff.** No "this lesson covers", "we'll explore", "you'll learn about". State the content.
- **Preserve on-disk ordering.** The index follows lesson order; don't alphabetize or re-prioritize.

### Subtopics

Add nested bullets only when:
- The lesson is substantial enough to hold multiple separable concepts, AND
- Those concepts are terms a learner would search for independently.

Don't invent subtopics to pad short lessons — a single summary line is fine.

## Update mode: diffing an existing index

If `INDEX.md` already exists, this is an **update**, not a rebuild:

1. Read existing `INDEX.md`.
2. List current teaching files on disk.
3. Compute the diff:
   - **Added** — files on disk with no entry → draft new entries
   - **Removed** — entries with no file on disk → delete
   - **Changed** — files whose titles or top-level headings have materially shifted → refresh
4. **Report the diff to the user before writing anything:**

   ```
   Added:     05-nextjs/5l-new-lesson.html
   Removed:   03-express/3z-deleted.html
   Changed:   04-react/4i-forms.html (added React 19 Form Actions section)
   Unchanged: 48 files
   ```

5. If the user asked **"is the index up to date?"** or **"what's new?"** — stop after reporting. Don't rewrite unless asked.

6. If the user asked to update — write the new `INDEX.md`. **Preserve existing summaries verbatim for unchanged lessons.** Consistency across re-runs is a feature; don't paraphrase stable entries.

## Efficiency for large repos

- Start with Glob to list candidates; don't read everything upfront.
- For updates, read `INDEX.md` once and track which files already have entries — skip re-reading those unless headings changed.
- For fresh builds on very large repos (>80 lessons), spawn parallel subagents — one per top-level section — each producing its part of the index. Merge at the end.

## Common pitfalls

- **Don't index code folders.** If a teaching repo has a companion `/examples/` with runnable code, link to it once in the intro; don't enumerate files.
- **Don't mirror the filesystem.** The index is a **content map**, not a directory listing. If a filename is cryptic (`1f-...`) but the title is clear ("Async & the Event Loop"), use the title.
- **Don't duplicate the README.** README = audience, setup, contributing. INDEX = topic lookup. Keep them distinct.
- **Don't under-summarize.** "Covers React." is useless. Test: could a learner searching for "`useReducer` with discriminated unions" find the right lesson from your summary alone?
- **Match the curriculum's voice.** If lessons are terse and practitioner-focused, summaries are too. Don't inject enthusiasm the source material lacks.

## Example excerpt

```markdown
# Curriculum Index

_A five-part curriculum taking Python-fluent engineers through modern full-stack JS/TS: JavaScript → TypeScript → Express → React → Next.js. Lessons are HTML, readable in any browser._

See [`README.md`](./README.md) for audience, setup, and contribution notes.

---

## Part 1 — JavaScript (11 lessons)

_Language semantics and runtime model JS developers need day-to-day._

- **1a — Language model** — Values, primitives, equality, truthiness, `??` / `?.`, `const` semantics, the `typeof null` fossil, symbols.
- **1b — Functions & scope** — Declarations vs expressions, closures, hoisting vs TDZ, `this` binding, class field arrow functions, rest over `arguments`.
- **1c — Objects, prototypes, classes** — Object literals, the prototype chain, ES classes, destructuring (object / array / parameter forms), spread + `Object.assign`, `hasOwn` vs `in`.
- **1d — Arrays & iteration** — Array methods (mutating vs immutable), `for...of`, `Map`, `Set`, generators, `reduce` for object-building.
...
```
