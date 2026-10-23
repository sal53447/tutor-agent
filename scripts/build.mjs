// Renders lesson sources (src/**/*.md, the content format) into lesson pages (content/**/*.html,
// the page contract). Content creators write only the .md; this script is the only thing that
// writes HTML. Format spec: .claude/skills/content-format/SKILL.md.
//
//   npm run build                  every lesson in the manifest
//   npm run build -- d1b           only those lesson ids
//   npm run build -- --watch       rebuild on change (used by npm run dev)
//
// Source errors (unknown block, bad JSON, missing fence) are reported as src/…md:line and exit 1.

import { mkdir, readFile, writeFile, readdir, rm } from "node:fs/promises";
import { watch } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Marked } from "marked";
import YAML from "yaml";

const root = path.resolve(import.meta.dirname, "..");
const manifestURL = pathToFileURL(path.join(root, "assets", "manifest.js"));

export const BLOCK_TYPES = ["concept", "bridge", "diagram", "stepper", "playground", "exercise", "review", "recall"];
const CALLOUT_TAGS = { py: "Python", warn: "Gotcha", good: "Do", bad: "Don't", review: "Review" };
const DEFAULT_TAGS = { bridge: "Python bridge", review: "Code review", diagram: "Mechanism", stepper: "Step through", playground: "Try it", exercise: "Exercise", recall: "Recall" };
const LANG_ALIAS = { js: "javascript", ts: "typescript", py: "python", sh: "bash", "": "none" };
const RUN_LANGS = ["js", "ts", "jsx", "tsx"];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => esc(s).replace(/"/g, "&quot;");

const md = new Marked({
  gfm: true,
  renderer: {
    code({ text, lang }) {
      const l = (lang || "").split(/\s+/)[0];
      return `<pre><code class="language-${LANG_ALIAS[l] ?? l}">${esc(text)}</code></pre>\n`;
    },
  },
});

class SourceError extends Error {
  constructor(line, msg) { super(msg); this.line = line; }
}

// --- Markdown with callouts: a blockquote whose first line is `> [!warn] Optional tag` becomes
// <div class="callout warn"><div class="tag">…</div>…</div>.
export function renderMarkdown(src) {
  const lines = src.split("\n");
  const out = [];
  let fence = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const f = /^(`{3,}|~{3,})/.exec(l);
    if (f) { if (!fence) fence = f[1]; else if (l.startsWith(fence)) fence = null; out.push(l); continue; }
    const m = !fence && /^>\s*\[!(\w+)\]\s*(.*)$/.exec(l);
    if (!m) { out.push(l); continue; }
    const kind = m[1];
    if (!CALLOUT_TAGS[kind]) throw new SourceError(i + 1, `unknown callout [!${kind}] (allowed: ${Object.keys(CALLOUT_TAGS).join(", ")})`);
    const inner = [];
    while (i + 1 < lines.length && /^>/.test(lines[i + 1])) inner.push(lines[++i].replace(/^> ?/, ""));
    out.push("", `<div class="callout ${kind}">\n<div class="tag">${esc(m[2] || CALLOUT_TAGS[kind])}</div>\n${md.parse(inner.join("\n"))}</div>`, "");
  }
  return md.parse(out.join("\n"));
}
const inline = (s) => md.parseInline(s.trim());

// --- Source → blocks
export function parseSource(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let meta = {}, i = 0;
  if (lines[0] === "---") {
    const end = lines.indexOf("---", 1);
    if (end < 0) throw new SourceError(1, "frontmatter not closed with ---");
    meta = YAML.parse(lines.slice(1, end).join("\n")) || {};
    i = end + 1;
  }
  const blocks = [];
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (!l.trim() || /^<!--.*-->\s*$/.test(l)) continue;
    const open = /^:::\s*(\w+)\s+#(\d{2,})\s*(.*)$/.exec(l);
    if (!open) throw new SourceError(i + 1, `text outside a block — every line belongs inside "::: <type> #NN … :::"`);
    const [, type, num, rest] = open;
    if (!BLOCK_TYPES.includes(type)) throw new SourceError(i + 1, `unknown block type "${type}" (allowed: ${BLOCK_TYPES.join(", ")})`);
    const attrs = Object.fromEntries([...rest.matchAll(/(\w+)=("[^"]*"|\S+)/g)].map(([, k, v]) => [k, v.replace(/^"|"$/g, "")]));
    const body = [];
    let fence = null, closed = false;
    const startLine = i + 1;
    for (i++; i < lines.length; i++) {
      const b = lines[i];
      const f = /^(`{3,}|~{3,})/.exec(b);
      if (f) { if (!fence) fence = f[1]; else if (b.startsWith(fence) && !b.slice(fence.length).trim()) fence = null; }
      else if (!fence && /^:::\s*$/.test(b)) { closed = true; break; }
      body.push(b);
    }
    if (!closed) throw new SourceError(startLine, `block #${num} is never closed with ":::"`);
    blocks.push({ type, num, attrs, body: body.join("\n"), line: startLine });
  }
  return { meta, blocks };
}

// Pull fenced sections out of a block body. Returns the remaining markdown plus the fences,
// each { info: ["js", "solution"], text, line }.
function splitFences(body) {
  const lines = body.split("\n");
  const rest = [], fences = [];
  for (let i = 0; i < lines.length; i++) {
    const f = /^(`{3,}|~{3,})\s*(.*)$/.exec(lines[i]);
    if (!f) { rest.push(lines[i]); continue; }
    const content = [];
    for (i++; i < lines.length && !(lines[i].startsWith(f[1]) && !lines[i].slice(f[1].length).trim()); i++) content.push(lines[i]);
    fences.push({ info: f[2].trim().split(/\s+/).filter(Boolean), text: content.join("\n") });
  }
  return { rest: rest.join("\n"), fences };
}
const role = (f) => f.info[1] || (["output", "hint", "explain", "json"].includes(f.info[0]) ? f.info[0] : "code");

function renderBlock(b, lessonId) {
  const id = `${lessonId}-${b.num}`;
  const fail = (msg) => { throw new SourceError(b.line, `#${b.num} ${b.type}: ${msg}`); };
  const tag = `<div class="tag">${esc(b.attrs.tag || DEFAULT_TAGS[b.type] || "")}</div>\n`;
  const attrs = { "data-block": b.type, id };
  let inner = "";

  if (["concept", "bridge", "review"].includes(b.type)) {
    inner = (b.type === "concept" ? "" : tag) + renderMarkdown(b.body);
  } else {
    const { rest, fences } = splitFences(b.body);
    const pick = (r) => fences.filter(f => role(f) === r);
    const one = (r, required) => { const fs = pick(r); if (fs.length > 1) fail(`more than one \`${r}\` fence`); if (required && !fs.length) fail(`needs a \`${r}\` fence`); return fs[0]; };
    const json = (f) => { try { return JSON.parse(f.text); } catch (e) { fail(`invalid JSON: ${e.message}`); } };
    const codeOf = (f) => `<pre><code class="language-${LANG_ALIAS[f.info[0]] ?? f.info[0]}">${esc(f.text)}</code></pre>\n`;
    const script = (o) => `<script type="application/json">${JSON.stringify(o, null, 1).replace(/<\//g, "<\\/")}</script>\n`;
    const prose = rest.trim() ? renderMarkdown(rest) : "";

    switch (b.type) {
      case "diagram": {
        inner = tag + script(json(one("json", true)));
        if (rest.trim()) inner += `<p class="caption">${inline(rest)}</p>\n`;
        break;
      }
      case "stepper": {
        attrs["data-kind"] = b.attrs.kind || "queue";
        inner = tag + prose + script(json(one("json", true)));
        break;
      }
      case "playground": {
        const code = one("code", true);
        if (!RUN_LANGS.includes(code.info[0])) fail(`code fence language must be one of ${RUN_LANGS.join("|")}`);
        attrs["data-lang"] = code.info[0];
        if (b.attrs.mode) attrs["data-mode"] = b.attrs.mode;
        const out = one("output");
        inner = tag + prose + codeOf(code) + (out ? `<output>${esc(out.text)}</output>\n` : "");
        break;
      }
      case "exercise": {
        const kind = b.attrs.kind;
        attrs["data-kind"] = kind;
        const hints = pick("hint").map(f => inline(f.text));
        const explain = one("explain");
        const spec = {};
        if (hints.length) spec.hints = hints;
        if (explain) spec.explain = renderMarkdown(explain.text);
        let codeHtml = "";
        if (kind === "mcq") {
          // Options are a task list in the prose: "- [ ] wrong", "- [x] right".
          const options = [], answer = [];
          const kept = rest.split("\n").filter(l => {
            const m = /^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/.exec(l);
            if (!m) return true;
            if (m[1] !== " ") answer.push(options.length);
            options.push(inline(m[2]));
            return false;
          });
          if (options.length < 2) fail("mcq needs ≥2 options as a task list (- [ ] / - [x])");
          if (!answer.length) fail("mcq needs at least one - [x] option");
          Object.assign(spec, { options, answer: answer.length === 1 ? answer[0] : answer });
          inner = tag + renderMarkdown(kept.join("\n")) + script(spec);
          break;
        }
        const code = one("code", true);
        if (!RUN_LANGS.includes(code.info[0])) fail(`code fence language must be one of ${RUN_LANGS.join("|")}`);
        attrs["data-lang"] = code.info[0];
        if (b.attrs.mode) attrs["data-mode"] = b.attrs.mode;
        codeHtml = codeOf(code);
        if (kind === "predict") {
          spec.expected = one("output", true).text;
        } else if (kind === "fix" || kind === "complete") {
          spec.tests = one("tests", true).text;
          spec.solution = one("solution", true).text;
        } else fail(`kind=${kind} — must be predict | fix | complete | mcq`);
        inner = tag + prose + codeHtml + script(spec);
        break;
      }
      case "recall": {
        // Each card: "### question" followed by the answer.
        const cards = [];
        let cur = null;
        for (const l of b.body.split("\n")) {
          const q = /^###\s+(.*)$/.exec(l);
          if (q) { cur = { q: q[1], a: [] }; cards.push(cur); }
          else if (cur) cur.a.push(l);
          else if (l.trim()) fail("text before the first ### question");
        }
        if (!cards.length) fail("no cards — each card is a ### question followed by its answer");
        inner = tag + "<dl>\n" + cards.map(c => `<dt>${inline(c.q)}</dt>\n<dd>${renderMarkdown(c.a.join("\n")).trim()}</dd>`).join("\n") + "\n</dl>\n";
        break;
      }
    }
  }
  const attrStr = Object.entries(attrs).map(([k, v]) => `${k}="${escAttr(v)}"`).join(" ");
  return `<section class="block" ${attrStr}>\n${inner}</section>`;
}

export function renderLesson(text, lesson) {
  const { meta, blocks } = parseSource(text);
  if (meta.id !== lesson.id) throw new SourceError(1, `frontmatter id "${meta.id}" ≠ manifest id "${lesson.id}"`);
  const seen = new Set();
  for (const b of blocks) { if (seen.has(b.num)) throw new SourceError(b.line, `duplicate block #${b.num}`); seen.add(b.num); }
  const title = meta.title || lesson.title;
  return `<!DOCTYPE html>
<!-- GENERATED from ${lesson.src} by scripts/build.mjs — edit the source, not this file. -->
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(lesson.id)}. ${esc(title)} · ${esc(lesson.topic.title)}</title>
<link rel="icon" href="/assets/favicon.svg">
<link rel="stylesheet" href="/assets/vendor/prism.css">
<link rel="stylesheet" href="/assets/styles.css">
</head>
<body data-lesson="${escAttr(lesson.id)}" data-level="interactive">
<article class="lesson">
<header><h1>${esc(title)}</h1></header>

${blocks.map(b => renderBlock(b, lesson.id)).join("\n\n")}
</article>
<script type="module" src="/assets/runtime/boot.js"></script>
</body>
</html>
`;
}

export async function build(only = []) {
  const { allLessons } = await import(manifestURL + "?t=" + Date.now());
  const lessons = allLessons();
  const errors = [];
  // Sources on disk that the manifest doesn't know about are invisible — say so.
  const listed = new Set(lessons.map(l => l.src));
  const srcFiles = [];
  const stack = [path.join(root, "src")];
  while (stack.length) {
    const d = stack.pop();
    for (const e of await readdir(d, { withFileTypes: true }).catch(() => [])) (e.isDirectory() ? stack : srcFiles).push(path.join(d, e.name));
  }
  for (const f of srcFiles) if (f.endsWith(".md") && !listed.has(path.relative(root, f))) errors.push(`${path.relative(root, f)}: not in assets/manifest.js — add it or delete it`);

  // content/ is fully generated: clear it on a full build so renamed/removed lessons don't linger.
  if (!only.length) await rm(path.join(root, "content"), { recursive: true, force: true });
  let n = 0;
  for (const l of lessons.filter(l => !only.length || only.includes(l.id))) {
    let text;
    try { text = await readFile(path.join(root, l.src), "utf8"); }
    catch { errors.push(`${l.src}: missing (lesson ${l.id} is in the manifest)`); continue; }
    try {
      const html = renderLesson(text, l);
      const out = path.join(root, l.path.slice(1));
      await mkdir(path.dirname(out), { recursive: true });
      await writeFile(out, html);
      n++;
    } catch (e) {
      if (!(e instanceof SourceError)) throw e;
      errors.push(`${l.src}:${e.line}  ${e.message}`);
    }
  }
  return { built: n, errors };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const only = args.filter(a => !a.startsWith("--"));
  const run = async () => {
    const { built, errors } = await build(only);
    for (const e of errors) console.log("✗ " + e);
    console.log(`build: ${built} lessons rendered${errors.length ? `, ${errors.length} errors` : ""}`);
    return errors.length;
  };
  const failed = await run();
  if (args.includes("--watch")) {
    let t = null;
    watch(path.join(root, "src"), { recursive: true }, () => { clearTimeout(t); t = setTimeout(run, 100); });
    watch(path.join(root, "assets", "manifest.js"), () => { clearTimeout(t); t = setTimeout(run, 100); });
    console.log("watching src/ …");
  } else process.exit(failed ? 1 : 0);
}
