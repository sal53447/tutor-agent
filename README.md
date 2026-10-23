# Data structures & algorithms: an interactive curriculum for a Python engineer

Lessons are written as Markdown sources by Claude Code agents and rendered into interactive pages. Code is JavaScript and runs in the page. Python bridges appear where the idiom differs.

Each lesson is a page of **blocks**:

| block | what you get |
|---|---|
| concept | terse explanation + code, callouts for gotchas and good/bad patterns |
| Python bridge | the mapping to what you already know (`bisect`, `heapq`, `deque` …) |
| stepper | animated step-through: array pointers, linked structures, call stacks, phases |
| diagram | states and structures, drawn from a spec so every one looks the same |
| playground | the lesson's code, editable and runnable in the page |
| exercise | predict-the-output, fix-the-bug, complete-the-function (with tests, hints, solution), multiple choice |
| review | what bites in production or in an interview |
| recall | flashcards; `review.html` gathers the ones that are due across all lessons |

Progress lives in your browser. Export it (Index → Export) to `progress/progress.json` and the tutor agent can see where you are.

## Run it

```bash
npm install
npm run dev        # → http://localhost:8080 (rebuilds when src/ changes)
```

Needs Node ≥ 20.

## Learn with the agent

In Claude Code, inside this repo:

- `/study`: what to do next, based on your exported progress
- `/study d1b`: a session on one lesson
- `/study quiz dsa`: get quizzed from recall cards and predict exercises
- `/study due`: spaced review in chat
- or just ask a question, and the tutor answers from the lessons and names the block to open.

## Add lessons

`/add-lesson` with a topic, e.g. "add a lesson on two pointers". See `CLAUDE.md` for how content (`src/**/*.md`) and site (`scripts/build.mjs`, `assets/runtime/`) are split.

The previous JS/TS/Express/React/Next.js curriculum is kept in `archive/` and is not built.
