// Console-style output panel shared by playground and exercise widgets.

import { h } from "../ui.js";

export function createOutput() {
  const lines = h("div", { class: "sb-lines" });
  const status = h("span", { class: "sb-status" });
  const el = h("div", { class: "sb-output" }, h("div", { class: "sb-output-head" }, "Output", status), lines);

  function clear() { lines.replaceChildren(); status.textContent = ""; status.className = "sb-status"; }
  function log({ level, text }) {
    lines.appendChild(h("div", { class: `sb-line ${level}` }, text));
    lines.scrollTop = lines.scrollHeight;
  }
  function setStatus(text, kind = "") { status.textContent = text; status.className = "sb-status " + kind; }
  function showResult(r) {
    if (r.timedOut) setStatus("timed out", "bad");
    else if (r.error) setStatus("error", "bad");
    else setStatus(`${r.durationMs ?? 0} ms`, "ok");
    if (!r.logs.length && !r.error) lines.appendChild(h("div", { class: "sb-line dim" }, "(no output)"));
  }
  return { el, lines, clear, log, setStatus, showResult };
}
