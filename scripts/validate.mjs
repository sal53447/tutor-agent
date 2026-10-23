// Validates every rendered lesson page against the page contract (see .claude/skills/site-contract)
// and the manifest. Run `npm run build` first — package.json does that for you.
// Exit code 1 on any error. Warnings don't fail the build.
//
//   npm run validate                      all lessons
//   npm run validate -- content/dsa/foundations/d1b-binary-search.html
//   npm run validate -- --json            machine-readable (for agents)
//
// A lesson declares itself upgraded with <body data-lesson="1f" data-level="interactive">;
// then "no exercise / no recall / no visual" become errors instead of warnings.

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseHTML, attr, classes, find, findAll, children, text, line, byTag } from "./lib/html.mjs";

const root = path.resolve(import.meta.dirname, "..");
const { CURRICULUM, allLessons } = await import(pathToFileURL(path.join(root, "assets", "manifest.js")));

export const BLOCK_TYPES = ["concept", "bridge", "diagram", "stepper", "playground", "exercise", "review", "recall"];
export const EXERCISE_KINDS = ["predict", "fix", "complete", "mcq"];
export const STEPPER_KINDS = ["queue", "chain", "timeline", "array"];
export const CALLOUT_KINDS = ["py", "warn", "good", "bad", "review"];
export const CODE_LANGS = ["javascript", "typescript", "python", "jsx", "tsx", "bash", "json", "css", "markup", "html", "sql", "yaml", "http", "docker", "nginx", "markdown", "diff", "toml", "ini", "text", "none"];
const LANG_ATTR = ["js", "ts", "jsx", "tsx"];
const MODES = ["worker", "dom", "express"];

const args = process.argv.slice(2);
const json = args.includes("--json");
const only = args.filter(a => !a.startsWith("--")).map(a => path.resolve(a));

const problems = []; // { level: "error"|"warn", file, line, msg }
const err = (file, l, msg) => problems.push({ level: "error", file, line: l, msg });
const warn = (file, l, msg) => problems.push({ level: "warn", file, line: l, msg });

// --- 1. Manifest ↔ disk
const lessons = allLessons();
const ids = new Set();
for (const l of lessons) {
  if (ids.has(l.id)) err("assets/manifest.js", 0, `duplicate lesson id ${l.id}`);
  ids.add(l.id);
}
async function listHtml(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await listHtml(p));
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}
const contentDir = path.join(root, "content");
const onDisk = new Set((await stat(contentDir).catch(() => null)) ? await listHtml(contentDir) : []);
const expected = new Map(lessons.map(l => [path.join(root, l.path.slice(1)), l]));
for (const [file, l] of expected) if (!onDisk.has(file)) err("assets/manifest.js", 0, `lesson ${l.id} listed but file missing: ${path.relative(root, file)}`);
for (const file of onDisk) if (!expected.has(file)) err(path.relative(root, file), 0, "file exists on disk but is not in assets/manifest.js (invisible to the site)");

// Topic desc should state the right lesson count ("Eleven lessons").
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
for (const t of CURRICULUM.topics) {
  const n = t.sections.reduce((a, s) => a + s.lessons.length, 0);
  const m = /\b(\w+) lessons\b/i.exec(t.desc || "");
  if (m) {
    const stated = WORDS.indexOf(m[1].toLowerCase()) >= 0 ? WORDS.indexOf(m[1].toLowerCase()) : Number(m[1]);
    if (stated !== n) warn("assets/manifest.js", 0, `topic ${t.id}: desc says "${m[1]} lessons" but it has ${n}`);
  }
}

// --- 2. Per-page contract
const relOf = (f) => path.relative(root, f);
const targets = [...expected.keys()].filter(f => onDisk.has(f) && (!only.length || only.some(o => f === o || f.startsWith(o + path.sep))));

for (const file of targets) {
  const rel = relOf(file);
  const lesson = expected.get(file);
  const html = await readFile(file, "utf8");
  const doc = parseHTML(html);
  const body = find(doc, n => n.tagName === "body");
  const level = body ? attr(body, "data-level") : null;
  const strict = level === "interactive";
  const E = (n, m) => err(rel, typeof n === "number" ? n : line(n), m);
  const W = (n, m) => warn(rel, typeof n === "number" ? n : line(n), m);

  if (!body) { E(0, "no <body>"); continue; }
  if (attr(body, "data-lesson") !== lesson.id) E(body, `body[data-lesson] is "${attr(body, "data-lesson")}", manifest says "${lesson.id}"`);
  if (level && level !== "interactive" && level !== "migrated") W(body, `unknown data-level "${level}"`);

  // head
  const links = byTag(doc, "link").map(n => attr(n, "href"));
  if (!links.includes("/assets/styles.css")) E(0, 'missing <link rel="stylesheet" href="/assets/styles.css">');
  for (const href of links) if (/^https?:/.test(href || "")) E(0, `external stylesheet ${href} — vendor it under /assets/vendor`);
  if (!byTag(doc, "title").length) W(0, "missing <title>");

  // scripts: exactly one, the boot module
  const scripts = byTag(doc, "script").filter(s => attr(s, "type") !== "application/json" && attr(s, "type") !== "importmap");
  if (scripts.length !== 1 || attr(scripts[0], "src") !== "/assets/runtime/boot.js" || attr(scripts[0], "type") !== "module")
    E(scripts[0] || 0, 'the page must contain exactly one script: <script type="module" src="/assets/runtime/boot.js">');

  // legacy chrome
  for (const n of findAll(body, n => classes(n).some(c => ["topbar", "lesson-footer", "lesson-id", "mark-done"].includes(c))))
    E(n, `legacy .${classes(n).join(".")} markup — boot.js renders this; remove it`);
  for (const n of findAll(body, n => n.tagName === "details" && classes(n).includes("quiz")))
    E(n, "<details class=\"quiz\"> is retired — use a recall or exercise block");

  // article + header
  const articles = findAll(body, n => n.tagName === "article");
  if (articles.length !== 1 || !classes(articles[0]).includes("lesson")) { E(body, 'need exactly one <article class="lesson">'); continue; }
  const article = articles[0];
  const kids = children(article);
  const header = kids[0];
  if (!header || header.tagName !== "header") E(article, "first child of <article> must be <header> with an <h1>");
  else if (!find(header, n => n.tagName === "h1")) E(header, "<header> needs an <h1>");

  // blocks
  const blocks = [];
  for (const k of kids.slice(1)) {
    if (k.tagName !== "section" || !classes(k).includes("block")) { E(k, `<${k.tagName}> at article top level — every top-level element after <header> must be <section class="block" data-block="…">`); continue; }
    blocks.push(k);
  }
  const seen = new Set();
  const counts = {};
  blocks.forEach((b, i) => {
    const type = attr(b, "data-block");
    const id = attr(b, "id");
    if (!BLOCK_TYPES.includes(type)) E(b, `unknown data-block="${type}" (allowed: ${BLOCK_TYPES.join(", ")})`);
    counts[type] = (counts[type] || 0) + 1;
    if (!id) E(b, "block has no id");
    else {
      if (!new RegExp(`^${lesson.id}-\\d{2,}$`).test(id)) E(b, `block id "${id}" must be "${lesson.id}-NN"`);
      if (seen.has(id)) E(b, `duplicate block id "${id}"`);
      seen.add(id);
    }
    const jsonScripts = children(b).filter(c => c.tagName === "script" && attr(c, "type") === "application/json");
    let spec = null;
    if (jsonScripts.length > 1) E(b, "more than one application/json script in a block");
    if (jsonScripts.length) {
      try { spec = JSON.parse(text(jsonScripts[0])); }
      catch (e) { E(jsonScripts[0], `invalid JSON: ${e.message}`); }
    }
    const pre = children(b).find(c => c.tagName === "pre");
    const lang = attr(b, "data-lang");
    if (lang && !LANG_ATTR.includes(lang)) E(b, `data-lang="${lang}" must be one of ${LANG_ATTR.join("|")}`);
    const mode = attr(b, "data-mode");
    if (mode && !MODES.includes(mode)) E(b, `data-mode="${mode}" must be one of ${MODES.join("|")}`);

    switch (type) {
      case "concept":
        if (!children(b).length) W(b, "empty concept block");
        break;
      case "bridge":
      case "review": {
        const tag = children(b)[0];
        if (!tag || !classes(tag).includes("tag")) W(b, `${type} block should start with <div class="tag">…</div>`);
        break;
      }
      case "playground":
        if (!pre) E(b, "playground needs a <pre><code> starter");
        break;
      case "exercise": {
        const kind = attr(b, "data-kind");
        if (!EXERCISE_KINDS.includes(kind)) E(b, `exercise data-kind="${kind}" must be one of ${EXERCISE_KINDS.join("|")}`);
        if (!spec) E(b, "exercise needs an application/json spec");
        else if (kind === "mcq") {
          if (!Array.isArray(spec.options) || spec.options.length < 2) E(b, "mcq needs ≥2 options");
          if (spec.answer == null) E(b, "mcq needs answer");
          else { const ans = [].concat(spec.answer); if (ans.some(a => !Number.isInteger(a) || a < 0 || a >= (spec.options || []).length)) E(b, "mcq answer index out of range"); }
        } else if (kind === "predict") {
          if (!pre) E(b, "predict exercise needs the code in <pre><code>");
          if (typeof spec.expected !== "string") E(b, 'predict needs "expected" string');
        } else {
          if (!pre) E(b, `${kind} exercise needs starter code in <pre><code>`);
          if (typeof spec.tests !== "string" || !/\btest\s*\(/.test(spec.tests)) E(b, `${kind} needs "tests" containing at least one test(...)`);
          if (typeof spec.solution !== "string") E(b, `${kind} needs "solution"`);
          if (!Array.isArray(spec.hints) || !spec.hints.length) W(b, "no hints");
        }
        break;
      }
      case "stepper": {
        const kind = attr(b, "data-kind") || "queue";
        if (!STEPPER_KINDS.includes(kind)) E(b, `stepper data-kind="${kind}" must be one of ${STEPPER_KINDS.join("|")}`);
        if (!spec || !Array.isArray(spec.steps) || spec.steps.length < 2) E(b, "stepper needs ≥2 steps");
        else spec.steps.forEach((s, j) => { if (!s.state || typeof s.state !== "object") E(b, `step ${j + 1} has no state`); if (!s.label) W(b, `step ${j + 1} has no label`); });
        break;
      }
      case "diagram": {
        const svg = children(b).find(c => c.tagName === "svg");
        if (!svg && !spec) E(b, "diagram needs a JSON spec or an inline <svg>");
        if (spec) {
          const nodeIds = new Set((spec.nodes || []).map(n => n.id));
          if (nodeIds.size < 2) E(b, "diagram needs ≥2 nodes");
          for (const e of spec.edges || []) if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) E(b, `edge ${e.from}→${e.to} references unknown node`);
        }
        if (!children(b).some(c => classes(c).includes("caption"))) W(b, "diagram has no <p class=\"caption\">");
        break;
      }
      case "recall": {
        const dts = findAll(b, n => n.tagName === "dt");
        const dds = findAll(b, n => n.tagName === "dd");
        if (!dts.length || dts.length !== dds.length) E(b, `recall needs matching <dt>/<dd> pairs (found ${dts.length}/${dds.length})`);
        break;
      }
    }
  });

  // per-lesson composition
  const need = (type, min, msg) => { if ((counts[type] || 0) < min) (strict ? E : W)(body, msg); };
  need("exercise", 1, "lesson has no exercise block");
  need("recall", 1, "lesson has no recall block");
  if (!(counts.stepper || counts.diagram)) (strict ? E : W)(body, "lesson has no visual (stepper or diagram)");
  if (strict && (counts.exercise || 0) < 3) W(body, "interactive lessons should have ≥3 exercises");
  if (!counts.bridge && !findAll(article, n => classes(n).includes("py")).length) W(body, "no Python bridge anywhere in the lesson");

  // callouts + code + headings inside blocks
  for (const n of findAll(article, n => classes(n).includes("callout"))) {
    const kinds = classes(n).filter(c => c !== "callout");
    if (!kinds.length || kinds.some(k => !CALLOUT_KINDS.includes(k))) E(n, `callout class must be one of ${CALLOUT_KINDS.join("|")} (got "${kinds.join(" ")}")`);
    if (!children(n)[0] || !classes(children(n)[0]).includes("tag")) W(n, 'callout should start with <div class="tag">');
  }
  for (const code of findAll(article, n => n.tagName === "code" && n.parentNode?.tagName === "pre")) {
    const m = /language-([\w-]+)/.exec(attr(code, "class") || "");
    if (!m) W(code, "<pre><code> without language-* class");
    else if (!CODE_LANGS.includes(m[1])) E(code, `unknown code language "${m[1]}"`);
    if (children(code).length) E(code, `unescaped HTML inside <pre><code> (<${children(code)[0].tagName}>) — escape < > & in code`);
  }
  for (const n of findAll(article, n => ["h4", "h5", "h6"].includes(n.tagName))) W(n, `<${n.tagName}> — keep lessons to h2/h3`);
  for (const n of findAll(article, n => n.tagName === "a" && /^\.\.\/|^0\d-/.test(attr(n, "href") || ""))) E(n, `legacy relative lesson link ${attr(n, "href")} — use /content/... paths`);
  for (const n of findAll(article, n => /^(src|href)$/.test("src") && (attr(n, "src") || "").includes("../assets"))) E(n, "../assets path — use /assets");
}

// --- Report
const errors = problems.filter(p => p.level === "error");
const warns = problems.filter(p => p.level === "warn");
if (json) {
  console.log(JSON.stringify({ ok: !errors.length, lessons: targets.length, errors, warnings: warns }, null, 2));
} else {
  for (const p of problems) console.log(`${p.level === "error" ? "✗" : "△"} ${p.file}${p.line ? ":" + p.line : ""}  ${p.msg}`);
  console.log(`\n${targets.length} lessons checked — ${errors.length} errors, ${warns.length} warnings`);
}
process.exit(errors.length ? 1 : 0);
