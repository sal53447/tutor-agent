// Exercise block. Four kinds, all recording pass/fail per block id.
//
// <section class="block" data-block="exercise" id="1f-06" data-kind="fix" data-lang="js" data-mode="worker">
//   <p>Prompt (kept as-is).</p>
//   <pre><code class="language-javascript">starter code</code></pre>
//   <script type="application/json">{ … kind-specific … }</script>
// </section>
//
// kind=predict  { "expected": "a\nc\nb", "explain": "why" }                      — learner types the output
// kind=fix      { "tests": "test('…', () => assert.equal(f(1), 2))", "hints": [], "solution": "code", "explain": "" }
// kind=complete same as fix (starter has a TODO)
// kind=mcq      { "options": ["…"], "answer": 1 | [0,2], "explain": "" }         — no <pre> needed

import { h, blockJSON, blockCode, langFromClass, toast } from "../ui.js";
import { createEditor } from "../editor.js";
import { createRunner, normalizeOutput } from "../sandbox.js";
import { normalizeLang } from "../transpile.js";
import { createOutput } from "./output.js";
import { recordBlock, load } from "../progress.js";
import { inferMode } from "./playground.js";

export function mount(block, ctx) {
  const kind = block.dataset.kind || "fix";
  const spec = blockJSON(block) || {};
  const pre = block.querySelector(":scope > pre");
  const lang = normalizeLang(block.dataset.lang || (pre ? langFromClass(pre.querySelector("code")) : "js"));
  const mode = inferMode(block, lang, ctx.lesson);
  const starter = pre ? blockCode(block) : "";

  const head = h("div", { class: "ex-head" },
    h("span", { class: "badge kind" }, kind),
    h("span", { class: "ex-status" }, load().blocks[block.id]?.passed ? "passed ✓" : ""));
  block.prepend(head);
  if (load().blocks[block.id]?.passed) block.classList.add("passed");

  const body = h("div", { class: "ex-body" });
  if (pre) pre.replaceWith(body); else block.appendChild(body);

  const setPassed = (ok) => {
    recordBlock(block.id, ok);
    if (ok) { block.classList.add("passed"); head.querySelector(".ex-status").textContent = "passed ✓"; toast("Exercise passed"); }
    else head.querySelector(".ex-status").textContent = "not yet";
  };

  const hintsEl = hints(spec.hints);
  const explainEl = spec.explain ? h("div", { class: "ex-explain", hidden: true }, h("div", { class: "tag" }, "Why"), h("div", { html: spec.explain })) : null;

  if (kind === "mcq") {
    const multi = Array.isArray(spec.answer);
    const name = "mcq-" + block.id;
    const inputs = (spec.options || []).map((opt, i) =>
      h("label", { class: "mcq-opt" }, h("input", { type: multi ? "checkbox" : "radio", name, value: i }), h("span", { html: opt })));
    const check = h("button", { class: "btn primary", type: "button", onClick: () => {
      const chosen = inputs.map((l, i) => l.querySelector("input").checked ? i : -1).filter(i => i >= 0);
      const want = multi ? spec.answer.slice().sort() : [spec.answer];
      const ok = JSON.stringify(chosen) === JSON.stringify(want);
      inputs.forEach((l, i) => { l.classList.toggle("right", want.includes(i)); l.classList.toggle("wrong", chosen.includes(i) && !want.includes(i)); });
      if (explainEl) explainEl.hidden = false;
      setPassed(ok);
    } }, "Check");
    body.append(h("div", { class: "mcq" }, inputs), h("div", { class: "sb-toolbar" }, check), hintsEl, explainEl);
    return;
  }

  if (kind === "predict") {
    const editor = createEditor({ code: starter, lang, readOnly: true });
    const answer = h("textarea", { class: "predict-input", rows: 3, placeholder: "What does this print? One line per console.log", spellcheck: "false" });
    const output = createOutput();
    const runner = createRunner();
    const check = h("button", { class: "btn primary", type: "button", onClick: () => {
      const ok = normalizeOutput(answer.value) === normalizeOutput(spec.expected || "");
      output.clear();
      output.setStatus(ok ? "correct ✓" : "not quite — run it and compare", ok ? "ok" : "warn");
      if (ok && explainEl) explainEl.hidden = false;
      setPassed(ok);
    } }, "Check");
    const runBtn = h("button", { class: "btn", type: "button", onClick: async () => {
      output.clear(); output.setStatus("running…");
      const r = await runner.run({ code: starter, lang, mode, onLog: output.log });
      output.showResult(r);
      if (explainEl) explainEl.hidden = false;
    } }, "Run it");
    body.append(editor.el, answer, h("div", { class: "sb-toolbar" }, check, runBtn), output.el, hintsEl, explainEl);
    return;
  }

  // fix | complete
  const editor = createEditor({ code: starter, lang, onRun: run });
  const output = createOutput();
  const preview = h("div", { class: "sb-preview-wrap", hidden: mode !== "dom" });
  const runner = createRunner({ mount: preview });
  const results = h("ul", { class: "ex-tests" });
  const runBtn = h("button", { class: "btn primary", type: "button", onClick: run }, "Run tests ▶");
  const resetBtn = h("button", { class: "btn", type: "button", onClick: () => { editor.setValue(starter); output.clear(); results.replaceChildren(); } }, "Reset");
  let attempts = 0;
  const solutionBtn = spec.solution ? h("button", { class: "btn", type: "button", disabled: true, title: "Available after one attempt", onClick: () => {
    solution.hidden = false; solutionBtn.disabled = true;
  } }, "Show solution") : null;
  const solution = spec.solution ? h("div", { class: "ex-solution", hidden: true },
    h("div", { class: "tag" }, "Solution"),
    createEditor({ code: spec.solution, lang, readOnly: true }).el,
    h("button", { class: "btn", type: "button", onClick: () => editor.setValue(spec.solution) }, "Load into editor")) : null;

  body.append(h("div", { class: "sb-toolbar" }, runBtn, resetBtn, solutionBtn, h("span", { class: "sb-hint" }, "Ctrl+Enter"), h("span", { class: "badge" }, mode === "express" ? "express (simulated)" : lang)),
    editor.el, results, output.el, preview, hintsEl, solution, explainEl);

  async function run() {
    attempts += 1;
    output.clear(); results.replaceChildren();
    output.setStatus("running…");
    runBtn.disabled = true;
    const code = editor.getValue() + "\n;\n" + (spec.tests || "") + "\nawait __runTests();\n";
    const r = await runner.run({ code, lang, mode, onLog: output.log });
    runBtn.disabled = false;
    output.showResult(r);
    const tests = r.tests || [];
    for (const t of tests) results.appendChild(h("li", { class: t.ok ? "ok" : "fail" }, h("span", { class: "mark" }, t.ok ? "✓" : "✗"), " ", t.name, t.error ? h("div", { class: "err" }, t.error) : null));
    if (!tests.length && !r.error) results.appendChild(h("li", { class: "fail" }, "No tests ran — did the code throw before the test block?"));
    const ok = tests.length > 0 && tests.every(t => t.ok) && !r.error;
    if (ok && explainEl) explainEl.hidden = false;
    if (solutionBtn && attempts >= 1) solutionBtn.disabled = false;
    setPassed(ok);
  }
}

function hints(list) {
  if (!list || !list.length) return null;
  let shown = 0;
  const box = h("div", { class: "ex-hints" });
  const btn = h("button", { class: "btn small", type: "button", onClick: () => {
    if (shown < list.length) box.appendChild(h("div", { class: "hint", html: `<span class="tag">Hint ${shown + 1}</span> ${list[shown]}` }));
    shown += 1;
    btn.textContent = shown < list.length ? `Hint ${shown + 1} / ${list.length}` : "No more hints";
    btn.disabled = shown >= list.length;
  } }, `Hint 1 / ${list.length}`);
  return h("div", { class: "ex-hints-wrap" }, btn, box);
}
