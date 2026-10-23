# Manifest: `assets/manifest.js`

```js
export const CURRICULUM = {
  title: "…",
  topics: [
    {
      id: "dsa",                // short, stable; used in code (e.g. express-mode inference uses id "express")
      slug: "dsa",              // folder name under src/ and content/
      title: "Data structures & algorithms",
      desc: "Two lessons — …",  // validator checks the number word against the real count
      bridge: "…",              // one line shown under the topic on the index
      time: "~1 hour",
      runs: "browser" | "simulated",   // what playgrounds can do; informational on the index
      sections: [
        { slug: "foundations", title: "Foundations", lessons: [
          { id: "d1b", file: "d1b-binary-search.html", title: "Binary search and its invariant" },
        ]},
      ],
    },
  ],
};
```

Derived helpers (import them, don't re-walk the tree): `allLessons()` (flat, ordered, each with `topic`, `section`, `path` = rendered page, `src` = source .md), `findLesson(id)`, `neighbours(id)` → `{ prev, next, index, total }`.

## Lesson ids

`<topicLetter><sectionNumber><letter>`: DSA is `d`, so `d1a`, `d1b` … in section 1, `d2a` in section 2. Ids are permanent: progress keys, block ids and `INDEX.md` entries all hang off them. A new topic picks an unused letter. Never reuse a retired id; the v1 ids `1a`…`5k` are retired (archived in `archive/`).

## Procedures

**Add a lesson**
1. Append `{ id, file, title }` to the right section (file name `<id>-<slug>.html`).
2. Create the source `src/<topic>/<section>/<id>-<slug>.md` (frontmatter + blocks, see the `content-format` skill). Never create files under `content/`, which is generated.
3. Fix the topic's `desc` lesson count.
4. `npm run validate` → `curriculum-indexer` skill → `INDEX.md`.

**Move a lesson to another section / re-section a topic**
1. Edit the `sections` array (create/rename section objects; sections are just `{ slug, title, lessons }`).
2. `git mv` the source(s) so the path matches `src/<topic>/<section>/`.
3. `npm run validate` (reports every manifest↔disk mismatch) → re-index.

Nothing else changes: ids, block ids, progress, links (`boot.js` resolves prev/next from the manifest at load).

**Add a topic** (e.g. SQL, Docker, system design — still coding/CS)
1. Add a topic object with `id`, `slug`, `title`, `desc`, `bridge`, `time`, `runs`, and sections.
2. Decide `runs`: if the code can't execute in a worker (`browser`), it's `simulated` — plan for steppers, diagrams, predict/mcq, and a shim like `sim-express.js` if a tiny runtime makes playgrounds possible.
3. Prism: add the language to `scripts/vendor.mjs` **and** `CODE_LANGS` in `scripts/validate.mjs`, run `npm run vendor`.
4. If a new execution mode is needed, add it to `sandbox.js`/`harness.js` and document it in `widgets.md`.

**Retire a lesson**: remove from the manifest, delete the source, re-index. Progress entries for its id simply stop being counted.
