# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A static, browser-only teaching curriculum — **53 HTML lessons** across five parts (JavaScript → TypeScript → Express → React → Next.js), targeted at experienced engineers (Python background assumed). **No build system, no package.json, no tests, no server.** You open `index.html` in a browser and it works. Lessons link to Prism and the local `assets/` folder; that is the entire runtime.

Do not add a bundler, test framework, or package manifest unless the user asks for one — it would be a category error in this repo.

## Running / previewing

- Open `index.html` directly in a browser, or serve the folder with any static server (`python -m http.server`, `npx serve`, etc.) if you want cleaner URLs.
- Every lesson is standalone — opening `01-javascript/1b-functions-scope.html` directly also works.

## The one load-bearing file: `assets/nav.js`

`assets/nav.js` is the **manifest of record** for the entire curriculum. It holds:

- `LESSONS` — an ordered array of every lesson (`id`, `folder`, `file`, `part`, `title`). The index page, prev/next nav, search filter, and progress tracking are all driven from this one array.
- `PART_INFO` — per-part `name`, `desc`, `bridge`, `time` fields rendered in the section headers on `index.html`.

**Adding, removing, reordering, or renaming a lesson requires editing `LESSONS` here.** Nothing auto-discovers files. A new HTML file on disk that isn't in the manifest is invisible to `index.html`, `prev/next`, progress, and search. The README's "Contributing / authoring" section documents this.

If you add a lesson, also verify `PART_INFO[part].desc` still describes the correct lesson count.

Progress is stored under localStorage key `curriculum-progress-v2`. If you change the manifest's `id` scheme, existing users' progress becomes orphaned.

## Lesson HTML anatomy

Every lesson file follows the same structural contract. Match it when adding lessons, and expect it when editing:

- `<body data-lesson="1a">` — the `data-lesson` attribute is how `nav.js` knows which lesson this page is, to wire up prev/next and the "mark as read" checkbox. The value must match an `id` in the `LESSONS` manifest.
- `<nav class="topbar">` with `← Index`, crumb, and prev/next links (IDs `prev-link` / `next-link`, filled by `nav.js` at load).
- `<article class="lesson">` with a header containing `.lesson-id`, `<h1>`, and the `.mark-done` checkbox.
- `<h2>` sections throughout. Avoid `<h3>` unless a lesson is genuinely deep enough to need a third level.
- Code blocks as `<pre><code class="language-javascript">` (or `language-ts`, `language-tsx`, `language-bash`, `language-json`, etc.). Prism autohighlights on load.

Two Prism script tags and `nav.js` are loaded at the bottom of every page — these are duplicated manually across all 53 files. If you change the bundle, change it everywhere.

## Callout classes (the pedagogical vocabulary)

These classes are shared across all lessons and styled in `assets/styles.css`. Use them; do not invent new ones.

- `<div class="callout py">` — **Python bridge.** Short explanation in Python terms. Used heavily; it's a defining convention of this curriculum.
- `<div class="callout warn">` — gotcha / surprising behavior to watch for.
- `<div class="callout good">` / `<div class="callout bad">` — right-vs-wrong pattern contrast.
- `<div class="callout review">` — "what a staff engineer would flag in code review." Real production concerns, not trivia.
- `<details class="quiz">` — self-check question. `<summary>` holds the prompt; the body holds the answer.

Each callout has a `<div class="tag">Python bridge</div>` (or equivalent label) as its first child. Follow the existing pattern when adding one.

## Voice and content conventions

The lessons are **terse, practitioner-voiced, and code-forward** — not tutorial prose. Match this tone in any edits:

- State the content directly. No "in this lesson we will explore", "you'll learn about", "let's dive in".
- Name concepts by the vocabulary a practitioner would search for (`TDZ`, `useActionState`, `unstable_cache`, `z.infer`) so lessons are greppable.
- Python bridge callouts are high-value — add them when the analogy is genuinely load-bearing, skip when forced.
- `callout review` items are about real production behavior, not style nitpicks.

**Current framework assumptions (as of the April 2026 rewrite):** React 19 (Form Actions, Compiler, `use()` hook, ref-as-prop), Next.js 15 (App Router default, opt-in caching, `useActionState` not `useFormState`, `await params`), TypeScript 5.x, Vitest as the default test runner. If a lesson references older APIs, it's probably stale and should be updated rather than preserved.

## The three top-level reference files

They look similar but serve different purposes. Don't merge them.

- **`index.html`** — the interactive landing page. Rendered from `nav.js`, includes progress tracking, search filter, keyboard shortcuts. Learner-facing.
- **`README.md`** — setup, features, and contribution notes. Brief.
- **`INDEX.md`** — a concept-level content map of all 53 lessons with 1–2 sentence summaries per lesson naming the vocabulary taught. Use this when looking up *where a topic lives* without opening files. Regenerated by the `curriculum-indexer` skill (see below).

## Custom agents and skills in `.claude/`

This repo has project-scoped agents and a skill that are useful for the work typically done here:

- **`.claude/agents/teaching-content-auditor.md`** — audits or expands teaching content. Good for "what's missing from this section" or "fill in these gaps."
- **`.claude/agents/followup-qa-specialist.md`** — answers follow-up questions, grounding answers in the relevant lesson via `INDEX.md`. Falls back to general knowledge when a question is outside the curriculum (explicitly labeling the source).
- **`.claude/skills/curriculum-indexer/SKILL.md`** — regenerates or updates `INDEX.md`. In update mode it diffs against existing entries and reports added/removed/changed lessons before rewriting.

Prefer invoking these when the task fits — they encode the curriculum's conventions (callout classes, voice, quiz pattern).

## Parallel work guidance

Large edits that span sections (e.g., "fix all React 19 references across Part 4 and Part 5") parallelize well by spawning one agent per section folder. Folders don't share files, so there's no merge conflict risk. The `teaching-content-auditor` agent is well-suited for this pattern.
