// Minimal code editor: a transparent <textarea> over a Prism-highlighted <pre>. No dependency,
// good enough for 5–40 line snippets. Tab inserts two spaces; Ctrl/Cmd+Enter fires onRun.

import { h } from "./ui.js";

const PRISM_LANG = { js: "javascript", ts: "typescript", jsx: "jsx", tsx: "tsx", javascript: "javascript", typescript: "typescript" };

export function createEditor({ code = "", lang = "js", readOnly = false, onRun } = {}) {
  const prismLang = PRISM_LANG[lang] || lang;
  const codeEl = h("code", { class: `language-${prismLang}` });
  const pre = h("pre", { class: "editor-hl", "aria-hidden": "true" }, codeEl);
  const ta = h("textarea", {
    class: "editor-ta", spellcheck: "false", autocapitalize: "off", autocomplete: "off",
    readonly: readOnly, "aria-label": "code editor",
  });
  const el = h("div", { class: "editor" + (readOnly ? " readonly" : ""), dataset: { lang } }, pre, ta);

  function render() {
    const v = ta.value;
    codeEl.textContent = v.endsWith("\n") ? v + " " : v;
    if (globalThis.Prism) Prism.highlightElement(codeEl);
    const lines = v.split("\n").length;
    ta.rows = Math.max(3, lines);
  }
  function setValue(v) { ta.value = v; render(); }
  setValue(code);

  ta.addEventListener("input", render);
  ta.addEventListener("scroll", () => { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; });
  ta.addEventListener("keydown", (e) => {
    if (e.key === "Tab" && !readOnly) {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: en, value } = ta;
      ta.value = value.slice(0, s) + "  " + value.slice(en);
      ta.selectionStart = ta.selectionEnd = s + 2;
      render();
    }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && onRun) { e.preventDefault(); onRun(); }
  });

  return { el, getValue: () => ta.value, setValue, focus: () => ta.focus(), textarea: ta };
}
