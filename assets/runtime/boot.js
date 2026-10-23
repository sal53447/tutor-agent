// Lesson page entry point. A lesson file contains only <article class="lesson"> with blocks;
// this module renders the chrome (topbar, breadcrumb, prev/next, footer, mark-read), highlights
// code, and mounts a widget for every interactive block.

import { CURRICULUM, findLesson, neighbours } from "/assets/manifest.js";
import { h, toast, applyTheme, themeButton } from "./ui.js";
import { load, touchLesson, markRead, lessonStatus } from "./progress.js";

const WIDGETS = ["playground", "exercise", "stepper", "diagram", "recall"];
const STATIC_BLOCKS = ["concept", "bridge", "review"];
export const BLOCK_TYPES = [...STATIC_BLOCKS, ...WIDGETS];

applyTheme();

async function main() {
  const id = document.body.dataset.lesson;
  const lesson = id ? findLesson(id) : null;
  const article = document.querySelector("article.lesson");
  if (!lesson || !article) { console.error("boot: body[data-lesson] does not match the manifest"); return; }
  const { prev, next, index, total } = neighbours(id);
  const href = (l) => l.path;

  // --- Topbar
  const crumb = `${lesson.topic.title} › ${lesson.section.title} › ${lesson.id}`;
  const topbar = h("nav", { class: "topbar" },
    h("a", { href: "/", class: "home" }, "← Index"),
    h("span", { class: "crumb" }, crumb),
    h("span", { class: "nav-links" },
      h("a", { href: prev ? href(prev) : "#", class: prev ? "" : "disabled", id: "prev-link" }, "← Prev"),
      h("a", { href: "/review.html", title: "Spaced review" }, "Review"),
      h("a", { href: next ? href(next) : "#", class: next ? "" : "disabled", id: "next-link" }, "Next →"),
      themeButton()));
  document.body.prepend(topbar);

  // --- Header: id line + mark-read
  const header = article.querySelector(":scope > header");
  if (header) {
    header.prepend(h("div", { class: "lesson-id" }, `${lesson.topic.title} · ${lesson.section.title} · ${lesson.id} · ${index + 1}/${total}`));
    const cb = h("input", { type: "checkbox" });
    cb.checked = !!load().lessons[id]?.read;
    cb.addEventListener("change", () => { markRead(id, cb.checked); toast(cb.checked ? "Marked as read" : "Unmarked"); });
    header.appendChild(h("label", { class: "mark-done" }, cb, " Mark as read"));
  }

  // --- Footer prev/next cards
  const card = (l, dir, cls) => l
    ? h("a", { class: `${cls}`, href: href(l) }, h("span", { class: "dir" }, dir), h("span", { class: "title" }, `${l.id}. ${l.title}`))
    : h("a", { class: `${cls} disabled`, href: "#" }, h("span", { class: "dir" }, dir), h("span", { class: "title" }, dir.startsWith("←") ? "(start of curriculum)" : "(end of curriculum)"));
  article.appendChild(h("footer", { class: "lesson-footer" }, card(prev, "← Previous", "prev-card"), card(next, "Next →", "next-card next")));

  // --- Prism
  const { default: Prism } = await import("/assets/vendor/prism.js");
  Prism.highlightAllUnder(article);

  // --- Blocks
  const blocks = [...article.querySelectorAll(":scope > section.block")];
  const counts = {};
  for (const b of blocks) counts[b.dataset.block] = (counts[b.dataset.block] || 0) + 1;
  touchLesson(id, counts);
  const ctx = { lesson, Prism };
  for (const b of blocks) {
    const type = b.dataset.block;
    if (!WIDGETS.includes(type)) continue;
    try {
      const mod = await import(`./widgets/${type}.js`);
      mod.mount(b, ctx);
    } catch (e) {
      console.error(`widget ${type} failed on #${b.id}`, e);
      b.appendChild(h("p", { class: "widget-error" }, `${type}: ${e.message}`));
    }
  }

  // Section anchors on concept headings
  article.querySelectorAll("section.block > h2").forEach(h2 => {
    const sec = h2.parentElement;
    h2.appendChild(h("a", { class: "anchor", href: `#${sec.id}`, "aria-label": "link" }, "#"));
  });

  // --- Copy buttons on static code blocks (not editors)
  article.querySelectorAll("pre:not(.editor-hl):not(.st-code)").forEach(pre => {
    if (pre.closest(".editor")) return;
    const btn = h("button", { class: "copy-btn", type: "button" }, "Copy");
    btn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(pre.querySelector("code")?.textContent ?? pre.textContent); btn.textContent = "Copied!"; }
      catch { btn.textContent = "Failed"; }
      setTimeout(() => (btn.textContent = "Copy"), 1200);
    });
    pre.appendChild(btn);
  });

  // --- Keyboard: J/K or arrows for next/prev (outside inputs)
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea, select, .st, .card, [contenteditable]")) return;
    if ((e.key === "j" || e.key === "ArrowRight") && next) location.href = href(next);
    if ((e.key === "k" || e.key === "ArrowLeft") && prev) location.href = href(prev);
  });

  // Completion hint
  const st = lessonStatus(load(), id);
  if (st.total) document.querySelector(".lesson-id")?.append(` · ${st.passed}/${st.total} exercises passed`);
  document.title = `${lesson.id}. ${lesson.title} · ${CURRICULUM.title}`;
}

main();
