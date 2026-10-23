// Playground block: editable code, Run, console output, optional expected output, live DOM preview.
//
// <section class="block" data-block="playground" id="1f-05" data-lang="js" data-mode="worker">
//   <p>…intro (kept)…</p>
//   <pre><code class="language-javascript">…starter…</code></pre>
//   <output>expected console output (optional)</output>
// </section>
// data-lang: js | ts | jsx | tsx      data-mode: worker | dom | express   (defaults inferred)

import { h, blockCode, langFromClass } from "../ui.js";
import { createEditor } from "../editor.js";
import { createRunner, normalizeOutput } from "../sandbox.js";
import { normalizeLang } from "../transpile.js";
import { createOutput } from "./output.js";
import { recordBlock } from "../progress.js";

export function inferMode(block, lang, lesson) {
  if (block.dataset.mode) return block.dataset.mode;
  if (lesson?.topic?.id === "express") return "express";
  return lang === "jsx" || lang === "tsx" ? "dom" : "worker";
}

export function mount(block, ctx) {
  const pre = block.querySelector(":scope > pre");
  if (!pre) return;
  const lang = normalizeLang(block.dataset.lang || langFromClass(pre.querySelector("code")));
  const mode = inferMode(block, lang, ctx.lesson);
  const starter = blockCode(block);
  const expectedEl = block.querySelector(":scope > output");
  const expected = expectedEl ? expectedEl.textContent.trim() : null;
  expectedEl?.remove();

  const output = createOutput();
  const preview = h("div", { class: "sb-preview-wrap", hidden: mode !== "dom" });
  const runner = createRunner({ mount: preview });

  const editor = createEditor({ code: starter, lang, onRun: run });
  const runBtn = h("button", { class: "btn primary", type: "button", onClick: run }, "Run ▶");
  const resetBtn = h("button", { class: "btn", type: "button", onClick: () => { editor.setValue(starter); output.clear(); } }, "Reset");
  const badge = h("span", { class: "badge" }, mode === "express" ? "express (simulated)" : mode === "dom" ? `${lang} · browser` : lang);
  const toolbar = h("div", { class: "sb-toolbar" }, runBtn, resetBtn, h("span", { class: "sb-hint" }, "Ctrl+Enter"), badge);

  let expectedPanel = null;
  if (expected) {
    expectedPanel = h("details", { class: "sb-expected" }, h("summary", {}, "Expected output"), h("pre", {}, expected));
  }

  pre.replaceWith(h("div", { class: "sb" }, toolbar, editor.el, output.el, preview, expectedPanel));

  async function run() {
    output.clear();
    output.setStatus("running…");
    runBtn.disabled = true;
    const r = await runner.run({ code: editor.getValue(), lang, mode, onLog: output.log });
    runBtn.disabled = false;
    output.showResult(r);
    let matched = null;
    if (expected && !r.error) {
      matched = normalizeOutput(r.logs.map(l => l.text).join("\n")) === normalizeOutput(expected);
      output.setStatus(matched ? "matches expected ✓" : "differs from expected", matched ? "ok" : "warn");
    }
    recordBlock(block.id, matched !== false);
    block.classList.toggle("done", true);
  }
}
