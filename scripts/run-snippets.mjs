// Executes a lesson's code in node, the same way the browser sandbox does, and checks the
// contract the widgets rely on:
//   playground      starter runs without error; if <output> given, output matches
//   exercise predict runs; actual output == spec.expected
//   exercise fix/complete
//                   solution passes every test; starter does NOT pass every test (else the exercise is trivial)
//   <pre><code data-run> in concept blocks   runs without error
// dom-mode (React/JSX) blocks can't run in node and are reported as "skipped" — the headless
// smoke test (scripts/smoke.mjs) covers those.
//
//   npm run snippets                        every lesson
//   npm run snippets -- content/dsa/foundations/d1b-binary-search.html [more files…]
//   npm run snippets -- --json

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";
import { transform } from "sucrase";
import { parseHTML, attr, children, find, text, line, findAll } from "./lib/html.mjs";

const root = path.resolve(import.meta.dirname, "..");
const { assemble } = await import(pathToFileURL(path.join(root, "assets", "runtime", "harness.js")));
const { allLessons } = await import(pathToFileURL(path.join(root, "assets", "manifest.js")));

const args = process.argv.slice(2);
const json = args.includes("--json");
// No files given → every lesson in the manifest.
const named = args.filter(a => !a.startsWith("--")).map(a => path.resolve(a));
const files = named.length ? named : allLessons().map(l => path.join(root, l.path.slice(1)));

const tmp = path.join(os.tmpdir(), "curriculum-snippets");
await mkdir(tmp, { recursive: true });

function toJS(code, lang) {
  const l = (lang || "js").replace("javascript", "js").replace("typescript", "ts");
  if (l === "js") return code;
  const transforms = [];
  if (l === "ts" || l === "tsx") transforms.push("typescript");
  if (l === "jsx" || l === "tsx") transforms.push("jsx");
  return transform(code, { transforms, jsxRuntime: "automatic", production: true }).code;
}

async function run(code, { lang, mode }) {
  const result = { logs: [], error: null, tests: null, timedOut: false };
  let js;
  try { js = toJS(code, lang); } catch (e) { result.error = "SyntaxError: " + e.message; return result; }
  const src = assemble(js, { mode, settleMs: 80, postFn: "(m) => process.stdout.write(JSON.stringify(m) + '\\n')" });
  const file = path.join(tmp, `snippet-${process.pid}-${Math.random().toString(36).slice(2)}.mjs`);
  await writeFile(file, src);
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["--no-warnings", file], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "", errOut = "";
    child.stdout.on("data", d => (out += d));
    child.stderr.on("data", d => (errOut += d));
    const timer = setTimeout(() => { result.timedOut = true; child.kill("SIGKILL"); }, 5000);
    child.on("close", () => {
      clearTimeout(timer);
      for (const l of out.split("\n").filter(Boolean)) {
        let m; try { m = JSON.parse(l); } catch { continue; }
        if (m.type === "log") result.logs.push(m);
        else if (m.type === "error") result.error = result.error || m.text;
        else if (m.type === "tests") result.tests = m.results;
      }
      if (errOut && !result.error) result.error = errOut.split("\n").find(l => /Error/.test(l)) || errOut.trim().split("\n")[0];
      if (result.timedOut) result.error = result.error || "timed out (5 s)";
      resolve(result);
    });
  });
}

const norm = (t) => String(t ?? "").split("\n").map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
const output = (r) => r.logs.map(l => l.text).join("\n");

const lessonsByFile = new Map(allLessons().map(l => [path.join(root, l.path.slice(1)), l]));
const report = []; // { file, block, kind, status: pass|fail|skip, detail }

for (const file of files) {
  const rel = path.relative(root, file);
  const lesson = lessonsByFile.get(file);
  const doc = parseHTML(await readFile(file, "utf8"));
  const article = find(doc, n => n.tagName === "article");
  if (!article) { report.push({ file: rel, block: "-", kind: "-", status: "fail", detail: "no <article>" }); continue; }
  const topicMode = lesson?.topic?.id === "express" ? "express" : "worker";

  for (const b of children(article).filter(n => n.tagName === "section")) {
    const type = attr(b, "data-block"), id = attr(b, "id");
    const pre = children(b).find(c => c.tagName === "pre");
    const codeEl = pre && children(pre).find(c => c.tagName === "code");
    const langClass = /language-(\w+)/.exec(attr(codeEl || {}, "class") || "")?.[1];
    const lang = attr(b, "data-lang") || langClass || "js";
    const mode = attr(b, "data-mode") || ((lang === "jsx" || lang === "tsx") ? "dom" : topicMode);
    const specEl = children(b).find(c => c.tagName === "script" && attr(c, "type") === "application/json");
    let spec = null;
    if (specEl) { try { spec = JSON.parse(text(specEl)); } catch { spec = null; } }
    const starter = codeEl ? text(codeEl).replace(/\n$/, "") : "";
    const push = (kind, status, detail = "") => report.push({ file: rel, block: id, line: line(b), kind, status, detail });

    if (type === "concept") {
      for (const c of findAll(b, n => n.tagName === "code" && attr(n, "data-run") != null)) {
        const r = await run(text(c), { lang: /language-(\w+)/.exec(attr(c, "class") || "")?.[1] || "js", mode: topicMode });
        push("data-run", r.error ? "fail" : "pass", r.error || "");
      }
      continue;
    }
    if (type !== "playground" && type !== "exercise") continue;
    if (mode === "dom") { push(type, "skip", "dom mode — covered by smoke test"); continue; }

    if (type === "playground") {
      const r = await run(starter, { lang, mode });
      const expectedEl = children(b).find(c => c.tagName === "output");
      if (r.error) push("playground", "fail", r.error);
      else if (expectedEl && norm(output(r)) !== norm(text(expectedEl))) push("playground", "fail", `output differs\n   expected: ${norm(text(expectedEl)).replace(/\n/g, " ⏎ ")}\n   actual:   ${norm(output(r)).replace(/\n/g, " ⏎ ")}`);
      else push("playground", "pass");
      continue;
    }

    const kind = attr(b, "data-kind");
    if (kind === "mcq") { push("mcq", "pass", "static"); continue; }
    if (!spec) { push(kind, "fail", "invalid spec"); continue; }
    if (kind === "predict") {
      const r = await run(starter, { lang, mode });
      if (r.error) push("predict", "fail", r.error);
      else if (norm(output(r)) !== norm(spec.expected)) push("predict", "fail", `expected "${norm(spec.expected).replace(/\n/g, " ⏎ ")}" but code prints "${norm(output(r)).replace(/\n/g, " ⏎ ")}"`);
      else push("predict", "pass");
      continue;
    }
    // fix | complete
    const withTests = (code) => code + "\n;\n" + spec.tests + "\nawait __runTests();\n";
    const sol = await run(withTests(spec.solution), { lang, mode });
    const solOk = !sol.error && sol.tests?.length && sol.tests.every(t => t.ok);
    if (!solOk) { push(kind, "fail", "solution does not pass: " + (sol.error || (sol.tests || []).filter(t => !t.ok).map(t => `${t.name}: ${t.error}`).join("; ") || "no tests ran")); continue; }
    const st = await run(withTests(starter), { lang, mode });
    const stOk = !st.error && st.tests?.length && st.tests.every(t => t.ok);
    if (stOk) { push(kind, "fail", "starter already passes every test — the exercise is trivial"); continue; }
    push(kind, "pass", `solution passes ${sol.tests.length} tests; starter fails ${st.error ? "(throws)" : (st.tests || []).filter(t => !t.ok).length + "/" + sol.tests.length}`);
  }
}

const fails = report.filter(r => r.status === "fail");
if (json) console.log(JSON.stringify({ ok: !fails.length, results: report }, null, 2));
else {
  for (const r of report) console.log(`${r.status === "pass" ? "✓" : r.status === "skip" ? "–" : "✗"} ${r.file}:${r.line ?? ""} ${r.block} [${r.kind}] ${r.detail}`);
  console.log(`\n${report.length} checks — ${fails.length} failed, ${report.filter(r => r.status === "skip").length} skipped`);
}
process.exit(fails.length ? 1 : 0);
