// Runs learner code and reports console output, errors, and test results.
//
// Two backends, same result shape:
//   worker — JS/TS with no DOM. Runs in a module Worker so an infinite loop can be terminated.
//   dom    — JSX/TSX/React (or anything needing `document`). Runs in a sandboxed srcdoc iframe
//            with an import map for react / react-dom/client / react/jsx-runtime, and the iframe
//            is shown as a live preview.
// `express` mode is the worker backend with the sim-express prelude prepended.
//
// User code is transpiled first (transpile.js), top-level `import` lines are hoisted, and the body
// runs inside an async IIFE so top-level await works and errors have a clean stack.

import { toJS } from "./transpile.js";
import { assemble } from "./harness.js";

const ORIGIN = location.origin;

/** A runner owns at most one live worker or iframe; each run() replaces the previous. */
export function createRunner({ mount } = {}) {
  let current = null; // { kill() }

  function kill() { if (current) { current.kill(); current = null; } }

  async function run({ code, lang = "js", mode = "worker", settleMs = 80, timeoutMs = 3000, onLog }) {
    kill();
    const result = { logs: [], error: null, tests: null, timedOut: false };
    let js;
    try { js = await toJS(code, lang); }
    catch (e) { result.error = "SyntaxError: " + (e.message || e); return result; }

    const started = performance.now();
    const push = (m) => {
      if (m.type === "log") { result.logs.push({ level: m.level, text: m.text }); onLog?.(m); }
      else if (m.type === "error") { result.error = result.error || m.text; result.logs.push({ level: "error", text: m.text }); onLog?.({ level: "error", text: m.text }); }
      else if (m.type === "tests") result.tests = m.results;
    };

    return new Promise((resolve) => {
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        result.durationMs = Math.round(performance.now() - started);
        resolve(result);
      };
      const timer = setTimeout(() => {
        result.timedOut = true;
        result.error = result.error || `Timed out after ${timeoutMs} ms (infinite loop? a timer longer than the settle window?)`;
        kill();
        finish();
      }, timeoutMs);

      if (mode === "dom") {
        const id = Math.random().toString(36).slice(2);
        const src = assemble(js, { settleMs, mode: "dom", postFn: `(m) => parent.postMessage(Object.assign({ __sb: "${id}" }, m), "*")` });
        const importMap = JSON.stringify({ imports: {
          "react": `${ORIGIN}/assets/vendor/react/react.js`,
          "react-dom/client": `${ORIGIN}/assets/vendor/react/react-dom-client.js`,
          "react/jsx-runtime": `${ORIGIN}/assets/vendor/react/jsx-runtime.js`,
        } });
        const theme = document.documentElement.dataset.theme === "light"
          ? "color:#1a1d24;background:#fff" : "color:#e8eaed;background:#0f1115";
        const html = `<!doctype html><html><head><meta charset="utf-8"><script type="importmap">${importMap}</script>` +
          `<style>body{font:14px/1.45 system-ui,sans-serif;margin:10px;${theme}} button,input{font:inherit}</style></head>` +
          `<body><div id="root"></div><script type="module">${src.replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
        const iframe = document.createElement("iframe");
        iframe.className = "sb-preview";
        iframe.setAttribute("sandbox", "allow-scripts");
        iframe.srcdoc = html;
        const onMsg = (e) => {
          if (!e.data || e.data.__sb !== id) return;
          push(e.data);
          if (e.data.type === "done") finish();
        };
        window.addEventListener("message", onMsg);
        current = { kill() { window.removeEventListener("message", onMsg); iframe.remove(); } };
        (mount || document.body).appendChild(iframe);
        // Preview stays alive after "done" so React UIs remain interactive; logs keep flowing to onLog.
        return;
      }

      const src = assemble(js, { settleMs, mode, postFn: "(m) => self.postMessage(m)" });
      const url = URL.createObjectURL(new Blob([src], { type: "text/javascript" }));
      let worker;
      try { worker = new Worker(url, { type: "module" }); }
      catch (e) { result.error = String(e); finish(); return; }
      worker.onmessage = (e) => { push(e.data); if (e.data.type === "done") { kill(); finish(); } };
      worker.onerror = (e) => {
        e.preventDefault?.();
        push({ type: "error", text: e.message?.replace(/^Uncaught /, "") || "Uncaught error" });
        kill(); finish();
      };
      current = { kill() { worker.terminate(); URL.revokeObjectURL(url); } };
    });
  }

  return { run, kill };
}

export function normalizeOutput(text) {
  return String(text ?? "").split("\n").map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
}
