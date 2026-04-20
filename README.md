# Tutor Agent — JS / TS / Express / React / Next.js Curriculum for Python Engineers

A static, browser-only teaching curriculum of 53 HTML lessons across five parts, calibrated for experienced engineers coming from Python. No build step, no server, no dependencies — just open it in a browser.

**Open [`index.html`](./index.html) in any browser.** It's the hub that links to every lesson.

## Structure

```
curriculum/
├── index.html                ← start here (the hub)
├── INDEX.md                  concept-level content map (53 lessons, 1–2 sentence summaries each)
├── CLAUDE.md                 guidance for Claude Code when working in this repo
├── assets/
│   ├── styles.css            shared styles (dark theme)
│   └── nav.js                shared navigation + progress logic (the lesson manifest lives here)
├── .claude/                  project-scoped Claude Code agents and skills
│   ├── agents/               teaching-content-auditor, followup-qa-specialist
│   └── skills/               curriculum-indexer (regenerates INDEX.md)
├── 01-javascript/            11 lessons
├── 02-typescript/             8 lessons
├── 03-express/               10 lessons
├── 04-react/                 13 lessons
└── 05-nextjs/                11 lessons
```

Each lesson is a small, self-contained HTML file. Opening a lesson only loads that page — no bloat, fast navigation.

## Features

- **Dark theme** throughout.
- **Progress tracking** — check off lessons as you read; persisted in your browser's local storage.
- **Search** — filter lessons from the index in real time.
- **Keyboard shortcuts** on every lesson: `J` / `→` for next, `K` / `←` for previous.
- **Copy-code buttons** on every snippet.
- **Revealable self-check answers** on selected lessons (click to open).
- **Syntax highlighting** via Prism (loaded on-demand per page).

## How the lessons are written

Calibrated for an experienced engineer. Each lesson: concept intro, real snippets (often right-vs-wrong variants), Python bridge where it helps, trade-off tables, "what a staff engineer would flag in code review" callouts, and common production pitfalls.

**Current framework versions covered** (as of April 2026): React 19 (Form Actions, Compiler, `use()` hook), Next.js 15 (App Router, opt-in caching, `useActionState`, `await params`), TypeScript 5.x, Vitest.

See [`INDEX.md`](./INDEX.md) for a scannable map of every lesson with concept-level summaries — useful for finding the right lesson by topic without opening files.

## Running it locally

No setup. Either:

- **Open `index.html` directly** in any modern browser, or
- **Serve the folder** with any static server if you prefer clean URLs:
  ```bash
  python -m http.server 8000
  # or
  npx serve .
  ```

## Contributing / authoring

New lessons must be registered manually in `assets/nav.js` — find the `LESSONS` array and add an entry with the correct `id`, `folder`, `file`, `part`, and `title` fields in the right position. The index page, progress tracking, prev/next navigation, and search are all driven from that manifest; no other file needs editing for a new lesson to appear. If you add a lesson that changes the count for a part, also update the `desc` string in `PART_INFO` for that part.

When adding content, match the existing voice: terse, practitioner-focused, vocabulary-first. See [`CLAUDE.md`](./CLAUDE.md) for the full authoring conventions (callout classes, quiz pattern, lesson HTML anatomy).

## Built with / alongside Claude Code

The curriculum was drafted and iteratively expanded using [Claude Code](https://claude.com/claude-code). Project-scoped agents and a skill live in [`.claude/`](./.claude/):

- **`teaching-content-auditor`** — audits sections for pedagogical gaps and writes additions
- **`followup-qa-specialist`** — answers follow-up questions grounded in the relevant lesson via `INDEX.md`
- **`curriculum-indexer`** skill — regenerates `INDEX.md`; diffs additions/removals/changes against the existing index

## License

No license specified — treat content as all-rights-reserved unless that changes.
