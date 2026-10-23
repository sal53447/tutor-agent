---
name: content-format
description: The source format content creators write — one Markdown file per lesson under src/<topic>/<section>/<id>-<slug>.md, with YAML frontmatter (goals, sources, gaps) and `::: <type> #NN` blocks (concept, bridge, diagram, stepper, playground, exercise, review, recall). Load this BEFORE writing or editing any lesson source, and when answering "how do I write an exercise / stepper / recall card". Content creators never write HTML; scripts/build.mjs renders this format into pages.
---

# Lesson source format

A lesson is **one Markdown file**: `src/<topic.slug>/<section.slug>/<id>-<slug>.md`. You write content and data. `npm run build` turns it into the page; you never write or edit HTML, CSS or runtime JS. If the format can't express what you need, stop and report the gap (it goes to the site builder). Don't work around it.

The real example is `src/dsa/foundations/d1b-binary-search.md`. Copy its shape.

## File skeleton

```markdown
---
id: d1b                         # must equal the manifest id
title: Binary search and its invariant
goals:                          # what the learner can DO afterwards; exercises must test these
  - Write a binary search that terminates on every input
  - State the loop invariant and use it to pick < vs <=
sources:                        # where the facts came from (URL or "book, chapter")
  - https://en.wikipedia.org/wiki/Binary_search
gaps: []                        # open questions / things you couldn't verify
---

::: concept #01
## The idea in one line
Prose…
:::

::: stepper #02 kind=array
…
:::
```

Rules:
- **Every line is inside a block**, except blank lines and `<!-- comments -->` between blocks.
- A block opens with `::: <type> #NN [key=value …]` and closes with a line that is just `:::`.
- `#NN` is a two-digit number, unique in the file. It becomes the block id `d1b-NN`, which keys the learner's progress. **Never renumber or reuse a number.** New blocks take the next unused number, whatever their position in the file.
- Blocks don't nest. A `:::` line inside a code fence is safe.

## Markdown inside blocks

This is standard GitHub Markdown: paragraphs, lists, tables, `inline code`, links, `###` subheads. Use `##` only as the first line of a `concept`.

Code fences are ```` ```js ````, ```` ```ts ````, ```` ```py ````, ```` ```bash ````, ```` ```json ```` and so on. Only `js`/`ts`/`jsx`/`tsx` can run. `py` is display-only (Python bridges).

Callouts are blockquotes that start with a marker. The text after the marker is the label; leave it out to get the default.

```markdown
> [!py] Python
> `bisect.bisect_left(a, x)` is exactly the lower-bound loop below.

> [!warn] Gotcha
> `(lo + hi) / 2` is a float in JS — use `(lo + hi) >> 1` or `Math.floor`.
```

Kinds: `py`, `warn`, `good` (Do), `bad` (Don't), `review`.

## Block types

### concept / bridge / review: prose
```markdown
::: concept #01
## Why sorted input buys you log n
…
:::

::: bridge #03
Python's `bisect` module… (label defaults to "Python bridge"; `tag="…"` overrides)
:::

::: review #14
- **Off-by-one on `hi`.** What breaks in production, and what to do instead.
:::
```
`review` is for production and code-review concerns, not style tips.

### diagram: a static picture (states, layers, a structure)
````markdown
::: diagram #04
```json
{ "direction": "down",
  "nodes": [ { "id": "a", "label": "unsorted", "kind": "pill" }, { "id": "b", "label": "sorted", "kind": "pill" } ],
  "edges": [ { "from": "a", "to": "b", "label": "sort O(n log n)" } ] }
```
One sentence: what the picture proves (becomes the caption).
:::
````
Node `kind`: `box` | `pill` (state) | `cyl` (store) | `note`. Use `\n` in a label for two lines. Keep it to ≤10 nodes and ≤7 per row. Set `"direction": "right"` for pipelines.

### stepper: something that changes over time (the main DSA tool)
````markdown
::: stepper #02 kind=array
Optional intro sentence.
```json
{ "code": "while (lo <= hi) {\n  const mid = (lo + hi) >> 1;\n  …\n}",
  "steps": [
    { "label": "Start", "line": 1, "note": "The <em>why</em>, in one or two sentences (HTML ok).",
      "state": { "cells": [2,5,8,12,16,23,38], "pointers": { "lo": 0, "hi": 6 }, "window": [0,6], "vars": { "target": 23 } } }
  ] }
```
:::
````
Each step shows exactly one visible change. Use 6–12 steps. The first step is the initial state and the last is the settled one. Keep `label` to 5 words or fewer. Use `note` for *why*. `line` highlights a line of `code`, which is optional but preferred and should be 12 lines or fewer.

| `kind=` | `state` | use for |
|---|---|---|
| `array` | `cells` (values), `pointers` `{name: index}` (index `cells.length` = past-the-end slot, for an exclusive `hi`), `window` `[first, last]` inclusive (cells outside are dimmed; `[4, 3]` = empty; for half-open `[lo, hi)` write `[lo, hi - 1]`), `mark` `[indices]` (highlighted), `vars` `{name: value}` | binary search, two pointers, sliding window, sorting passes, prefix sums |
| `chain` | `nodes` `[{id,label,fields[]}]`, `edges` `[[from,to,label]]`, `active` `[ids]` | linked lists, hash buckets, small trees, call trees of recursion |
| `queue` | `stack`, `pending`, `micro`, `macro`, `output` (string lists) | stack/queue operations, the call stack of recursion |
| `timeline` | `lanes` `[{name, items:[{label, state: idle\|active\|done}]}]` | phases: divide → conquer → combine |

### playground: runnable, editable code
````markdown
::: playground #05
What to try: 2–3 concrete edits that change the result.
```js
console.log(binarySearch([1, 3, 5], 5));
```
```output
2
```
:::
````
The `output` fence is optional. When present, the checks compare console output against it **exactly**, so write it by running the code, not from memory. Available in code: `console`, timers, top-level `await`, and the test helpers (below). There's no DOM in `js`/`ts`. The run times out after 3 s.

### exercise: graded
`kind=predict`: the learner types the output.
````markdown
::: exercise #06 kind=predict
What does this print?
```js
console.log([3, 1, 2].sort());
```
```output
[ 1, 2, 3 ]
```
```hint
Default sort compares strings.
```
```explain
Why. Markdown ok.
```
:::
````
Output is formatted like Node's `console.log` (`[ 1, 2, 3 ]`, `{ a: 1 }`, `[ 'a' ]`, `Map(1) { 'k' => 1 }`) but always **on one line**. Node wraps long arrays; the sandbox doesn't. The safe way to write any `output` fence: leave it empty or guess, run `npm run snippets`, and copy the `actual:` line it prints.

`kind=fix` / `kind=complete`: the learner edits the code until the tests pass.
````markdown
::: exercise #07 kind=complete
Implement `lowerBound(a, x)`: the first index with `a[i] >= x`.
```js
function lowerBound(a, x) {
  // TODO
}
```
```js tests
test("finds first of duplicates", () => assert.equal(lowerBound([1, 2, 2, 3], 2), 1));
test("past the end", () => assert.equal(lowerBound([1, 2], 9), 2));
```
```js solution
function lowerBound(a, x) {
  let lo = 0, hi = a.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (a[mid] < x) lo = mid + 1; else hi = mid; }
  return lo;
}
```
```hint
Keep `hi` exclusive: the answer is always in `[lo, hi]`.
```
:::
````
- The unlabelled ```` ```js ```` fence is the starter. It must **fail** the tests.
- ```` ```js solution ```` is the whole starter with the fix applied, and it must **pass** the tests.
- Tests are appended after the learner's code, so they see every top-level name. Available: `test(name, fn)`, `assert(cond, msg)`, `assert.equal(a, b)` (deep), `assert.notEqual`, `assert.throws(fn)`, `assert.rejects(p)`.
- Add one ```` ```hint ```` fence per hint, in order, from a nudge to almost the answer. `explain` is optional.
- For performance claims, test the *count* (instrument a counter), not wall-clock time.

`kind=mcq`: options are a task list, and `[x]` marks the right one(s). Several `[x]` makes it multi-select.
````markdown
::: exercise #08 kind=mcq
`a` has 1,000,000 sorted items. Worst-case comparisons for binary search?
- [ ] ~1,000
- [x] ~20
- [ ] ~500,000
```explain
log2(10^6) ≈ 19.9.
```
:::
````

### recall: spaced-repetition cards
```markdown
::: recall #15
### What invariant does lower-bound binary search keep?
The answer is always in `[lo, hi]`; `hi` is exclusive.

### Time and space of iterative binary search?
O(log n) time, O(1) space.
:::
```
Each `###` line is a question and everything until the next `###` is its answer. Write at least 5 cards, each holding one retrievable fact. Questions must stand alone, so never write "the code above". Only **append** cards, because each card's progress is keyed by its position.

## What a lesson needs (the checks enforce this)

- At least 1 visual (`stepper` or `diagram`), at least 3 exercises (predict → fix/complete → mcq is a good ladder), and 1 `recall` with at least 5 cards.
- A Python bridge (`bridge` block or `[!py]` callout) where the Python idiom differs.
- `goals` in the frontmatter, and every goal tested by at least one exercise.
- Every fact you weren't sure of goes in `sources` or `gaps`. Don't guess quietly.

Self-check before you report. These are the mistakes reviews actually catch:
- Every goal has an exercise where the learner **writes** the code (fix/complete), not just a predict or mcq.
- A fix/complete prompt states every bound its tests enforce ("≤ 11 reads for 1024 items").
- Every stepper step follows from the code and the previous state: no assignment happens only in a note, and `line` points at the line that caused the change.
- Every edit a playground suggests actually changes the output. Run it to confirm.
- When a concept explains why something fails, it gives the general mechanism, not one special case.
- Tests reject *every* wrong approach, not just the starter's. Spying on one built-in (`includes`) lets `findIndex` or a hand loop through. Count element reads through a `Proxy` over the input instead.
- Tests accept *every* correct approach. Avoid numbers past 2^53, where equivalent formulas round differently, and don't assert on the exact helper the solution happens to use.
- Every goal clause is exercised. If a clause can't be (e.g. "string concat"), cut it from the goal rather than leaving it untested.

## Voice

Terse, practitioner, code-forward. No "in this lesson we will". Name things by the term people search for ("lower bound", "loop invariant", "amortized"). Python bridges only where the comparison carries weight. The learner is an experienced Python engineer: skip what programming is, and go deep on *why the algorithm is correct* and *where it bites*.

## Checking your work

```bash
npm run build -- d1b         # source errors print as src/…md:LINE
npm run validate             # rendered page contract
npm run snippets -- content/dsa/foundations/d1b-binary-search.html   # runs every playground/exercise in node
```
All three must be clean before you report.
