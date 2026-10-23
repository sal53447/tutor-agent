---
name: add-lesson
description: The authoring pipeline for this curriculum. Write a new lesson, or revise one, from brief to checked page. Use when the user says "add a lesson on X", "write d1c", "add a two-pointers lesson", "fill the gaps in d1a", "start a new section/topic on graphs". It orchestrates content-author (writes the Markdown source) → build + checks → content-reviewer → index refresh, and routes format limitations to site-builder.
---

# add-lesson

Lessons are Markdown sources rendered by `scripts/build.mjs`. The pipeline is **one content agent, one reviewer, and scripts for everything mechanical**. You (the orchestrator) own the manifest edit, the brief, running the checks and routing findings. Don't write lesson content yourself; delegate it, so the reviewer stays independent.

## Cost rules (from the 2026-10-22 usage-limit incident)

- **Pilot before scale.** For a new section or topic, run the pipeline on one lesson, report its token cost to the user, and get a go-ahead before writing the rest.
- **At most 3 lessons in flight**, and ask the user before fanning out. Lessons in different sections can run in parallel; within a section run them serially, because the reviewer's findings on lesson n improve the brief for n+1.
- **At most two fix loops** per lesson. After that, report the remaining findings instead of forcing it.
- Agents read only what the brief points to. Don't hand them whole other lessons as "examples"; the format spec and its example file are enough.

## Steps

### 0. Brief
Read `assets/manifest.js` and the `INDEX.md` entries of the neighbouring lessons. Write a brief of at most 8 lines:
- id, title, source path;
- 2–4 goals (what the learner can *do*);
- the mechanism(s) worth a stepper;
- what the previous lesson already covered;
- anything the user specifically asked for.

### 1. Manifest (new lessons)
Add `{ id, file: "<id>-<slug>.html", title }` to the section, and fix the topic `desc` lesson count. Ids are `<topicLetter><section#><letter>` (`references` in the `site-contract` skill). Don't create the source file; the author does.

### 2. `content-author`
Spawn it with the brief. It researches, writes `src/…/<id>-<slug>.md`, and gets `build`, `validate` and `snippets` clean itself. If it reports a **format limitation** (no way to express a needed visual or exercise), decide:
- the limitation is real and recurring → `site-builder` extends the vocabulary first, then the author resumes (SendMessage, same agent);
- it can be worked around with what exists → tell the author how.

### 3. Checks (yours, cheap)
```bash
npm run check -- <id>     # build + validate + snippets + smoke
```
Snippets takes a file path, so for a single lesson run `npm run build && npm run validate && npm run snippets -- <html> && npm run smoke -- <id>`. Send failures back to the same author agent via SendMessage.

### 4. `content-reviewer`
Spawn it with the brief's goals and the source path. Route findings:
- BLOCKING/SHOULD about content → `content-author` (SendMessage, same agent);
- renderer/widget issues → `site-builder`.

Report NITs to the user rather than looping on them.

### 5. Index + report
Run the `curriculum-indexer` skill in update mode. Report to the user:
- the lesson URL (`http://localhost:8080/content/…`);
- the block list;
- check results;
- the reviewer's verdict and what was fixed;
- the token cost of the run, summed from the agents' usage.
