---
name: site-contract
description: The site side of this curriculum — how lesson sources (src/**/*.md) become pages: scripts/build.mjs (renderer), the rendered page contract, the browser runtime and widgets (assets/runtime/), the manifest, and the three gates (validate, snippets, smoke). Load this BEFORE changing build.mjs, any runtime/widget/CSS file, the validator, the manifest structure, or when adding a new block type or stepper kind ("we need a tree visual", "add a graph stepper", "support Python execution"). Content creators don't need it; they use content-format.
---

# Site contract

```
src/<topic>/<section>/<id>-<slug>.md     content creators write this   (spec: content-format skill)
        │  scripts/build.mjs             the only writer of lesson HTML (deterministic, no agent)
        ▼
content/<topic>/<section>/<id>-<slug>.html   generated + gitignored; the page contract below
        │  assets/runtime/boot.js + widgets/*  mount one widget per interactive block
        ▼
browser                                   checked by validate.mjs · run-snippets.mjs · smoke.mjs
```

Site builders own everything below the `.md` line. You change the **vocabulary**, never a single lesson's content. Every vocabulary change ships as one unit:

1. `scripts/build.mjs`: parse it from the source.
2. Runtime: the renderer or widget in `assets/runtime/widgets/`, plus styles in `assets/styles.css` (theme tokens only, both themes).
3. `scripts/validate.mjs`: a rule for the new spec shape.
4. A test: `tests/build.test.mjs` for parsing, plus a renderer test when the logic is non-trivial.
5. Docs: the `content-format` skill (what authors write) and `references/widgets.md` (JSON/state shape).
6. Proof: `npm test`, then `npm run check` on a lesson that uses it.

If any step is missing, authors either can't use the change or will misuse it.

## Rendered page contract (what build.mjs emits, what validate.mjs checks)

```html
<body data-lesson="d1b" data-level="interactive">
<article class="lesson">
<header><h1>…</h1></header>
<section class="block" data-block="concept|bridge|diagram|stepper|playground|exercise|review|recall" id="d1b-NN" [data-kind] [data-lang] [data-mode]>…</section>
</article>
<script type="module" src="/assets/runtime/boot.js"></script>
```

- `boot.js` renders the topbar, breadcrumb, prev/next, footer and mark-read, and highlights code. Pages hold content only, and exactly one script.
- Interactive payloads are `<script type="application/json">` inside the block. Shapes are in `references/widgets.md`.
- Code goes in `<pre><code class="language-…">` with `< > &` escaped. Callouts are `<div class="callout py|warn|good|bad|review"><div class="tag">…</div>…</div>`.
- Block ids are `<lessonId>-NN`, taken from the source's `#NN`. Progress (`progress.js`) and recall card keys (`<blockId>#<index>`) hang off them.

## Runtime map

| file | role |
|---|---|
| `runtime/boot.js` | page entry: chrome, Prism, widget per block |
| `runtime/widgets/stepper.js` | kinds `queue`, `chain`, `timeline`, `array`: pure SVG render functions + controls |
| `runtime/widgets/diagram.js` | JSON nodes/edges → SVG, `layoutRows` |
| `runtime/widgets/playground.js`, `exercise.js`, `output.js`, `recall.js` | interactive blocks |
| `runtime/sandbox.js` + `harness.js` | execution: module Worker (js/ts), sandboxed iframe (jsx/tsx), Worker + `sim-express.js`. `harness.js` is shared with the node runner |
| `runtime/progress.js` | localStorage `curriculum-progress-v3`, export/import JSON |
| `index.html`/`runtime/index.js`, `review.html`/`runtime/review.js` | topic tree, spaced review |
| `assets/vendor/` | esbuild output of `scripts/vendor.mjs` (Prism incl. python, sucrase, React 19); committed |

Execution today covers JS/TS in a Worker, JSX/TSX in an iframe, and Express via the shim. Running Python would mean a new mode (Pyodide). That is a deliberate decision for the user to make, not a quiet addition.

## Manifest

`assets/manifest.js` → `CURRICULUM.topics[].sections[].lessons[]`. `allLessons()` gives each lesson `path` (rendered page) and `src` (source). Schema and procedures: `references/manifest.md`.

## Gates

```bash
npm run build [-- <id>]     # src → content; source errors as src/…md:LINE
npm run validate            # build + page contract + manifest↔src
npm run snippets -- <html>  # build + execute playgrounds/exercises in node (starter fails, solution passes, outputs match)
npm run smoke -- <id>       # build + real Chrome clicks every widget (/usr/bin/google-chrome)
npm run check               # all of the above
npm test                    # vitest: build parser, progress, harness, manifest, layout
```
