# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this repo is

An **interactive learning platform** for one experienced engineer (Python background). Current topic: **data structures & algorithms, taught in JavaScript**. Lessons are interactive pages with animated step-throughs, runnable playgrounds, graded exercises and spaced-recall cards. Claude Code agents write them. Scope is coding / CS only; don't generalise it into a generic learning framework.

The first curriculum (53 JS/TS/Express/React/Next.js lessons) is archived in `archive/` and is out of the build. Don't revive or convert it unless asked.

## Two sides, one format

```
CONTENT CREATORS                       SITE BUILDERS
content-author → src/**/<id>-*.md  ──► scripts/build.mjs ──► content/**.html (generated, gitignored)
content-reviewer (gate)                assets/runtime/ widgets · validate/snippets/smoke · manifest
        skill: content-format                  skill: site-contract
```

- **Content** is Markdown with frontmatter (`goals`, `sources`, `gaps`) and `::: <type> #NN` blocks: concept, bridge, diagram, stepper, playground, exercise, review, recall. Authors never write HTML. Spec: `.claude/skills/content-format/SKILL.md`.
- **The site** is a deterministic renderer plus a browser runtime. It changes only when the vocabulary changes (new block type, new stepper kind), never per lesson. Spec: `.claude/skills/site-contract/SKILL.md`.
- If an author can't express something, that is a site-builder task. Don't hand-write HTML into a lesson.

## Running

```bash
npm install
npm run dev           # build --watch + http://localhost:8080 (ES modules need http://)
npm run build         # src → content
npm run validate      # build + page contract + manifest↔source
npm run snippets -- content/dsa/foundations/d1b-binary-search.html   # runs playgrounds/exercises in node
npm run smoke -- d1b  # real Chrome (/usr/bin/google-chrome) clicks every widget
npm run check         # build + validate + snippets + smoke, everything
npm test              # vitest
```

## Load-bearing files

| file | role |
|---|---|
| `assets/manifest.js` | **The registry.** `topics[].sections[].lessons[]`. A lesson not listed here doesn't exist. Ids (`d1b`) are permanent; block ids `d1b-NN` and progress hang off them. |
| `src/<topic>/<section>/<id>-<slug>.md` | Lesson sources: the only thing content creators edit. |
| `scripts/build.mjs` | Source → page. The only writer of lesson HTML. |
| `assets/runtime/` | `boot.js` page entry; `widgets/` stepper (queue/chain/timeline/array), diagram, playground, exercise, recall; `sandbox.js` + `harness.js` code execution; `progress.js` localStorage progress. |
| `scripts/validate.mjs`, `run-snippets.mjs`, `smoke.mjs` | The gates. |
| `INDEX.md` | Concept map of lessons. The tutor navigates by it. Refresh with `curriculum-indexer`. |

## Agents and skills

- Skills: **`content-format`** (authors' spec), **`site-contract`** (renderer/runtime/gates), **`add-lesson`** (pipeline: brief → `content-author` → checks → `content-reviewer` → index), **`curriculum-indexer`**, **`study`** (learner entry → `tutor`).
- Agents: `content-author` (research + whole lesson source), `content-reviewer` (read-only gate), `site-builder` (vocabulary/runtime changes), `tutor` (learner-facing; reads sources, cites block ids).
- Subagents have no Skill tool. Tell them to read the skill file directly.

## Cost discipline

On 2026-10-22, 14 parallel full-pipeline agents hit the usage limit and were all cut off. The rules since then:
- Pilot one lesson and report its token cost before scaling.
- Run at most 3 lesson pipelines at once, and only after asking.
- Use scripts, not agents, for anything mechanical.
- Agents read sources (`.md`), not generated HTML.

## Definition of done for a lesson

`npm run check` clean for it · `content-reviewer` has no BLOCKING findings · `INDEX.md` refreshed.
