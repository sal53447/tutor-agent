import { describe, expect, it } from "vitest";
import { parseSource, renderLesson } from "../scripts/build.mjs";

const lesson = { id: "x1a", title: "T", src: "src/x.md", topic: { title: "Topic" } };
const SRC = `---
id: x1a
title: Fixture
goals: [a]
---

::: concept #01
## Heading
Text with \`a < b\`.

> [!warn] Careful
> inside callout

\`\`\`js
if (a < b) {}
\`\`\`
:::

::: stepper #02 kind=array
\`\`\`json
{ "steps": [{ "label": "s", "state": { "cells": [1] } }, { "label": "t", "state": { "cells": [2] } }] }
\`\`\`
:::

::: playground #03
Try it.
\`\`\`js
console.log(1 < 2);
\`\`\`
\`\`\`output
true
\`\`\`
:::

::: exercise #04 kind=complete
Do it.
\`\`\`js
function f() {}
\`\`\`
\`\`\`js tests
test("t", () => assert.equal(f(), 1));
\`\`\`
\`\`\`js solution
function f() { return 1; }
\`\`\`
\`\`\`hint
Return **one**.
\`\`\`
:::

::: exercise #05 kind=mcq
Pick.
- [ ] no
- [x] \`yes\`
:::

::: recall #06
### Q one?
A one.

### Q two?
A two.
:::
`;

describe("build", () => {
  it("parses blocks and frontmatter, ignoring ::: inside fences", () => {
    const { meta, blocks } = parseSource("---\nid: a\n---\n::: concept #01\n```\n:::\n```\n:::\n");
    expect(meta.id).toBe("a");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].body).toContain(":::");
  });

  it("renders every block type to the page contract", () => {
    const html = renderLesson(SRC, lesson);
    expect(html).toContain('data-block="concept" id="x1a-01"');
    expect(html).toContain('<div class="callout warn">\n<div class="tag">Careful</div>');
    expect(html).toContain('<code class="language-javascript">if (a &lt; b) {}');
    expect(html).toContain('data-block="stepper" id="x1a-02" data-kind="array"');
    expect(html).toContain('data-lang="js"');
    expect(html).toContain("<output>true\n</output>".replace("\n", ""));
    const specs = [...html.matchAll(/<script type="application\/json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
    expect(specs[1]).toMatchObject({ solution: "function f() { return 1; }", hints: ["Return <strong>one</strong>."] });
    expect(specs[2]).toMatchObject({ options: ["no", "<code>yes</code>"], answer: 1 });
    expect(html.match(/<dt>/g)).toHaveLength(2);
  });

  it("reports source errors with a line number", () => {
    expect(() => renderLesson("---\nid: x1a\n---\n\nloose text\n", lesson)).toThrow(/outside a block/);
    expect(() => renderLesson("---\nid: x1a\n---\n::: widget #01\n:::\n", lesson)).toThrow(/unknown block type/);
    expect(() => renderLesson("---\nid: x1a\n---\n::: concept #01\n:::\n::: concept #01\n:::\n", lesson)).toThrow(/duplicate/);
    expect(() => renderLesson("---\nid: x1a\n---\n::: exercise #01 kind=complete\n```js\nf\n```\n:::\n", lesson)).toThrow(/tests/);
  });
});
