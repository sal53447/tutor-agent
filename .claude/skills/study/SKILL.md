---
name: study
description: Learner entry point for this curriculum. It runs a study session with the tutor agent. Use when the user wants to learn, review or be quizzed, or asks a data-structures/algorithms question in the context of the lessons: "/study d1b", "/study dsa", "/study due", "/study quiz dsa", "what should I do next", "explain the loop invariant again", "quiz me on binary search", "I don't get amortized analysis". Reads INDEX.md and the learner's exported progress/progress.json, then drives the tutor agent.
---

# study

The browser pages teach; this skill is the conversation around them. It never edits lessons.

## Resolve what the learner wants

| input | action |
|---|---|
| `/study` (no args) / "what next" | Load progress → pick the first incomplete lesson in manifest order (or the lesson with failing exercises most recently attempted) → open a session on it |
| `/study d1b` / lesson id | Session on that lesson |
| `/study dsa` / topic or section slug | Session on the first incomplete lesson of that topic |
| `/study due` / "review" | Spaced review: list due recall cards (from progress `cards`) grouped by lesson; quiz through them in chat, grade by the learner's self-report, remind them to also grade in `review.html` so the schedule updates |
| `/study quiz <id|topic>` | Quiz mode: ask the lesson's recall questions and predict exercises one at a time; don't reveal answers until the learner answers |
| a question | Q&A: delegate to `tutor` with the question |

## Progress

`progress/progress.json` is exported from the index page (Export button). If it is missing, say so once, explain how to export, and proceed without it (assume nothing is done). Never guess progress. Structure is documented in `.claude/skills/site-contract/references/widgets.md` § Progress.

## A session

1. Delegate to the `tutor` agent with: the lesson id/path, the learner's status for it (`read`, exercises passed/total, block ids attempted, due cards), and the mode (learn / quiz / q&a / review).
2. The tutor's reply is the conversation; relay it. Keep the loop going — follow-ups go back to the **same** tutor agent (SendMessage) so it keeps context.
3. Close by naming the next concrete action: open the lesson URL (`http://localhost:8080` + path), run a specific exercise block id, or export progress.

## Dev server

Sessions reference lesson URLs. If `http://localhost:8080` isn't up, tell the learner to run `npm run dev` (don't start long-running servers from inside a session unless asked).
