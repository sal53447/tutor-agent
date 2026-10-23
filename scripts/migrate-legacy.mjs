// One-time migration of the v1 lessons (0X-<topic>/<id>-<slug>.html, flat prose pages) into the
// v2 block layout under content/<topic>/<section>/. Kept for reference; it is idempotent on the
// already-migrated tree (no legacy folders → nothing to do).
//
// What it does per page:
//   - head: drop the cdnjs Prism theme, point at /assets/vendor/prism.css + /assets/styles.css
//   - body: drop topbar, footer, .lesson-id, .mark-done, all script tags (boot.js renders those)
//   - article content after <header> is split at each <h2> into a `concept` block (`<id>-NN`)
//   - every <details class="quiz"> becomes one card in a trailing `recall` block
//   - ../assets/ → /assets/, ../0X-folder/file.html → /content/… via the manifest
//   - body gets data-level="migrated"

import { readFile, writeFile, mkdir, rm, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const { allLessons } = await import(pathToFileURL(path.join(root, "assets", "manifest.js")));

const LEGACY = { 1: "01-javascript", 2: "02-typescript", 3: "03-express", 4: "04-react", 5: "05-nextjs" };
const lessons = allLessons();
const byFile = new Map(lessons.map(l => [l.file, l]));

let moved = 0;
for (const l of lessons) {
  const legacyDir = LEGACY[Number(l.id[0])];
  const src = path.join(root, legacyDir, l.file);
  const dest = path.join(root, l.path.slice(1));
  let html;
  try { html = await readFile(src, "utf8"); } catch { continue; } // already migrated
  const out = convert(html, l);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, out);
  await rm(src);
  moved += 1;
}
for (const dir of Object.values(LEGACY)) {
  const p = path.join(root, dir);
  try { if (!(await readdir(p)).length) await rm(p, { recursive: true }); } catch { /* gone */ }
}
console.log(`migrated ${moved} lessons`);

export function convert(html, lesson) {
  // --- head
  let head = html.slice(0, html.indexOf("<body"));
  head = head.replace(/<link rel="stylesheet" href="https:\/\/cdnjs[^>]*>\s*/g, "");
  head = head.replace(/<link rel="stylesheet" href="\.\.\/assets\/styles\.css">/, '<link rel="stylesheet" href="/assets/vendor/prism.css">\n<link rel="stylesheet" href="/assets/styles.css">');

  // --- article
  const aStart = html.indexOf("<article");
  const aEnd = html.lastIndexOf("</article>");
  let article = html.slice(html.indexOf(">", aStart) + 1, aEnd);
  article = article.replace(/<footer class="lesson-footer">[\s\S]*?<\/footer>\s*/, "");
  // v1 pages had raw JSX/HTML inside <pre><code> (browsers parsed `<div className>` as real elements).
  // Escape anything that isn't already an entity so code blocks hold text only.
  article = article.replace(/(<pre><code[^>]*>)([\s\S]*?)(<\/code><\/pre>)/g, (_, open, code, close) =>
    open + code.replace(/&(?![a-z]+;|#\d+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + close);
  const hEnd = article.indexOf("</header>");
  let header = article.slice(0, hEnd + "</header>".length);
  let rest = article.slice(hEnd + "</header>".length);
  header = header.replace(/<div class="lesson-id">[\s\S]*?<\/div>\s*/, "").replace(/<label class="mark-done">[\s\S]*?<\/label>\s*/, "");
  header = header.replace(/<header>\s*<div>\s*([\s\S]*?)\s*<\/div>\s*<\/header>/, "<header>\n  $1\n</header>");

  // --- pull quizzes out. Three legacy shapes:
  //   (a) several <div class="q">Q</div><p>A</p> pairs
  //   (b) one <div class="q"> + optional <pre> + <p><strong>Answer:</strong> …
  //   (c) <ol><li>Q…</li></ol> + <p><strong>Answers:</strong> …  → one card holding the list
  const cards = [];
  rest = rest.replace(/<details class="quiz">([\s\S]*?)<\/details>\s*/g, (_, inner) => {
    const body = inner.replace(/<summary>[\s\S]*?<\/summary>\s*/, "").trim();
    const chunks = body.split(/(?=<div class="q">)/).map(c => c.trim()).filter(Boolean);
    if (chunks.length && chunks[0].startsWith('<div class="q">')) {
      for (const chunk of chunks) {
        const qm = /^<div class="q">([\s\S]*?)<\/div>\s*/.exec(chunk);
        let q = qm[1].trim(), a = chunk.slice(qm[0].length).trim();
        const am = a.indexOf("<p><strong>Answer:</strong>");
        if (am > 0) { q = q + "\n" + a.slice(0, am).trim(); a = a.slice(am); }
        a = a.replace(/<p><strong>Answers?:<\/strong>\s*/, "<p>");
        cards.push({ q, a });
      }
    } else {
      const am = body.indexOf("<p><strong>Answers:</strong>");
      if (am > 0) cards.push({ q: body.slice(0, am).trim(), a: body.slice(am).replace(/<p><strong>Answers:<\/strong>\s*/, "<p>") });
      else cards.push({ q: "Self-check", a: body });
    }
    return "";
  });

  // --- split at h2 into concept blocks
  const parts = rest.split(/(?=<h2[\s>])/);
  const blocks = [];
  let n = 0;
  const id = () => `${lesson.id}-${String(++n).padStart(2, "0")}`;
  for (const p of parts) {
    const t = p.trim();
    if (!t) continue;
    blocks.push(`<section class="block" data-block="concept" id="${id()}">\n${t}\n</section>`);
  }
  if (cards.length) {
    const dl = cards.map(c => `  <dt>${c.q}</dt>\n  <dd>${c.a}</dd>`).join("\n");
    blocks.push(`<section class="block" data-block="recall" id="${id()}">\n<dl>\n${dl}\n</dl>\n</section>`);
  }

  let out = `${head}<body data-lesson="${lesson.id}" data-level="migrated">\n<article class="lesson">\n${header}\n\n${blocks.join("\n\n")}\n</article>\n<script type="module" src="/assets/runtime/boot.js"></script>\n</body>\n</html>\n`;

  // --- path rewrites
  out = out.replace(/\.\.\/assets\//g, "/assets/");
  out = out.replace(/(href=")\.\.\/0\d-[a-z]+\/([\w.-]+\.html)(#[^"]*)?"/g, (m, pre, file, hash) => {
    const l = byFile.get(file);
    return l ? `${pre}${l.path}${hash || ""}"` : m;
  });
  out = out.replace(/(href=")\.\.\/index\.html"/g, '$1/"');
  return out;
}
