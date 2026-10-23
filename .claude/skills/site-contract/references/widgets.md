# Widget specs

The runtime lives in `assets/runtime/widgets/`. This file documents the JSON each widget receives
(build.mjs copies it from the source's ```json fence, or assembles it from the exercise fences).
New widget or kind → follow the six-step checklist in `../SKILL.md`.

## stepper (`widgets/stepper.js`)

```json
{ "code": "optional source shown above the stage", "steps": [ { "label": "…", "note": "html", "line": 2, "state": { … } } ] }
```

Controls: Back / Next / Play / ↺, arrow keys. Items that are new compared with the previous step get a pop animation, so **make each step a single visible change**. Reaching the last step marks the block done.

### kind=queue — the event loop (JS/TS, also "how does React batch", "when do Express handlers run")

```json
"state": {
  "stack":   ["main()", "fn()"],             // call stack, bottom → top
  "pending": ["timer 0ms → log(\"2\")"],     // host side: timers, I/O, fetch in flight
  "micro":   ["log(\"3\")"],                 // microtask queue, FIFO
  "macro":   ["log(\"2\")"],                 // macrotask queue, FIFO
  "output":  ["1", "4"]                      // console so far
}
```

Use `line` to highlight the source line being executed.

### kind=chain — linked structures (prototype chain, scope chain, component tree, middleware stack, module graph)

```json
"state": {
  "nodes": [
    { "id": "obj",   "label": "dog",              "fields": ["name: \"Rex\""] },
    { "id": "proto", "label": "Dog.prototype",    "fields": ["bark()"] },
    { "id": "oproto","label": "Object.prototype", "fields": ["toString()", "hasOwnProperty()"] },
    { "id": "null",  "label": "null" }
  ],
  "edges": [["obj", "proto", "[[Prototype]]"], ["proto", "oproto", "[[Prototype]]"], ["oproto", "null"]],
  "active": ["proto"]                        // highlighted nodes (e.g. where lookup currently is)
}
```

Nodes lay out top-to-bottom, wrapping into a new column after 4. Vary `active` per step to animate a lookup; add nodes per step to animate construction.

### kind=timeline — phases across lanes (request lifecycle, SSR → hydration, render → commit → effects, build pipeline)

```json
"state": {
  "lanes": [
    { "name": "Server",  "items": [{ "label": "match route", "state": "done" }, { "label": "render RSC", "state": "active" }, { "label": "stream HTML", "state": "idle" }] },
    { "name": "Network", "items": [{ "label": "HTML", "state": "idle" }, { "label": "RSC payload", "state": "idle" }] },
    { "name": "Client",  "items": [{ "label": "paint", "state": "idle" }, { "label": "hydrate", "state": "idle" }] }
  ]
}
```

`state`: `idle` | `active` | `done`. Keep the same items across steps and advance their states; that's what makes it read as time passing.

### kind=array — indexed sequences (binary search, two pointers, sliding window, sorting, prefix sums)

```json
"state": {
  "cells":    [2, 5, 8, 12, 16, 23, 38],     // values, any JSON scalar; ≤ ~14 fit comfortably
  "pointers": { "lo": 0, "mid": 3, "hi": 7 }, // named indices above the cells; same index → stacked; index = cells.length draws a dashed past-the-end slot
  "window":   [0, 6],                         // inclusive; cells outside are dimmed (default: all); hi < lo (e.g. [4, 3]) = empty
  "mark":     [5],                            // highlighted indices (found, swapped, current)
  "vars":     { "target": 23, "comparisons": 1 }  // shown as a line under the array
}
```

A cell whose value changed vs the previous step pops; so does a pointer that moved.

## diagram (`widgets/diagram.js`)

```json
{
  "direction": "down" | "right",
  "nodes": [ { "id": "a", "label": "text\nsecond line", "kind": "box|pill|cyl|note", "row": 0 } ],
  "edges": [ { "from": "a", "to": "b", "label": "text", "dashed": true } ]
}
```

- Rows (or columns for `right`) are computed from edge depth; `row` overrides.
- Arrows: down/up between rows (curved), left/right within a row (straight). Labels get a background pill.
- Up to ~7 nodes per row before labels collide. Split big pictures into two diagrams.
- Good uses: state machines (Promise, request, form status), layer diagrams (router → middleware → handler → db), data-flow (props down / events up), cache decision trees (`"kind": "note"` for the question nodes).

## playground (`widgets/playground.js`) and exercise (`widgets/exercise.js`)

Both share `sandbox.js`:

| `data-mode` | runs in | has | notes |
|---|---|---|---|
| `worker` | module Worker | `console`, timers, `fetch` (but no network), `structuredClone`, Web APIs without DOM | terminated on timeout → real infinite-loop protection |
| `dom` | sandboxed iframe (`allow-scripts`) | `document`, `#root`, React via import map, live preview under the output | logs keep streaming after "done" so interactive UIs work |
| `express` | worker + `sim-express` prelude | globals `express`, `request` | `import express from "express"` lines are dropped; other bare imports fail |

Shared prelude (both modes):

- `console.*` captured and formatted (`{ a: 1 }`, `Map(1) { "k" => 1 }`, `[Function: f]`, `10n`).
- `test(name, fn)`, `assert(c, msg)`, `assert.equal(a, b, msg)` (deep), `assert.notEqual`, `assert.throws(fn)`, `assert.rejects(promiseOrFn)`.
- Code is wrapped in an async IIFE: top-level `await` works; `import` lines are hoisted out.
- After the body finishes the sandbox waits `settleMs` (80 ms) for pending timers, then reports. Timers longer than that won't be captured — keep demo delays ≤ 50 ms.
- Timeout 3 s.

### sim-express API (express mode)

```js
const app = express();                       // also express.Router(), express.json(), express.urlencoded(), express.static()
app.use([path], ...fns);  app.get/post/put/patch/delete/all(path, ...fns);
app.listen(port, cb);                        // prints "(listening on … — simulated)"

// req: method, path, url, originalUrl, params, query, body, headers, get(name), ip
// res: status(c), set(k, v), get(k), type(t), json(b), send(b), end(), sendStatus(c), redirect(url), cookie(k, v), locals, statusCode, headersSent
// next(), next(err); error handlers are (err, req, res, next)

const r = await request(app, { method: "POST", path: "/users?x=1", body: { name: "n" }, headers: { authorization: "Bearer t" } });
r.status; r.headers; r.body;                 // body is parsed when content-type is application/json
```

Unmatched routes → 404 `{ error: "Cannot GET /x" }`; unhandled error → 500 `{ error }`; a handler that neither responds nor calls `next()` → `request` rejects after 1 s with "never responded". `express.json()` parses a string body; object bodies pass through.

## recall (`widgets/recall.js`)

Cards are `<dt>/<dd>` pairs. Per-card progress key `<blockId>#<index>` — so **appending** cards is safe, inserting shifts keys (acceptable; only review scheduling resets). Grades: again (10 min) / good (1 → 3 → 7 → 14 → 30 days). `review.html` fetches every lesson and gathers due cards.

## Progress (`progress.js`, localStorage `curriculum-progress-v3`)

```json
{ "version": 3,
  "lessons": { "1f": { "read": "ISO|null", "opened": "ISO", "counts": { "exercise": 4, "recall": 1 } } },
  "blocks":  { "1f-11": { "passed": true, "attempts": 2, "lastSeen": "ISO" } },
  "cards":   { "1f-17#0": { "due": "ISO", "interval": 3, "reps": 2, "lastGrade": "good" } } }
```

A lesson is *complete* when marked read and every exercise block has passed. The learner exports this as `progress/progress.json` (Index → Export); the `tutor` agent reads it from there.
